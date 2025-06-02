import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';
import { useNavigate } from 'react-router-dom';

interface GameInterruptionModalProps {
  show: boolean;
  reason: string;
}

const GameInterruptionModal: React.FC<GameInterruptionModalProps> = ({ show, reason }) => {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-purple-900 rounded-lg p-6 max-w-md w-full mx-4 border border-purple-700/50"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-900/50 p-3 rounded-full">
                <AlertTriangle className="text-red-400 h-8 w-8" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-white text-center mb-2">
              Game Interrupted
            </h2>
            
            <p className="text-purple-200 text-center mb-6">
              {reason}
            </p>
            
            <div className="flex justify-center">
              <Button
                color="primary"
                onClick={() => navigate('/')}
              >
                Return to Home
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GameInterruptionModal;