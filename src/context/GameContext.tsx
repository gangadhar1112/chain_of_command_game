import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ref, set, get, onValue, off } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from './AuthContext';
import { Player, GameState, Role, RoleInfo } from '../types/gameTypes';
import { generateId } from '../utils/helpers';

interface GameContextType {
  gameState: GameState;
  currentPlayer: Player | null;
  players: Player[];
  gameId: string | null;
  isHost: boolean;
  createGame: (playerName: string) => string;
  joinGame: (gameId: string, playerName: string) => Promise<boolean>;
  startGame: () => void;
  makeGuess: (targetPlayerId: string) => void;
  leaveGame: () => void;
  getRoleInfo: (role: Role) => RoleInfo;
  getNextRoleInChain: (role: Role) => Role | null;
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
    icon: 'Briefcase',
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
    icon: 'BadgeAlert',
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
  createGame: () => '',
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
};

const GameContext = createContext<GameContextType>(defaultContext);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameId, setGameId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState<boolean>(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!gameId) return;

    const gameRef = ref(database, `games/${gameId}`);
    onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPlayers(data.players || []);
        setGameState(data.gameState);
        
        if (currentPlayer) {
          const updatedCurrentPlayer = data.players?.find((p: Player) => p.id === currentPlayer.id);
          if (updatedCurrentPlayer) {
            setCurrentPlayer(updatedCurrentPlayer);
          }
        }
      }
    });

    return () => {
      off(gameRef);
    };
  }, [gameId, currentPlayer]);

  const saveGameState = useCallback(async (
    gameId: string,
    players: Player[],
    gameState: GameState,
  ) => {
    const gameRef = ref(database, `games/${gameId}`);
    await set(gameRef, {
      gameId,
      players,
      gameState,
      updatedAt: Date.now()
    });
  }, []);

  const getRoleInfo = useCallback((role: Role): RoleInfo => {
    return roleInfoMap[role];
  }, []);

  const getNextRoleInChain = useCallback((role: Role): Role | null => {
    const currentIndex = roleChain.indexOf(role);
    if (currentIndex === -1 || currentIndex === roleChain.length - 1) {
      return null;
    }
    return roleChain[currentIndex + 1];
  }, []);

  const createGame = useCallback((playerName: string): string => {
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
    
    const newPlayers = [newPlayer];
    
    setGameId(newGameId);
    setPlayers(newPlayers);
    setCurrentPlayer(newPlayer);
    setIsHost(true);
    setGameState('lobby');
    
    saveGameState(newGameId, newPlayers, 'lobby');
    
    return newGameId;
  }, [user, saveGameState]);

  const joinGame = useCallback(async (gameId: string, playerName: string): Promise<boolean> => {
    if (!user) throw new Error('Must be logged in to join a game');

    const gameRef = ref(database, `games/${gameId}`);
    const snapshot = await get(gameRef);
    const gameData = snapshot.val();

    if (!gameData || gameData.gameState === 'playing' || gameData.gameState === 'completed') {
      return false;
    }

    const playerId = generateId(8);
    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      role: null,
      isHost: false,
      isLocked: false,
      isCurrentTurn: false,
      userId: user.id,
    };
    
    const updatedPlayers = [...(gameData.players || []), newPlayer];
    
    setGameId(gameId);
    setPlayers(updatedPlayers);
    setCurrentPlayer(newPlayer);
    setIsHost(false);
    setGameState(gameData.gameState);
    
    await saveGameState(gameId, updatedPlayers, gameData.gameState);
    return true;
  }, [user, saveGameState]);

  const startGame = useCallback(() => {
    if (!isHost || !gameId || players.length < 3 || players.length > 6) {
      return;
    }
    
    const availableRoles = [...roleChain.slice(0, players.length)];
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
      saveGameState(gameId, updatedPlayers, 'playing');
    }
  }, [isHost, gameId, players, currentPlayer, saveGameState]);

  const makeGuess = useCallback((targetPlayerId: string) => {
    if (!currentPlayer || !currentPlayer.isCurrentTurn || gameState !== 'playing') {
      return;
    }
    
    const guessingPlayer = { ...currentPlayer };
    const targetPlayerIndex = players.findIndex(p => p.id === targetPlayerId);
    
    if (targetPlayerIndex === -1 || guessingPlayer.isLocked) {
      return;
    }
    
    const targetPlayer = { ...players[targetPlayerIndex] };
    const expectedNextRole = getNextRoleInChain(guessingPlayer.role as Role);
    
    const isCorrectGuess = targetPlayer.role === expectedNextRole;
    
    let updatedPlayers = [...players];
    
    if (isCorrectGuess) {
      // Correct guess - lock positions and pass turn
      guessingPlayer.isLocked = true;
      targetPlayer.isLocked = true;
      
      updatedPlayers = updatedPlayers.map(p => {
        if (p.id === guessingPlayer.id) return guessingPlayer;
        if (p.id === targetPlayer.id) return targetPlayer;
        return p;
      });
      
      guessingPlayer.isCurrentTurn = false;
      targetPlayer.isCurrentTurn = true;
    } else {
      // Wrong guess - swap roles and pass turn to the new King
      const tempRole = guessingPlayer.role;
      guessingPlayer.role = targetPlayer.role;
      targetPlayer.role = tempRole;
      
      // Find who has the King role after the swap
      const newKing = guessingPlayer.role === 'king' ? guessingPlayer : targetPlayer;
      
      updatedPlayers = updatedPlayers.map(p => {
        if (p.id === guessingPlayer.id) {
          return { ...guessingPlayer, isCurrentTurn: false };
        }
        if (p.id === targetPlayer.id) {
          return { ...targetPlayer, isCurrentTurn: false };
        }
        if (p.id === newKing.id) {
          return { ...p, isCurrentTurn: true };
        }
        return p;
      });
    }
    
    setPlayers(updatedPlayers);
    setCurrentPlayer(guessingPlayer);
    
    const allPlayersLocked = updatedPlayers.every(p => p.isLocked || p.role === 'thief');
    const thief = updatedPlayers.find(p => p.role === 'thief');
    
    if (allPlayersLocked && thief) {
      setGameState('completed');
      if (gameId) {
        saveGameState(gameId, updatedPlayers, 'completed');
      }
    } else if (gameId) {
      saveGameState(gameId, updatedPlayers, 'playing');
    }
  }, [currentPlayer, players, gameState, gameId, getNextRoleInChain, saveGameState]);

  const leaveGame = useCallback(() => {
    if (gameId && currentPlayer) {
      const updatedPlayers = players.filter(p => p.id !== currentPlayer.id);
      
      if (updatedPlayers.length > 0) {
        if (currentPlayer.isHost) {
          updatedPlayers[0].isHost = true;
        }
        saveGameState(gameId, updatedPlayers, gameState);
      } else {
        const gameRef = ref(database, `games/${gameId}`);
        set(gameRef, null);
      }
    }

    setGameState('waiting');
    setCurrentPlayer(null);
    setPlayers([]);
    setGameId(null);
    setIsHost(false);
  }, [gameId, currentPlayer, players, gameState, saveGameState]);

  return (
    <GameContext.Provider
      value={{
        gameState,
        currentPlayer,
        players,
        gameId,
        isHost,
        createGame,
        joinGame,
        startGame,
        makeGuess,
        leaveGame,
        getRoleInfo,
        getNextRoleInChain,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);