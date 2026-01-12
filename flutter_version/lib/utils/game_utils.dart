import 'dart:math';
import 'package:flutter/material.dart';
import '../models/game_models.dart';

class GameUtils {
  static String generateId(int length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    final random = Random();
    return List.generate(length, (index) => chars[random.nextInt(chars.length)]).join();
  }

  static List<T> shuffleArray<T>(List<T> array) {
    final newArray = List<T>.from(array);
    newArray.shuffle();
    return newArray;
  }

  static RoleInfo getRoleInfo(Role role) {
    switch (role) {
      case Role.raja:
        return const RoleInfo(
          name: 'Raja',
          icon: '👑',
          color: Colors.amber,
          description: 'The King of the kingdom',
          points: 100,
          chainOrder: 1,
        );
      case Role.rani:
        return const RoleInfo(
          name: 'Rani',
          icon: '💖',
          color: Colors.pink,
          description: 'The Queen of the kingdom',
          points: 80,
          chainOrder: 2,
        );
      case Role.mantri:
        return const RoleInfo(
          name: 'Mantri',
          icon: '📜',
          color: Colors.blue,
          description: 'The Minister of the kingdom',
          points: 50,
          chainOrder: 3,
        );
      case Role.sipahi:
        return const RoleInfo(
          name: 'Sipahi',
          icon: '🛡️',
          color: Colors.green,
          description: 'The Guard of the kingdom',
          points: 25,
          chainOrder: 4,
        );
      case Role.police:
        return const RoleInfo(
          name: 'Police',
          icon: '🚨',
          color: Colors.indigo,
          description: 'The Law enforcer of the kingdom',
          points: 15,
          chainOrder: 5,
        );
      case Role.chor:
        return const RoleInfo(
          name: 'Chor',
          icon: '👣',
          color: Colors.red,
          description: 'The Thief who must avoid capture',
          points: 0,
          chainOrder: 6,
        );
    }
  }

  static Role? getNextRoleInChain(Role currentRole) {
    const roleOrder = [Role.raja, Role.rani, Role.mantri, Role.sipahi, Role.police, Role.chor];
    final currentIndex = roleOrder.indexOf(currentRole);
    return currentIndex < roleOrder.length - 1 ? roleOrder[currentIndex + 1] : null;
  }

  static String formatTimeElapsed(DateTime timestamp) {
    final seconds = DateTime.now().difference(timestamp).inSeconds;
    
    if (seconds < 60) {
      return '${seconds}s';
    }
    
    final minutes = seconds ~/ 60;
    
    if (minutes < 60) {
      return '${minutes}m ${seconds % 60}s';
    }
    
    final hours = minutes ~/ 60;
    return '${hours}h ${minutes % 60}m';
  }

  static IconData getRoleIcon(Role role) {
    switch (role) {
      case Role.raja:
        return Icons.crown;
      case Role.rani:
        return Icons.favorite;
      case Role.mantri:
        return Icons.description;
      case Role.sipahi:
        return Icons.shield;
      case Role.police:
        return Icons.local_police;
      case Role.chor:
        return Icons.directions_run;
    }
  }
}