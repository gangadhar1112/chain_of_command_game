import 'package:flutter/material.dart';
import '../models/game_models.dart';
import '../utils/game_utils.dart';

class RoleChainWidget extends StatelessWidget {
  const RoleChainWidget({super.key});

  @override
  Widget build(BuildContext context) {
    final roles = [Role.raja, Role.rani, Role.mantri, Role.sipahi, Role.police, Role.chor];
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'The Royal Chain',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            
            // Mobile Layout (Vertical)
            if (MediaQuery.of(context).size.width < 600)
              Column(
                children: roles.asMap().entries.map((entry) {
                  final index = entry.key;
                  final role = entry.value;
                  final roleInfo = GameUtils.getRoleInfo(role);
                  
                  return Column(
                    children: [
                      _buildRoleItem(context, roleInfo),
                      if (index < roles.length - 1)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: Icon(
                            Icons.arrow_downward,
                            color: Theme.of(context).colorScheme.outline,
                          ),
                        ),
                    ],
                  );
                }).toList(),
              )
            
            // Desktop Layout (Horizontal)
            else
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: roles.asMap().entries.map((entry) {
                    final index = entry.key;
                    final role = entry.value;
                    final roleInfo = GameUtils.getRoleInfo(role);
                    
                    return Row(
                      children: [
                        _buildRoleItem(context, roleInfo),
                        if (index < roles.length - 1)
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                            child: Icon(
                              Icons.arrow_forward,
                              color: Theme.of(context).colorScheme.outline,
                            ),
                          ),
                      ],
                    );
                  }).toList(),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildRoleItem(BuildContext context, RoleInfo roleInfo) {
    return Container(
      width: MediaQuery.of(context).size.width < 600 ? double.infinity : 120,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: roleInfo.color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: roleInfo.color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Text(
            roleInfo.icon,
            style: const TextStyle(fontSize: 24),
          ),
          const SizedBox(height: 4),
          Text(
            roleInfo.name,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
              color: roleInfo.color,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 2),
          Text(
            '${roleInfo.points} pts',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}