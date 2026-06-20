import 'storage_adapter.dart';
import 'firebase_adapter.dart';

class BackendProvider {
  // 🔱 Central point to get the active storage adapter
  // Can be easily switched between Mock, Firebase, or other providers
  static StorageAdapter get adapter => FirebaseAdapter();
}
