import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ref, set, get, onValue, off, remove, update, onDisconnect } from 'firebase/database';
import * as databaseModule from 'firebase/database';
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
  const [interruptionReason, setInterruptionReason] = useState('');
  const { user } = useAuth();

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

  const setupPresence = useCallback(async (gameId: string, playerId: string, playerName: string) => {
    if (!user) return;

    const presenceRef = ref(database, `presence/${gameId}/${playerId}`);
    const connectedRef = ref(database, '.info/connected');

    try {
      onValue(connectedRef, async (snap) => {
        if (snap.val() === true) {
          await set(presenceRef, {
            online: true,
            lastSeen: Date.now(),
            userId: user.id,
            name: playerName,
            timestamp: databaseModule.ServerValue.TIMESTAMP
          });

          onDisconnect(presenceRef).remove();
        }
      });

      const intervalId = setInterval(async () => {
        await set(presenceRef, {
          online: true,
          lastSeen: Date.now(),
          userId: user.id,
          name: playerName,
          timestamp: databaseModule.ServerValue.TIMESTAMP
        });
      }, 15000);

      return () => {
        clearInterval(intervalId);
        off(presenceRef);
        remove(presenceRef);
      };
    } catch (error) {
      console.error('Error setting up presence:', error);
    }
  }, [user]);

  const joinGame = useCallback(async (gameId: string, playerName: string): Promise<boolean> => {
    if (!user) {
      toast.error('Must be logged in to join a game');
      return false;
    }

    try {
      const gameRef = ref(database, `games/${gameId}`);
      const snapshot = await get(gameRef);
      const gameData = snapshot.val();

      if (!gameData) {
        toast.error('Game not found');
        return false;
      }

      if (gameData.gameState !== 'lobby') {
        toast.error('Game has already started');
        return false;
      }

      const currentPlayers = gameData.players || [];
      
      if (currentPlayers.length >= 6) {
        toast.error('Game is full');
        return false;
      }

      const existingPlayer = currentPlayers.find(
        (p: Player) => p.userId === user.id
      );
      
      if (existingPlayer) {
        setGameId(gameId);
        setPlayers(currentPlayers);
        setCurrentPlayer(existingPlayer);
        setIsHost(existingPlayer.isHost);
        setGameState(gameData.gameState);
        
        await setupPresence(gameId, existingPlayer.id, existingPlayer.name);
        
        return true;
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

      const updates: { [key: string]: any } = {
        [`games/${gameId}/players`]: updatedPlayers,
        [`games/${gameId}/updatedAt`]: Date.now(),
        [`userGames/${user.id}/${gameId}`]: {
          joinedAt: Date.now(),
          lastActive: Date.now(),
        }
      };

      await update(ref(database), updates);
      
      await setupPresence(gameId, playerId, playerName);
      
      localStorage.setItem('currentGameId', gameId);
      localStorage.setItem('currentPlayerId', playerId);
      setGameId(gameId);
      setPlayers(updatedPlayers);
      setCurrentPlayer(newPlayer);
      setIsHost(false);
      setGameState('lobby');

      toast.success('Successfully joined the game!');
      return true;
    } catch (error) {
      console.error('Error joining game:', error);
      toast.error('Failed to join game. Please try again.');
      return false;
    }
  }, [user, setupPresence]);

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