import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WrongGuessOverlayProps {
  show: boolean;
}

const WrongGuessOverlay: React.FC<WrongGuessOverlayProps> = ({ show }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", damping: 15 }}
            className="relative"
          >
            <img
              src="https://images.pexels.com/photos/207983/pexels-photo-207983.jpeg"
              alt="Wrong guess"
              className="w-64 h-64 object-cover rounded-lg shadow-2xl"
            />
            <div className="absolute inset-0 bg-red-900/50 rounded-lg backdrop-blur-sm" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WrongGuessOverlay;