import 'package:firebase_auth/firebase_auth.dart';

class FounderIdentity {
  static const founderUid = 'CswjiDlFjrcdHyyEjQ8oGIPYv1h1';
  static const founderEmails = {
    'rankcrackersofficial@gmail.com',
  };

  static bool isFounderUser(User? user) {
    if (user == null) return false;
    if (user.uid == founderUid) return true;
    if (founderEmails.contains(user.email)) return true;
    return false;
  }
}
