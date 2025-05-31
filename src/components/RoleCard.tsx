import React from 'react';
import { Crown, Heart, Briefcase, Shield, BadgeAlert, Footprints, Lock } from 'lucide-react';
import { Role } from '../types/gameTypes';

interface RoleCardProps {
  role: Role;
  isLocked: boolean;
}

const RoleCard: React.FC<RoleCardProps> = ({ role, isLocked }) => {
  const getRoleDetails = () => {
    switch (role) {
      case 'king':
        return {
          name: 'King',
          icon: <Crown className="h-6 w-6 sm:h-8 sm:w-8" />,
          color: 'text-yellow-400',
          bg: 'bg-yellow-900/30',
          border: 'border-yellow-700/50',
          description: 'You must find the Queen to secure your position.',
          points: 10,
        };
      case 'queen':
        return {
          name: 'Queen',
          icon: <Heart className="h-6 w-6 sm:h-8 sm:w-8" />,
          color: 'text-pink-400',
          bg: 'bg-pink-900/30',
          border: 'border-pink-700/50',
          description: 'You must find the Minister to secure your position.',
          points: 9,
        };
      case 'minister':
        return {
          name: 'Minister',
          icon: <Briefcase className="h-6 w-6 sm:h-8 sm:w-8" />,
          color: 'text-blue-400',
          bg: 'bg-blue-900/30',
          border: 'border-blue-700/50',
          description: 'You must find the Soldier to secure your position.',
          points: 7,
        };
      case 'soldier':
        return {
          name: 'Soldier',
          icon: <Shield className="h-6 w-6 sm:h-8 sm:w-8" />,
          color: 'text-green-400',
          bg: 'bg-green-900/30',
          border: 'border-green-700/50',
          description: 'You must find the Police to secure your position.',
          points: 6,
        };
      case 'police':
        return {
          name: 'Police',
          icon: <BadgeAlert className="h-6 w-6 sm:h-8 sm:w-8" />,
          color: 'text-indigo-400',
          bg: 'bg-indigo-900/30',
          border: 'border-indigo-700/50',
          description: 'You must find the Thief to secure your position.',
          points: 4,
        };
      case 'thief':
        return {
          name: 'Thief',
          icon: <Footprints className="h-6 w-6 sm:h-8 sm:w-8" />,
          color: 'text-red-400',
          bg: 'bg-red-900/30',
          border: 'border-red-700/50',
          description: 'Stay hidden from the Police!',
          points: 0,
        };
      default:
        return {
          name: 'Unknown',
          icon: null,
          color: 'text-gray-400',
          bg: 'bg-gray-900/30',
          border: 'border-gray-700/50',
          description: 'Role not assigned',
          points: 0,
        };
    }
  };

  const roleDetails = getRoleDetails();

  return (
    <div className={`
      ${roleDetails.bg} rounded-lg p-3 sm:p-4 relative overflow-hidden
      border ${roleDetails.border} ${isLocked ? 'border-indigo-500' : ''}
    `}>
      <div className="flex items-start">
        <div className={`
          ${roleDetails.color} bg-opacity-20 p-2 sm:p-3 rounded-full mr-3
          ${isLocked ? 'bg-indigo-900' : `bg-${role}-900`}
        `}>
          {roleDetails.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <h3 className={`text-lg sm:text-xl font-bold ${roleDetails.color}`}>
              {roleDetails.name}
            </h3>
            
            {isLocked && (
              <div className="flex items-center text-indigo-400">
                <Lock className="h-4 w-4 mr-1" />
                <span className="text-xs sm:text-sm">Locked</span>
              </div>
            )}
          </div>
          
          <p className="text-purple-200 mt-1 text-sm sm:text-base">{roleDetails.description}</p>
          
          <div className="mt-2 sm:mt-3 flex flex-wrap gap-2">
            <div className="bg-purple-900/50 px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm">
              <span className="text-purple-300">Points: </span>
              <span className="text-yellow-300 font-bold">{roleDetails.points}</span>
            </div>
            
            <div className="bg-purple-900/50 px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm">
              <span className="text-purple-300">Position: </span>
              <span className="text-white font-bold">
                {roleChainPosition(role)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const roleChainPosition = (role: Role): string => {
  const positions = {
    king: '1st',
    queen: '2nd',
    minister: '3rd',
    soldier: '4th',
    police: '5th',
    thief: '6th',
  };
  
  return positions[role] || 'Unknown';
};

export default RoleCard;