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

const ROLES: Role[] = ['raja', 'rani', 'mantri', 'sipahi', 'police', 'chor'];

const getRoleInfo = (role: Role): RoleInfo => {
  switch (role) {
    case 'raja':
      return {
        name: 'Raja',
        icon: 'crown',
        color: 'text-yellow-400',
        description: 'The King of the kingdom',
        points: 100,
        chainOrder: 1
      };
    case 'rani':
      return {
        name: 'Rani',
        icon: 'heart',
        color: 'text-pink-400',
        description: 'The Queen of the kingdom',
        points: 80,
        chainOrder: 2
      };
    case 'mantri':
      return {
        name: 'Mantri',
        icon: 'scroll',
        color: 'text-blue-400',
        description: 'The Minister of the kingdom',
        points: 50,
        chainOrder: 3
      };
    case 'sipahi':
      return {
        name: 'Sipahi',
        icon: 'shield',
        color: 'text-green-400',
        description: 'The Guard of the kingdom',
        points: 25,
        chainOrder: 4
      };
    case 'police':
      return {
        name: 'Police',
        icon: 'siren',
        color: 'text-indigo-400',
        description: 'The Law enforcer of the kingdom',
        points: 15,
        chainOrder: 5
      };
    case 'chor':
      return {
        name: 'Chor',
        icon: 'footprints',
        color: 'text-red-400',
        description: 'The Thief who must avoid capture',
        points: 0,
        chainOrder: 6
      };
  }
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
    if (!gameId) return;

    const gameRef = ref(database, `games/${gameId}`);
    const unsubscribe = onValue(gameRef, async (snapshot) => {
      const game = snapshot.val();
      
      if (!game) {
        if (gameState !== 'waiting') {
          setGameState('waiting');
          setPlayers([]);
          setCurrentRole(null);
          setIsHost(false);
          setShowInterruptionModal(true);
          setInterruptionReason('Game session has ended');
          navigate('/');
        }
        return;
      }

      setGameState(game.state);
      setPlayers(game.players || []);
      
      const playerInGame = game.players?.find((p: Player) => p.userId === user?.id);
      setIsHost(playerInGame?.isHost || false);
      
      if (game.state === 'playing') {
        const playerRole = game.players.find((p: Player) => p.userId === user?.id)?.role;
        setCurrentRole(playerRole || null);
      }

      if (game.state === 'interrupted') {
        setShowInterruptionModal(true);
        setInterruptionReason(game.interruptionReason || 'Game was interrupted');
      }
    });

    return () => {
      off(gameRef);
    };
  }, [gameId, user?.id, navigate, gameState]);

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

      const updatedPlayers = [...currentPlayers, newPlayer];
      
      await update(gameRef, {
        players: updatedPlayers,
        lastUpdated: Date.now()
      });

      setGameId(gameId);
      setGameState('lobby');
      setPlayers(updatedPlayers);
      setIsHost(false);

      return true;
    } catch (error) {
      console.error('Error joining game:', error);
      toast.error('Failed to join game');
      return false;
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

      const shuffledRoles = shuffleArray([...ROLES]);
      const playersWithRoles = game.players.map((player: Player, index: number) => ({
        ...player,
        role: shuffledRoles[index],
        isCurrentTurn: shuffledRoles[index] === 'raja'
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
    if (!gameId || !currentPlayer) return;

    const gameRef = ref(database, `games/${gameId}`);
    const snapshot = await get(gameRef);
    const game = snapshot.val();

    const targetPlayer = game.players.find((p: Player) => p.id === targetPlayerId);
    if (!targetPlayer || targetPlayer.isLocked) return;

    const nextRole = getNextRoleInChain(currentPlayer.role as Role);
    
    if (targetPlayer.role === nextRole) {
      const updatedPlayers = game.players.map((p: Player) => {
        if (p.id === currentPlayer.id) {
          return { ...p, isLocked: true, isCurrentTurn: false };
        }
        if (p.id === targetPlayer.id) {
          return { ...p, isCurrentTurn: true };
        }
        return { ...p, isCurrentTurn: false };
      });

      await update(gameRef, { players: updatedPlayers });
      setLastGuessResult({
        correct: true,
        message: `Correct! You found the ${getRoleInfo(nextRole as Role).name}!`
      });

      const unlockedPlayers = updatedPlayers.filter(p => !p.isLocked && p.role !== 'chor');
      if (unlockedPlayers.length === 0) {
        await update(gameRef, { state: 'completed' });
      }
    } else {
      const updatedPlayers = game.players.map((p: Player) => {
        if (p.id === currentPlayer.id) {
          return { ...p, role: targetPlayer.role, isCurrentTurn: false };
        }
        if (p.id === targetPlayer.id) {
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

    setTimeout(() => setLastGuessResult(null), 3000);
  };

  const leaveGame = async () => {
    if (!gameId || !user) return;

    const gameRef = ref(database, `games/${gameId}`);
    
    try {
      const snapshot = await get(gameRef);
      const game = snapshot.val();

      if (!game) return;

      if (game.state === 'playing') {
        await update(gameRef, {
          state: 'interrupted',
          interruptionReason: `${currentPlayer?.name} has left the game`
        });
      }

      const remainingPlayers = game.players.filter((p: Player) => p.userId !== user.id);
      
      if (remainingPlayers.length === 0) {
        await remove(gameRef);
      } else {
        if (isHost) {
          remainingPlayers[0] = { ...remainingPlayers[0], isHost: true };
        }
        
        await update(gameRef, {
          players: remainingPlayers,
          hostId: remainingPlayers[0].userId,
          lastUpdated: Date.now()
        });
      }

      setGameId(null);
      setGameState('waiting');
      setPlayers([]);
      setCurrentRole(null);
      setIsHost(false);
      setShowInterruptionModal(false);
      
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

  const getNextRoleInChain = (currentRole: Role): Role | null => {
    const roleOrder = ['raja', 'rani', 'mantri', 'sipahi', 'police', 'chor'];
    const currentIndex = roleOrder.indexOf(currentRole);
    return currentIndex < roleOrder.length - 1 ? roleOrder[currentIndex + 1] as Role : null;
  };

  return (
    <GameContext.Provider value={{
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
    }}>
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