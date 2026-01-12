# Raja Rani Mantri - Flutter Version

A traditional Indian strategy game built with Flutter - Chain of Command multiplayer game.

## Features

- **Cross-Platform**: Runs on iOS, Android, and Web
- **Real-time Multiplayer**: Firebase Realtime Database integration
- **Authentication**: Email/password authentication with Firebase Auth
- **Beautiful UI**: Material Design 3 with custom theming
- **Responsive Design**: Optimized for mobile and tablet devices
- **Game Logic**: Complete implementation of traditional Raja Rani Mantri rules

## Game Rules

Raja Rani Mantri is a classic Indian game of deduction and strategy:

1. **Players**: 3-6 players (optimally 6)
2. **Roles**: Raja (King), Rani (Queen), Mantri (Minister), Sipahi (Soldier), Police, Chor (Thief)
3. **Objective**: Lock your position in the royal hierarchy by correctly identifying the next role in the chain
4. **Gameplay**: 
   - Raja starts and must find the Rani
   - Correct guess = both players lock positions, next player's turn
   - Wrong guess = players swap roles, guesser continues
   - Game ends when all except Chor are locked in correct positions

## Getting Started

### Prerequisites

- Flutter SDK (3.0.0 or higher)
- Dart SDK
- Firebase project setup
- Android Studio / VS Code with Flutter extensions

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd flutter_version
   ```

2. **Install dependencies**:
   ```bash
   flutter pub get
   ```

3. **Firebase Setup**:
   - Create a new Firebase project
   - Enable Authentication (Email/Password)
   - Enable Realtime Database
   - Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
   - Place them in the appropriate directories

4. **Run the app**:
   ```bash
   flutter run
   ```

### Firebase Configuration

Create a Firebase project and configure:

1. **Authentication**:
   - Enable Email/Password sign-in method
   - Disable email verification for simplicity

2. **Realtime Database**:
   ```json
   {
     "rules": {
       "games": {
         "$gameId": {
           ".read": "auth != null",
           ".write": "auth != null"
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

## Project Structure

```
lib/
├── main.dart                 # App entry point
├── models/                   # Data models
│   └── game_models.dart
├── services/                 # Firebase services
│   ├── firebase_service.dart
│   ├── auth_service.dart
│   └── game_service.dart
├── providers/                # State management
│   ├── auth_provider.dart
│   └── game_provider.dart
├── screens/                  # UI screens
│   ├── home_screen.dart
│   ├── auth/
│   │   ├── sign_in_screen.dart
│   │   └── sign_up_screen.dart
│   └── game/
│       ├── create_game_screen.dart
│       ├── join_game_screen.dart
│       └── game_room_screen.dart
├── widgets/                  # Reusable widgets
│   ├── custom_button.dart
│   ├── custom_text_field.dart
│   ├── player_card.dart
│   ├── role_card.dart
│   ├── role_chain_widget.dart
│   └── game_results.dart
└── utils/                    # Utilities
    ├── app_theme.dart
    └── game_utils.dart
```

## Key Features

### Authentication
- Email/password sign-up and sign-in
- User profile management
- Secure session handling

### Game Management
- Create and join games with 6-character codes
- Real-time player synchronization
- Host controls and game state management

### Gameplay
- Role assignment and turn management
- Guess validation and role swapping
- Game completion detection
- Results and scoring

### UI/UX
- Material Design 3 theming
- Responsive layouts for different screen sizes
- Smooth animations and transitions
- Toast notifications and loading states

## State Management

The app uses Provider for state management with two main providers:

- **AuthProvider**: Manages authentication state and user data
- **GameProvider**: Manages game state, players, and game logic

## Building for Production

### Android APK
```bash
flutter build apk --release
```

### iOS App
```bash
flutter build ios --release
```

### Web App
```bash
flutter build web --release
```

## Testing

Run tests with:
```bash
flutter test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions:
- Create an issue in the repository
- Check the Flutter documentation
- Review Firebase documentation

---

**Raja Rani Mantri Flutter** - Bringing the classic Indian game to modern mobile devices with Flutter's cross-platform capabilities.