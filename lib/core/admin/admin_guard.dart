class AdminGuard {

  static const List<String>
      adminEmails = [

    'rankcrackersofficial@gmail.com',
  ];

  static bool isAdmin(
    String email,
  ) {

    return adminEmails
        .contains(email);
  }
}
