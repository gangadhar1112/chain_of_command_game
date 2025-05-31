import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, ArrowLeft, Loader, Crown } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../config/firebase';
import Header from '../components/Header';
import Button from '../components/Button';
import Input from '../components/Input';

const JoinGamePage: React.FC = () => {
  const [gameId, setGameId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [gameIdError, setGameIdError] = useState('');
  const [nameError, setNameError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isAutoMatching, setIsAutoMatching] = useState(false);
  const [waitingPlayers, setWaitingPlayers] = useState(0);
  
  const { joinGame } = useGame();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isPlayNow = location.search.includes('play=true');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/signin', { state: { from: location.pathname } });
    }
  }, [user, loading, navigate, location]);

  useEffect(() => {
    if (isPlayNow) {
      setIsAutoMatching(true);
    }
  }, [isPlayNow]);

  useEffect(() => {
    if (!isAutoMatching) return;

    const openGamesRef = ref(database, 'games');
    const unsubscribe = onValue(openGamesRef, (snapshot) => {
      const games = snapshot.val();
      if (!games) return;

      let availableGame = null;
      let totalWaiting = 0;

      Object.entries(games).forEach(([id, game]: [string, any]) => {
        if (game.gameState === 'lobby' && game.players && game.players.length < 6) {
          totalWaiting += game.players.length;
          if (!availableGame) {
            availableGame = { id, players: game.players.length };
          }
        }
      });

      setWaitingPlayers(totalWaiting);

      if (availableGame && playerName) {
        handleJoinGame(availableGame.id);
      }
    });

    return () => off(openGamesRef);
  }, [isAutoMatching, playerName]);

  const handleJoinGame = async (targetGameId: string) => {
    try {
      setIsJoining(true);
      const success = await joinGame(targetGameId, playerName.trim());
      
      if (success) {
        navigate(`/game/${targetGameId}`);
      } else {
        setGameIdError('Game not found or already in progress');
      }
    } catch (error) {
      console.error('Error joining game:', error);
      setGameIdError('Error joining game. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setNameError('Please enter your name');
      return;
    }

    if (!isAutoMatching && !gameId.trim()) {
      setGameIdError('Please enter a game code');
      return;
    }

    if (isAutoMatching) {
      setIsJoining(true);
      // The auto-matching effect will handle the join
    } else {
      await handleJoinGame(gameId.trim().toUpperCase());
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
              {isAutoMatching ? (
                <Crown className="text-yellow-400 h-8 w-8" />
              ) : (
                <Users className="text-blue-400 h-8 w-8" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-white">
              {isAutoMatching ? 'Quick Play' : 'Join Game'}
            </h1>
            <p className="text-purple-200 mt-2">
              {isAutoMatching 
                ? `Waiting for players (${waitingPlayers}/6)...`
                : 'Enter the game code and your name to join an existing game'}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {!isAutoMatching && (
              <div>
                <Input
                  label="Game Code"
                  id="gameId"
                  value={gameId}
                  onChange={(e) => {
                    setGameId(e.target.value.toUpperCase());
                    setGameIdError('');
                  }}
                  placeholder="Enter 6-character code"
                  error={gameIdError}
                  maxLength={6}
                  disabled={isJoining}
                />
              </div>
            )}
            
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
                    {isAutoMatching ? 'Finding Game...' : 'Joining Game...'}
                  </span>
                ) : (
                  isAutoMatching ? 'Find Game' : 'Join Game'
                )}
              </Button>
            </div>

            {!isAutoMatching && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsAutoMatching(true)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Or find an open game automatically
                </button>
              </div>
            )}
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

export default JoinGamePage;