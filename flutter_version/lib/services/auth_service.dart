import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_database/firebase_database.dart';
import 'firebase_service.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseService.auth;
  final DatabaseReference _database = FirebaseService.database.ref();

  Stream<User?> get authStateChanges => _auth.authStateChanges();

  User? get currentUser => _auth.currentUser;

  Future<UserCredential> signInWithEmailAndPassword(
    String email,
    String password,
  ) async {
    try {
      final credential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      // Update user data in database
      if (credential.user != null) {
        await _updateUserInDatabase(credential.user!);
      }
      
      return credential;
    } catch (e) {
      throw _handleAuthException(e);
    }
  }

  Future<UserCredential> createUserWithEmailAndPassword(
    String email,
    String password,
    String name,
  ) async {
    try {
      final credential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      // Update profile with name
      await credential.user?.updateDisplayName(name);
      
      // Save user data to database
      if (credential.user != null) {
        await _saveUserToDatabase(credential.user!, name);
      }
      
      return credential;
    } catch (e) {
      throw _handleAuthException(e);
    }
  }

  Future<void> signOut() async {
    await _auth.signOut();
  }

  Future<void> sendPasswordResetEmail(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email);
    } catch (e) {
      throw _handleAuthException(e);
    }
  }

  Future<void> deleteAccount() async {
    final user = _auth.currentUser;
    if (user != null) {
      // Delete user data from database
      await _database.child('users/${user.uid}').remove();
      
      // Delete user account
      await user.delete();
    }
  }

  Future<void> updateUserProfile({String? name, String? photoURL}) async {
    final user = _auth.currentUser;
    if (user != null) {
      if (name != null) {
        await user.updateDisplayName(name);
      }
      if (photoURL != null) {
        await user.updatePhotoURL(photoURL);
      }
      
      // Update in database
      await _database.child('users/${user.uid}').update({
        if (name != null) 'name': name,
        if (photoURL != null) 'photoURL': photoURL,
        'updatedAt': DateTime.now().millisecondsSinceEpoch,
      });
    }
  }

  Future<void> _saveUserToDatabase(User user, String name) async {
    await _database.child('users/${user.uid}').set({
      'email': user.email,
      'name': name,
      'photoURL': user.photoURL,
      'createdAt': DateTime.now().millisecondsSinceEpoch,
      'updatedAt': DateTime.now().millisecondsSinceEpoch,
    });
  }

  Future<void> _updateUserInDatabase(User user) async {
    final userRef = _database.child('users/${user.uid}');
    final snapshot = await userRef.get();
    
    if (snapshot.exists) {
      await userRef.update({
        'updatedAt': DateTime.now().millisecondsSinceEpoch,
      });
    } else {
      // Create user data if doesn't exist
      await _saveUserToDatabase(user, user.displayName ?? '');
    }
  }

  String _handleAuthException(dynamic e) {
    if (e is FirebaseAuthException) {
      switch (e.code) {
        case 'invalid-credential':
        case 'wrong-password':
        case 'user-not-found':
          return 'Invalid email or password';
        case 'email-already-in-use':
          return 'An account with this email already exists';
        case 'weak-password':
          return 'Password is too weak';
        case 'invalid-email':
          return 'Invalid email address';
        case 'too-many-requests':
          return 'Too many failed attempts. Please try again later';
        default:
          return 'Authentication failed: ${e.message}';
      }
    }
    return 'An unexpected error occurred';
  }
}