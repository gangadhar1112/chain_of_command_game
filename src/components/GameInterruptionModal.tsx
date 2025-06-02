import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

interface GameInterruptionModalProps {
  show: boolean;
  reason: string;
  onClose: () => void;
}

const GameInterruptionModal: React.FC<GameInterruptionModalProps> = ({ show, reason, onClose }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-purple-900/90 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-purple-700/50">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-yellow-500" />
          <h2 className="text-xl font-semibold text-white">Game Interrupted</h2>
        </div>
        <p className="text-purple-200 mb-6">{reason}</p>
        <div className="flex justify-center">
          <Button color="primary" onClick={onClose}>
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameInterruptionModal;