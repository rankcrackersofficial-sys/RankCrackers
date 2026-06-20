class ExamSeedData {
  static const Map<String, List<Map<String, dynamic>>> exams = {
    'Rajasthan': [
      {
        'id': 'ras',
        'title': 'RPSC RAS',
        'titleHindi': 'आरपीएससी आरएएस',
        'subtitle': 'Administrative Command',
        'subtitleHindi': 'प्रशासनिक कमान',
        'keywords': ['ras', 'rpsc', 'civil service', 'rajasthan administrative service']
      },
      {
        'id': 'eo_ro',
        'title': 'EO RO',
        'titleHindi': 'ईओ आरओ',
        'subtitle': 'Executive Realm',
        'subtitleHindi': 'कार्यपालक प्रशासन',
        'keywords': ['eo', 'ro', 'executive officer', 'revenue officer', 'rpsc'],
        'variants': [
          {'title': 'EO', 'code': 'eo'},
          {'title': 'RO', 'code': 'ro'},
        ]
      },
      {
        'id': 'reet',
        'title': 'REET',
        'titleHindi': 'रीट',
        'subtitle': 'Teaching Realm',
        'subtitleHindi': 'शिक्षण क्षेत्र',
        'keywords': ['reet', 'teacher', 'third grade', 'teaching'],
        'variants': [
          {'title': 'Level 1', 'code': 'reet_l1'},
          {'title': 'Level 2', 'code': 'reet_l2'},
        ]
      },
      {
        'id': 'school_lecturer',
        'title': 'School Lecturer',
        'titleHindi': 'स्कूल व्याख्याता (1st Grade)',
        'subtitle': 'First Grade Teaching',
        'subtitleHindi': 'प्रथम श्रेणी शिक्षण',
        'keywords': ['1st grade', 'lecturer', 'school lecturer', 'teacher'],
        'variants': [
          {'title': 'Hindi', 'code': 'school_lecturer_hindi'},
          {'title': 'English', 'code': 'school_lecturer_english'},
          {'title': 'History', 'code': 'school_lecturer_history'},
          {'title': 'Geography', 'code': 'school_lecturer_geography'},
          {'title': 'Political Science', 'code': 'school_lecturer_polity'},
          {'title': 'Physics', 'code': 'school_lecturer_physics'},
          {'title': 'Chemistry', 'code': 'school_lecturer_chemistry'},
          {'title': 'Biology', 'code': 'school_lecturer_biology'},
          {'title': 'Mathematics', 'code': 'school_lecturer_maths'},
        ]
      },
      {
        'id': '2nd_grade',
        'title': 'Second Grade Teacher',
        'titleHindi': 'द्वितीय श्रेणी शिक्षक (2nd Grade)',
        'subtitle': 'Secondary Teaching',
        'subtitleHindi': 'द्वितीय श्रेणी शिक्षण',
        'keywords': ['2nd grade', 'senior teacher', 'teacher'],
        'variants': [
          {'title': 'Hindi', 'code': 'sgt_hindi'},
          {'title': 'English', 'code': 'sgt_english'},
          {'title': 'Science', 'code': 'sgt_science'},
          {'title': 'Maths', 'code': 'sgt_maths'},
          {'title': 'Social Science', 'code': 'sgt_sst'},
          {'title': 'Sanskrit', 'code': 'sgt_sanskrit'},
        ]
      },
      {
        'id': 'police_constable',
        'title': 'Police Constable',
        'titleHindi': 'पुलिस कांस्टेबल',
        'subtitle': 'Defense & Discipline',
        'subtitleHindi': 'रक्षा और अनुशासन',
        'keywords': ['police', 'constable', 'raj police', 'defense']
      },
      {
        'id': 'patwar',
        'title': 'Patwar',
        'titleHindi': 'पटवार',
        'subtitle': 'Land Records Authority',
        'subtitleHindi': 'भू-अभिलेख प्राधिकरण',
        'keywords': ['patwar', 'revenue', 'patwari']
      },
      {
        'id': 'ldc',
        'title': 'LDC',
        'titleHindi': 'एलडीसी',
        'subtitle': 'Clerical Command',
        'subtitleHindi': 'लिपिकीय कमान',
        'keywords': ['ldc', 'clerk', 'rssb', 'clerical']
      },
    ],
    'Uttar Pradesh': [
      {
        'id': 'uppsc',
        'title': 'UPPSC',
        'titleHindi': 'यूपीपीएससी',
        'subtitle': 'State Civil Command',
        'subtitleHindi': 'राज्य सिविल कमान',
        'keywords': ['uppsc', 'pcs', 'civil service']
      },
      {
        'id': 'up_police',
        'title': 'UP Police',
        'titleHindi': 'यूपी पुलिस',
        'subtitle': 'Law & Order',
        'subtitleHindi': 'कानून और व्यवस्था',
        'keywords': ['police', 'up police', 'constable', 'si']
      },
      {
        'id': 'uptet',
        'title': 'UPTET',
        'titleHindi': 'यूपीटीईटी',
        'subtitle': 'Teaching Realm',
        'subtitleHindi': 'शिक्षण क्षेत्र',
        'keywords': ['uptet', 'teacher', 'teaching']
      },
      {
        'id': 'up_lekhpal',
        'title': 'UP Lekhpal',
        'titleHindi': 'यूपी लेखपाल',
        'subtitle': 'Administrative Service',
        'subtitleHindi': 'प्रशासनिक सेवा',
        'keywords': ['lekhpal', 'revenue']
      },
      {
        'id': 'ro_aro',
        'title': 'RO ARO',
        'titleHindi': 'आरओ एआरओ',
        'subtitle': 'Review Officer Realm',
        'subtitleHindi': 'समीक्षा अधिकारी क्षेत्र',
        'keywords': ['ro', 'aro', 'review officer']
      },
    ],
    'Central': [
      {
        'id': 'upsc',
        'title': 'UPSC',
        'titleHindi': 'यूपीएससी',
        'subtitle': 'National Civil Command',
        'subtitleHindi': 'राष्ट्रीय सिविल कमान',
        'keywords': ['upsc', 'ias', 'ips', 'civil services']
      },
      {
        'id': 'ssc_cgl',
        'title': 'SSC CGL',
        'titleHindi': 'एसएससी सीजीएल',
        'subtitle': 'Central Administration',
        'subtitleHindi': 'केंद्रीय प्रशासन',
        'keywords': ['ssc', 'cgl', 'combined graduate level']
      },
      {
        'id': 'ssc_chsl',
        'title': 'SSC CHSL',
        'titleHindi': 'एसएससी सीएचएसएल',
        'subtitle': 'Clerical Excellence',
        'subtitleHindi': 'लिपिकीय उत्कृष्टता',
        'keywords': ['ssc', 'chsl', '10+2']
      },
      {
        'id': 'railway_ntpc',
        'title': 'Railway NTPC',
        'titleHindi': 'रेलवे एनटीपीसी',
        'subtitle': 'National Infrastructure',
        'subtitleHindi': 'राष्ट्रीय बुनियादी ढांचा',
        'keywords': ['railway', 'ntpc', 'rrb']
      },
      {
        'id': 'banking',
        'title': 'Banking (IBPS/SBI)',
        'titleHindi': 'बैंकिंग',
        'subtitle': 'Financial Systems',
        'subtitleHindi': 'वित्तीय प्रणाली',
        'keywords': ['bank', 'banking', 'ibps', 'sbi', 'po', 'clerk']
      },
    ],
    'Punjab': [
      {'id': 'punjab_police', 'title': 'Punjab Police', 'titleHindi': 'पंजाब पुलिस', 'subtitle': 'State Security', 'subtitleHindi': 'राज्य सुरक्षा', 'keywords': ['police', 'punjab']},
      {'id': 'psssb_clerk', 'title': 'PSSSB Clerk', 'titleHindi': 'पीएसएसएसबी क्लर्क', 'subtitle': 'Service Branch', 'subtitleHindi': 'सेवा शाखा', 'keywords': ['clerk', 'psssb']},
      {'id': 'pstet', 'title': 'PSTET', 'titleHindi': 'पीएसटीईटी', 'subtitle': 'Teaching Realm', 'subtitleHindi': 'शिक्षण क्षेत्र', 'keywords': ['pstet', 'teacher']},
    ],
    'Delhi': [
      {'id': 'dsssb', 'title': 'DSSSB', 'titleHindi': 'डीएसएसएसबी', 'subtitle': 'State Board Command', 'subtitleHindi': 'राज्य बोर्ड कमान', 'keywords': ['dsssb', 'delhi']},
      {'id': 'delhi_police', 'title': 'Delhi Police', 'titleHindi': 'दिल्ली पुलिस', 'subtitle': 'National Capital Defense', 'subtitleHindi': 'राष्ट्रीय राजधानी रक्षा', 'keywords': ['police', 'delhi']},
    ],
    'Bihar': [
      {'id': 'bpsc', 'title': 'BPSC', 'titleHindi': 'बीपीएससी', 'subtitle': 'State Civil Service', 'subtitleHindi': 'राज्य सिविल सेवा', 'keywords': ['bpsc', 'bihar']},
      {'id': 'bihar_police', 'title': 'Bihar Police', 'titleHindi': 'बिहार पुलिस', 'subtitle': 'Law Enforcement', 'subtitleHindi': 'कानून प्रवर्तन', 'keywords': ['police', 'bihar']},
      {'id': 'btet', 'title': 'BTET', 'titleHindi': 'बीटीईटी', 'subtitle': 'Education Sector', 'subtitleHindi': 'शिक्षा क्षेत्र', 'keywords': ['btet', 'teacher']},
    ],
    'Madhya Pradesh': [
      {'id': 'mppsc', 'title': 'MPPSC', 'titleHindi': 'एमपीपीएससी', 'subtitle': 'State Civil Service', 'subtitleHindi': 'राज्य सिविल सेवा', 'keywords': ['mppsc', 'mp']},
      {'id': 'mp_police', 'title': 'MP Police', 'titleHindi': 'एमपी पुलिस', 'subtitle': 'Security Realm', 'subtitleHindi': 'सुरक्षा क्षेत्र', 'keywords': ['police', 'mp']},
      {'id': 'mp_tet', 'title': 'MP TET', 'titleHindi': 'एमपी टीईटी', 'subtitle': 'Teaching Standards', 'subtitleHindi': 'शिक्षण मानक', 'keywords': ['mptet', 'teacher']},
    ],
    'Gujarat': [
      {'id': 'gpsc', 'title': 'GPSC', 'titleHindi': 'जीपीएससी', 'subtitle': 'State Service Command', 'subtitleHindi': 'राज्य सेवा कमान', 'keywords': ['gpsc', 'gujarat']},
      {'id': 'gujarat_police', 'title': 'Gujarat Police', 'titleHindi': 'गुजरात पुलिस', 'subtitle': 'Defense Authority', 'subtitleHindi': 'रक्षा प्राधिकरण', 'keywords': ['police', 'gujarat']},
    ],
    'Haryana': [
      {'id': 'hssc_cet', 'title': 'HSSC CET', 'titleHindi': 'एचएसएससी सीईटी', 'subtitle': 'Common Entry Tier', 'subtitleHindi': 'सामान्य प्रवेश स्तर', 'keywords': ['hssc', 'cet', 'haryana']},
      {'id': 'haryana_police', 'title': 'Haryana Police', 'titleHindi': 'हरियाणा पुलिस', 'subtitle': 'State Defense', 'subtitleHindi': 'राज्य रक्षा', 'keywords': ['police', 'haryana']},
      {'id': 'htet', 'title': 'HTET', 'titleHindi': 'एचटीईटी', 'subtitle': 'Teaching Realm', 'subtitleHindi': 'शिक्षण क्षेत्र', 'keywords': ['htet', 'teacher']},
    ],
  };
}
