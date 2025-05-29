import React from 'react';
import { Player, Role, RoleInfo } from '../types/gameTypes';
import { User, Crown, Lock } from 'lucide-react';

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
  
  // Get the role info if the player has a role
  const roleInfo = player.role ? getRoleInfo(player.role) : null;
  
  // Card border class based on state
  const cardBorderClass = isSelected
    ? 'border-yellow-400 shadow-lg shadow-yellow-400/20'
    : player.isCurrentTurn
    ? 'border-green-500 shadow-lg shadow-green-500/20'
    : player.isLocked
    ? 'border-indigo-500'
    : 'border-purple-700/50';
    
  // Background class based on state
  const cardBgClass = isSelected
    ? 'bg-purple-800/70'
    : player.isCurrentTurn
    ? 'bg-purple-900/90'
    : player.isLocked
    ? 'bg-purple-900/70'
    : 'bg-purple-900/50';

  // Scale animation on hover
  const hoverClass = canSelect
    ? 'cursor-pointer transition transform hover:scale-105'
    : '';
    
  return (
    <div
      className={`
        rounded-lg p-4 ${cardBgClass} ${cardBorderClass} ${hoverClass}
        relative overflow-hidden transition-all duration-300
      `}
      onClick={canSelect ? onSelect : undefined}
    >
      {/* Glow effect for current turn */}
      {player.isCurrentTurn && (
        <div className="absolute inset-0 opacity-20 bg-green-500 animate-pulse pointer-events-none" />
      )}
      
      <div className="flex items-center relative z-10">
        {/* Player avatar */}
        <div className={`
          w-12 h-12 rounded-full flex items-center justify-center mr-4
          ${player.isLocked ? 'bg-indigo-700' : 'bg-purple-700'}
        `}>
          {player.isHost ? (
            <Crown className="text-yellow-400 h-6 w-6" />
          ) : (
            <User className="text-purple-300 h-6 w-6" />
          )}
        </div>
        
        {/* Player info */}
        <div className="flex-1">
          <div className="flex items-center">
            <p className={`font-semibold ${isCurrentPlayer ? 'text-yellow-300' : 'text-white'}`}>
              {player.name} {isCurrentPlayer && '(You)'}
            </p>
            
            {player.isLocked && (
              <Lock className="text-indigo-400 h-4 w-4 ml-2" />
            )}
          </div>
          
          {/* Role info - Only show for current player or locked players */}
          <div className="flex items-center">
            {isCurrentPlayer && player.role ? (
              <div className={`text-sm flex items-center ${roleInfo?.color}`}>
                {getRoleIcon(player.role)}
                <span className="ml-1">{roleInfo?.name}</span>
              </div>
            ) : player.isLocked ? (
              <div className={`text-sm flex items-center ${roleInfo?.color}`}>
                {getRoleIcon(player.role as string)}
                <span className="ml-1">{roleInfo?.name}</span>
              </div>
            ) : (
              <p className="text-sm text-purple-400">
                {player.isCurrentTurn ? 'Current Turn' : 'Role Hidden'}
              </p>
            )}
          </div>
        </div>
        
        {/* Selection indicator */}
        {isSelected && (
          <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
            <span className="text-purple-900 text-xs font-bold">✓</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerCard;