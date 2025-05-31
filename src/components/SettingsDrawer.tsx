import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, LogOut, UserX, X } from 'lucide-react';
import Button from './Button';
import { useAuth } from '../context/AuthContext';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose }) => {
  const { logout, deleteAccount } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await deleteAccount();
        onClose();
      } catch (error) {
        console.error('Delete account error:', error);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed right-0 top-0 h-full w-80 bg-purple-900 shadow-xl z-50 border-l border-purple-700/50"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Settings className="text-purple-300 h-6 w-6 mr-2" />
                  <h2 className="text-xl font-bold text-white">Settings</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-purple-300 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <Button
                  color="secondary"
                  fullWidth
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Sign Out
                </Button>

                <Button
                  color="danger"
                  fullWidth
                  onClick={handleDeleteAccount}
                >
                  <UserX className="h-5 w-5 mr-2" />
                  Delete Account
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SettingsDrawer;