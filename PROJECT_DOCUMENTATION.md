# Raja Rani Mantri - Chain of Command Game

## Project Overview

**Raja Rani Mantri** is a multiplayer online strategy game based on the traditional Indian game of the same name. It's a game of deduction, strategy, and social interaction where players must identify each other's roles in a royal hierarchy.

### Package Information
- **Package Name**: `com.rajarani.game`
- **App Name**: Raja Rani Mantri
- **Version**: 1.0.0
- **Platform**: Web (React/TypeScript) with Android APK support via Capacitor

## Game Description

Raja Rani Mantri is a classic Indian game that combines elements of deduction, strategy, and social interaction. Players are assigned secret roles in a royal hierarchy and must identify the next person in the chain of command through strategic guessing.

### Core Concept
- **Players**: 3-6 players (optimally 6)
- **Objective**: Lock your position in the royal hierarchy by correctly identifying the next role in the chain
- **Gameplay**: Turn-based guessing with role swapping mechanics
- **Duration**: 10-20 minutes per game

## Game Rules & Logic

### Role Hierarchy (Chain of Command)
1. **Raja (King)** - 100 points - Must find the Rani
2. **Rani (Queen)** - 80 points - Must find the Mantri
3. **Mantri (Minister)** - 50 points - Must find the Sipahi
4. **Sipahi (Soldier)** - 25 points - Must find the Police
5. **Police** - 15 points - Must find the Chor
6. **Chor (Thief)** - 0 points - Tries to avoid being caught

### Game Flow
1. **Setup**: Players join a lobby and receive secret roles
2. **Turn Order**: Raja starts first, then follows the chain
3. **Guessing**: Active player selects another player to guess their role
4. **Outcomes**:
   - **Correct Guess**: Both players lock their positions, next player in chain takes turn
   - **Wrong Guess**: Players swap roles, guesser continues their turn
5. **End Condition**: Game ends when all players except Chor are locked in correct positions

### Scoring System
- Players earn points based on their final role position
- Higher positions in hierarchy earn more points
- Locked players maintain their role's point value

## Technical Architecture

### Frontend Stack
- **Framework**: React 18.2.0 with TypeScript
- **Styling**: Tailwind CSS 3.4.0
- **Routing**: React Router DOM 6.21.1
- **State Management**: React Context API
- **Animations**: Framer Motion 10.18.0
- **Icons**: Lucide React
- **Notifications**: React Hot Toast 2.4.1
- **Celebrations**: Canvas Confetti 1.9.2

### Backend & Database
- **Authentication**: Firebase Auth
- **Database**: Firebase Realtime Database
- **Storage**: Firebase Storage (for profile images)
- **Real-time Sync**: Firebase Realtime Database listeners

### Mobile Support
- **Framework**: Capacitor 7.4.2
- **Platform**: Android APK generation
- **Build Tools**: Android Studio integration

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Button.tsx       # Custom button component
│   ├── Input.tsx        # Form input component
│   ├── Header.tsx       # App header with navigation
│   ├── PlayerCard.tsx   # Player display component
│   ├── RoleCard.tsx     # Role information display
│   ├── GameResults.tsx  # End game results
│   └── ...
├── pages/               # Route components
│   ├── HomePage.tsx     # Landing page
│   ├── CreateGamePage.tsx
│   ├── JoinGamePage.tsx
│   ├── GameRoomPage.tsx # Main game interface
│   ├── SignInPage.tsx
│   └── ...
├── context/             # React Context providers
│   ├── AuthContext.tsx  # Authentication state
│   └── GameContext.tsx  # Game state management
├── config/              # Configuration files
│   └── firebase.ts      # Firebase configuration
├── types/               # TypeScript type definitions
│   └── gameTypes.ts     # Game-related types
├── utils/               # Utility functions
│   └── helpers.ts       # Helper functions
└── ...
```

## Key Components

### 1. Authentication System
- **Sign Up/Sign In**: Email and password authentication
- **Profile Management**: User profiles with display names and photos
- **Password Reset**: Email-based password recovery
- **Account Management**: Account deletion and profile updates

### 2. Game Management
- **Game Creation**: Host creates game with unique 6-character code
- **Game Joining**: Players join using game codes
- **Real-time Sync**: All game state synchronized across players
- **Game States**: Lobby → Playing → Completed/Interrupted

### 3. Game Logic Implementation

#### Role Assignment
```typescript
const ROLES: Role[] = ['raja', 'rani', 'mantri', 'sipahi', 'police', 'chor'];

const assignRoles = (players: Player[]): Player[] => {
  const shuffledRoles = shuffleArray([...ROLES]);
  return players.map((player, index) => ({
    ...player,
    role: shuffledRoles[index],
    isCurrentTurn: shuffledRoles[index] === 'raja'
  }));
};
```

#### Guess Logic
```typescript
const makeGuess = async (targetPlayerId: string) => {
  const targetPlayer = players.find(p => p.id === targetPlayerId);
  const nextRole = getNextRoleInChain(currentPlayer.role);
  
  if (targetPlayer.role === nextRole) {
    // Correct guess - lock positions
    lockPlayers(currentPlayer, targetPlayer);
    setNextPlayerTurn(targetPlayer);
  } else {
    // Wrong guess - swap roles
    swapRoles(currentPlayer, targetPlayer);
    // Current player continues turn
  }
};
```

### 4. Real-time Features
- **Live Player Updates**: Players see others join/leave in real-time
- **Turn Indicators**: Visual indicators for whose turn it is
- **Game State Sync**: All actions synchronized across all players
- **Disconnection Handling**: Graceful handling of player disconnections

## Firebase Integration

### Database Structure
```
games/
  {gameId}/
    id: string
    state: 'lobby' | 'playing' | 'completed' | 'interrupted'
    players: Player[]
    createdAt: number
    hostId: string
    
users/
  {userId}/
    email: string
    name: string
    photoURL: string
    createdAt: number
    updatedAt: number
```

### Security Rules
- Users can only read/write their own data
- Game data is accessible to all players in that game
- Authentication required for all operations

## Mobile App (Android)

### APK Generation
The project includes Capacitor configuration for generating Android APKs:

1. **Build Process**:
   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   ```

2. **App Configuration**:
   - App ID: `com.rajarani.game`
   - App Name: Raja Rani Mantri
   - Minimum SDK: 23 (Android 6.0)
   - Target SDK: 35 (Android 15)

3. **Features**:
   - Offline capability after installation
   - Native Android UI integration
   - Push notification support (configurable)

## Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project setup
- Android Studio (for APK generation)

### Installation
```bash
# Clone repository
git clone <repository-url>
cd raja-rani-mantri

# Install dependencies
npm install

# Set up environment variables
# Create .env file with Firebase configuration

# Start development server
npm run dev

# Build for production
npm run build

# Generate Android APK
npm run build
npx cap sync android
npx cap open android
```

### Environment Variables
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Game Features

### Core Features
- ✅ User authentication and profiles
- ✅ Game creation and joining
- ✅ Real-time multiplayer gameplay
- ✅ Role-based game mechanics
- ✅ Turn-based gameplay
- ✅ Score calculation and leaderboards
- ✅ Game state persistence
- ✅ Mobile-responsive design

### Advanced Features
- ✅ Animated celebrations for correct guesses
- ✅ Visual feedback for game actions
- ✅ Game interruption handling
- ✅ Player disconnection management
- ✅ Admin dashboard
- ✅ Profile image uploads
- ✅ Password reset functionality

### Mobile Features
- ✅ Android APK generation
- ✅ Offline capability
- ✅ Native app experience
- ✅ Touch-optimized interface

## Deployment

### Web Deployment (Netlify)
The application is configured for easy deployment to Netlify:
- Automatic builds from Git repository
- Environment variable configuration
- Custom domain support
- SSL certificate included

### Android Deployment
APK can be generated for:
- Direct installation on Android devices
- Google Play Store distribution
- Enterprise distribution

## Performance Optimizations

### Frontend Optimizations
- Code splitting with React.lazy()
- Image optimization and lazy loading
- Efficient re-rendering with React.memo()
- Optimized bundle size with tree shaking

### Backend Optimizations
- Firebase Realtime Database indexing
- Efficient data queries
- Connection pooling
- Caching strategies

## Security Considerations

### Authentication Security
- Secure password requirements
- Email verification
- Session management
- Account lockout protection

### Data Security
- Firebase Security Rules
- Input validation and sanitization
- XSS protection
- CSRF protection

### Game Security
- Anti-cheating measures
- Game state validation
- Player verification
- Secure random number generation

## Future Enhancements

### Planned Features
- [ ] Spectator mode
- [ ] Tournament system
- [ ] Chat functionality
- [ ] Custom game rules
- [ ] AI players
- [ ] Statistics and analytics
- [ ] Social features (friends, invites)
- [ ] Multiple game variants

### Technical Improvements
- [ ] Progressive Web App (PWA) support
- [ ] iOS app development
- [ ] WebRTC for peer-to-peer communication
- [ ] Advanced analytics
- [ ] Performance monitoring
- [ ] Automated testing suite

## Contributing

### Development Guidelines
1. Follow TypeScript best practices
2. Use ESLint and Prettier for code formatting
3. Write unit tests for new features
4. Follow Git flow for branching
5. Update documentation for new features

### Code Style
- Use functional components with hooks
- Implement proper error handling
- Follow naming conventions
- Add TypeScript types for all data structures
- Use meaningful commit messages

## License

This project is proprietary software. All rights reserved.

## Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

---

**Raja Rani Mantri** - Bringing the classic Indian game to the digital age with modern web technologies and mobile support.