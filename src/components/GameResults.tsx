import React from 'react';
import { Player, Role, RoleInfo } from '../types/gameTypes';
import { Trophy, Crown, Medal, Award, ArrowRight, Star, Shield, Heart, Building2, Siren, Footprints } from 'lucide-react';
import Button from './Button';

interface GameResultsProps {
  players: Player[];
  getRoleInfo: (role: Role) => RoleInfo;
  onLeaveGame: () => void;
}

const GameResults: React.FC<GameResultsProps> = ({ 
  players, 
  getRoleInfo,
  onLeaveGame
}) => {
  // Sort players by their role's points (highest first)
  const sortedPlayers = [...players].sort((a, b) => {
    const roleA = a.role ? getRoleInfo(a.role).points : 0;
    const roleB = b.role ? getRoleInfo(b.role).points : 0;
    return roleB - roleA;
  });

  // Get rank suffix (1st, 2nd, 3rd, etc.)
  const getRankSuffix = (index: number): string => {
    if (index === 0) return '1st';
    if (index === 1) return '2nd';
    if (index === 2) return '3rd';
    return `${index + 1}th`;
  };
  
  return (
    <div className="bg-purple-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-lg border border-purple-700/50 w-full max-w-4xl mx-auto">
      <div className="text-center mb-6 md:mb-8">
        <div className="inline-flex items-center justify-center p-3 md:p-4 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full mb-4">
          <Trophy className="text-white h-8 w-8 md:h-10 md:w-10" />
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
          Game Completed!
        </h1>
        <p className="text-purple-200 text-base md:text-lg">
          The Chain of Command has been established
        </p>
      </div>
      
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-semibold text-white mb-4 flex items-center justify-center">
          <Award className="text-yellow-400 mr-2 h-5 w-5 md:h-6 md:w-6" />
          Final Rankings
        </h2>
        
        <div className="grid gap-3 md:gap-4">
          {sortedPlayers.map((player, index) => {
            const roleInfo = player.role ? getRoleInfo(player.role) : null;
            const isTopThree = index < 3;
            
            return (
              <div 
                key={player.id}
                className={`
                  rounded-lg p-3 md:p-4 border relative overflow-hidden
                  ${index === 0 ? 'bg-gradient-to-r from-yellow-900/50 to-amber-900/50 border-yellow-500/50' : 
                    index === 1 ? 'bg-gradient-to-r from-slate-800/50 to-gray-800/50 border-gray-400/50' :
                    index === 2 ? 'bg-gradient-to-r from-amber-900/50 to-orange-900/50 border-orange-500/50' :
                    'bg-purple-900/50 border-purple-700/50'}
                `}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-3 md:mr-4">
                    {isTopThree ? (
                      <div className={`
                        w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center
                        ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'}
                      `}>
                        {index === 0 ? (
                          <Crown className="text-yellow-900 h-5 w-5 md:h-6 md:w-6" />
                        ) : (
                          <Medal className="text-gray-900 h-5 w-5 md:h-6 md:w-6" />
                        )}
                      </div>
                    ) : (
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-800 rounded-full flex items-center justify-center">
                        <span className="text-purple-300 font-bold text-base md:text-lg">{index + 1}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div>
                        <h3 className="text-white font-bold text-base md:text-lg flex items-center">
                          <span className="truncate">{player.name}</span>
                          <span className="ml-2 text-xs md:text-sm font-normal text-purple-300">
                            {getRankSuffix(index)} Place
                          </span>
                        </h3>
                      </div>
                      <div className="bg-purple-950/60 px-2 py-1 md:px-3 rounded-full">
                        <span className="text-yellow-400 font-bold text-sm md:text-base">{roleInfo?.points} pts</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center mt-1">
                      <div className={`${roleInfo?.color} mr-2`}>
                        {getRoleIcon(player.role as string)}
                      </div>
                      <span className={`${roleInfo?.color} text-sm md:text-base`}>{roleInfo?.name}</span>
                      {player.isHost && (
                        <span className="ml-2 bg-purple-700/50 px-2 py-0.5 rounded-full text-xs text-purple-300">
                          Host
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 md:mt-3 flex flex-wrap gap-2">
                  {index === 0 && (
                    <div className="bg-yellow-900/30 text-yellow-400 px-2 py-1 md:px-3 rounded-full text-xs md:text-sm flex items-center">
                      <Star className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                      Game Winner
                    </div>
                  )}
                  {player.isLocked && (
                    <div className="bg-green-900/30 text-green-400 px-2 py-1 md:px-3 rounded-full text-xs md:text-sm flex items-center">
                      <Shield className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                      Perfect Chain
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="flex justify-center">
        <Button color="primary" onClick={onLeaveGame}>
          Return to Home
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

// Helper function to get role icon
const getRoleIcon = (role: string) => {
  switch (role) {
    case 'king': return <Crown className="h-4 w-4 md:h-5 md:w-5" />;
    case 'queen': return <Heart className="h-4 w-4 md:h-5 md:w-5" />;
    case 'minister': return <Building2 className="h-4 w-4 md:h-5 md:w-5" />;
    case 'soldier': return <Shield className="h-4 w-4 md:h-5 md:w-5" />;
    case 'police': return <Siren className="h-4 w-4 md:h-5 md:w-5" />;
    case 'thief': return <Footprints className="h-4 w-4 md:h-5 md:w-5" />;
    default: return null;
  }
};

export default GameResults;