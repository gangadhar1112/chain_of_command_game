import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SettingsDrawer from './SettingsDrawer';

const Header: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="bg-purple-900/80 backdrop-blur-sm py-4 shadow-md border-b border-purple-800/50">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <Crown className="text-yellow-400 h-6 w-6 mr-2" />
          <span className="text-white font-bold text-xl">Chain of Command</span>
        </Link>

        {user && (
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="text-purple-300 hover:text-white transition-colors p-2 rounded-full hover:bg-purple-800/50"
          >
            <Settings className="h-6 w-6" />
          </button>
        )}

        <SettingsDrawer
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </div>
    </header>
  );
};

export default Header;