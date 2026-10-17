class AdminGuard {

  static const List<String>
      adminEmails = [

    'founder.rcofficial@gmail.com',
  ];

  static bool isAdmin(
    String email,
  ) {

    return adminEmails
        .contains(email);
  }
}
