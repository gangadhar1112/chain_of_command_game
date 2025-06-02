import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, Loader, Crown } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { ref, onValue, off, set, get, remove } from 'firebase/database';
import { database } from '../config/firebase';
import Header from '../components/Header';
import Button from '../components/Button';
import Input from '../components/Input';
import { generateId } from '../utils/helpers';
import toast from 'react-hot-toast';

const PLAYER_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const REFRESH_INTERVAL = 3 * 1000; // 3 seconds
const MAX_RETRIES = 15;
const RETRY_DELAY = 300;
const GAME_START_DELAY = 2000;
const LOCK_TIMEOUT = 10000;

const QuickPlayPage: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const [nameError, setNameError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [waitingPlayers, setWaitingPlayers] = useState(0);
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  
  const { joinGame, createGame } = useGame();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/signin', { state: { from: '/quick-play' } });
    }
  }, [user, loading, navigate]);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Cleanup stale players
  useEffect(() => {
    if (!isJoining) return;

    const cleanupInterval = setInterval(async () => {
      const quickPlayRef = ref(database, 'quickPlay/players');
      const snapshot = await get(quickPlayRef);
      const players = snapshot.val() || {};

      const now = Date.now();
      for (const [id, player] of Object.entries(players)) {
        if (now - (player as any).timestamp >= PLAYER_TIMEOUT) {
          await remove(ref(database, `quickPlay/players/${id}`));
        }
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(cleanupInterval);
  }, [isJoining]);

  const getUniqueActivePlayers = (players: Record<string, any>) => {
    const now = Date.now();
    const uniquePlayers = new Map<string, any>();

    Object.entries(players).forEach(([id, player]) => {
      if (now - player.timestamp < PLAYER_TIMEOUT) {
        const existingPlayer = uniquePlayers.get(player.userId);
        if (!existingPlayer || existingPlayer.timestamp < player.timestamp) {
          uniquePlayers.set(player.userId, { ...player, id });
        }
      }
    });

    return Array.from(uniquePlayers.values())
      .sort((a, b) => a.timestamp - b.timestamp);
  };

  const acquireGameLock = async (): Promise<boolean> => {
    const lockRef = ref(database, 'quickPlay/lock');
    const lockSnapshot = await get(lockRef);
    const currentLock = lockSnapshot.val();
    const now = Date.now();

    if (!currentLock || now - currentLock.timestamp > LOCK_TIMEOUT) {
      await set(lockRef, {
        userId: user?.id,
        timestamp: now
      });
      
      // Double-check we got the lock
      const verifySnapshot = await get(lockRef);
      const verifyLock = verifySnapshot.val();
      return verifyLock?.userId === user?.id;
    }

    return false;
  };

  const releaseGameLock = async () => {
    const lockRef = ref(database, 'quickPlay/lock');
    const lockSnapshot = await get(lockRef);
    const currentLock = lockSnapshot.val();

    if (currentLock?.userId === user?.id) {
      await remove(lockRef);
    }
  };

  const handleGameCreation = async (activePlayers: any[]) => {
    try {
      const newGameId = await createGame(playerName);
      if (!newGameId) throw new Error('Failed to create game');

      // Update game info for other players
      const gameInfoRef = ref(database, 'quickPlay/gameInfo');
      await set(gameInfoRef, {
        gameId: newGameId,
        hostId: user?.id,
        timestamp: Date.now(),
        players: activePlayers.map(p => p.name).slice(0, 6)
      });

      // Wait for other players to join
      await sleep(GAME_START_DELAY);
      
      setGameId(newGameId);
      navigate(`/game/${newGameId}`);
      return true;
    } catch (error) {
      console.error('Error creating game:', error);
      return false;
    }
  };

  const handleGameJoin = async (gameInfo: any): Promise<boolean> => {
    try {
      const success = await joinGame(gameInfo.gameId, playerName);
      if (success) {
        setGameId(gameInfo.gameId);
        navigate(`/game/${gameInfo.gameId}`);
        return true;
      }
    } catch (error) {
      console.error('Error joining game:', error);
    }
    return false;
  };

  // Keep player alive
  useEffect(() => {
    if (!isJoining || !playerId || !user) return;

    const keepAliveInterval = setInterval(async () => {
      const playerRef = ref(database, `quickPlay/players/${playerId}`);
      await set(playerRef, {
        name: playerName.trim(),
        userId: user.id,
        timestamp: Date.now()
      });
    }, REFRESH_INTERVAL / 2);

    return () => clearInterval(keepAliveInterval);
  }, [isJoining, playerId, playerName, user]);

  // Main game logic
  useEffect(() => {
    if (!playerName || !user || !isJoining) return;

    const quickPlayRef = ref(database, 'quickPlay/players');
    let gameJoined = false;
    let cleanup = false;

    const handleQuickPlay = async (activePlayers: any[]) => {
      if (gameJoined || cleanup || activePlayers.length < 6) return;

      const hasLock = await acquireGameLock();
      if (!hasLock) {
        // Try to join existing game
        const gameInfoRef = ref(database, 'quickPlay/gameInfo');
        const gameInfoSnapshot = await get(gameInfoRef);
        const gameInfo = gameInfoSnapshot.val();

        if (gameInfo?.gameId) {
          const joined = await handleGameJoin(gameInfo);
          if (joined) {
            gameJoined = true;
            return;
          }
        }
        return;
      }

      try {
        // Verify we still have 6 players
        const currentSnapshot = await get(quickPlayRef);
        const currentPlayers = getUniqueActivePlayers(currentSnapshot.val() || {});
        if (currentPlayers.length < 6) {
          await releaseGameLock();
          return;
        }

        const success = await handleGameCreation(currentPlayers);
        if (success) {
          gameJoined = true;
        }
      } finally {
        await releaseGameLock();
      }
    };

    const unsubscribe = onValue(quickPlayRef, async (snapshot) => {
      if (gameJoined || cleanup) return;

      const players = snapshot.val() || {};
      const activePlayers = getUniqueActivePlayers(players);
      setWaitingPlayers(activePlayers.length);

      if (activePlayers.length >= 6) {
        await handleQuickPlay(activePlayers);
      }
    });

    // Add player to queue
    const addToQueue = async () => {
      if (!cleanup) {
        try {
          const newPlayerId = generateId(8);
          const playerRef = ref(database, `quickPlay/players/${newPlayerId}`);
          await set(playerRef, {
            name: playerName.trim(),
            userId: user.id,
            timestamp: Date.now()
          });
          setPlayerId(newPlayerId);
        } catch (error) {
          console.error('Error adding to queue:', error);
          setNameError('Error joining queue. Please try again.');
          setIsJoining(false);
        }
      }
    };

    addToQueue();

    return () => {
      cleanup = true;
      unsubscribe();
      
      // Cleanup
      if (user) {
        get(quickPlayRef).then(snapshot => {
          const players = snapshot.val() || {};
          Object.entries(players).forEach(([id, player]: [string, any]) => {
            if (player.userId === user.id) {
              remove(ref(database, `quickPlay/players/${id}`));
            }
          });
        });
        releaseGameLock();
      }
    };
  }, [playerName, user, isJoining, createGame, joinGame, navigate]);

  const handleQuickPlay = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setNameError('Please enter your name');
      return;
    }

    if (!user) {
      setNameError('You must be signed in to join quick play');
      navigate('/signin', { state: { from: '/quick-play' } });
      return;
    }

    setIsJoining(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-white">
            <Loader className="animate-spin h-5 w-5" />
            <span>Loading...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-purple-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-purple-700/50">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 bg-purple-700 rounded-full mb-4">
              <Crown className="text-yellow-400 h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-white">Quick Play</h1>
            <p className="text-purple-200 mt-2">
              {isJoining 
                ? `Waiting for players (${waitingPlayers}/6)...`
                : 'Enter your name to join the next available game'}
            </p>
          </div>
          
          <form onSubmit={handleQuickPlay} className="space-y-4">
            <div>
              <Input
                label="Your Name"
                id="playerName"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  setNameError('');
                }}
                placeholder="Enter your name"
                error={nameError}
                disabled={isJoining}
                maxLength={20}
              />
            </div>
            
            <div className="pt-4">
              <Button 
                type="submit" 
                color="primary" 
                fullWidth
                disabled={isJoining}
              >
                {isJoining ? (
                  <span className="flex items-center justify-center">
                    <Loader className="animate-spin h-5 w-5 mr-2" />
                    Finding Players ({waitingPlayers}/6)
                  </span>
                ) : (
                  'Find Game'
                )}
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-purple-300 hover:text-white flex items-center justify-center mx-auto"
              disabled={isJoining}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Home
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuickPlayPage;