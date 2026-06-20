import 'package:firebase_auth/firebase_auth.dart';

class FounderIdentity {
  static const founderUid = '6TdzjpBr6Zdx1ag3LbMmjJ0DY312';
  static const founderEmails = {
    'founder.rcofficial@gmail.com',
  };

  static bool isFounderUser(User? user) {
    if (user == null) return false;
    if (user.uid == founderUid) return true;
    if (founderEmails.contains(user.email)) return true;
    return false;
  }
}
