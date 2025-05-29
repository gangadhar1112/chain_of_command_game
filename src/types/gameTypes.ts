// Game roles
export type Role = 'king' | 'queen' | 'minister' | 'soldier' | 'police' | 'thief';

// Game states
export type GameState = 'waiting' | 'lobby' | 'playing' | 'completed';

// Role information
export interface RoleInfo {
  name: string;
  icon: string;
  color: string;
  description: string;
  points: number;
  chainOrder: number;
}

// Player interface
export interface Player {
  id: string;
  name: string;
  role: Role | null;
  isHost: boolean;
  isLocked: boolean;
  isCurrentTurn: boolean;
  userId: string; // Added to track which user owns this player
}

// Game interface
export interface Game {
  id: string;
  players: Player[];
  state: GameState;
  currentTurnPlayerId: string | null;
  createdAt: number;
}