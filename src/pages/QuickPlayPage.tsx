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

const PLAYER_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
const REFRESH_INTERVAL = 60 * 1000; // Refresh every minute
const MAX_RETRIES = 5; // Maximum number of retries for fetching game info
const RETRY_DELAY = 1000; // Delay between retries in milliseconds

const QuickPlayPage: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const [nameError, setNameError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [waitingPlayers, setWaitingPlayers] = useState(0);
  const [gameId, setGameId] = useState<string | null>(null);
  
  const { joinGame, createGame } = useGame();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/signin', { state: { from: '/quick-play' } });
    }
  }, [user, loading, navigate]);

  // Cleanup stale players
  useEffect(() => {
    if (!isJoining) return;

    const cleanupStalePlayersInterval = setInterval(async () => {
      const quickPlayRef = ref(database, 'quickPlay/players');
      const snapshot = await get(quickPlayRef);
      const players = snapshot.val() || {};

      const stalePlayerIds = Object.entries(players)
        .filter(([_, player]: [string, any]) => 
          Date.now() - player.timestamp >= PLAYER_TIMEOUT
        )
        .map(([id]) => id);

      for (const id of stalePlayerIds) {
        await set(ref(database, `quickPlay/players/${id}`), null);
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(cleanupStalePlayersInterval);
  }, [isJoining]);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchGameInfo = async (retries = MAX_RETRIES): Promise<{ gameId: string } | null> => {
    for (let i = 0; i < retries; i++) {
      const gameInfoSnapshot = await get(ref(database, 'quickPlay/gameInfo'));
      const gameInfo = gameInfoSnapshot.val();
      
      if (gameInfo?.gameId) {
        return gameInfo;
      }
      
      if (i < retries - 1) {
        await sleep(RETRY_DELAY);
      }
    }
    return null;
  };

  // Get unique active players
  const getUniqueActivePlayers = (players: Record<string, any>) => {
    const now = Date.now();
    const activePlayersMap = new Map();

    Object.entries(players).forEach(([id, player]: [string, any]) => {
      // Only consider players that have been active within the timeout period
      if (now - player.timestamp < PLAYER_TIMEOUT) {
        // If this userId already exists in our map, only keep the most recent entry
        const existingPlayer = activePlayersMap.get(player.userId);
        if (!existingPlayer || existingPlayer.timestamp < player.timestamp) {
          // Remove any existing entries for this userId
          for (const [mapId, mapPlayer] of activePlayersMap.entries()) {
            if (mapPlayer.userId === player.userId && mapId !== id) {
              activePlayersMap.delete(mapId);
            }
          }
          // Add the new entry
          activePlayersMap.set(id, {
            ...player,
            id
          });
        }
      }
    });

    return Array.from(activePlayersMap.values())
      .sort((a, b) => a.timestamp - b.timestamp);
  };

  // Main game logic
  useEffect(() => {
    if (!playerName || !user || !isJoining) return;

    const quickPlayRef = ref(database, 'quickPlay/players');
    const gameInfoRef = ref(database, 'quickPlay/gameInfo');
    let gameJoined = false;
    let cleanup = false;

    const handleGameStart = async (activePlayers: any[]) => {
      if (gameJoined || cleanup || activePlayers.length < 6) return;
      gameJoined = true;

      const isFirstPlayer = activePlayers[0].userId === user.id;
      
      try {
        if (isFirstPlayer) {
          // First create the game and wait for it to be fully established
          const newGameId = generateId(6);
          const gameCreated = await createGame(playerName);
          
          if (!gameCreated) {
            throw new Error('Failed to create game');
          }

          // Only after game is created, update the gameInfo for other players
          await set(gameInfoRef, {
            gameId: gameCreated,
            hostId: user.id,
            timestamp: Date.now(),
            players: activePlayers.slice(0, 6).map(p => p.name)
          });
          
          setGameId(gameCreated);
          navigate(`/game/${gameCreated}`);

          setTimeout(async () => {
            if (!cleanup) {
              await remove(ref(database, 'quickPlay'));
            }
          }, 5000);
        } else {
          // Add a small delay before joining to ensure host has created the game
          await sleep(1000);
          
          const gameInfo = await fetchGameInfo();
          
          if (!gameInfo) {
            throw new Error('Game ID not found after multiple retries');
          }

          const joined = await joinGame(gameInfo.gameId, playerName);
          if (joined) {
            setGameId(gameInfo.gameId);
            navigate(`/game/${gameInfo.gameId}`);
          }
        }
      } catch (error) {
        console.error('Error in game creation/joining:', error);
        setNameError('Error starting game. Please try again.');
        setIsJoining(false);
        gameJoined = false;
      }
    };

    const unsubscribe = onValue(quickPlayRef, async (snapshot) => {
      if (gameJoined || cleanup) return;

      const players = snapshot.val() || {};
      const activePlayers = getUniqueActivePlayers(players);
      
      // Update waiting players count, excluding the current user's duplicate entries
      const uniquePlayerCount = new Set(activePlayers.map(p => p.userId)).size;
      setWaitingPlayers(uniquePlayerCount);

      if (activePlayers.length >= 6) {
        await handleGameStart(activePlayers);
      }
    });

    // Add player to queue
    const addToQueue = async () => {
      if (!cleanup) {
        try {
          const playerRef = ref(database, `quickPlay/players/${generateId(8)}`);
          await set(playerRef, {
            name: playerName.trim(),
            userId: user.id,
            timestamp: Date.now()
          });
        } catch (error) {
          console.error('Error adding to queue:', error);
          setNameError('Error joining queue. Please try again.');
          setIsJoining(false);
        }
      }
    };

    const refreshInterval = setInterval(addToQueue, REFRESH_INTERVAL);
    addToQueue();

    return () => {
      cleanup = true;
      clearInterval(refreshInterval);
      unsubscribe();
      
      // Remove all entries for this user
      if (user) {
        get(quickPlayRef).then(snapshot => {
          const players = snapshot.val() || {};
          Object.entries(players).forEach(([id, player]: [string, any]) => {
            if (player.userId === user.id) {
              set(ref(database, `quickPlay/players/${id}`), null).catch(console.error);
            }
          });
        });
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