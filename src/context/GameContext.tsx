import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { GameState, Player, Role } from '../types/gameTypes';

interface GameContextType {
  gameState: GameState;
  players: Player[];
  currentRole: Role | null;
  isHost: boolean;
  joinGame: (gameId: string) => Promise<void>;
  createGame: () => Promise<void>;
  startGame: () => Promise<void>;
  endGame: () => Promise<void>;
  leaveGame: () => Promise<void>;
  updateGameState: (newState: Partial<GameState>) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState>({
    id: '',
    status: 'waiting',
    round: 0,
    score: 0,
    timeRemaining: 0
  });
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [isHost, setIsHost] = useState(false);

  const joinGame = async (gameId: string) => {
    // Implementation
  };

  const createGame = async () => {
    // Implementation
  };

  const startGame = async () => {
    // Implementation
  };

  const endGame = async () => {
    // Implementation
  };

  const leaveGame = async () => {
    // Implementation
  };

  const updateGameState = (newState: Partial<GameState>) => {
    setGameState(prev => ({ ...prev, ...newState }));
  };

  const value = {
    gameState,
    players,
    currentRole,
    isHost,
    joinGame,
    createGame,
    startGame,
    endGame,
    leaveGame,
    updateGameState
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};