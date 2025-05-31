import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crown, Users, Trophy, Star, ChevronRight, Heart, Building2, Shield, Siren, Footprints, ArrowRight, ChevronDown, ChevronUp, PlayCircle } from 'lucide-react';
import Header from '../components/Header';
import Button from '../components/Button';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const chainRoles = [
    { name: 'King', icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-900/30', points: 10 },
    { name: 'Queen', icon: Heart, color: 'text-pink-400', bg: 'bg-pink-900/30', points: 9 },
    { name: 'Minister', icon: Building2, color: 'text-blue-400', bg: 'bg-blue-900/30', points: 7 },
    { name: 'Soldier', icon: Shield, color: 'text-green-400', bg: 'bg-green-900/30', points: 6 },
    { name: 'Police', icon: Siren, color: 'text-indigo-400', bg: 'bg-indigo-900/30', points: 4 },
    { name: 'Thief', icon: Footprints, color: 'text-red-400', bg: 'bg-red-900/30', points: 0 },
  ];

  const handleQuickPlay = () => {
    navigate('/quick-play');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <div className="max-w-3xl w-full bg-purple-800/50 backdrop-blur-sm rounded-xl p-6 md:p-8 shadow-lg border border-purple-700/50">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 flex items-center justify-center">
              <Crown className="text-yellow-400 mr-3 h-10 w-10" />
              <span>Chain of Command</span>
            </h1>
            <p className="text-purple-200 text-lg md:text-xl">
              A royal game of deduction and strategy
            </p>
          </div>

          {/* Game Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-purple-900/70 rounded-lg p-5 border border-purple-700/50 shadow-md transition hover:bg-purple-900/90">
              <div className="flex items-center mb-3">
                <Users className="text-purple-300 h-6 w-6 mr-2" />
                <h3 className="text-xl font-semibold text-white">6 Players</h3>
              </div>
              <p className="text-purple-200">
                Gather six players to start the game. Each player is assigned a secret role in the royal hierarchy.
              </p>
            </div>
            
            <div className="bg-purple-900/70 rounded-lg p-5 border border-purple-700/50 shadow-md transition hover:bg-purple-900/90">
              <div className="flex items-center mb-3">
                <Trophy className="text-yellow-400 h-6 w-6 mr-2" />
                <h3 className="text-xl font-semibold text-white">Score Points</h3>
              </div>
              <p className="text-purple-200">
                Higher positions in the hierarchy earn more points. The King earns 10 points, while the Thief earns none.
              </p>
            </div>
          </div>

          {/* Chain of Command Diagram */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">The Royal Chain</h2>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-indigo-900/20 to-purple-900/20 rounded-lg" />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative">
                {chainRoles.map((role, index) => (
                  <div key={role.name} className="relative">
                    <div className={`${role.bg} rounded-lg p-4 border border-purple-700/50 text-center relative z-10`}>
                      <div className="flex justify-center mb-2">
                        <role.icon className={`${role.color} h-8 w-8`} />
                      </div>
                      <h3 className={`${role.color} font-bold text-lg mb-1`}>{role.name}</h3>
                      <p className="text-purple-200 text-sm mb-2">{role.points} points</p>
                      {index < chainRoles.length - 1 && (
                        <div className="hidden lg:block absolute -right-4 top-1/2 transform -translate-y-1/2 z-20">
                          <ArrowRight className="text-purple-400 h-6 w-6" />
                        </div>
                      )}
                    </div>
                    {index < chainRoles.length - 1 && (
                      <div className="lg:hidden flex justify-center my-2">
                        <ArrowRight className="text-purple-400 h-6 w-6 transform rotate-90 sm:rotate-0" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Collapsible How to Play Section */}
          <div className="mb-8">
            <button
              onClick={() => setShowHowToPlay(!showHowToPlay)}
              className="w-full bg-gradient-to-r from-purple-900/80 to-indigo-900/80 rounded-lg p-4 border border-purple-600/50 flex items-center justify-between"
            >
              <div className="flex items-center">
                <Star className="text-yellow-400 h-6 w-6 mr-2" />
                <h2 className="text-2xl font-bold text-white">How to Play</h2>
              </div>
              {showHowToPlay ? (
                <ChevronUp className="text-purple-300 h-6 w-6" />
              ) : (
                <ChevronDown className="text-purple-300 h-6 w-6" />
              )}
            </button>
            
            {showHowToPlay && (
              <div className="mt-4 bg-purple-900/60 rounded-lg p-6 border border-purple-600/50">
                <ol className="space-y-3 text-purple-100">
                  <li className="flex">
                    <span className="font-bold text-yellow-400 mr-2">1.</span>
                    <span>Each player receives a secret role in the royal hierarchy: King, Queen, Minister, Soldier, Police, or Thief.</span>
                  </li>
                  <li className="flex">
                    <span className="font-bold text-yellow-400 mr-2">2.</span>
                    <span>The King starts first and must find the Queen. After the King, each role must find the next role in the chain.</span>
                  </li>
                  <li className="flex">
                    <span className="font-bold text-yellow-400 mr-2">3.</span>
                    <span>On your turn, select a player you think has the next role in the chain (e.g., King looks for Queen, Queen for Minister).</span>
                  </li>
                  <li className="flex">
                    <span className="font-bold text-yellow-400 mr-2">4.</span>
                    <span>If your guess is correct, both you and the player you found are "locked" in your positions. The found player takes the next turn.</span>
                  </li>
                  <li className="flex">
                    <span className="font-bold text-yellow-400 mr-2">5.</span>
                    <span>If your guess is wrong, you swap roles with the player you selected. The King (whether original or new) starts the next turn.</span>
                  </li>
                  <li className="flex">
                    <span className="font-bold text-yellow-400 mr-2">6.</span>
                    <span>The game ends when all players except the Thief are locked in their correct positions in the chain.</span>
                  </li>
                </ol>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button color="primary" size="large" onClick={handleQuickPlay}>
              <PlayCircle className="mr-2 h-5 w-5" />
              Play Game
            </Button>
            <Link to="/create">
              <Button color="secondary" size="large">
                Create Game
                <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/join">
              <Button color="secondary" size="large">
                Join Game
                <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
      
      <footer className="bg-purple-950/70 py-4 border-t border-purple-800/50">
        <div className="container mx-auto px-4 text-center text-purple-300 text-sm">
          Chain of Command &copy; {new Date().getFullYear()} — A royal game of deduction
        </div>
      </footer>
    </div>
  );
};

export default HomePage;