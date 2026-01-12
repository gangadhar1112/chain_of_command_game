import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../../providers/game_provider.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';

class JoinGameScreen extends StatefulWidget {
  const JoinGameScreen({super.key});

  @override
  State<JoinGameScreen> createState() => _JoinGameScreenState();
}

class _JoinGameScreenState extends State<JoinGameScreen> {
  final _formKey = GlobalKey<FormState>();
  final _gameIdController = TextEditingController();
  final _nameController = TextEditingController();
  bool _isJoining = false;

  @override
  void dispose() {
    _gameIdController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _joinGame() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = context.read<AuthProvider>();
    if (!authProvider.isAuthenticated) {
      Fluttertoast.showToast(
        msg: 'You must be signed in to join a game',
        backgroundColor: Colors.red,
      );
      context.go('/signin');
      return;
    }

    setState(() {
      _isJoining = true;
    });

    try {
      final success = await context.read<GameProvider>().joinGame(
        _gameIdController.text.trim().toUpperCase(),
        _nameController.text.trim(),
      );
      
      if (mounted) {
        if (success) {
          Fluttertoast.showToast(msg: 'Successfully joined the game!');
          context.go('/game/${_gameIdController.text.trim().toUpperCase()}');
        } else {
          Fluttertoast.showToast(
            msg: 'Failed to join game. Please check the game code.',
            backgroundColor: Colors.red,
          );
        }
      }
    } catch (e) {
      if (mounted) {
        Fluttertoast.showToast(
          msg: 'Error joining game: $e',
          backgroundColor: Colors.red,
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isJoining = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Join Game'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/'),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              const SizedBox(height: 32),
              
              // Header Card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      Icon(
                        Icons.group_add,
                        size: 64,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Join Game',
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Enter the game code and your name to join an existing game',
                        style: Theme.of(context).textTheme.bodyMedium,
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
              
              const SizedBox(height: 32),
              
              // Name Field
              CustomTextField(
                controller: _nameController,
                label: 'Your Name',
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your name';
                  }
                  if (value.length > 20) {
                    return 'Name must be 20 characters or less';
                  }
                  return null;
                },
              ),
              
              const SizedBox(height: 16),
              
              // Game Code Field
              CustomTextField(
                controller: _gameIdController,
                label: 'Game Code',
                textCapitalization: TextCapitalization.characters,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter the game code';
                  }
                  if (value.length != 6) {
                    return 'Game code must be 6 characters';
                  }
                  return null;
                },
                onChanged: (value) {
                  // Auto-format to uppercase
                  final upperValue = value.toUpperCase();
                  if (upperValue != value) {
                    _gameIdController.value = _gameIdController.value.copyWith(
                      text: upperValue,
                      selection: TextSelection.collapsed(offset: upperValue.length),
                    );
                  }
                },
              ),
              
              const SizedBox(height: 32),
              
              // Join Button
              SizedBox(
                width: double.infinity,
                child: CustomButton(
                  text: _isJoining ? 'Joining Game...' : 'Join Game',
                  onPressed: _isJoining ? null : _joinGame,
                  isPrimary: true,
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Info Card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Need a game code?',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Ask the game host for the 6-character game code. The host can find it in their game lobby.',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}