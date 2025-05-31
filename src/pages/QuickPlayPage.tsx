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

  // Separate effect for cleaning up stale players
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

  useEffect(() => {
    if (!playerName || !user || !isJoining) return;

    const quickPlayRef = ref(database, 'quickPlay/players');
    const gameInfoRef = ref(database, 'quickPlay/gameInfo');
    let gameJoined = false;
    let cleanup = false;

    const handleGameStart = async (activePlayers: any[]) => {
      if (gameJoined || cleanup) return;
      gameJoined = true;

      const isFirstPlayer = activePlayers[0].id === user.id;
      
      try {
        if (isFirstPlayer) {
          const newGameId = generateId(6);
          await set(gameInfoRef, {
            gameId: newGameId,
            hostId: user.id,
            timestamp: Date.now(),
            players: activePlayers.map(p => p.name)
          });
          
          await createGame(playerName);
          setGameId(newGameId);
          navigate(`/game/${newGameId}`);

          setTimeout(async () => {
            if (!cleanup) {
              await remove(ref(database, 'quickPlay'));
            }
          }, 5000);
        } else {
          const gameInfoSnapshot = await get(gameInfoRef);
          const gameInfo = gameInfoSnapshot.val();
          
          if (!gameInfo || !gameInfo.gameId) {
            throw new Error('Game ID not found');
          }

          await joinGame(gameInfo.gameId, playerName);
          setGameId(gameInfo.gameId);
          navigate(`/game/${gameInfo.gameId}`);
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
      const activePlayers = Object.entries(players)
        .filter(([_, player]: [string, any]) => 
          Date.now() - player.timestamp < PLAYER_TIMEOUT
        )
        .map(([id, player]: [string, any]) => ({
          id,
          ...player
        }))
        .sort((a, b) => a.timestamp - b.timestamp);

      const uniquePlayers = activePlayers.filter((player, index, self) =>
        index === self.findIndex((p) => p.userId === player.userId)
      );

      setWaitingPlayers(uniquePlayers.length);

      if (uniquePlayers.length >= 6) {
        await handleGameStart(uniquePlayers.slice(0, 6));
      }
    });

    // Add player to queue
    const addToQueue = async () => {
      if (!cleanup) {
        try {
          const playerRef = ref(database, `quickPlay/players/${user.id}`);
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
      if (user) {
        const playerRef = ref(database, `quickPlay/players/${user.id}`);
        set(playerRef, null).catch(console.error);
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