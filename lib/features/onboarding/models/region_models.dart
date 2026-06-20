class Country {
  final String id;
  final String titleEn;
  final String titleHi;

  const Country({required this.id, required this.titleEn, required this.titleHi});

  Map<String, dynamic> toMap() => {'id': id, 'titleEn': titleEn, 'titleHi': titleHi};
}

class StateRegion {
  final String id;
  final String countryId;
  final String titleEn;
  final String titleHi;

  const StateRegion({
    required this.id, 
    required this.countryId, 
    required this.titleEn, 
    required this.titleHi
  });

  Map<String, dynamic> toMap() => {
    'id': id, 
    'countryId': countryId, 
    'titleEn': titleEn, 
    'titleHi': titleHi
  };
}

class ExamEcosystem {
  final String id;
  final String stateId; // Can be 'central' for SSC/UPSC
  final String titleEn;
  final String titleHi;
  final String category; // Admin, Police, Teaching, etc.

  const ExamEcosystem({
    required this.id, 
    required this.stateId, 
    required this.titleEn, 
    required this.titleHi,
    required this.category
  });

  Map<String, dynamic> toMap() => {
    'id': id, 
    'stateId': stateId, 
    'titleEn': titleEn, 
    'titleHi': titleHi,
    'category': category
  };
}
