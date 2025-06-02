import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

const Header: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="bg-purple-900/80 backdrop-blur-sm py-4 shadow-md border-b border-purple-800/50">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <Crown className="text-yellow-400 h-6 w-6 mr-2" />
          <span className="text-white font-bold text-xl">Chain of Command</span>
        </Link>

        {user && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 text-white hover:text-purple-200 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-purple-700 flex items-center justify-center">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name || ''}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <UserCircle className="w-6 h-6 text-purple-300" />
                )}
              </div>
              <span className="hidden md:inline">{user.name || user.email}</span>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-purple-800 rounded-lg shadow-lg py-1 border border-purple-700">
                <div className="px-4 py-2 border-b border-purple-700">
                  <p className="text-sm text-purple-200">Signed in as</p>
                  <p className="text-sm font-medium text-white truncate">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-purple-700 flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}

        {!user && (
          <Link to="/signin">
            <Button color="secondary" size="small">
              Sign In
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;