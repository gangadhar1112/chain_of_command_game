import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ref, set, get, onValue, off, remove, update, onDisconnect, serverTimestamp } from 'firebase/database';
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
            timestamp: serverTimestamp()
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
          timestamp: serverTimestamp()
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

  const createGame = useCallback(async (playerName: string): Promise<string> => {
    if (!user) {
      toast.error('Must be logged in to create a game');
      return '';
    }

    try {
      const newGameId = generateId(6);
      const playerId = generateId(8);
      
      const newPlayer: Player = {
        id: playerId,
        name: playerName.trim(),
        role: null,
        isHost: true,
        isLocked: false,
        isCurrentTurn: false,
        userId: user.id,
      };

      const gameData = {
        id: newGameId,
        gameState: 'lobby' as GameState,
        players: [newPlayer],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        hostId: playerId,
      };

      const updates: { [key: string]: any } = {
        [`games/${newGameId}`]: gameData,
        [`userGames/${user.id}/${newGameId}`]: {
          createdAt: Date.now(),
          lastActive: Date.now(),
        }
      };

      await update(ref(database), updates);
      
      await setupPresence(newGameId, playerId, playerName);
      
      localStorage.setItem('currentGameId', newGameId);
      localStorage.setItem('currentPlayerId', playerId);
      setGameId(newGameId);
      setPlayers([newPlayer]);
      setCurrentPlayer(newPlayer);
      setIsHost(true);
      setGameState('lobby');

      toast.success('Game created successfully!');
      return newGameId;
    } catch (error) {
      console.error('Error creating game:', error);
      toast.error('Failed to create game. Please try again.');
      return '';
    }
  }, [user, setupPresence]);

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

  const startGame = useCallback(async () => {
    if (!isHost || !gameId || !players.length) {
      return;
    }

    if (players.length !== 6) {
      toast.error('Need 6 players to start the game');
      return;
    }

    try {
      const availableRoles = [...roleChain];
      const shuffledRoles = availableRoles.sort(() => Math.random() - 0.5);
      
      const updatedPlayers = players.map((player, index) => ({
        ...player,
        role: shuffledRoles[index],
        isLocked: false,
        isCurrentTurn: shuffledRoles[index] === 'king',
      }));

      const updates = {
        [`games/${gameId}/players`]: updatedPlayers,
        [`games/${gameId}/gameState`]: 'playing',
        [`games/${gameId}/updatedAt`]: Date.now(),
      };

      await update(ref(database), updates);
      
      setPlayers(updatedPlayers);
      setGameState('playing');

      if (currentPlayer) {
        const updatedCurrentPlayer = updatedPlayers.find(p => p.id === currentPlayer.id);
        if (updatedCurrentPlayer) {
          setCurrentPlayer(updatedCurrentPlayer);
        }
      }

      toast.success('Game started!');
    } catch (error) {
      console.error('Error starting game:', error);
      toast.error('Failed to start game. Please try again.');
    }
  }, [gameId, isHost, players, currentPlayer]);

  const makeGuess = useCallback((targetPlayerId: string) => {
    // Implementation will be added later
  }, []);

  const leaveGame = useCallback(() => {
    // Implementation will be added later
  }, []);

  const getRoleInfo = useCallback((role: Role): RoleInfo => {
    return roleInfoMap[role] || defaultContext.getRoleInfo();
  }, []);

  const getNextRoleInChain = useCallback((role: Role): Role | null => {
    const currentIndex = roleChain.indexOf(role);
    if (currentIndex === -1 || currentIndex === roleChain.length - 1) {
      return null;
    }
    return roleChain[currentIndex + 1];
  }, []);

  const clearGuessResult = useCallback(() => {
    setLastGuessResult(null);
  }, []);

  useEffect(() => {
    if (!gameId || !currentPlayer || !user) return;

    const presenceRef = ref(database, `presence/${gameId}`);
    const gameRef = ref(database, `games/${gameId}`);
    let cleanup = false;

    const monitorPresence = async () => {
      try {
        // Set up presence monitoring
        const playerPresenceRef = ref(database, `presence/${gameId}/${currentPlayer.id}`);
        await set(playerPresenceRef, {
          online: true,
          lastSeen: serverTimestamp(),
          userId: user.id,
          name: currentPlayer.name
        });

        // Set up disconnect cleanup
        onDisconnect(playerPresenceRef).remove();

        // Monitor other players' presence
        onValue(presenceRef, async (snapshot) => {
          if (cleanup) return;

          const presence = snapshot.val() || {};
          const currentPlayers = [...players];
          let playersDisconnected = false;
          const disconnectedNames: string[] = [];

          // Check for disconnected players
          currentPlayers.forEach(player => {
            if (!presence[player.id] && player.id !== currentPlayer.id) {
              playersDisconnected = true;
              disconnectedNames.push(player.name);
            }
          });

          if (playersDisconnected && gameState === 'playing') {
            handleGameInterruption(`Players disconnected: ${disconnectedNames.join(', ')}`);
            
            // If host, clean up the game
            if (isHost) {
              await remove(gameRef);
            }
          }
        });

        // Keep presence alive
        const intervalId = setInterval(async () => {
          if (!cleanup) {
            await set(playerPresenceRef, {
              online: true,
              lastSeen: serverTimestamp(),
              userId: user.id,
              name: currentPlayer.name
            });
          }
        }, 15000);

        return () => {
          cleanup = true;
          clearInterval(intervalId);
          remove(playerPresenceRef);
        };
      } catch (error) {
        console.error('Error in presence monitoring:', error);
      }
    };

    monitorPresence();

    return () => {
      cleanup = true;
    };
  }, [gameId, currentPlayer, user, players, gameState, isHost, handleGameInterruption]);

  useEffect(() => {
    if (!gameId) return;

    const gameRef = ref(database, `games/${gameId}`);
    let cleanup = false;

    const unsubscribe = onValue(gameRef, (snapshot) => {
      if (cleanup) return;

      const gameData = snapshot.val();
      
      if (!gameData) {
        handleGameInterruption('Game no longer exists');
        return;
      }

      // Update game state
      setGameState(gameData.gameState);
      setPlayers(gameData.players || []);

      // Update current player
      if (currentPlayer) {
        const updatedCurrentPlayer = gameData.players?.find(
          (p: Player) => p.id === currentPlayer.id
        );
        if (updatedCurrentPlayer) {
          setCurrentPlayer(updatedCurrentPlayer);
        }
      }
    }, {
      onlyOnce: false
    });

    return () => {
      cleanup = true;
      off(gameRef);
    };
  }, [gameId, currentPlayer, handleGameInterruption]);

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

export { GameProvider }