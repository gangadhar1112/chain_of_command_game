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
  joinGame: (gameId: string, playerName: string) => boolean;
  startGame: () => void;
  makeGuess: (targetPlayerId: string) => void;
  leaveGame: () => void;
  getRoleInfo: (role: Role) => RoleInfo;
  getNextRoleInChain: (role: Role) => Role | null;
}

// Default context values
const defaultContext: GameContextType = {
  gameState: 'waiting',
  currentPlayer: null,
  players: [],
  gameId: null,
  isHost: false,
  createGame: () => '',
  joinGame: () => false,
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

// Create a provider component
export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameId, setGameId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState<string | null>(null);

  // Poll for updates every 2 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      const savedGameData = localStorage.getItem('chainOfCommandGame');
      if (savedGameData) {
        try {
          const { players: savedPlayers, gameState: savedGameState } = JSON.parse(savedGameData);
          if (savedPlayers) {
            setPlayers(savedPlayers);
          }
          if (savedGameState) {
            setGameState(savedGameState);
          }
        } catch (error) {
          console.error('Failed to parse saved game data', error);
        }
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, []);

  // Initial load of game data
  useEffect(() => {
    const savedGameData = localStorage.getItem('chainOfCommandGame');
    if (savedGameData) {
      try {
        const { gameId: savedGameId, playerId, isHost: savedIsHost, players: savedPlayers, gameState: savedGameState } = JSON.parse(savedGameData);
        if (savedGameId) {
          setGameId(savedGameId);
          setIsHost(savedIsHost);
          setPlayers(savedPlayers || []);
          setGameState(savedGameState || 'waiting');
          
          if (playerId) {
            const player = savedPlayers?.find((p: Player) => p.id === playerId);
            if (player) {
              setCurrentPlayer(player);
              if (player.isCurrentTurn) {
                setCurrentTurnPlayerId(player.id);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to parse saved game data', error);
        localStorage.removeItem('chainOfCommandGame');
      }
    }
  }, []);

  // Save game data to localStorage
  const saveGameData = useCallback((gameId: string, playerId: string, isHost: boolean, currentPlayers: Player[], currentGameState: GameState) => {
    localStorage.setItem(
      'chainOfCommandGame',
      JSON.stringify({
        gameId,
        playerId,
        isHost,
        players: currentPlayers,
        gameState: currentGameState
      })
    );
  }, []);

  // Get role info
  const getRoleInfo = useCallback((role: Role): RoleInfo => {
    return roleInfoMap[role];
  }, []);

  // Get next role in chain
  const getNextRoleInChain = useCallback((role: Role): Role | null => {
    const currentIndex = roleChain.indexOf(role);
    if (currentIndex === -1 || currentIndex === roleChain.length - 1) {
      return null;
    }
    return roleChain[currentIndex + 1];
  }, []);

  // Create a new game
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
    
    saveGameData(newGameId, playerId, true, newPlayers, 'lobby');
    
    return newGameId;
  }, [saveGameData]);

  // Join an existing game
  const joinGame = useCallback((gameId: string, playerName: string): boolean => {
    const playerId = generateId(8);
    
    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      role: null,
      isHost: false,
      isLocked: false,
      isCurrentTurn: false,
    };
    
    const updatedPlayers = [...players, newPlayer];
    
    setGameId(gameId);
    setCurrentPlayer(newPlayer);
    setPlayers(updatedPlayers);
    setIsHost(false);
    setGameState('lobby');
    
    saveGameData(gameId, playerId, false, updatedPlayers, 'lobby');
    
    return true;
  }, [players, saveGameData]);

  // Start the game
  const startGame = useCallback(() => {
    if (!isHost || players.length < 3 || players.length > 6) {
      return;
    }
    
    // Assign roles randomly
    const availableRoles = [...roleChain.slice(0, players.length)];
    const shuffledRoles = availableRoles.sort(() => Math.random() - 0.5);
    
    const updatedPlayers = players.map((player, index) => ({
      ...player,
      role: shuffledRoles[index],
      isLocked: false,
      isCurrentTurn: false,
    }));
    
    // Find the King to start the game
    const kingPlayer = updatedPlayers.find(player => player.role === 'king');
    if (kingPlayer) {
      kingPlayer.isCurrentTurn = true;
      setCurrentTurnPlayerId(kingPlayer.id);
    }
    
    setPlayers(updatedPlayers);
    setGameState('playing');
    
    // Update the current player's role
    if (currentPlayer) {
      const playerWithRole = updatedPlayers.find(p => p.id === currentPlayer.id);
      if (playerWithRole) {
        setCurrentPlayer(playerWithRole);
      }
    }
    
    // Save the updated game state
    if (gameId && currentPlayer) {
      saveGameData(gameId, currentPlayer.id, isHost, updatedPlayers, 'playing');
    }
  }, [isHost, players, currentPlayer, gameId, saveGameData]);

  // Make a guess
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
    
    // Check if the guess is correct
    const isCorrectGuess = targetPlayer.role === expectedNextRole;
    
    let updatedPlayers = [...players];
    
    if (isCorrectGuess) {
      // Lock both players
      guessingPlayer.isLocked = true;
      targetPlayer.isLocked = true;
      
      // Update the players in the array
      updatedPlayers = updatedPlayers.map(p => {
        if (p.id === guessingPlayer.id) return guessingPlayer;
        if (p.id === targetPlayer.id) return targetPlayer;
        return p;
      });
      
      // Set the target player's turn
      guessingPlayer.isCurrentTurn = false;
      targetPlayer.isCurrentTurn = true;
      setCurrentTurnPlayerId(targetPlayer.id);
    } else {
      // Swap roles
      const tempRole = guessingPlayer.role;
      guessingPlayer.role = targetPlayer.role;
      targetPlayer.role = tempRole;
      
      // Update the players in the array
      updatedPlayers = updatedPlayers.map(p => {
        if (p.id === guessingPlayer.id) return guessingPlayer;
        if (p.id === targetPlayer.id) return targetPlayer;
        return p;
      });
    }
    
    setPlayers(updatedPlayers);
    
    // Update current player if it was modified
    if (currentPlayer.id === guessingPlayer.id) {
      setCurrentPlayer(guessingPlayer);
    }
    
    // Save the updated game state
    if (gameId && currentPlayer) {
      saveGameData(gameId, currentPlayer.id, isHost, updatedPlayers, gameState);
    }
    
    // Check if the game is complete
    const allPlayersLocked = updatedPlayers.every(p => p.isLocked || p.role === 'thief');
    const thief = updatedPlayers.find(p => p.role === 'thief');
    
    if (allPlayersLocked && thief) {
      setGameState('completed');
      if (gameId && currentPlayer) {
        saveGameData(gameId, currentPlayer.id, isHost, updatedPlayers, 'completed');
      }
    }
  }, [currentPlayer, players, gameState, getNextRoleInChain, gameId, isHost, saveGameData]);

  // Leave the game
  const leaveGame = useCallback(() => {
    setGameState('waiting');
    setCurrentPlayer(null);
    setPlayers([]);
    setGameId(null);
    setIsHost(false);
    setCurrentTurnPlayerId(null);
    
    localStorage.removeItem('chainOfCommandGame');
  }, []);

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

// Custom hook to use the game context
export const useGame = () => useContext(GameContext);