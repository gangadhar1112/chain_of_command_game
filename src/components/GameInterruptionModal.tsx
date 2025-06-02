import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface GameInterruptionModalProps {
  show: boolean;
  reason: string;
}

const GameInterruptionModal: React.FC<GameInterruptionModalProps> = ({ show, reason }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-yellow-500" />
          <h2 className="text-xl font-semibold text-gray-900">Game Interrupted</h2>
        </div>
        <p className="text-gray-600 mb-4">{reason}</p>
        <div className="border-t pt-4">
          <p className="text-sm text-gray-500">
            You'll be redirected to the lobby when all players have acknowledged this message.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GameInterruptionModal;