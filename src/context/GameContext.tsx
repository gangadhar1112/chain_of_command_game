import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Player, GameState, Role, RoleInfo } from '../types/gameTypes';
import { generateId } from '../utils/helpers';

// Define the context type
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

// Default context values
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

// Create the context
const GameContext = createContext<GameContextType>(defaultContext);

// Create a provider component
export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameId, setGameId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState<boolean>(false);

  // Load game state from localStorage
  useEffect(() => {
    const savedGameData = localStorage.getItem('chainOfCommandGame');
    if (savedGameData) {
      try {
        const { gameId, players, gameState, currentPlayerId } = JSON.parse(savedGameData);
        setGameId(gameId);
        setPlayers(players);
        setGameState(gameState);
        
        const currentPlayer = players.find(p => p.id === currentPlayerId);
        if (currentPlayer) {
          setCurrentPlayer(currentPlayer);
          setIsHost(currentPlayer.isHost);
        }
      } catch (error) {
        console.error('Failed to load game data:', error);
      }
    }
  }, []);

  // Save game state to localStorage
  const saveGameState = useCallback((
    gameId: string,
    players: Player[],
    gameState: GameState,
    currentPlayerId: string
  ) => {
    localStorage.setItem('chainOfCommandGame', JSON.stringify({
      gameId,
      players,
      gameState,
      currentPlayerId,
      updatedAt: Date.now()
    }));
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
    const newGameId = generateId(6);
    const playerId = generateId(8);
    
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
    
    saveGameState(newGameId, newPlayers, 'lobby', playerId);
    
    return newGameId;
  }, [saveGameState]);

  const joinGame = useCallback(async (gameId: string, playerName: string): Promise<boolean> => {
    // Check if game exists in localStorage
    const savedGameData = localStorage.getItem('chainOfCommandGame');
    let existingGame = null;
    
    if (savedGameData) {
      try {
        existingGame = JSON.parse(savedGameData);
        if (existingGame.gameId !== gameId) {
          existingGame = null;
        }
      } catch (error) {
        console.error('Failed to parse game data:', error);
      }
    }

    if (!existingGame) {
      // Create new game data if it doesn't exist
      const playerId = generateId(8);
      const newPlayer: Player = {
        id: playerId,
        name: playerName,
        role: null,
        isHost: false,
        isLocked: false,
        isCurrentTurn: false,
      };
      
      const newPlayers = [newPlayer];
      
      setGameId(gameId);
      setPlayers(newPlayers);
      setCurrentPlayer(newPlayer);
      setIsHost(false);
      setGameState('lobby');
      
      saveGameState(gameId, newPlayers, 'lobby', playerId);
      return true;
    }

    // Join existing game
    const playerId = generateId(8);
    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      role: null,
      isHost: false,
      isLocked: false,
      isCurrentTurn: false,
    };
    
    const updatedPlayers = [...existingGame.players, newPlayer];
    
    setGameId(gameId);
    setPlayers(updatedPlayers);
    setCurrentPlayer(newPlayer);
    setIsHost(false);
    setGameState(existingGame.gameState);
    
    saveGameState(gameId, updatedPlayers, existingGame.gameState, playerId);
    return true;
  }, [saveGameState]);

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
      saveGameState(gameId, updatedPlayers, 'playing', currentPlayer.id);
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
    
    setPlayers(updatedPlayers);
    setCurrentPlayer(guessingPlayer);
    
    const allPlayersLocked = updatedPlayers.every(p => p.isLocked || p.role === 'thief');
    const thief = updatedPlayers.find(p => p.role === 'thief');
    
    if (allPlayersLocked && thief) {
      setGameState('completed');
      if (gameId) {
        saveGameState(gameId, updatedPlayers, 'completed', guessingPlayer.id);
      }
    } else if (gameId) {
      saveGameState(gameId, updatedPlayers, 'playing', guessingPlayer.id);
    }
  }, [currentPlayer, players, gameState, gameId, getNextRoleInChain, saveGameState]);

  const leaveGame = useCallback(() => {
    if (gameId && currentPlayer) {
      const updatedPlayers = players.filter(p => p.id !== currentPlayer.id);
      
      if (updatedPlayers.length > 0) {
        if (currentPlayer.isHost) {
          updatedPlayers[0].isHost = true;
        }
        saveGameState(gameId, updatedPlayers, gameState, updatedPlayers[0].id);
      } else {
        localStorage.removeItem('chainOfCommandGame');
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