import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../domain/revenue_plan.dart';

class UpiCheckoutScreen extends StatefulWidget {
  final RevenuePlan plan;
  const UpiCheckoutScreen({super.key, required this.plan});

  @override
  State<UpiCheckoutScreen> createState() => _UpiCheckoutScreenState();
}

enum _UpiMode { intent, qr, collect }

class _UpiCheckoutScreenState extends State<UpiCheckoutScreen> {
  final _couponController = TextEditingController();
  _UpiMode _mode = _UpiMode.intent;
  bool _loading = false;
  String? _error;
  String? _orderId;
  String? _upiIntent;
  int? _amountPaise;
  String? _couponSummary;

  @override
  void dispose() {
    _couponController.dispose();
    super.dispose();
  }

  Future<void> _createOrder() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await FirebaseFunctions.instance
          .httpsCallable('createUpiPaymentOrder')
          .call({
        'offerId': widget.plan.offerId,
        'couponCode': _couponController.text.trim(),
        'paymentMode': _mode.name,
      });
      final data = Map<String, dynamic>.from(result.data as Map);
      setState(() {
        _orderId = data['orderId'] as String?;
        _upiIntent = data['upiIntent'] as String?;
        _amountPaise = (data['amountPaise'] as num?)?.toInt();
        final coupon = data['coupon'];
        _couponSummary =
            coupon is Map ? 'Coupon applied: ${coupon['code']}' : null;
      });
      if (_mode == _UpiMode.intent && (_upiIntent?.isNotEmpty ?? false)) {
        await launchUrl(Uri.parse(_upiIntent!),
            mode: LaunchMode.externalApplication);
      }
    } catch (_) {
      setState(() => _error =
          'We could not create a secure payment order. Please try again.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _checkStatus() async {
    if (_orderId == null) return;
    setState(() => _loading = true);
    try {
      final result = await FirebaseFunctions.instance
          .httpsCallable('verifyUpiPaymentOrder')
          .call({'orderId': _orderId});
      final data = Map<String, dynamic>.from(result.data as Map);
      if (!mounted) return;
      final status = data['status']?.toString() ?? 'pending';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(status == 'paid'
              ? 'Payment verified. Elite access is active.'
              : 'Payment is still awaiting server verification.')));
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Verification could not be checked yet.')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final amount = _amountPaise == null
        ? widget.plan.price
        : '₹${(_amountPaise! / 100).toStringAsFixed(0)}';
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => context.pop()),
        title: Text('SECURE UPI CHECKOUT', style: AppTypography.label),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          children: [
            Text(widget.plan.title,
                style: AppTypography.hero.copyWith(fontSize: 24)),
            const SizedBox(height: 6),
            Text(
                'Payment remains pending until the backend verifies provider authorization.',
                style: AppTypography.body.copyWith(fontSize: 12)),
            const SizedBox(height: 18),
            _summaryCard(amount),
            const SizedBox(height: 16),
            Text('SELECT UPI OPTION', style: AppTypography.label),
            const SizedBox(height: 10),
            _methodTile(_UpiMode.intent, Icons.apps_rounded, 'Open any UPI app',
                'GPay, PhonePe, Paytm, BHIM and installed UPI apps'),
            _methodTile(_UpiMode.qr, Icons.qr_code_2_rounded, 'Scan UPI QR',
                'Use any UPI app camera or scanner'),
            _methodTile(
                _UpiMode.collect,
                Icons.notifications_active_outlined,
                'UPI collect request',
                'Approve the request inside your UPI app'),
            const SizedBox(height: 18),
            Text('COUPON CODE', style: AppTypography.label),
            const SizedBox(height: 8),
            TextField(
              controller: _couponController,
              textCapitalization: TextCapitalization.characters,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Enter founder-published code',
                hintStyle: TextStyle(color: AppColors.textSecondary),
                filled: true,
                fillColor: AppColors.surface,
                suffixIcon: IconButton(
                    icon:
                        const Icon(Icons.check_rounded, color: AppColors.gold),
                    onPressed: _createOrder),
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide.none),
              ),
            ),
            if (_couponSummary != null)
              Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(_couponSummary!,
                      style: AppTypography.body
                          .copyWith(color: Colors.greenAccent, fontSize: 12))),
            if (_error != null)
              Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Text(_error!,
                      style: AppTypography.body
                          .copyWith(color: Colors.redAccent, fontSize: 12))),
            const SizedBox(height: 18),
            if (_mode == _UpiMode.qr &&
                _upiIntent != null &&
                _upiIntent!.isNotEmpty)
              Center(
                  child: Container(
                      padding: const EdgeInsets.all(16),
                      color: Colors.white,
                      child: QrImageView(data: _upiIntent!, size: 220))),
            if (_mode == _UpiMode.collect)
              _infoCard(
                  'Collect requests are initiated only after a server-created order. Approve the notification in your selected UPI app, then return here to verify.'),
            const SizedBox(height: 16),
            SizedBox(
              height: 54,
              child: ElevatedButton(
                onPressed: _loading
                    ? null
                    : (_orderId == null ? _createOrder : _checkStatus),
                style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.tacticalGold,
                    foregroundColor: Colors.black,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(18))),
                child: Text(
                    _loading
                        ? 'PROCESSING…'
                        : (_orderId == null
                            ? 'CREATE SECURE UPI ORDER'
                            : 'CHECK PAYMENT STATUS'),
                    style: AppTypography.button),
              ),
            ),
            const SizedBox(height: 12),
            Center(
                child: TextButton(
                    onPressed: () =>
                        Clipboard.setData(ClipboardData(text: _orderId ?? '')),
                    child: Text(
                        _orderId == null
                            ? 'Your order ID will appear after order creation'
                            : 'Order ID: $_orderId',
                        style: AppTypography.body.copyWith(fontSize: 11)))),
          ],
        ),
      ),
    );
  }

  Widget _summaryCard(String amount) => Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.gold.withValues(alpha: .35))),
      child: Row(children: [
        const Icon(Icons.lock_rounded, color: AppColors.gold),
        const SizedBox(width: 12),
        Expanded(
            child: Text('Payable amount',
                style: AppTypography.body.copyWith(fontSize: 13))),
        Text(amount, style: AppTypography.hero.copyWith(fontSize: 22))
      ]));

  Widget _methodTile(
      _UpiMode mode, IconData icon, String title, String subtitle) {
    final active = _mode == mode;
    return GestureDetector(
        onTap: () => setState(() => _mode = mode),
        child: Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(15),
                border: Border.all(
                    color: active ? AppColors.gold : Colors.white12)),
            child: Row(children: [
              Icon(icon, color: active ? AppColors.gold : Colors.white70),
              const SizedBox(width: 12),
              Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                    Text(title,
                        style: AppTypography.cardTitle.copyWith(fontSize: 14)),
                    const SizedBox(height: 3),
                    Text(subtitle,
                        style: AppTypography.body.copyWith(fontSize: 11))
                  ])),
              Icon(
                  active
                      ? Icons.radio_button_checked
                      : Icons.radio_button_unchecked,
                  color: active ? AppColors.gold : Colors.white38)
            ])));
  }

  Widget _infoCard(String text) => Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
          color: AppColors.surface, borderRadius: BorderRadius.circular(14)),
      child: Text(text, style: AppTypography.body.copyWith(fontSize: 12)));
}
