import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/game_models.dart';
import '../services/game_service.dart';
import '../services/firebase_service.dart';
import '../utils/game_utils.dart';

class GameProvider with ChangeNotifier {
  final GameService _gameService = GameService();
  
  Game? _currentGame;
  Player? _currentPlayer;
  GameState _gameState = GameState.waiting;
  String? _gameId;
  StreamSubscription? _gameSubscription;
  Map<String, dynamic>? _lastGuessResult;
  bool _showInterruptionModal = false;
  String _interruptionReason = '';

  Game? get currentGame => _currentGame;
  Player? get currentPlayer => _currentPlayer;
  GameState get gameState => _gameState;
  String? get gameId => _gameId;
  List<Player> get players => _currentGame?.players ?? [];
  bool get isHost => _currentPlayer?.isHost ?? false;
  Map<String, dynamic>? get lastGuessResult => _lastGuessResult;
  bool get showInterruptionModal => _showInterruptionModal;
  String get interruptionReason => _interruptionReason;

  Future<String> createGame(String playerName) async {
    try {
      final user = FirebaseService.auth.currentUser;
      if (user == null) throw Exception('Must be signed in to create a game');

      final player = Player(
        id: GameUtils.generateId(8),
        name: playerName,
        isHost: true,
        isLocked: false,
        isCurrentTurn: false,
        userId: user.uid,
      );

      final gameId = await _gameService.createGame(player);
      _gameId = gameId;
      _currentPlayer = player;
      _gameState = GameState.lobby;
      
      _listenToGameUpdates(gameId);
      notifyListeners();
      
      return gameId;
    } catch (e) {
      throw Exception('Failed to create game: $e');
    }
  }

  Future<bool> joinGame(String gameId, String playerName) async {
    try {
      final user = FirebaseService.auth.currentUser;
      if (user == null) throw Exception('Must be signed in to join a game');

      final player = Player(
        id: GameUtils.generateId(8),
        name: playerName,
        isHost: false,
        isLocked: false,
        isCurrentTurn: false,
        userId: user.uid,
      );

      final success = await _gameService.joinGame(gameId, player);
      
      if (success) {
        _gameId = gameId;
        _currentPlayer = player;
        _listenToGameUpdates(gameId);
        notifyListeners();
      }
      
      return success;
    } catch (e) {
      print('Error joining game: $e');
      return false;
    }
  }

  Future<void> startGame() async {
    if (_gameId == null || !isHost) return;

    try {
      await _gameService.startGame(_gameId!);
    } catch (e) {
      throw Exception('Failed to start game: $e');
    }
  }

  Future<void> makeGuess(String targetPlayerId) async {
    if (_gameId == null || _currentPlayer == null) return;

    try {
      await _gameService.makeGuess(_gameId!, _currentPlayer!.id, targetPlayerId);
      
      // Set guess result for UI feedback
      final targetPlayer = players.firstWhere((p) => p.id == targetPlayerId);
      final nextRole = GameUtils.getNextRoleInChain(_currentPlayer!.role!);
      
      if (targetPlayer.role == nextRole) {
        _lastGuessResult = {
          'correct': true,
          'message': 'Correct! You found the ${GameUtils.getRoleInfo(nextRole!).name}!',
        };
      } else {
        _lastGuessResult = {
          'correct': false,
          'message': 'Wrong guess! Roles have been swapped.',
        };
      }
      
      notifyListeners();
      
      // Clear result after 3 seconds
      Timer(const Duration(seconds: 3), () {
        _lastGuessResult = null;
        notifyListeners();
      });
    } catch (e) {
      throw Exception('Failed to make guess: $e');
    }
  }

  Future<void> leaveGame() async {
    if (_gameId == null || _currentPlayer == null) return;

    try {
      await _gameService.leaveGame(_gameId!, _currentPlayer!.id);
      _cleanup();
    } catch (e) {
      print('Error leaving game: $e');
    }
  }

  Future<void> endGame() async {
    if (_gameId == null || !isHost) return;

    try {
      await _gameService.endGame(_gameId!);
    } catch (e) {
      throw Exception('Failed to end game: $e');
    }
  }

  void _listenToGameUpdates(String gameId) {
    _gameSubscription?.cancel();
    _gameSubscription = _gameService.gameStream(gameId).listen(
      (game) {
        if (game != null) {
          _currentGame = game;
          _gameState = game.state;
          
          // Update current player info
          final user = FirebaseService.auth.currentUser;
          if (user != null) {
            try {
              _currentPlayer = game.players.firstWhere(
                (p) => p.userId == user.uid,
              );
            } catch (e) {
              // Player not found in game
              _currentPlayer = null;
            }
          }
          
          // Handle game interruption
          if (game.state == GameState.interrupted) {
            _showInterruptionModal = true;
            _interruptionReason = game.interruptionReason ?? 'Game was interrupted';
          }
          
          notifyListeners();
        } else {
          // Game no longer exists
          if (_gameState != GameState.waiting) {
            _showInterruptionModal = true;
            _interruptionReason = 'Game session has ended';
            _cleanup();
          }
        }
      },
      onError: (error) {
        print('Game stream error: $error');
      },
    );
  }

  void closeInterruptionModal() {
    _showInterruptionModal = false;
    _cleanup();
    notifyListeners();
  }

  void _cleanup() {
    _gameSubscription?.cancel();
    _gameSubscription = null;
    _gameId = null;
    _currentGame = null;
    _currentPlayer = null;
    _gameState = GameState.waiting;
    _lastGuessResult = null;
    _showInterruptionModal = false;
    _interruptionReason = '';
  }

  @override
  void dispose() {
    _gameSubscription?.cancel();
    super.dispose();
  }
}