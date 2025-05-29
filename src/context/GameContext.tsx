import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ref, set, onValue, remove, get } from 'firebase/database';
import { useAuth } from './AuthContext';
import { database } from '../config/firebase';
import { Player, GameState, Role, RoleInfo } from '../types/gameTypes';
import { generateId } from '../utils/helpers';

// Role information
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

// Chain order
const roleChain: Role[] = ['king', 'queen', 'minister', 'soldier', 'police', 'thief'];

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

  // Listen for game updates
  useEffect(() => {
    if (!gameId) return;

    const gameRef = ref(database, `games/${gameId}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPlayers(data.players || []);
        setGameState(data.gameState || 'waiting');
        
        // Update current player if needed
        if (currentPlayer) {
          const updatedCurrentPlayer = data.players?.find((p: Player) => p.id === currentPlayer.id);
          if (updatedCurrentPlayer) {
            setCurrentPlayer(updatedCurrentPlayer);
          }
        }
      } else {
        // Game was deleted or doesn't exist
        setGameState('waiting');
        setPlayers([]);
        setCurrentPlayer(null);
        setGameId(null);
        setIsHost(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [gameId, currentPlayer]);

  const saveGameState = useCallback(async (
    gameId: string,
    players: Player[],
    gameState: GameState
  ) => {
    const gameRef = ref(database, `games/${gameId}`);
    await set(gameRef, {
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
    if (!user) throw new Error('Must be signed in to create a game');

    const newGameId = generateId(6);
    const playerId = user.id; // Changed from user.uid to user.id
    
    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      role: null,
      isHost: true,
      isLocked: false,
      isCurrentTurn: false,
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
    if (!user) throw new Error('Must be signed in to join a game');

    try {
      const gameRef = ref(database, `games/${gameId}`);
      const snapshot = await get(gameRef);
      
      if (!snapshot.exists()) {
        return false;
      }

      const gameData = snapshot.val();
      if (gameData.gameState !== 'lobby') {
        return false;
      }

      // Check if player is already in the game
      const existingPlayer = gameData.players?.find((p: Player) => p.id === user.id); // Changed from user.uid to user.id
      if (existingPlayer) {
        setGameId(gameId);
        setCurrentPlayer(existingPlayer);
        setPlayers(gameData.players);
        setIsHost(existingPlayer.isHost);
        setGameState(gameData.gameState);
        return true;
      }

      const newPlayer: Player = {
        id: user.id, // Changed from user.uid to user.id
        name: playerName,
        role: null,
        isHost: false,
        isLocked: false,
        isCurrentTurn: false,
      };
      
      const updatedPlayers = [...(gameData.players || []), newPlayer];
      
      await saveGameState(gameId, updatedPlayers, gameData.gameState);
      
      setGameId(gameId);
      setCurrentPlayer(newPlayer);
      setPlayers(updatedPlayers);
      setIsHost(false);
      setGameState(gameData.gameState);
      
      return true;
    } catch (error) {
      console.error('Error joining game:', error);
      return false;
    }
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
    
    saveGameState(gameId, updatedPlayers, 'playing');
  }, [isHost, gameId, players, saveGameState]);

  const makeGuess = useCallback((targetPlayerId: string) => {
    if (!currentPlayer || !currentPlayer.isCurrentTurn || !gameId || gameState !== 'playing') {
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
      const tempRole = guessingPlayer.role;
      guessingPlayer.role = targetPlayer.role;
      targetPlayer.role = tempRole;
      
      updatedPlayers = updatedPlayers.map(p => {
        if (p.id === guessingPlayer.id) return guessingPlayer;
        if (p.id === targetPlayer.id) return targetPlayer;
        return p;
      });
    }
    
    const allPlayersLocked = updatedPlayers.every(p => p.isLocked || p.role === 'thief');
    const thief = updatedPlayers.find(p => p.role === 'thief');
    
    const newGameState = allPlayersLocked && thief ? 'completed' : 'playing';
    saveGameState(gameId, updatedPlayers, newGameState);
  }, [currentPlayer, gameId, players, gameState, getNextRoleInChain, saveGameState]);

  const leaveGame = useCallback(async () => {
    if (gameId && currentPlayer) {
      const updatedPlayers = players.filter(p => p.id !== currentPlayer.id);
      
      if (updatedPlayers.length > 0) {
        // If current player was host, assign host to next player
        if (currentPlayer.isHost && updatedPlayers.length > 0) {
          updatedPlayers[0].isHost = true;
        }
        await saveGameState(gameId, updatedPlayers, gameState);
      } else {
        // If last player leaves, remove the game
        const gameRef = ref(database, `games/${gameId}`);
        await remove(gameRef);
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