import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ref, set, get, onValue, off, remove, update, onDisconnect } from 'firebase/database';
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
  createGame: (playerName: string, customRoleNames?: { [key in Role]?: string }) => Promise<string>;
  joinGame: (gameId: string, playerName: string) => Promise<boolean>;
  startGame: () => void;
  makeGuess: (targetPlayerId: string) => void;
  leaveGame: () => void;
  getRoleInfo: (role: Role) => RoleInfo;
  getNextRoleInChain: (role: Role) => Role | null;
  clearGuessResult: () => void;
  showInterruptionModal: boolean;
  interruptionReason: string;
  handleGameInterruption: (reason: string) => void;
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
  showInterruptionModal: false,
  interruptionReason: '',
  handleGameInterruption: () => {},
};

const GameContext = createContext<GameContextType>(defaultContext);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameId, setGameId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [lastGuessResult, setLastGuessResult] = useState<{ correct: boolean; message: string } | null>(null);
  const [showInterruptionModal, setShowInterruptionModal] = useState(false);
  const [interruptionReason, setInterruptionReason] = useState<string>('');
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

  const createGame = useCallback(async (playerName: string, customRoleNames?: { [key in Role]?: string }): Promise<string> => {
    if (!user) throw new Error('User must be authenticated to create a game');

    const newGameId = generateId();
    const newPlayer: Player = {
      id: generateId(),
      name: playerName,
      role: null,
      points: 0,
      isHost: true,
      userId: user.id,
      customRoleNames: customRoleNames || {},
    };

    await set(ref(database, `games/${newGameId}`), {
      players: [newPlayer],
      gameState: 'waiting',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastHeartbeat: Date.now(),
    });

    localStorage.setItem('currentGameId', newGameId);
    localStorage.setItem('currentPlayerId', newPlayer.id);

    setGameId(newGameId);
    setCurrentPlayer(newPlayer);
    setPlayers([newPlayer]);
    setIsHost(true);
    setGameState('waiting');

    return newGameId;
  }, [user]);

  const joinGame = useCallback(async (gameId: string, playerName: string): Promise<boolean> => {
    if (!user) throw new Error('User must be authenticated to join a game');

    const gameRef = ref(database, `games/${gameId}`);
    const snapshot = await get(gameRef);
    const gameData = snapshot.val();

    if (!gameData || gameData.gameState !== 'waiting') {
      return false;
    }

    const newPlayer: Player = {
      id: generateId(),
      name: playerName,
      role: null,
      points: 0,
      isHost: false,
      userId: user.id,
      customRoleNames: {},
    };

    const updatedPlayers = [...(gameData.players || []), newPlayer];

    await update(ref(database), {
      [`games/${gameId}/players`]: updatedPlayers,
      [`games/${gameId}/updatedAt`]: Date.now(),
    });

    localStorage.setItem('currentGameId', gameId);
    localStorage.setItem('currentPlayerId', newPlayer.id);

    setGameId(gameId);
    setCurrentPlayer(newPlayer);
    setPlayers(updatedPlayers);
    setIsHost(false);
    setGameState('waiting');

    return true;
  }, [user]);

  const startGame = useCallback(() => {
    if (!gameId || !isHost || players.length < 3) return;

    const shuffledRoles = [...roleChain]
      .slice(0, players.length)
      .sort(() => Math.random() - 0.5);

    const updatedPlayers = players.map((player, index) => ({
      ...player,
      role: shuffledRoles[index],
      points: 0,
    }));

    setPlayers(updatedPlayers);
    setGameState('playing');
    setCurrentPlayer(prev => {
      if (!prev) return null;
      const updated = updatedPlayers.find(p => p.id === prev.id);
      return updated || null;
    });

    debouncedSaveGameState(gameId, updatedPlayers, 'playing');
  }, [gameId, isHost, players, debouncedSaveGameState]);

  const makeGuess = useCallback((targetPlayerId: string) => {
    if (!currentPlayer || !gameId || gameState !== 'playing') return;

    const targetPlayer = players.find(p => p.id === targetPlayerId);
    if (!targetPlayer || !currentPlayer.role || !targetPlayer.role) return;

    const nextRole = getNextRoleInChain(currentPlayer.role);
    const isCorrectGuess = nextRole === targetPlayer.role;

    if (isCorrectGuess) {
      const updatedPlayers = players.map(player => {
        if (player.id === currentPlayer.id) {
          return { ...player, points: player.points + roleInfoMap[player.role!].points };
        }
        return player;
      });

      setPlayers(updatedPlayers);
      setLastGuessResult({ correct: true, message: `Correct! You found the ${roleInfoMap[targetPlayer.role].name}!` });
      confetti();
      debouncedSaveGameState(gameId, updatedPlayers, gameState);
    } else {
      setLastGuessResult({ correct: false, message: 'Wrong guess! Try again.' });
    }
  }, [currentPlayer, gameId, gameState, players, debouncedSaveGameState]);

  const leaveGame = useCallback(async () => {
    if (!gameId || !currentPlayer) return;

    const updatedPlayers = players.filter(p => p.id !== currentPlayer.id);

    if (currentPlayer.isHost && updatedPlayers.length > 0) {
      updatedPlayers[0].isHost = true;
    }

    if (updatedPlayers.length < 3) {
      await remove(ref(database, `games/${gameId}`));
    } else {
      await update(ref(database), {
        [`games/${gameId}/players`]: updatedPlayers,
        [`games/${gameId}/updatedAt`]: Date.now(),
      });
    }

    localStorage.removeItem('currentGameId');
    localStorage.removeItem('currentPlayerId');

    setGameState('waiting');
    setPlayers([]);
    setCurrentPlayer(null);
    setGameId(null);
    setIsHost(false);
  }, [gameId, currentPlayer, players]);

  const getRoleInfo = useCallback((role: Role): RoleInfo => {
    return memoizedRoleInfo[role];
  }, [memoizedRoleInfo]);

  const getNextRoleInChain = useCallback((role: Role): Role | null => {
    const currentIndex = memoizedRoleChain.indexOf(role);
    if (currentIndex === -1 || currentIndex === memoizedRoleChain.length - 1) return null;
    return memoizedRoleChain[currentIndex + 1];
  }, [memoizedRoleChain]);

  const clearGuessResult = useCallback(() => {
    setLastGuessResult(null);
  }, []);

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
            
            const presenceRef = ref(database, `presence/${savedGameId}/${player.id}`);
            set(presenceRef, {
              online: true,
              lastSeen: Date.now(),
              userId: user.id,
              name: player.name
            });

            onDisconnect(presenceRef).remove();
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
    const presenceRef = ref(database, `presence/${gameId}`);

    const gameUnsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      
      if (!data) {
        handleGameInterruption('Game session ended');
        return;
      }

      setGameState(data.gameState);
      setPlayers(data.players || []);
      
      if (currentPlayer) {
        const updatedCurrentPlayer = data.players?.find((p: Player) => p.id === currentPlayer.id);
        if (!updatedCurrentPlayer) {
          handleGameInterruption('You were removed from the game');
          return;
        }
        setCurrentPlayer(updatedCurrentPlayer);
      }
    });

    const presenceUnsubscribe = onValue(presenceRef, (snapshot) => {
      const presence = snapshot.val() || {};
      const now = Date.now();
      const offlineThreshold = 10000;

      players.forEach(player => {
        const playerPresence = presence[player.id];
        if (!playerPresence || now - playerPresence.lastSeen > offlineThreshold) {
          handlePlayerDisconnection(player);
        }
      });
    });

    return () => {
      gameUnsubscribe();
      presenceUnsubscribe();
    };
  }, [gameId, currentPlayer, players]);

  const handleGameInterruption = useCallback((reason: string) => {
    setInterruptionReason(reason);
    setShowInterruptionModal(true);
    
    localStorage.removeItem('currentGameId');
    localStorage.removeItem('currentPlayerId');
    setGameState('waiting');
    setPlayers([]);
    setCurrentPlayer(null);
    setGameId(null);
    setIsHost(false);
  }, []);

  const handlePlayerDisconnection = useCallback(async (disconnectedPlayer: Player) => {
    if (!gameId || gameState !== 'playing') return;

    const updatedPlayers = players.filter(p => p.id !== disconnectedPlayer.id);
    
    if (disconnectedPlayer.isHost && updatedPlayers.length > 0) {
      updatedPlayers[0].isHost = true;
    }

    const updates: { [key: string]: any } = {
      [`games/${gameId}/players`]: updatedPlayers,
      [`games/${gameId}/updatedAt`]: Date.now(),
    };

    await update(ref(database), updates);
    
    toast.error(`${disconnectedPlayer.name} has left the game`);
    
    if (updatedPlayers.length < 3) {
      handleGameInterruption('Not enough players to continue');
    }
  }, [gameId, gameState, players, handleGameInterruption]);

  return (
    <GameContext.Provider value={{
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
      showInterruptionModal,
      interruptionReason,
      handleGameInterruption,
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);