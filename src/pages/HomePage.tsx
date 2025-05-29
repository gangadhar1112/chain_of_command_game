import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Users, Trophy, Star, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import Button from '../components/Button';

const HomePage: React.FC = () => {
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-purple-900/70 rounded-lg p-5 border border-purple-700/50 shadow-md transition hover:bg-purple-900/90">
              <div className="flex items-center mb-3">
                <Users className="text-purple-300 h-6 w-6 mr-2" />
                <h3 className="text-xl font-semibold text-white">3-6 Players</h3>
              </div>
              <p className="text-purple-200">
                Each player is assigned a secret role in the royal hierarchy. Find your place in the chain!
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

          <div className="bg-gradient-to-r from-purple-900/80 to-indigo-900/80 rounded-lg p-6 mb-8 border border-purple-600/50">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <Star className="text-yellow-400 h-6 w-6 mr-2" />
              How to Play
            </h2>
            <ol className="space-y-3 text-purple-100">
              <li className="flex">
                <span className="font-bold text-yellow-400 mr-2">1.</span>
                <span>Each player is secretly assigned a role: King, Queen, Minister, Soldier, Police, or Thief.</span>
              </li>
              <li className="flex">
                <span className="font-bold text-yellow-400 mr-2">2.</span>
                <span>Starting with the King, each player must find the next role in the chain.</span>
              </li>
              <li className="flex">
                <span className="font-bold text-yellow-400 mr-2">3.</span>
                <span>If you guess correctly, both players lock their positions, and the turn passes to the player you found.</span>
              </li>
              <li className="flex">
                <span className="font-bold text-yellow-400 mr-2">4.</span>
                <span>If you guess incorrectly, you swap roles with the player you guessed, and your turn continues.</span>
              </li>
              <li className="flex">
                <span className="font-bold text-yellow-400 mr-2">5.</span>
                <span>The game ends when all players have found their correct positions in the chain.</span>
              </li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/create">
              <Button color="primary" size="large">
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