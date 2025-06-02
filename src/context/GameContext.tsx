import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { database } from '../config/firebase';
import { ref, set, onValue, off, get, update, remove } from 'firebase/database';
import { GameState, Player, Role, RoleInfo } from '../types/gameTypes';
import { generateId, shuffleArray } from '../utils/helpers';
import toast from 'react-hot-toast';

interface GameContextType {
  gameState: GameState;
  players: Player[];
  currentRole: Role | null;
  isHost: boolean;
  currentPlayer: Player | null;
  lastGuessResult: { correct: boolean; message: string } | null;
  showInterruptionModal: boolean;
  interruptionReason: string;
  joinGame: (gameId: string, playerName: string) => Promise<boolean>;
  createGame: (playerName: string) => Promise<string>;
  startGame: () => Promise<void>;
  endGame: () => Promise<void>;
  leaveGame: () => Promise<void>;
  makeGuess: (targetPlayerId: string) => Promise<void>;
  getRoleInfo: (role: Role) => RoleInfo;
  updateGameState: (newState: Partial<GameState>) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const ROLES: Role[] = ['king', 'queen', 'minister', 'soldier', 'police', 'thief'];

const getRoleInfo = (role: Role): RoleInfo => {
  switch (role) {
    case 'king':
      return {
        name: 'King',
        icon: 'crown',
        color: 'text-yellow-400',
        description: 'Find the Queen to secure your position',
        points: 10,
        chainOrder: 1
      };
    case 'queen':
      return {
        name: 'Queen',
        icon: 'heart',
        color: 'text-pink-400',
        description: 'Find the Minister to secure your position',
        points: 9,
        chainOrder: 2
      };
    case 'minister':
      return {
        name: 'Minister',
        icon: 'building',
        color: 'text-blue-400',
        description: 'Find the Soldier to secure your position',
        points: 7,
        chainOrder: 3
      };
    case 'soldier':
      return {
        name: 'Soldier',
        icon: 'shield',
        color: 'text-green-400',
        description: 'Find the Police to secure your position',
        points: 6,
        chainOrder: 4
      };
    case 'police':
      return {
        name: 'Police',
        icon: 'siren',
        color: 'text-indigo-400',
        description: 'Find the Thief to secure your position',
        points: 4,
        chainOrder: 5
      };
    case 'thief':
      return {
        name: 'Thief',
        icon: 'footprints',
        color: 'text-red-400',
        description: 'Stay hidden from the Police',
        points: 0,
        chainOrder: 6
      };
  }
};

const getNextRoleInChain = (currentRole: Role): Role | null => {
  const roleOrder = ['king', 'queen', 'minister', 'soldier', 'police', 'thief'];
  const currentIndex = roleOrder.indexOf(currentRole);
  return currentIndex < roleOrder.length - 1 ? roleOrder[currentIndex + 1] as Role : null;
};

export function GameProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [gameId, setGameId] = useState<string | null>(null);
  const [lastGuessResult, setLastGuessResult] = useState<{ correct: boolean; message: string } | null>(null);
  const [showInterruptionModal, setShowInterruptionModal] = useState(false);
  const [interruptionReason, setInterruptionReason] = useState('');

  const currentPlayer = players.find(p => p.userId === user?.id) || null;

  useEffect(() => {
    return () => {
      if (gameId) {
        const gameRef = ref(database, `games/${gameId}`);
        off(gameRef);
      }
    };
  }, [gameId]);

  const createGame = async (playerName: string): Promise<string> => {
    if (!user) throw new Error('Must be signed in to create a game');

    const newGameId = generateId(6);
    const gameRef = ref(database, `games/${newGameId}`);

    const initialPlayer: Player = {
      id: generateId(8),
      name: playerName,
      role: null,
      isHost: true,
      isLocked: false,
      isCurrentTurn: false,
      userId: user.id
    };

    try {
      await set(gameRef, {
        id: newGameId,
        state: 'lobby',
        players: [initialPlayer],
        createdAt: Date.now(),
        hostId: user.id
      });

      setGameId(newGameId);
      setGameState('lobby');
      setPlayers([initialPlayer]);
      setIsHost(true);

      return newGameId;
    } catch (error) {
      console.error('Error creating game:', error);
      throw new Error('Failed to create game');
    }
  };

  const joinGame = async (gameId: string, playerName: string): Promise<boolean> => {
    if (!user) throw new Error('Must be signed in to join a game');

    const gameRef = ref(database, `games/${gameId}`);
    
    try {
      const snapshot = await get(gameRef);
      const gameData = snapshot.val();

      if (!gameData) {
        toast.error('Game not found');
        return false;
      }

      // Check if user is already in the game
      const existingPlayer = gameData.players?.find((p: Player) => p.userId === user.id);
      if (existingPlayer) {
        // If the game is in lobby, allow rejoin
        if (gameData.state === 'lobby') {
          setGameId(gameId);
          setGameState('lobby');
          setPlayers(gameData.players || []);
          setIsHost(existingPlayer.isHost);
          return true;
        }
        // If game is in progress, navigate to game page
        navigate(`/game/${gameId}`);
        return true;
      }

      if (gameData.state !== 'lobby') {
        toast.error('Game has already started');
        return false;
      }

      const currentPlayers = gameData.players || [];
      if (currentPlayers.length >= 6) {
        toast.error('Game is full');
        return false;
      }

      const newPlayer: Player = {
        id: generateId(8),
        name: playerName,
        role: null,
        isHost: false,
        isLocked: false,
        isCurrentTurn: false,
        userId: user.id
      };

      await update(gameRef, {
        players: [...currentPlayers, newPlayer]
      });

      setGameId(gameId);
      setGameState('lobby');
      setPlayers([...currentPlayers, newPlayer]);
      setIsHost(false);

      // Set up real-time updates
      onValue(gameRef, (snapshot) => {
        const game = snapshot.val();
        if (game) {
          setGameState(game.state);
          setPlayers(game.players || []);
          
          if (game.state === 'playing') {
            const playerRole = game.players.find((p: Player) => p.userId === user.id)?.role;
            setCurrentRole(playerRole);
          }
        }
      });

      return true;
    } catch (error) {
      console.error('Error joining game:', error);
      throw new Error('Failed to join game');
    }
  };

  const startGame = async () => {
    if (!gameId || !isHost) return;

    const gameRef = ref(database, `games/${gameId}`);
    
    try {
      const snapshot = await get(gameRef);
      const game = snapshot.val();

      if (game.players.length !== 6) {
        toast.error('Need 6 players to start the game');
        return;
      }

      // Assign random roles
      const shuffledRoles = shuffleArray([...ROLES]);
      const playersWithRoles = game.players.map((player: Player, index: number) => ({
        ...player,
        role: shuffledRoles[index],
        isCurrentTurn: shuffledRoles[index] === 'king'
      }));

      await update(gameRef, {
        state: 'playing',
        players: playersWithRoles,
        startedAt: Date.now()
      });

      toast.success('Game started!');
    } catch (error) {
      console.error('Error starting game:', error);
      toast.error('Failed to start game');
    }
  };

  const makeGuess = async (targetPlayerId: string) => {
    if (!gameId || !currentPlayer || !currentPlayer.isCurrentTurn) return;

    const gameRef = ref(database, `games/${gameId}`);
    const snapshot = await get(gameRef);
    const game = snapshot.val();

    const targetPlayer = game.players.find((p: Player) => p.id === targetPlayerId);
    const nextRole = getNextRoleInChain(currentPlayer.role as Role);

    if (targetPlayer.role === nextRole) {
      // Correct guess
      const updatedPlayers = game.players.map((p: Player) => {
        if (p.id === currentPlayer.id || p.id === targetPlayerId) {
          return { ...p, isLocked: true };
        }
        return p;
      });

      // Set next turn
      const nextPlayer = updatedPlayers.find((p: Player) => p.id === targetPlayerId);
      updatedPlayers.forEach((p: Player) => {
        p.isCurrentTurn = p.id === nextPlayer.id;
      });

      await update(gameRef, { players: updatedPlayers });
      setLastGuessResult({
        correct: true,
        message: `Correct! You found the ${getRoleInfo(nextRole as Role).name}!`
      });

      // Check if game is complete
      const unlockedPlayers = updatedPlayers.filter((p: Player) => !p.isLocked && p.role !== 'thief');
      if (unlockedPlayers.length === 0) {
        await update(gameRef, { state: 'completed' });
      }
    } else {
      // Incorrect guess
      const updatedPlayers = game.players.map((p: Player) => {
        if (p.id === currentPlayer.id) {
          return { ...p, role: targetPlayer.role, isCurrentTurn: false };
        }
        if (p.id === targetPlayerId) {
          return { ...p, role: currentPlayer.role, isCurrentTurn: true };
        }
        return { ...p, isCurrentTurn: false };
      });

      await update(gameRef, { players: updatedPlayers });
      setLastGuessResult({
        correct: false,
        message: 'Wrong guess! Roles have been swapped.'
      });
    }

    // Clear guess result after 3 seconds
    setTimeout(() => setLastGuessResult(null), 3000);
  };

  const leaveGame = async () => {
    if (!gameId || !user) return;

    const gameRef = ref(database, `games/${gameId}`);
    
    try {
      const snapshot = await get(gameRef);
      const game = snapshot.val();

      if (game.state === 'playing') {
        // Set interruption state for other players
        await update(gameRef, {
          state: 'interrupted',
          interruptionReason: `${currentPlayer?.name} has left the game`
        });
      }

      const remainingPlayers = game.players.filter((p: Player) => p.userId !== user.id);
      
      if (remainingPlayers.length === 0) {
        // Delete the game if no players remain
        await remove(gameRef);
      } else {
        // Update host if current player was host
        if (isHost) {
          const newHost = remainingPlayers[0];
          remainingPlayers[0] = { ...newHost, isHost: true };
        }
        
        await update(gameRef, {
          players: remainingPlayers
        });
      }

      // Clean up local state
      setGameId(null);
      setGameState('waiting');
      setPlayers([]);
      setCurrentRole(null);
      setIsHost(false);
      
      // Unsubscribe from game updates
      off(gameRef);
      
      navigate('/');
    } catch (error) {
      console.error('Error leaving game:', error);
      toast.error('Failed to leave game');
    }
  };

  const endGame = async () => {
    if (!gameId || !isHost) return;

    const gameRef = ref(database, `games/${gameId}`);
    
    try {
      await update(gameRef, {
        state: 'completed',
        endedAt: Date.now()
      });

      toast.success('Game ended');
    } catch (error) {
      console.error('Error ending game:', error);
      toast.error('Failed to end game');
    }
  };

  const updateGameState = (newState: Partial<GameState>) => {
    setGameState(prev => ({ ...prev, ...newState } as GameState));
  };

  const value = {
    gameState,
    players,
    currentRole,
    isHost,
    currentPlayer,
    lastGuessResult,
    showInterruptionModal,
    interruptionReason,
    joinGame,
    createGame,
    startGame,
    endGame,
    leaveGame,
    makeGuess,
    getRoleInfo,
    updateGameState
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};