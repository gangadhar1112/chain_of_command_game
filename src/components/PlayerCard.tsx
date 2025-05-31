import React from 'react';
import { Player, Role, RoleInfo } from '../types/gameTypes';
import { User, Crown, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface PlayerCardProps {
  player: Player;
  isCurrentPlayer: boolean;
  isSelected: boolean;
  onSelect: () => void;
  getRoleIcon: (role: string) => React.ReactNode;
  getRoleInfo: (role: Role) => RoleInfo;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isCurrentPlayer,
  isSelected,
  onSelect,
  getRoleIcon,
  getRoleInfo,
}) => {
  const canSelect = !isCurrentPlayer && player.role !== null;
  const roleInfo = player.role ? getRoleInfo(player.role) : null;
  
  const cardBorderClass = isSelected
    ? 'border-yellow-400 shadow-lg shadow-yellow-400/20'
    : player.isCurrentTurn
    ? 'border-green-500 shadow-lg shadow-green-500/20'
    : player.isLocked
    ? 'border-indigo-500'
    : 'border-purple-700/50';
    
  const cardBgClass = isSelected
    ? 'bg-purple-800/70'
    : player.isCurrentTurn
    ? 'bg-purple-900/90'
    : player.isLocked
    ? 'bg-purple-900/70'
    : 'bg-purple-900/50';

  const hoverClass = canSelect
    ? 'cursor-pointer transition transform hover:scale-105'
    : '';
    
  return (
    <motion.div
      whileTap={canSelect ? { scale: 0.95 } : {}}
      className={`
        rounded-lg p-3 ${cardBgClass} ${cardBorderClass} ${hoverClass}
        relative overflow-hidden transition-all duration-300
      `}
      onClick={canSelect ? onSelect : undefined}
    >
      {player.isCurrentTurn && (
        <div className="absolute inset-0 opacity-20 bg-green-500 animate-pulse pointer-events-none" />
      )}
      
      <div className="flex items-center relative z-10">
        <div className={`
          w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mr-2 sm:mr-3
          ${player.isLocked ? 'bg-indigo-700' : 'bg-purple-700'}
        `}>
          {player.isHost ? (
            <Crown className="text-yellow-400 h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <User className="text-purple-300 h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <p className={`font-semibold truncate ${isCurrentPlayer ? 'text-yellow-300' : 'text-white'} text-sm sm:text-base`}>
              {player.name} {isCurrentPlayer && '(You)'}
            </p>
            
            {player.isLocked && (
              <Lock className="text-indigo-400 h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 flex-shrink-0" />
            )}
          </div>
          
          <div className="flex items-center">
            {isCurrentPlayer && player.role ? (
              <div className={`text-xs sm:text-sm flex items-center ${roleInfo?.color}`}>
                {getRoleIcon(player.role)}
                <span className="ml-1 truncate">{roleInfo?.name}</span>
              </div>
            ) : player.isLocked ? (
              <div className={`text-xs sm:text-sm flex items-center ${roleInfo?.color}`}>
                {getRoleIcon(player.role as string)}
                <span className="ml-1 truncate">{roleInfo?.name}</span>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-purple-400">
                {player.isCurrentTurn ? 'Current Turn' : 'Role Hidden'}
              </p>
            )}
          </div>
        </div>
        
        {isSelected && (
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
            <span className="text-purple-900 text-xs font-bold">✓</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PlayerCard;