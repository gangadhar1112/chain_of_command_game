import React, { useState, useEffect } from 'react';
import { Player, Role, RoleInfo } from '../types/gameTypes';
import { Trophy, Crown, Medal, Award, ArrowRight } from 'lucide-react';
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
  const [showAnimation, setShowAnimation] = useState(false);
  
  // Sort players by their role's points (highest first)
  const sortedPlayers = [...players].sort((a, b) => {
    const roleA = a.role ? getRoleInfo(a.role).points : 0;
    const roleB = b.role ? getRoleInfo(b.role).points : 0;
    return roleB - roleA;
  });
  
  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => {
      setShowAnimation(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="bg-purple-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-purple-700/50">
      <div className={`
        text-center mb-8 transition-all duration-1000
        ${showAnimation ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-10'}
      `}>
        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full mb-4">
          <Trophy className="text-white h-10 w-10" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Game Completed!</h1>
        <p className="text-purple-200 text-lg">
          The Chain of Command has been established
        </p>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center justify-center">
          <Award className="text-yellow-400 mr-2 h-6 w-6" />
          Final Standings
        </h2>
        
        <div className="grid gap-4 max-w-2xl mx-auto">
          {sortedPlayers.map((player, index) => {
            const roleInfo = player.role ? getRoleInfo(player.role) : null;
            const isTopThree = index < 3;
            
            return (
              <div 
                key={player.id}
                className={`
                  rounded-lg p-4 border relative overflow-hidden
                  transition-all duration-500 delay-${index * 200}
                  ${showAnimation ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform -translate-x-10'}
                  ${index === 0 ? 'bg-gradient-to-r from-yellow-900/50 to-amber-900/50 border-yellow-500/50' : 
                    index === 1 ? 'bg-gradient-to-r from-slate-800/50 to-gray-800/50 border-gray-400/50' :
                    index === 2 ? 'bg-gradient-to-r from-amber-900/50 to-orange-900/50 border-orange-500/50' :
                    'bg-purple-900/50 border-purple-700/50'}
                `}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-4">
                    {isTopThree ? (
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center
                        ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'}
                      `}>
                        {index === 0 ? (
                          <Crown className="text-yellow-900 h-6 w-6" />
                        ) : (
                          <Medal className="text-gray-900 h-6 w-6" />
                        )}
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-purple-800 rounded-full flex items-center justify-center">
                        <span className="text-purple-300 font-bold text-lg">{index + 1}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className="text-white font-bold text-lg">{player.name}</h3>
                      <div className="bg-purple-950/60 px-3 py-1 rounded-full">
                        <span className="text-yellow-400 font-bold">{roleInfo?.points} pts</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center mt-1">
                      <div className={`${roleInfo?.color} mr-2`}>
                        {getRoleIcon(player.role as string)}
                      </div>
                      <span className={`${roleInfo?.color}`}>{roleInfo?.name}</span>
                    </div>
                  </div>
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
  const { Crown, Heart, Briefcase, Shield, BadgeAlert, Footprints } = require('lucide-react');
  
  switch (role) {
    case 'king': return <Crown className="h-5 w-5" />;
    case 'queen': return <Heart className="h-5 w-5" />;
    case 'minister': return <Briefcase className="h-5 w-5" />;
    case 'soldier': return <Shield className="h-5 w-5" />;
    case 'police': return <BadgeAlert className="h-5 w-5" />;
    case 'thief': return <Footprints className="h-5 w-5" />;
    default: return null;
  }
};

export default GameResults;