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

    if (disconnectedPlayer.isHost) {
      const remainingPlayers = players.filter(p => p.id !== disconnectedPlayer.id);
      if (remainingPlayers.length > 0) {
        const newHost = remainingPlayers[0];
        newHost.isHost = true;
      }
    }

    const updates: { [key: string]: any } = {
      [`games/${gameId}/players`]: players.filter(p => p.id !== disconnectedPlayer.id),
      [`games/${gameId}/updatedAt`]: Date.now(),
    };

    await update(ref(database), updates);
    
    toast.error(`${disconnectedPlayer.name} has left the game`);
    
    if (players.length < 3) {
      handleGameInterruption('Not enough players to continue');
    }
  }, [gameId, gameState, players, handleGameInterruption]);

  // ... (rest of the existing code remains unchanged)

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