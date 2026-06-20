enum SubscriptionTier {
  warrior, // Free
  elite,   // Paid
}

class UserProfile {
  final String uid;
  final String name;
  final String email;
  final SubscriptionTier tier;
  final String preferredLanguage;
  final List<String> targetExams;
  final String region; // State (Rajasthan, UP, etc.)
  final DateTime? eliteExpiry;

  const UserProfile({
    required this.uid,
    required this.name,
    required this.email,
    this.tier = SubscriptionTier.warrior,
    this.preferredLanguage = 'hindi',
    this.targetExams = const [],
    this.region = 'rajasthan',
    this.eliteExpiry,
  });

  bool get isElite {
    if (tier == SubscriptionTier.elite) {
      if (eliteExpiry == null) return true;
      return DateTime.now().isBefore(eliteExpiry!);
    }
    return false;
  }

  Map<String, dynamic> toMap() {
    return {
      'uid': uid,
      'name': name,
      'email': email,
      'tier': tier.name,
      'preferredLanguage': preferredLanguage,
      'targetExams': targetExams,
      'region': region,
      'eliteExpiry': eliteExpiry?.millisecondsSinceEpoch,
    };
  }

  factory UserProfile.fromMap(Map<String, dynamic> map) {
    return UserProfile(
      uid: map['uid'] ?? '',
      name: map['name'] ?? '',
      email: map['email'] ?? '',
      tier: SubscriptionTier.values.firstWhere(
        (e) => e.name == map['tier'],
        orElse: () => SubscriptionTier.warrior,
      ),
      preferredLanguage: map['preferredLanguage'] ?? 'hindi',
      targetExams: List<String>.from(map['targetExams'] ?? []),
      region: map['region'] ?? 'rajasthan',
      eliteExpiry: map['eliteExpiry'] != null 
          ? DateTime.fromMillisecondsSinceEpoch(map['eliteExpiry']) 
          : null,
    );
  }
}
