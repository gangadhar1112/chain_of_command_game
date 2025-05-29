import React from 'react';
import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-purple-900/80 backdrop-blur-sm py-4 shadow-md border-b border-purple-800/50">
      <div className="container mx-auto px-4">
        <Link to="/" className="flex items-center justify-center md:justify-start">
          <Crown className="text-yellow-400 h-6 w-6 mr-2" />
          <span className="text-white font-bold text-xl">Chain of Command</span>
        </Link>
      </div>
    </header>
  );
};

export default Header;