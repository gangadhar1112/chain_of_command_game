import 'dart:async';
import 'dart:math';
import 'package:firebase_database/firebase_database.dart';
import '../models/game_models.dart';
import 'firebase_service.dart';

class GameService {
  final DatabaseReference _database = FirebaseService.database.ref();

  Stream<Game?> gameStream(String gameId) {
    return _database.child('games/$gameId').onValue.map((event) {
      if (event.snapshot.value != null) {
        try {
          final data = Map<String, dynamic>.from(event.snapshot.value as Map);
          return Game.fromJson(data);
        } catch (e) {
          print('Error parsing game data: $e');
          return null;
        }
      }
      return null;
    });
  }

  Future<String> createGame(Player hostPlayer) async {
    final gameId = _generateGameId();
    final game = Game(
      id: gameId,
      players: [hostPlayer],
      state: GameState.lobby,
      createdAt: DateTime.now(),
      hostId: hostPlayer.userId,
    );

    await _database.child('games/$gameId').set(game.toJson());
    return gameId;
  }

  Future<bool> joinGame(String gameId, Player player) async {
    try {
      final gameRef = _database.child('games/$gameId');
      final snapshot = await gameRef.get();
      
      if (!snapshot.exists) {
        throw Exception('Game not found');
      }

      final gameData = Map<String, dynamic>.from(snapshot.value as Map);
      final game = Game.fromJson(gameData);
      
      if (game.state != GameState.lobby) {
        throw Exception('Game has already started');
      }

      if (game.players.length >= 6) {
        throw Exception('Game is full');
      }

      // Check if user is already in the game
      final existingPlayer = game.players.where((p) => p.userId == player.userId);
      if (existingPlayer.isNotEmpty) {
        return true; // Already in game
      }

      final updatedPlayers = [...game.players, player];
      await gameRef.child('players').set(
        updatedPlayers.map((p) => p.toJson()).toList(),
      );
      
      await gameRef.child('lastUpdated').set(DateTime.now().millisecondsSinceEpoch);
      
      return true;
    } catch (e) {
      print('Error joining game: $e');
      return false;
    }
  }

  Future<void> startGame(String gameId) async {
    final gameRef = _database.child('games/$gameId');
    final snapshot = await gameRef.get();
    
    if (!snapshot.exists) {
      throw Exception('Game not found');
    }

    final gameData = Map<String, dynamic>.from(snapshot.value as Map);
    final game = Game.fromJson(gameData);

    if (game.players.length < 3) {
      throw Exception('Need at least 3 players to start the game');
    }

    // Assign roles
    final roles = [Role.raja, Role.rani, Role.mantri, Role.sipahi, Role.police, Role.chor];
    final shuffledRoles = List<Role>.from(roles)..shuffle();
    
    final playersWithRoles = game.players.asMap().entries.map((entry) {
      final index = entry.key;
      final player = entry.value;
      final role = index < shuffledRoles.length ? shuffledRoles[index] : null;
      
      return player.copyWith(
        role: role,
        isCurrentTurn: role == Role.raja,
      );
    }).toList();

    await gameRef.update({
      'state': GameState.playing.name,
      'players': playersWithRoles.map((p) => p.toJson()).toList(),
      'startedAt': DateTime.now().millisecondsSinceEpoch,
    });
  }

  Future<void> makeGuess(String gameId, String currentPlayerId, String targetPlayerId) async {
    final gameRef = _database.child('games/$gameId');
    final snapshot = await gameRef.get();
    
    if (!snapshot.exists) {
      throw Exception('Game not found');
    }

    final gameData = Map<String, dynamic>.from(snapshot.value as Map);
    final game = Game.fromJson(gameData);

    final currentPlayer = game.players.firstWhere((p) => p.id == currentPlayerId);
    final targetPlayer = game.players.firstWhere((p) => p.id == targetPlayerId);

    if (!currentPlayer.isCurrentTurn || targetPlayer.isLocked) {
      throw Exception('Invalid guess');
    }

    final nextRole = _getNextRoleInChain(currentPlayer.role!);
    
    List<Player> updatedPlayers;
    
    if (targetPlayer.role == nextRole) {
      // Correct guess - lock both players
      updatedPlayers = game.players.map((p) {
        if (p.id == currentPlayer.id) {
          return p.copyWith(isLocked: true, isCurrentTurn: false);
        }
        if (p.id == targetPlayer.id) {
          return p.copyWith(isCurrentTurn: true);
        }
        return p.copyWith(isCurrentTurn: false);
      }).toList();
    } else {
      // Wrong guess - swap roles
      updatedPlayers = game.players.map((p) {
        if (p.id == currentPlayer.id) {
          return p.copyWith(role: targetPlayer.role, isCurrentTurn: false);
        }
        if (p.id == targetPlayer.id) {
          return p.copyWith(role: currentPlayer.role, isCurrentTurn: true);
        }
        return p.copyWith(isCurrentTurn: false);
      }).toList();
    }

    // Check if game is completed
    final unlockedPlayers = updatedPlayers.where((p) => !p.isLocked && p.role != Role.chor).toList();
    final newState = unlockedPlayers.isEmpty ? GameState.completed : GameState.playing;

    await gameRef.update({
      'players': updatedPlayers.map((p) => p.toJson()).toList(),
      'state': newState.name,
      if (newState == GameState.completed) 'endedAt': DateTime.now().millisecondsSinceEpoch,
    });
  }

  Future<void> leaveGame(String gameId, String playerId) async {
    final gameRef = _database.child('games/$gameId');
    final snapshot = await gameRef.get();
    
    if (!snapshot.exists) return;

    final gameData = Map<String, dynamic>.from(snapshot.value as Map);
    final game = Game.fromJson(gameData);

    final leavingPlayer = game.players.firstWhere((p) => p.id == playerId);
    final remainingPlayers = game.players.where((p) => p.id != playerId).toList();

    if (remainingPlayers.isEmpty) {
      // Delete game if no players left
      await gameRef.remove();
      return;
    }

    // If game is in progress, mark as interrupted
    if (game.state == GameState.playing) {
      await gameRef.update({
        'state': GameState.interrupted.name,
        'interruptionReason': '${leavingPlayer.name} has left the game',
        'players': remainingPlayers.map((p) => p.toJson()).toList(),
      });
    } else {
      // If host leaves, transfer host to another player
      if (leavingPlayer.isHost && remainingPlayers.isNotEmpty) {
        final newHost = remainingPlayers.first.copyWith(isHost: true);
        final updatedPlayers = [newHost, ...remainingPlayers.skip(1)];
        
        await gameRef.update({
          'players': updatedPlayers.map((p) => p.toJson()).toList(),
          'hostId': newHost.userId,
        });
      } else {
        await gameRef.child('players').set(
          remainingPlayers.map((p) => p.toJson()).toList(),
        );
      }
    }
  }

  Future<void> endGame(String gameId) async {
    await _database.child('games/$gameId').update({
      'state': GameState.completed.name,
      'endedAt': DateTime.now().millisecondsSinceEpoch,
    });
  }

  Role? _getNextRoleInChain(Role currentRole) {
    const roleOrder = [Role.raja, Role.rani, Role.mantri, Role.sipahi, Role.police, Role.chor];
    final currentIndex = roleOrder.indexOf(currentRole);
    return currentIndex < roleOrder.length - 1 ? roleOrder[currentIndex + 1] : null;
  }

  String _generateGameId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    final random = Random();
    return List.generate(6, (index) => chars[random.nextInt(chars.length)]).join();
  }
}