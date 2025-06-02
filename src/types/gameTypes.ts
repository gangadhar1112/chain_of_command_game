// Game roles
export type Role = 'raja' | 'rani' | 'mantri' | 'sipahi' | 'chor';

// Game states
export type GameState = 'waiting' | 'lobby' | 'playing' | 'completed' | 'interrupted';

// Role information
export interface RoleInfo {
  name: string;
  icon: string;
  color: string;
  description: string;
  points: number;
  chainOrder: number;
  customName?: string;
}

// Player interface
export interface Player {
  id: string;
  name: string;
  role: Role | null;
  isHost: boolean;
  isLocked: boolean;
  isCurrentTurn: boolean;
  userId: string;
}

// Game interface
export interface Game {
  id: string;
  players: Player[];
  state: GameState;
  currentTurnPlayerId: string | null;
  createdAt: number;
  customRoleNames?: { [key in Role]?: string };
}