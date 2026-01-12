# API Documentation - Raja Rani Mantri

## Firebase Realtime Database API

### Database Structure

```json
{
  "games": {
    "{gameId}": {
      "id": "string",
      "state": "lobby | playing | completed | interrupted",
      "players": [
        {
          "id": "string",
          "name": "string",
          "role": "raja | rani | mantri | sipahi | police | chor | null",
          "isHost": "boolean",
          "isLocked": "boolean",
          "isCurrentTurn": "boolean",
          "userId": "string"
        }
      ],
      "createdAt": "number",
      "hostId": "string",
      "startedAt": "number (optional)",
      "endedAt": "number (optional)",
      "interruptionReason": "string (optional)"
    }
  },
  "users": {
    "{userId}": {
      "email": "string",
      "name": "string",
      "photoURL": "string (optional)",
      "createdAt": "number",
      "updatedAt": "number"
    }
  },
  "quickPlay": {
    "queues": {
      "{queueId}": {
        "createdAt": "number",
        "status": "waiting | starting",
        "gameId": "string (optional)",
        "startedAt": "number (optional)",
        "players": {
          "{playerId}": {
            "name": "string",
            "userId": "string",
            "timestamp": "number"
          }
        }
      }
    }
  }
}
```

## Game Context API

### Methods

#### `createGame(playerName: string): Promise<string>`
Creates a new game and returns the game ID.

**Parameters:**
- `playerName`: The name of the host player

**Returns:**
- Promise resolving to the game ID

**Example:**
```typescript
const gameId = await createGame("John Doe");
console.log(`Game created with ID: ${gameId}`);
```

#### `joinGame(gameId: string, playerName: string): Promise<boolean>`
Joins an existing game.

**Parameters:**
- `gameId`: The 6-character game code
- `playerName`: The player's display name

**Returns:**
- Promise resolving to boolean indicating success

**Example:**
```typescript
const success = await joinGame("ABC123", "Jane Smith");
if (success) {
  console.log("Successfully joined game");
}
```

#### `startGame(): Promise<void>`
Starts the game (host only). Assigns roles and begins gameplay.

**Requirements:**
- Must be the host
- Must have 3-6 players in lobby

**Example:**
```typescript
if (isHost && players.length >= 3) {
  await startGame();
}
```

#### `makeGuess(targetPlayerId: string): Promise<void>`
Makes a guess about another player's role.

**Parameters:**
- `targetPlayerId`: The ID of the player being guessed

**Game Logic:**
- If correct: Both players lock positions, next player takes turn
- If incorrect: Players swap roles, current player continues

**Example:**
```typescript
await makeGuess("player123");
```

#### `leaveGame(): Promise<void>`
Leaves the current game.

**Effects:**
- Removes player from game
- If host leaves, transfers host to another player
- If game is in progress, marks as interrupted

#### `endGame(): Promise<void>`
Ends the current game (host only).

**Requirements:**
- Must be the host
- Game must be in progress

### State Properties

#### `gameState: GameState`
Current state of the game.

**Values:**
- `'waiting'`: No active game
- `'lobby'`: Players joining, waiting to start
- `'playing'`: Game in progress
- `'completed'`: Game finished normally
- `'interrupted'`: Game ended due to disconnection/error

#### `players: Player[]`
Array of all players in the current game.

#### `currentPlayer: Player | null`
The current user's player object.

#### `currentRole: Role | null`
The current user's assigned role.

#### `isHost: boolean`
Whether the current user is the game host.

#### `lastGuessResult: { correct: boolean; message: string } | null`
Result of the last guess made (temporary, auto-clears after 3 seconds).

## Authentication Context API

### Methods

#### `signUp(email: string, password: string, name: string): Promise<void>`
Creates a new user account.

**Parameters:**
- `email`: User's email address
- `password`: Password (minimum 6 characters)
- `name`: Display name

**Validation:**
- Email format validation
- Password strength requirements
- Unique email enforcement

#### `signIn(email: string, password: string): Promise<void>`
Signs in an existing user.

**Parameters:**
- `email`: User's email address
- `password`: User's password

**Error Handling:**
- Invalid credentials
- Account not found
- Too many attempts

#### `logout(): Promise<void>`
Signs out the current user.

#### `resetPassword(email: string): Promise<void>`
Sends password reset email.

**Parameters:**
- `email`: User's email address

#### `updateUserProfile(data: { name?: string; photoURL?: string }): Promise<void>`
Updates user profile information.

**Parameters:**
- `data.name`: New display name (optional)
- `data.photoURL`: New profile image URL (optional)

#### `deleteAccount(): Promise<void>`
Permanently deletes the user account and all associated data.

### State Properties

#### `user: User | null`
Current authenticated user object.

```typescript
interface User {
  id: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
}
```

#### `loading: boolean`
Whether authentication state is being determined.

## Game Types

### Core Types

```typescript
type Role = 'raja' | 'rani' | 'mantri' | 'sipahi' | 'police' | 'chor';

type GameState = 'waiting' | 'lobby' | 'playing' | 'completed' | 'interrupted';

interface Player {
  id: string;
  name: string;
  role: Role | null;
  isHost: boolean;
  isLocked: boolean;
  isCurrentTurn: boolean;
  userId: string;
}

interface RoleInfo {
  name: string;
  icon: string;
  color: string;
  description: string;
  points: number;
  chainOrder: number;
}

interface Game {
  id: string;
  players: Player[];
  state: GameState;
  currentTurnPlayerId: string | null;
  createdAt: number;
}
```

## Error Handling

### Common Error Codes

#### Authentication Errors
- `auth/invalid-credential`: Invalid email or password
- `auth/email-already-in-use`: Email already registered
- `auth/weak-password`: Password too weak
- `auth/too-many-requests`: Too many failed attempts

#### Game Errors
- `game/not-found`: Game ID doesn't exist
- `game/already-started`: Cannot join game in progress
- `game/full`: Game has maximum players
- `game/invalid-state`: Invalid operation for current game state

#### Network Errors
- `network/timeout`: Request timed out
- `network/offline`: No internet connection
- `network/server-error`: Server unavailable

### Error Handling Pattern

```typescript
try {
  await gameOperation();
} catch (error) {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/invalid-credential':
        setError('Invalid email or password');
        break;
      case 'game/not-found':
        setError('Game not found');
        break;
      default:
        setError('An unexpected error occurred');
    }
  }
}
```

## Real-time Updates

### Firebase Listeners

The application uses Firebase Realtime Database listeners for real-time updates:

```typescript
// Game state listener
const gameRef = ref(database, `games/${gameId}`);
const unsubscribe = onValue(gameRef, (snapshot) => {
  const game = snapshot.val();
  if (game) {
    setGameState(game.state);
    setPlayers(game.players || []);
  }
});

// Cleanup
return () => unsubscribe();
```

### Update Frequency
- Game state: Real-time via Firebase listeners
- Player actions: Immediate updates
- Heartbeat: Every 5 seconds for active games
- Cleanup: Every 30 seconds for stale data

## Security Rules

### Firebase Security Rules

```javascript
{
  "rules": {
    "games": {
      "$gameId": {
        ".read": "auth != null",
        ".write": "auth != null && (
          !data.exists() || 
          data.child('hostId').val() == auth.uid ||
          data.child('players').hasChildren() && 
          data.child('players').hasChild(auth.uid)
        )"
      }
    },
    "users": {
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        ".write": "auth != null && auth.uid == $userId"
      }
    }
  }
}
```

### Data Validation

All user inputs are validated both client-side and server-side:

- **Player names**: 1-20 characters, no special characters
- **Game codes**: 6 uppercase alphanumeric characters
- **Email addresses**: Valid email format
- **Passwords**: Minimum 6 characters

## Performance Considerations

### Optimization Strategies

1. **Connection Pooling**: Reuse Firebase connections
2. **Data Pagination**: Limit query results
3. **Caching**: Cache frequently accessed data
4. **Debouncing**: Limit rapid successive calls
5. **Cleanup**: Remove stale listeners and data

### Rate Limiting

- **Game creation**: 1 per minute per user
- **Join attempts**: 5 per minute per user
- **Guess actions**: 1 per second per user
- **Profile updates**: 3 per minute per user

## Testing

### Unit Tests

```typescript
// Example test for game logic
describe('makeGuess', () => {
  it('should lock players on correct guess', async () => {
    const result = await makeGuess(correctTargetId);
    expect(currentPlayer.isLocked).toBe(true);
    expect(targetPlayer.isLocked).toBe(true);
  });

  it('should swap roles on incorrect guess', async () => {
    const originalRole = currentPlayer.role;
    await makeGuess(incorrectTargetId);
    expect(currentPlayer.role).not.toBe(originalRole);
  });
});
```

### Integration Tests

```typescript
// Example integration test
describe('Game Flow', () => {
  it('should complete full game cycle', async () => {
    const gameId = await createGame('Host');
    await joinGame(gameId, 'Player2');
    await startGame();
    // ... test game progression
    expect(gameState).toBe('completed');
  });
});
```

## Monitoring & Analytics

### Key Metrics

- **Game Creation Rate**: Games created per hour
- **Join Success Rate**: Successful joins vs attempts
- **Game Completion Rate**: Games completed vs started
- **Average Game Duration**: Time from start to completion
- **Player Retention**: Return player percentage

### Error Tracking

- **Authentication Failures**: Failed login attempts
- **Game Errors**: Failed game operations
- **Network Issues**: Connection problems
- **Client Errors**: JavaScript exceptions

---

This API documentation provides comprehensive coverage of all available methods, types, and patterns used in the Raja Rani Mantri game application.