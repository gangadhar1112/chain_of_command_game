import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:confetti/confetti.dart';
import '../../providers/game_provider.dart';
import '../../models/game_models.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/player_card.dart';
import '../../widgets/role_card.dart';
import '../../widgets/game_results.dart';
import '../../utils/game_utils.dart';

class GameRoomScreen extends StatefulWidget {
  final String gameId;

  const GameRoomScreen({
    super.key,
    required this.gameId,
  });

  @override
  State<GameRoomScreen> createState() => _GameRoomScreenState();
}

class _GameRoomScreenState extends State<GameRoomScreen> {
  late ConfettiController _confettiController;
  String? _selectedPlayerId;
  bool _showHelp = false;

  @override
  void initState() {
    super.initState();
    _confettiController = ConfettiController(duration: const Duration(seconds: 2));
    
    // Join the game if not already joined
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final gameProvider = context.read<GameProvider>();
      if (gameProvider.gameId != widget.gameId) {
        // Need to join this game
        // This would typically be handled by navigation logic
      }
    });
  }

  @override
  void dispose() {
    _confettiController.dispose();
    super.dispose();
  }

  void _handleGuessResult(Map<String, dynamic>? result) {
    if (result != null && result['correct'] == true) {
      _confettiController.play();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<GameProvider>(
      builder: (context, gameProvider, _) {
        // Handle guess result animation
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _handleGuessResult(gameProvider.lastGuessResult);
        });

        return Scaffold(
          appBar: AppBar(
            title: Text('Game ${widget.gameId}'),
            leading: IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () {
                gameProvider.leaveGame();
                context.go('/');
              },
            ),
            actions: [
              if (gameProvider.gameState == GameState.playing)
                IconButton(
                  icon: const Icon(Icons.help_outline),
                  onPressed: () {
                    setState(() {
                      _showHelp = !_showHelp;
                    });
                  },
                ),
            ],
          ),
          body: Stack(
            children: [
              _buildGameContent(gameProvider),
              
              // Confetti
              Align(
                alignment: Alignment.topCenter,
                child: ConfettiWidget(
                  confettiController: _confettiController,
                  blastDirectionality: BlastDirectionality.explosive,
                  colors: const [
                    Colors.amber,
                    Colors.orange,
                    Colors.pink,
                    Colors.purple,
                  ],
                ),
              ),
              
              // Guess Result Overlay
              if (gameProvider.lastGuessResult != null)
                _buildGuessResultOverlay(gameProvider.lastGuessResult!),
              
              // Interruption Modal
              if (gameProvider.showInterruptionModal)
                _buildInterruptionModal(gameProvider),
            ],
          ),
        );
      },
    );
  }

  Widget _buildGameContent(GameProvider gameProvider) {
    switch (gameProvider.gameState) {
      case GameState.lobby:
        return _buildLobby(gameProvider);
      case GameState.playing:
        return _buildGameplay(gameProvider);
      case GameState.completed:
        return GameResults(
          players: gameProvider.players,
          onLeaveGame: () {
            gameProvider.leaveGame();
            context.go('/');
          },
        );
      default:
        return const Center(
          child: CircularProgressIndicator(),
        );
    }
  }

  Widget _buildLobby(GameProvider gameProvider) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Game Info Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Icon(
                    Icons.crown,
                    size: 48,
                    color: Theme.of(context).colorScheme.secondary,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Game Lobby',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Game Code: ${widget.gameId}',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: Theme.of(context).colorScheme.secondary,
                      fontFamily: 'monospace',
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Share this code with friends to join the game',
                    style: Theme.of(context).textTheme.bodyMedium,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Players Section
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Players (${gameProvider.players.length}/6)',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      if (gameProvider.isHost)
                        CustomButton(
                          text: gameProvider.players.length < 3
                              ? 'Need ${3 - gameProvider.players.length} more'
                              : 'Start Game',
                          onPressed: gameProvider.players.length >= 3
                              ? () => gameProvider.startGame()
                              : null,
                          isPrimary: true,
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  // Player List
                  ...gameProvider.players.map((player) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: PlayerCard(
                      player: player,
                      isCurrentPlayer: player.id == gameProvider.currentPlayer?.id,
                      onTap: null,
                    ),
                  )),
                  
                  // Empty Slots
                  ...List.generate(
                    6 - gameProvider.players.length,
                    (index) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: Theme.of(context).colorScheme.outline.withOpacity(0.3),
                          ),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.person_add_outlined,
                              color: Theme.of(context).colorScheme.outline,
                            ),
                            const SizedBox(width: 12),
                            Text(
                              'Waiting for player...',
                              style: TextStyle(
                                color: Theme.of(context).colorScheme.outline,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Leave Game Button
          SizedBox(
            width: double.infinity,
            child: CustomButton(
              text: 'Leave Game',
              onPressed: () {
                gameProvider.leaveGame();
                context.go('/');
              },
              isPrimary: false,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGameplay(GameProvider gameProvider) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Help Section
          if (_showHelp)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'How to Play',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '• The Raja starts and must find the Rani\n'
                      '• If correct, both players lock positions\n'
                      '• If wrong, roles swap and guesser continues\n'
                      '• Chain: Raja → Rani → Mantri → Sipahi → Police → Chor\n'
                      '• Game ends when all are locked in correct positions',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
            ),
          
          if (_showHelp) const SizedBox(height: 16),
          
          // Your Role
          if (gameProvider.currentPlayer?.role != null)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Your Role',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 12),
                    RoleCard(
                      role: gameProvider.currentPlayer!.role!,
                      isLocked: gameProvider.currentPlayer!.isLocked,
                    ),
                  ],
                ),
              ),
            ),
          
          const SizedBox(height: 16),
          
          // Turn Status
          Card(
            color: gameProvider.currentPlayer?.isCurrentTurn == true
                ? Colors.green.withOpacity(0.2)
                : null,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  if (gameProvider.currentPlayer?.isCurrentTurn == true) ...[
                    Icon(
                      Icons.play_arrow,
                      color: Colors.green,
                      size: 32,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Your Turn!',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: Colors.green,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _getTurnInstructions(gameProvider),
                      style: Theme.of(context).textTheme.bodyMedium,
                      textAlign: TextAlign.center,
                    ),
                  ] else ...[
                    Icon(
                      Icons.hourglass_empty,
                      color: Theme.of(context).colorScheme.outline,
                      size: 32,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Waiting for other player',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "It's another player's turn to make a guess",
                      style: Theme.of(context).textTheme.bodyMedium,
                      textAlign: TextAlign.center,
                    ),
                  ],
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Players
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Players',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  ...gameProvider.players.map((player) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: PlayerCard(
                      player: player,
                      isCurrentPlayer: player.id == gameProvider.currentPlayer?.id,
                      isSelected: player.id == _selectedPlayerId,
                      onTap: _canSelectPlayer(gameProvider, player)
                          ? () => _selectPlayer(player.id)
                          : null,
                    ),
                  )),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Make Guess Button
          if (gameProvider.currentPlayer?.isCurrentTurn == true && _selectedPlayerId != null)
            SizedBox(
              width: double.infinity,
              child: CustomButton(
                text: 'Make Guess',
                onPressed: () => _makeGuess(gameProvider),
                isPrimary: true,
              ),
            ),
        ],
      ),
    );
  }

  String _getTurnInstructions(GameProvider gameProvider) {
    if (gameProvider.currentPlayer?.role == null) return '';
    
    final nextRole = GameUtils.getNextRoleInChain(gameProvider.currentPlayer!.role!);
    if (nextRole == null) return 'You are the last in the chain!';
    
    final roleInfo = GameUtils.getRoleInfo(nextRole);
    return 'Select the player you think is the ${roleInfo.name}';
  }

  bool _canSelectPlayer(GameProvider gameProvider, Player player) {
    return gameProvider.currentPlayer?.isCurrentTurn == true &&
           player.id != gameProvider.currentPlayer?.id &&
           !player.isLocked;
  }

  void _selectPlayer(String playerId) {
    setState(() {
      _selectedPlayerId = _selectedPlayerId == playerId ? null : playerId;
    });
  }

  Future<void> _makeGuess(GameProvider gameProvider) async {
    if (_selectedPlayerId == null) return;
    
    try {
      await gameProvider.makeGuess(_selectedPlayerId!);
      setState(() {
        _selectedPlayerId = null;
      });
    } catch (e) {
      Fluttertoast.showToast(
        msg: 'Failed to make guess: $e',
        backgroundColor: Colors.red,
      );
    }
  }

  Widget _buildGuessResultOverlay(Map<String, dynamic> result) {
    return Container(
      color: Colors.black54,
      child: Center(
        child: Card(
          margin: const EdgeInsets.all(32),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  result['correct'] ? Icons.check_circle : Icons.cancel,
                  size: 64,
                  color: result['correct'] ? Colors.green : Colors.red,
                ),
                const SizedBox(height: 16),
                Text(
                  result['message'],
                  style: Theme.of(context).textTheme.titleLarge,
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInterruptionModal(GameProvider gameProvider) {
    return Container(
      color: Colors.black54,
      child: Center(
        child: Card(
          margin: const EdgeInsets.all(32),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.warning,
                  size: 64,
                  color: Colors.orange,
                ),
                const SizedBox(height: 16),
                Text(
                  'Game Interrupted',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 8),
                Text(
                  gameProvider.interruptionReason,
                  style: Theme.of(context).textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                CustomButton(
                  text: 'Return to Home',
                  onPressed: () {
                    gameProvider.closeInterruptionModal();
                    context.go('/');
                  },
                  isPrimary: true,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}