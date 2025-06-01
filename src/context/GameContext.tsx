import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ref, set, get, onValue, off, remove, update } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from './AuthContext';
import { Player, GameState, Role, RoleInfo } from '../types/gameTypes';
import { generateId } from '../utils/helpers';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { debounce } from '../utils/helpers';

interface GameContextType {
  gameState: GameState;
  currentPlayer: Player | null;
  players: Player[];
  gameId: string | null;
  isHost: boolean;
  lastGuessResult: { correct: boolean; message: string } | null;
  createGame: (playerName: string) => Promise<string>;
  joinGame: (gameId: string, playerName: string) => Promise<boolean>;
  startGame: () => void;
  makeGuess: (targetPlayerId: string) => void;
  leaveGame: () => void;
  getRoleInfo: (role: Role) => RoleInfo;
  getNextRoleInChain: (role: Role) => Role | null;
  clearGuessResult: () => void;
}

const roleInfoMap: Record<Role, RoleInfo> = {
  king: {
    name: 'King',
    icon: 'Crown',
    color: 'text-yellow-500',
    description: 'Seeks the Queen',
    points: 10,
    chainOrder: 1,
  },
  queen: {
    name: 'Queen',
    icon: 'Heart',
    color: 'text-pink-500',
    description: 'Seeks the Minister',
    points: 9,
    chainOrder: 2,
  },
  minister: {
    name: 'Minister',
    icon: 'Building2',
    color: 'text-blue-500',
    description: 'Seeks the Soldier',
    points: 7,
    chainOrder: 3,
  },
  soldier: {
    name: 'Soldier',
    icon: 'Shield',
    color: 'text-green-500',
    description: 'Seeks the Police',
    points: 6,
    chainOrder: 4,
  },
  police: {
    name: 'Police',
    icon: 'Siren',
    color: 'text-indigo-500',
    description: 'Seeks the Thief',
    points: 4,
    chainOrder: 5,
  },
  thief: {
    name: 'Thief',
    icon: 'Footprints',
    color: 'text-red-500',
    description: 'Tries to hide from the Police',
    points: 0,
    chainOrder: 6,
  },
};

const roleChain: Role[] = ['king', 'queen', 'minister', 'soldier', 'police', 'thief'];

const defaultContext: GameContextType = {
  gameState: 'waiting',
  currentPlayer: null,
  players: [],
  gameId: null,
  isHost: false,
  lastGuessResult: null,
  createGame: () => Promise.resolve(''),
  joinGame: () => Promise.resolve(false),
  startGame: () => {},
  makeGuess: () => {},
  leaveGame: () => {},
  getRoleInfo: () => ({
    name: 'Unknown',
    icon: 'User',
    color: 'text-gray-500',
    description: '',
    points: 0,
    chainOrder: 0,
  }),
  getNextRoleInChain: () => null,
  clearGuessResult: () => {},
};

const GameContext = createContext<GameContextType>(defaultContext);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameId, setGameId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [lastGuessResult, setLastGuessResult] = useState<{ correct: boolean; message: string } | null>(null);
  const { user } = useAuth();

  const memoizedRoleInfo = useMemo(() => roleInfoMap, []);
  const memoizedRoleChain = useMemo(() => roleChain, []);

  const debouncedSaveGameState = useCallback(
    debounce(async (gameId: string, players: Player[], gameState: GameState) => {
      const updates: { [key: string]: any } = {
        [`games/${gameId}/players`]: players,
        [`games/${gameId}/gameState`]: gameState,
        [`games/${gameId}/updatedAt`]: Date.now(),
        [`games/${gameId}/lastHeartbeat`]: Date.now(),
      };

      if (user) {
        updates[`userGames/${user.id}/${gameId}/lastActive`] = Date.now();
      }

      await update(ref(database), updates);
    }, 100),
    [user]
  );

  useEffect(() => {
    const savedGameId = localStorage.getItem('currentGameId');
    const savedPlayerId = localStorage.getItem('currentPlayerId');
    
    if (savedGameId && savedPlayerId && user) {
      const gameRef = ref(database, `games/${savedGameId}`);
      get(gameRef).then((snapshot) => {
        const gameData = snapshot.val();
        if (gameData) {
          const player = gameData.players?.find((p: Player) => p.id === savedPlayerId && p.userId === user.id);
          if (player) {
            setGameId(savedGameId);
            setCurrentPlayer(player);
            setPlayers(gameData.players || []);
            setGameState(gameData.gameState);
            setIsHost(player.isHost);
          } else {
            localStorage.removeItem('currentGameId');
            localStorage.removeItem('currentPlayerId');
          }
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (!gameId) return;

    const gameRef = ref(database, `games/${gameId}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      
      if (!data) {
        setGameState('waiting');
        setPlayers([]);
        setCurrentPlayer(null);
        setGameId(null);
        setIsHost(false);
        return;
      }

      if (data.gameState !== gameState) {
        setGameState(data.gameState);
      }

      if (JSON.stringify(data.players) !== JSON.stringify(players)) {
        setPlayers(data.players || []);
        
        if (currentPlayer) {
          const updatedCurrentPlayer = data.players?.find((p: Player) => p.id === currentPlayer.id);
          if (updatedCurrentPlayer && JSON.stringify(updatedCurrentPlayer) !== JSON.stringify(currentPlayer)) {
            setCurrentPlayer(updatedCurrentPlayer);
          }
        }
      }
    }, {
      startAt: Date.now()
    });

    return () => off(gameRef);
  }, [gameId, currentPlayer, players, gameState]);

  useEffect(() => {
    if (!gameId || !user) return;

    const heartbeatInterval = setInterval(async () => {
      const updates = {
        [`games/${gameId}/lastHeartbeat`]: Date.now(),
        [`userGames/${user.id}/${gameId}/lastActive`]: Date.now()
      };
      await update(ref(database), updates);
    }, 30000);

    return () => clearInterval(heartbeatInterval);
  }, [gameId, user]);

  const createGame = useCallback(async (playerName: string): Promise<string> => {
    if (!user) throw new Error('Must be logged in to create a game');

    const newGameId = generateId(6);
    const playerId = generateId(8);
    
    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      role: null,
      isHost: true,
      isLocked: false,
      isCurrentTurn: false,
      userId: user.id,
    };
    
    const updates = {
      [`games/${newGameId}`]: {
        gameId: newGameId,
        players: [newPlayer],
        gameState: 'lobby',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastHeartbeat: Date.now(),
      },
      [`userGames/${user.id}/${newGameId}`]: {
        joinedAt: Date.now(),
        lastActive: Date.now(),
      }
    };

    await update(ref(database), updates);
    
    setGameId(newGameId);
    setPlayers([newPlayer]);
    setCurrentPlayer(newPlayer);
    setIsHost(true);
    setGameState('lobby');
    
    return newGameId;
  }, [user]);

  const joinGame = useCallback(async (gameId: string, playerName: string): Promise<boolean> => {
    if (!user) throw new Error('Must be logged in to join a game');

    const gameRef = ref(database, `games/${gameId}`);
    
    try {
      const snapshot = await get(gameRef);
      const gameData = snapshot.val();

      if (!gameData) {
        console.error('Game not found');
        return false;
      }

      if (gameData.gameState !== 'lobby') {
        console.error('Game is not in lobby state');
        return false;
      }

      const currentPlayers = gameData.players || [];
      
      const existingPlayer = currentPlayers.find(
        (p: Player) => p.userId === user.id
      );
      
      if (existingPlayer) {
        setGameId(gameId);
        setPlayers(currentPlayers);
        setCurrentPlayer(existingPlayer);
        setIsHost(existingPlayer.isHost);
        setGameState(gameData.gameState);
        return true;
      }

      if (currentPlayers.length >= 6) {
        console.error('Game is full');
        return false;
      }

      const playerId = generateId(8);
      const newPlayer: Player = {
        id: playerId,
        name: playerName.trim(),
        role: null,
        isHost: false,
        isLocked: false,
        isCurrentTurn: false,
        userId: user.id,
      };

      const updatedPlayers = [...currentPlayers, newPlayer];

      await debouncedSaveGameState(gameId, updatedPlayers, gameData.gameState);
      
      setGameId(gameId);
      setPlayers(updatedPlayers);
      setCurrentPlayer(newPlayer);
      setIsHost(false);
      setGameState(gameData.gameState);

      return true;
    } catch (error) {
      console.error('Error joining game:', error);
      return false;
    }
  }, [user, debouncedSaveGameState]);

  const startGame = useCallback(() => {
    if (!isHost || !gameId || players.length !== 6) {
      return;
    }
    
    const availableRoles = [...memoizedRoleChain];
    const shuffledRoles = availableRoles.sort(() => Math.random() - 0.5);
    
    const updatedPlayers = players.map((player, index) => ({
      ...player,
      role: shuffledRoles[index],
      isLocked: false,
      isCurrentTurn: false,
    }));
    
    const kingPlayer = updatedPlayers.find(player => player.role === 'king');
    if (kingPlayer) {
      kingPlayer.isCurrentTurn = true;
    }
    
    setPlayers(updatedPlayers);
    setGameState('playing');
    
    if (currentPlayer) {
      const updatedCurrentPlayer = updatedPlayers.find(p => p.id === currentPlayer.id);
      if (updatedCurrentPlayer) {
        setCurrentPlayer(updatedCurrentPlayer);
      }
      debouncedSaveGameState(gameId, updatedPlayers, 'playing');
    }
  }, [isHost, gameId, players, currentPlayer, debouncedSaveGameState, memoizedRoleChain]);

  const makeGuess = useCallback((targetPlayerId: string) => {
    if (!currentPlayer?.isCurrentTurn || !currentPlayer.role || gameState !== 'playing') {
      return;
    }
    
    const targetPlayer = players.find(p => p.id === targetPlayerId);
    if (!targetPlayer || targetPlayer.isLocked || currentPlayer.isLocked) {
      return;
    }

    const expectedNextRole = getNextRoleInChain(currentPlayer.role);
    const isCorrectGuess = targetPlayer.role === expectedNextRole;
    
    let updatedPlayers = [...players];
    
    if (isCorrectGuess) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      updatedPlayers = updatedPlayers.map(p => {
        if (p.id === currentPlayer.id) {
          return { ...p, isLocked: true, isCurrentTurn: false };
        }
        if (p.id === targetPlayer.id) {
          return { ...p, isCurrentTurn: true };
        }
        return { ...p, isCurrentTurn: false };
      });

      setLastGuessResult({
        correct: true,
        message: `Correct! You found the ${memoizedRoleInfo[targetPlayer.role].name}!`
      });
      
      toast.success(`You found the ${memoizedRoleInfo[targetPlayer.role].name}!`, {
        duration: 3000,
        icon: '🎯',
      });
    } else {
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }

      const tempRole = currentPlayer.role;
      updatedPlayers = updatedPlayers.map(p => {
        if (p.id === currentPlayer.id) {
          return { ...p, role: targetPlayer.role, isCurrentTurn: false };
        }
        if (p.id === targetPlayer.id) {
          return { ...p, role: tempRole, isCurrentTurn: false };
        }
        return { ...p, isCurrentTurn: false };
      });

      setLastGuessResult({
        correct: false,
        message: `Wrong guess! You swapped roles with ${targetPlayer.name}.`
      });
      
      toast.error(`Wrong guess! You swapped roles with ${targetPlayer.name}`, {
        duration: 3000,
        icon: '❌',
      });

      const newKingPlayer = updatedPlayers.find(p => p.role === 'king' && !p.isLocked);
      if (newKingPlayer) {
        newKingPlayer.isCurrentTurn = true;
      }
    }
    
    const allPlayersLocked = updatedPlayers.every(p => p.isLocked || p.role === 'thief');
    
    if (allPlayersLocked) {
      setGameState('completed');
      if (gameId) {
        debouncedSaveGameState(gameId, updatedPlayers, 'completed');
      }
    } else if (!isCorrectGuess) {
      const nextPlayer = findNextActivePlayer(updatedPlayers);
      if (nextPlayer) {
        updatedPlayers = updatedPlayers.map(p => ({
          ...p,
          isCurrentTurn: p.id === nextPlayer.id
        }));
      }
    }
    
    setPlayers(updatedPlayers);
    const updatedCurrentPlayer = updatedPlayers.find(p => p.id === currentPlayer.id);
    if (updatedCurrentPlayer) {
      setCurrentPlayer(updatedCurrentPlayer);
    }
    
    if (gameId) {
      debouncedSaveGameState(gameId, updatedPlayers, allPlayersLocked ? 'completed' : 'playing');
    }

    setTimeout(clearGuessResult, 3000);
  }, [currentPlayer, players, gameState, gameId, getNextRoleInChain, debouncedSaveGameState, findNextActivePlayer, clearGuessResult, memoizedRoleInfo]);

  const leaveGame = useCallback(() => {
    if (gameId && currentPlayer) {
      const updatedPlayers = players.filter(p => p.id !== currentPlayer.id);
      
      if (updatedPlayers.length > 0) {
        if (currentPlayer.isHost) {
          updatedPlayers[0].isHost = true;
        }
        debouncedSaveGameState(gameId, updatedPlayers, gameState);
      } else {
        const gameRef = ref(database, `games/${gameId}`);
        remove(gameRef).catch(console.error);
      }

      if (user) {
        const userGamesRef = ref(database, `userGames/${user.id}/${gameId}`);
        remove(userGamesRef).catch(console.error);
      }

      localStorage.removeItem('currentGameId');
      localStorage.removeItem('currentPlayerId');
    }

    setGameState('waiting');
    setCurrentPlayer(null);
    setPlayers([]);
    setGameId(null);
    setIsHost(false);
  }, [gameId, currentPlayer, players, gameState, debouncedSaveGameState, user]);

  const getRoleInfo = useCallback((role: Role): RoleInfo => {
    return memoizedRoleInfo[role];
  }, [memoizedRoleInfo]);

  const getNextRoleInChain = useCallback((role: Role): Role | null => {
    const currentIndex = memoizedRoleChain.indexOf(role);
    if (currentIndex === -1 || currentIndex === memoizedRoleChain.length - 1) {
      return null;
    }
    return memoizedRoleChain[currentIndex + 1];
  }, [memoizedRoleChain]);

  const findNextActivePlayer = useCallback((players: Player[]): Player | null => {
    for (const role of memoizedRoleChain) {
      const player = players.find(p => p.role === role && !p.isLocked);
      if (player) {
        return player;
      }
    }
    return null;
  }, [memoizedRoleChain]);

  const clearGuessResult = useCallback(() => {
    setLastGuessResult(null);
  }, []);

  return (
    <GameContext.Provider
      value={{
        gameState,
        currentPlayer,
        players,
        gameId,
        isHost,
        lastGuessResult,
        createGame,
        joinGame,
        startGame,
        makeGuess,
        leaveGame,
        getRoleInfo,
        getNextRoleInChain,
        clearGuessResult,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);