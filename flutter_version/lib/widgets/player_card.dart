import 'package:flutter/material.dart';
import '../models/game_models.dart';
import '../utils/game_utils.dart';

class PlayerCard extends StatelessWidget {
  final Player player;
  final bool isCurrentPlayer;
  final bool isSelected;
  final VoidCallback? onTap;

  const PlayerCard({
    super.key,
    required this.player,
    required this.isCurrentPlayer,
    this.isSelected = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final roleInfo = player.role != null ? GameUtils.getRoleInfo(player.role!) : null;
    
    return Card(
      color: isSelected
          ? Theme.of(context).colorScheme.secondary.withOpacity(0.2)
          : player.isCurrentTurn
              ? Colors.green.withOpacity(0.1)
              : null,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              // Avatar
              CircleAvatar(
                backgroundColor: player.isHost
                    ? Theme.of(context).colorScheme.secondary
                    : Theme.of(context).colorScheme.primary,
                child: Icon(
                  player.isHost ? Icons.crown : Icons.person,
                  color: Colors.white,
                ),
              ),
              
              const SizedBox(width: 12),
              
              // Player Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          player.name,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: isCurrentPlayer
                                ? Theme.of(context).colorScheme.secondary
                                : null,
                          ),
                        ),
                        if (isCurrentPlayer) ...[
                          const SizedBox(width: 4),
                          Text(
                            '(You)',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Theme.of(context).colorScheme.secondary,
                            ),
                          ),
                        ],
                        if (player.isLocked) ...[
                          const SizedBox(width: 8),
                          Icon(
                            Icons.lock,
                            size: 16,
                            color: Colors.blue,
                          ),
                        ],
                      ],
                    ),
                    
                    // Role Info
                    if ((isCurrentPlayer || player.isLocked) && roleInfo != null)
                      Row(
                        children: [
                          Text(
                            GameUtils.getRoleInfo(player.role!).icon,
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
                      )
                    else
                      Text(
                        player.isCurrentTurn ? 'Current Turn' : 'Role Hidden',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: player.isCurrentTurn
                              ? Colors.green
                              : Theme.of(context).colorScheme.outline,
                        ),
                      ),
                  ],
                ),
              ),
              
              // Selection Indicator
              if (isSelected)
                Icon(
                  Icons.check_circle,
                  color: Theme.of(context).colorScheme.secondary,
                ),
            ],
          ),
        ),
      ),
    );
  }
}