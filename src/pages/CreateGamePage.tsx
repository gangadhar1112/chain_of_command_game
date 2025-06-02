import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, ArrowLeft, Settings } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Button from '../components/Button';
import Input from '../components/Input';
import { Role } from '../types/gameTypes';

const defaultRoleNames = {
  king: 'King',
  queen: 'Queen',
  minister: 'Minister',
  soldier: 'Soldier',
  police: 'Police',
  thief: 'Thief'
};

const CreateGamePage: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [showCustomRoles, setShowCustomRoles] = useState(false);
  const [customRoleNames, setCustomRoleNames] = useState<{ [key in Role]?: string }>(defaultRoleNames);
  
  const { createGame } = useGame();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/signin', { state: { from: '/create' } });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    try {
      const gameId = await createGame(playerName.trim(), customRoleNames);
      navigate(`/game/${gameId}`);
    } catch (error) {
      console.error('Error creating game:', error);
      setError('Failed to create game. Please try again.');
    }
  };

  const handleRoleNameChange = (role: Role, value: string) => {
    setCustomRoleNames(prev => ({
      ...prev,
      [role]: value || defaultRoleNames[role]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-white">Loading...</div>
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
            <h1 className="text-2xl font-bold text-white">Create New Game</h1>
            <p className="text-purple-200 mt-2">
              Host a new Chain of Command game and invite your friends to join
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
                  setError('');
                }}
                placeholder="Enter your name"
                error={error}
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowCustomRoles(!showCustomRoles)}
                className="flex items-center text-purple-300 hover:text-white transition-colors"
              >
                <Settings className="h-4 w-4 mr-1" />
                {showCustomRoles ? 'Hide Custom Roles' : 'Customize Role Names'}
              </button>
            </div>

            {showCustomRoles && (
              <div className="space-y-3 pt-2">
                <p className="text-sm text-purple-200">Customize the role names (optional):</p>
                {Object.entries(defaultRoleNames).map(([role, defaultName]) => (
                  <Input
                    key={role}
                    label={defaultName}
                    id={`role-${role}`}
                    value={customRoleNames[role as Role] || ''}
                    onChange={(e) => handleRoleNameChange(role as Role, e.target.value)}
                    placeholder={`Custom name for ${defaultName}`}
                  />
                ))}
              </div>
            )}
            
            <div className="pt-4">
              <Button type="submit" color="primary" fullWidth>
                Create Game
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

export default CreateGamePage;