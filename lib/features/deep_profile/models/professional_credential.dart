import 'package:equatable/equatable.dart';

/// 🔱 PROFESSIONAL CREDENTIAL
/// Represents a dynamic professional qualification chip.
class ProfessionalCredential extends Equatable {
  final String id;
  final String label;
  final String category; // Teaching, Engineering, Administrative, etc.

  const ProfessionalCredential({
    required this.id,
    required this.label,
    required this.category,
  });

  @override
  List<Object?> get props => [id, label, category];

  static const List<ProfessionalCredential> masterList = [
    ProfessionalCredential(id: 'bed', label: 'B.Ed', category: 'Teaching'),
    ProfessionalCredential(id: 'deled', label: 'D.El.Ed', category: 'Teaching'),
    ProfessionalCredential(id: 'bstc', label: 'BSTC', category: 'Teaching'),
    ProfessionalCredential(id: 'net', label: 'NET', category: 'Teaching'),
    ProfessionalCredential(id: 'set', label: 'SET', category: 'Teaching'),
    ProfessionalCredential(id: 'phd', label: 'PhD', category: 'Research'),
    ProfessionalCredential(id: 'llb', label: 'LLB', category: 'Law'),
    ProfessionalCredential(id: 'nursing', label: 'Nursing', category: 'Medical'),
    ProfessionalCredential(id: 'ca', label: 'CA', category: 'Accounts'),
    ProfessionalCredential(id: 'cs', label: 'CS', category: 'Corporate'),
    ProfessionalCredential(id: 'cma', label: 'CMA', category: 'Accounts'),
    ProfessionalCredential(id: 'gate', label: 'GATE', category: 'Engineering'),
    ProfessionalCredential(id: 'nclt', label: 'NCLT', category: 'Law'),
    ProfessionalCredential(id: 'apprent', label: 'Apprenticeship', category: 'Technical'),
    ProfessionalCredential(id: 'ncc', label: 'NCC', category: 'Defense'),
    ProfessionalCredential(id: 'sports', label: 'Sports Cert', category: 'General'),
    ProfessionalCredential(id: 'ex_serv', label: 'Ex-Serviceman', category: 'General'),
  ];
}
