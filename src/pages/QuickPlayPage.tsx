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

const PLAYER_TIMEOUT = 15000; // 15 seconds
const REFRESH_INTERVAL = 3000; // 3 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const GAME_START_DELAY = 2000;

const QuickPlayPage: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const [nameError, setNameError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [waitingPlayers, setWaitingPlayers] = useState(0);
  const [queueId, setQueueId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  
  const { joinGame, createGame } = useGame();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/signin', { state: { from: '/quick-play' } });
    }
  }, [user, loading, navigate]);

  // Cleanup stale queues and players
  useEffect(() => {
    if (!isJoining || !queueId || !playerId) return;

    const cleanupInterval = setInterval(async () => {
      try {
        const queueRef = ref(database, `quickPlay/queues/${queueId}`);
        const snapshot = await get(queueRef);
        const queue = snapshot.val();

        if (!queue) {
          setIsJoining(false);
          toast.error('Queue no longer exists');
          navigate('/');
          return;
        }

        const now = Date.now();
        const activePlayers = Object.entries(queue.players || {}).filter(
          ([, player]: [string, any]) => now - player.timestamp < PLAYER_TIMEOUT
        );

        if (activePlayers.length === 0) {
          await remove(queueRef);
          setIsJoining(false);
          toast.error('All players disconnected');
          navigate('/');
        } else {
          const updatedPlayers = Object.fromEntries(activePlayers);
          await set(ref(database, `quickPlay/queues/${queueId}/players`), updatedPlayers);
          setWaitingPlayers(activePlayers.length);
        }
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(cleanupInterval);
  }, [isJoining, queueId, playerId, navigate]);

  // Keep player alive in queue
  useEffect(() => {
    if (!isJoining || !queueId || !playerId || !user) return;

    const keepAliveInterval = setInterval(async () => {
      try {
        const playerRef = ref(database, `quickPlay/queues/${queueId}/players/${playerId}`);
        await set(playerRef, {
          name: playerName.trim(),
          userId: user.id,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Keep alive error:', error);
        if (retryAttempts < MAX_RETRIES) {
          setRetryAttempts(prev => prev + 1);
        } else {
          setIsJoining(false);
          toast.error('Connection lost. Please try again.');
          navigate('/');
        }
      }
    }, REFRESH_INTERVAL / 2);

    return () => clearInterval(keepAliveInterval);
  }, [isJoining, queueId, playerId, playerName, user, retryAttempts, navigate]);

  const findOrCreateQueue = async (): Promise<string> => {
    const queuesRef = ref(database, 'quickPlay/queues');
    const snapshot = await get(queuesRef);
    const queues = snapshot.val() || {};

    // Find an available queue
    const now = Date.now();
    for (const [id, queue] of Object.entries(queues)) {
      if (!queue.players) continue;
      
      const activePlayers = Object.values(queue.players).filter(
        (player: any) => now - player.timestamp < PLAYER_TIMEOUT
      );

      if (activePlayers.length < 6 && queue.status !== 'starting') {
        return id;
      }
    }

    // Create new queue if none available
    const newQueueId = generateId(8);
    await set(ref(database, `quickPlay/queues/${newQueueId}`), {
      createdAt: now,
      status: 'waiting',
      players: {}
    });

    return newQueueId;
  };

  const handleGameCreation = async (queueId: string, players: any[]): Promise<boolean> => {
    try {
      const gameId = await createGame(playerName);
      if (!gameId) throw new Error('Failed to create game');

      await set(ref(database, `quickPlay/queues/${queueId}`), {
        status: 'starting',
        gameId,
        startedAt: Date.now()
      });

      await new Promise(resolve => setTimeout(resolve, GAME_START_DELAY));
      
      const success = await joinGame(gameId, playerName);
      if (success) {
        navigate(`/game/${gameId}`);
        return true;
      }
      throw new Error('Failed to join game');
    } catch (error) {
      console.error('Game creation error:', error);
      return false;
    }
  };

  // Main queue logic
  useEffect(() => {
    if (!isJoining || !queueId || !user) return;

    const queueRef = ref(database, `quickPlay/queues/${queueId}`);
    let gameJoined = false;
    let retryTimeout: NodeJS.Timeout;

    const unsubscribe = onValue(queueRef, async (snapshot) => {
      if (gameJoined) return;

      try {
        const queue = snapshot.val();
        if (!queue) {
          setIsJoining(false);
          toast.error('Queue no longer exists');
          navigate('/');
          return;
        }

        const players = Object.values(queue.players || {});
        setWaitingPlayers(players.length);

        if (queue.status === 'starting' && queue.gameId) {
          gameJoined = true;
          clearTimeout(retryTimeout);
          
          const joined = await joinGame(queue.gameId, playerName);
          if (joined) {
            navigate(`/game/${queue.gameId}`);
          } else if (retryAttempts < MAX_RETRIES) {
            setRetryAttempts(prev => prev + 1);
            retryTimeout = setTimeout(() => {
              gameJoined = false;
            }, RETRY_DELAY);
          } else {
            setIsJoining(false);
            toast.error('Failed to join game. Please try again.');
            navigate('/');
          }
        } else if (players.length >= 6 && queue.status === 'waiting') {
          const isFirstPlayer = players[0].userId === user.id;
          if (isFirstPlayer) {
            await handleGameCreation(queueId, players);
          }
        }
      } catch (error) {
        console.error('Queue processing error:', error);
        if (retryAttempts < MAX_RETRIES) {
          setRetryAttempts(prev => prev + 1);
        } else {
          setIsJoining(false);
          toast.error('Connection error. Please try again.');
          navigate('/');
        }
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(retryTimeout);
      if (playerId) {
        remove(ref(database, `quickPlay/queues/${queueId}/players/${playerId}`))
          .catch(console.error);
      }
    };
  }, [isJoining, queueId, user, playerId, playerName, joinGame, navigate, retryAttempts]);

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

    try {
      setIsJoining(true);
      setRetryAttempts(0);
      const queueId = await findOrCreateQueue();
      const playerId = generateId(8);
      
      await set(ref(database, `quickPlay/queues/${queueId}/players/${playerId}`), {
        name: playerName.trim(),
        userId: user.id,
        timestamp: Date.now()
      });

      setQueueId(queueId);
      setPlayerId(playerId);
    } catch (error) {
      console.error('Error joining quick play:', error);
      toast.error('Failed to join quick play. Please try again.');
      setIsJoining(false);
    }
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