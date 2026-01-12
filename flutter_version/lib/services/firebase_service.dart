import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:firebase_storage/firebase_storage.dart';

class FirebaseService {
  static FirebaseAuth get auth => FirebaseAuth.instance;
  static FirebaseDatabase get database => FirebaseDatabase.instance;
  static FirebaseStorage get storage => FirebaseStorage.instance;
}