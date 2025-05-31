import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, Loader, Crown } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { ref, onValue, off, set, get } from 'firebase/database';
import { database } from '../config/firebase';
import Header from '../components/Header';
import Button from '../components/Button';
import Input from '../components/Input';
import { generateId } from '../utils/helpers';

const QuickPlayPage: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const [nameError, setNameError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [waitingPlayers, setWaitingPlayers] = useState(0);
  
  const { joinGame, createGame } = useGame();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/signin', { state: { from: '/quick-play' } });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!playerName || !user || !isJoining) return;

    const quickPlayRef = ref(database, 'quickPlay');
    
    const unsubscribe = onValue(quickPlayRef, async (snapshot) => {
      const players = snapshot.val() || {};
      const currentPlayers = Object.entries(players)
        .filter(([_, player]: [string, any]) => 
          Date.now() - player.timestamp < 30000 // Remove stale players (30s timeout)
        )
        .map(([id, player]: [string, any]) => ({
          id,
          ...player
        }));

      setWaitingPlayers(currentPlayers.length);

      // Sort players by timestamp to ensure consistent order
      currentPlayers.sort((a, b) => a.timestamp - b.timestamp);

      if (currentPlayers.length >= 6) {
        try {
          // First player creates the game
          const isFirstPlayer = currentPlayers[0].userId === user.id;
          const gameId = generateId(6);

          if (isFirstPlayer) {
            // Create game as host
            createGame(playerName);
            
            // Wait a bit for game creation
            await new Promise(resolve => setTimeout(resolve, 500));

            // Clear quick play queue
            await set(quickPlayRef, null);
          } else {
            // Other players join the game
            await joinGame(gameId, playerName);
          }

          // Navigate to game
          navigate(`/game/${gameId}`);
        } catch (error) {
          console.error('Error starting game:', error);
          setNameError('Error starting game. Please try again.');
          setIsJoining(false);
        }
      }
    });

    // Cleanup function
    return () => {
      off(quickPlayRef);
      if (user) {
        const playerRef = ref(database, `quickPlay/${user.id}`);
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

    try {
      // Add player to quick play queue
      const quickPlayRef = ref(database, `quickPlay/${user.id}`);
      await set(quickPlayRef, {
        name: playerName.trim(),
        userId: user.id,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error joining quick play:', error);
      setNameError('Error joining quick play. Please try again.');
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