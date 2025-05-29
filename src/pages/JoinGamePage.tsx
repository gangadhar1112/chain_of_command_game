import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowLeft } from 'lucide-react';
import { useGame } from '../context/GameContext';
import Header from '../components/Header';
import Button from '../components/Button';
import Input from '../components/Input';

const JoinGamePage: React.FC = () => {
  const [gameId, setGameId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [gameIdError, setGameIdError] = useState('');
  const [nameError, setNameError] = useState('');
  
  const { joinGame } = useGame();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;
    
    if (!gameId.trim()) {
      setGameIdError('Please enter a game code');
      hasError = true;
    }
    
    if (!playerName.trim()) {
      setNameError('Please enter your name');
      hasError = true;
    }
    
    if (hasError) return;
    
    const success = joinGame(gameId.trim().toUpperCase(), playerName.trim());
    
    if (success) {
      navigate(`/game/${gameId.trim().toUpperCase()}`);
    } else {
      setGameIdError('Invalid game code or game not found');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-purple-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-purple-700/50">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 bg-purple-700 rounded-full mb-4">
              <Users className="text-blue-400 h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-white">Join Game</h1>
            <p className="text-purple-200 mt-2">
              Enter the game code and your name to join an existing game
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
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
              />
            </div>
            
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
              />
            </div>
            
            <div className="pt-4">
              <Button type="submit" color="primary" fullWidth>
                Join Game
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-purple-300 hover:text-white flex items-center justify-center mx-auto"
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