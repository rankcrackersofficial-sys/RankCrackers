// G2 Notification Routing Rule
class G2NotificationRoutingRule {
  static bool validateNotificationRoute(String route) {
    if (route.startsWith('/digibook')) return true;
    if (route.startsWith('/home')) return true;
    return false;
  }
}
