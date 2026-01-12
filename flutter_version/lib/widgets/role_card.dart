import 'package:flutter/material.dart';
import '../models/game_models.dart';
import '../utils/game_utils.dart';

class RoleCard extends StatelessWidget {
  final Role role;
  final bool isLocked;

  const RoleCard({
    super.key,
    required this.role,
    required this.isLocked,
  });

  @override
  Widget build(BuildContext context) {
    final roleInfo = GameUtils.getRoleInfo(role);
    
    return Card(
      color: roleInfo.color.withOpacity(0.1),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                // Role Icon
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: roleInfo.color.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    roleInfo.icon,
                    style: const TextStyle(fontSize: 24),
                  ),
                ),
                
                const SizedBox(width: 16),
                
                // Role Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            roleInfo.name,
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              color: roleInfo.color,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          if (isLocked) ...[
                            const SizedBox(width: 8),
                            Icon(
                              Icons.lock,
                              size: 20,
                              color: Colors.blue,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'Locked',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Colors.blue,
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        roleInfo.description,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 16),
            
            // Role Stats
            Row(
              children: [
                _buildStatChip(
                  context,
                  'Points',
                  '${roleInfo.points}',
                  Colors.amber,
                ),
                const SizedBox(width: 12),
                _buildStatChip(
                  context,
                  'Position',
                  '${roleInfo.chainOrder}${_getOrdinalSuffix(roleInfo.chainOrder)}',
                  Colors.blue,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatChip(BuildContext context, String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '$label: ',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
            ),
          ),
          Text(
            value,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  String _getOrdinalSuffix(int number) {
    if (number >= 11 && number <= 13) return 'th';
    switch (number % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }
}