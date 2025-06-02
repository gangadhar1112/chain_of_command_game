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

  const makeGuess = useCallback(async (targetPlayerId: string) => {
    if (!currentPlayer?.isCurrentTurn || !currentPlayer.role || gameState !== 'playing' || !gameId) {
      return;
    }
    
    const targetPlayer = players.find(p => p.id === targetPlayerId);
    if (!targetPlayer || targetPlayer.isLocked || currentPlayer.isLocked) {
      return;
    }

    try {
      const expectedNextRole = getNextRoleInChain(currentPlayer.role);
      const isCorrectGuess = targetPlayer.role === expectedNextRole;
      
      let updatedPlayers = [...players];
      
      if (isCorrectGuess) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        updatedPlayers = updatedPlayers.map(p => {
          if (p.id === currentPlayer.id) {
            return { ...p, isLocked: true, isCurrentTurn: false };
          }
          if (p.id === targetPlayer.id) {
            return { ...p, isCurrentTurn: true };
          }
          return { ...p, isCurrentTurn: false };
        });

        setLastGuessResult({
          correct: true,
          message: `Correct! You found the ${roleInfoMap[targetPlayer.role].name}!`
        });
        
        toast.success(`You found the ${roleInfoMap[targetPlayer.role].name}!`, {
          duration: 3000,
          icon: '🎯',
        });
      } else {
        if (navigator.vibrate) {
          navigator.vibrate(200);
        }

        const tempRole = currentPlayer.role;
        updatedPlayers = updatedPlayers.map(p => {
          if (p.id === currentPlayer.id) {
            return { ...p, role: targetPlayer.role, isCurrentTurn: false };
          }
          if (p.id === targetPlayer.id) {
            return { ...p, role: tempRole, isCurrentTurn: false };
          }
          return { ...p, isCurrentTurn: false };
        });

        setLastGuessResult({
          correct: false,
          message: `Wrong guess! You swapped roles with ${targetPlayer.name}.`
        });
        
        toast.error(`Wrong guess! You swapped roles with ${targetPlayer.name}`, {
          duration: 3000,
          icon: '❌',
        });

        // After a wrong guess, the King (whether original or new) gets the next turn
        const newKingPlayer = updatedPlayers.find(p => p.role === 'king' && !p.isLocked);
        if (newKingPlayer) {
          newKingPlayer.isCurrentTurn = true;
        }
      }
      
      const allPlayersLocked = updatedPlayers.every(p => p.isLocked || p.role === 'thief');
      
      if (allPlayersLocked) {
        setGameState('completed');
        await update(ref(database), {
          [`games/${gameId}/players`]: updatedPlayers,
          [`games/${gameId}/gameState`]: 'completed',
          [`games/${gameId}/updatedAt`]: Date.now(),
        });
      } else {
        await update(ref(database), {
          [`games/${gameId}/players`]: updatedPlayers,
          [`games/${gameId}/updatedAt`]: Date.now(),
        });
      }
      
      setPlayers(updatedPlayers);
      const updatedCurrentPlayer = updatedPlayers.find(p => p.id === currentPlayer.id);
      if (updatedCurrentPlayer) {
        setCurrentPlayer(updatedCurrentPlayer);
      }

      setTimeout(clearGuessResult, 3000);
    } catch (error) {
      console.error('Error making guess:', error);
      toast.error('Failed to make guess. Please try again.');
    }
  }, [currentPlayer, players, gameState, gameId, getNextRoleInChain, clearGuessResult]);

  const leaveGame = useCallback(async () => {
    if (!gameId || !currentPlayer || !user) return;

    try {
      const gameRef = ref(database, `games/${gameId}`);
      const snapshot = await get(gameRef);
      const gameData = snapshot.val();

      if (gameData) {
        const updatedPlayers = gameData.players.filter((p: Player) => p.id !== currentPlayer.id);

        if (updatedPlayers.length > 0) {
          if (currentPlayer.isHost) {
            updatedPlayers[0].isHost = true;
          }

          if (currentPlayer.isCurrentTurn && gameData.gameState === 'playing') {
            const nextPlayer = updatedPlayers.find(p => !p.isLocked);
            if (nextPlayer) {
              nextPlayer.isCurrentTurn = true;
            }
          }

          const updates: { [key: string]: any } = {
            [`games/${gameId}/players`]: updatedPlayers,
            [`games/${gameId}/updatedAt`]: Date.now(),
          };

          if (gameData.gameState === 'playing' && updatedPlayers.length < 6) {
            updates[`games/${gameId}/gameState`] = 'lobby';
            updatedPlayers.forEach(p => {
              p.role = null;
              p.isLocked = false;
              p.isCurrentTurn = false;
            });
          }

          await update(ref(database), updates);
        } else {
          await remove(gameRef);
        }

        await remove(ref(database, `presence/${gameId}/${currentPlayer.id}`));
        await remove(ref(database, `userGames/${user.id}/${gameId}`));
      }

      localStorage.removeItem('currentGameId');
      localStorage.removeItem('currentPlayerId');
      
      setGameState('waiting');
      setCurrentPlayer(null);
      setPlayers([]);
      setGameId(null);
      setIsHost(false);

      toast.success('Left game successfully');
    } catch (error) {
      console.error('Error leaving game:', error);
      toast.error('Error leaving game');
    }
  }, [gameId, currentPlayer, user]);

  useEffect(() => {
    if (!gameId || !currentPlayer || !user) return;

    const presenceRef = ref(database, `presence/${gameId}`);
    const gameRef = ref(database, `games/${gameId}`);
    let cleanup = false;

    const monitorPresence = async () => {
      try {
        const playerPresenceRef = ref(database, `presence/${gameId}/${currentPlayer.id}`);
        await set(playerPresenceRef, {
          online: true,
          lastSeen: serverTimestamp(),
          userId: user.id,
          name: currentPlayer.name
        });

        onDisconnect(playerPresenceRef).remove();

        onValue(presenceRef, async (snapshot) => {
          if (cleanup) return;

          const presence = snapshot.val() || {};
          const currentPlayers = [...players];
          let playersDisconnected = false;
          const disconnectedNames: string[] = [];

          currentPlayers.forEach(player => {
            if (!presence[player.id] && player.id !== currentPlayer.id) {
              playersDisconnected = true;
              disconnectedNames.push(player.name);
            }
          });

          if (playersDisconnected && gameState === 'playing') {
            handleGameInterruption(`Players disconnected: ${disconnectedNames.join(', ')}`);
            
            if (isHost) {
              await remove(gameRef);
            }
          }
        });

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

      if (gameData.gameState !== gameState) {
        setGameState(gameData.gameState);
      }

      const updatedPlayers = gameData.players || [];
      if (JSON.stringify(updatedPlayers) !== JSON.stringify(players)) {
        setPlayers(updatedPlayers);

        if (currentPlayer) {
          const updatedCurrentPlayer = updatedPlayers.find(
            (p: Player) => p.id === currentPlayer.id
          );
          if (updatedCurrentPlayer) {
            setCurrentPlayer(updatedCurrentPlayer);
          }
        }

        if (gameData.gameState === 'playing' && updatedPlayers.length < 6) {
          handleGameInterruption('Not enough players to continue the game');
        }
      }
    }, {
      onlyOnce: false
    });

    return () => {
      cleanup = true;
      off(gameRef);
    };
  }, [gameId, currentPlayer, players, gameState, handleGameInterruption]);

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