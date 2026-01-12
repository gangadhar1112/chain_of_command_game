import 'package:flutter/material.dart';
import '../models/game_models.dart';
import '../utils/game_utils.dart';
import 'custom_button.dart';

class GameResults extends StatelessWidget {
  final List<Player> players;
  final VoidCallback onLeaveGame;

  const GameResults({
    super.key,
    required this.players,
    required this.onLeaveGame,
  });

  @override
  Widget build(BuildContext context) {
    // Sort players by their role's points (highest first)
    final sortedPlayers = List<Player>.from(players)
      ..sort((a, b) {
        final roleA = a.role != null ? GameUtils.getRoleInfo(a.role!) : null;
        final roleB = b.role != null ? GameUtils.getRoleInfo(b.role!) : null;
        final pointsA = roleA?.points ?? 0;
        final pointsB = roleB?.points ?? 0;
        return pointsB.compareTo(pointsA);
      });

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Header
          Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Icon(
                    Icons.emoji_events,
                    size: 64,
                    color: Theme.of(context).colorScheme.secondary,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Game Completed!',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'The final positions have been revealed',
                    style: Theme.of(context).textTheme.bodyMedium,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Results
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.star,
                        color: Theme.of(context).colorScheme.secondary,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Final Rankings',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  ...sortedPlayers.asMap().entries.map((entry) {
                    final index = entry.key;
                    final player = entry.value;
                    final roleInfo = player.role != null ? GameUtils.getRoleInfo(player.role!) : null;
                    final isTopThree = index < 3;
                    
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: _getRankColor(index).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: _getRankColor(index).withOpacity(0.3),
                        ),
                      ),
                      child: Row(
                        children: [
                          // Rank Badge
                          Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: _getRankColor(index),
                              shape: BoxShape.circle,
                            ),
                            child: Center(
                              child: isTopThree
                                  ? Icon(
                                      index == 0 ? Icons.crown : Icons.emoji_events,
                                      color: Colors.white,
                                      size: 20,
                                    )
                                  : Text(
                                      '${index + 1}',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                            ),
                          ),
                          
                          const SizedBox(width: 16),
                          
                          // Player Info
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      player.name,
                                      style: Theme.of(context).textTheme.titleMedium,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      _getRankSuffix(index),
                                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                        color: Theme.of(context).colorScheme.outline,
                                      ),
                                    ),
                                    if (player.isHost) ...[
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 6,
                                          vertical: 2,
                                        ),
                                        decoration: BoxDecoration(
                                          color: Theme.of(context).colorScheme.primary.withOpacity(0.2),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          'Host',
                                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                            color: Theme.of(context).colorScheme.primary,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                                if (roleInfo != null)
                                  Row(
                                    children: [
                                      Text(
                                        roleInfo.icon,
                                        style: const TextStyle(fontSize: 16),
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        roleInfo.name,
                                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                          color: roleInfo.color,
                                        ),
                                      ),
                                    ],
                                  ),
                              ],
                            ),
                          ),
                          
                          // Points
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.secondary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Text(
                              '${roleInfo?.points ?? 0} pts',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: Theme.of(context).colorScheme.secondary,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Return Button
          SizedBox(
            width: double.infinity,
            child: CustomButton(
              text: 'Return to Home',
              onPressed: onLeaveGame,
              isPrimary: true,
              icon: Icons.home,
            ),
          ),
        ],
      ),
    );
  }

  Color _getRankColor(int index) {
    switch (index) {
      case 0: return Colors.amber; // Gold
      case 1: return Colors.grey; // Silver
      case 2: return Colors.orange; // Bronze
      default: return Colors.blue; // Default
    }
  }

  String _getRankSuffix(int index) {
    switch (index) {
      case 0: return '1st Place';
      case 1: return '2nd Place';
      case 2: return '3rd Place';
      default: return '${index + 1}th Place';
    }
  }
}