import 'package:flutter/material.dart';
import 'package:cloud_functions/cloud_functions.dart';

import '../../shared/rc_colors.dart';
import '../../shared/rc_panel.dart';

class RevenueSubscriptionControlWeb extends StatelessWidget {
  const RevenueSubscriptionControlWeb({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(28),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('REVENUE & SUBSCRIPTION CONTROL',
            style: TextStyle(
                color: rcGold,
                fontSize: 24,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.2)),
        const SizedBox(height: 6),
        const Text(
            'Govern the Elite offer without changing the student experience.',
            style: TextStyle(color: rcMuted, fontSize: 12)),
        const SizedBox(height: 22),
        Wrap(spacing: 12, runSpacing: 12, children: const [
          _StatusCard(
              label: 'OFFER CATALOG',
              value: '3 plans',
              status: 'READY',
              color: rcGreen),
          _StatusCard(
              label: 'ENTITLEMENT SYNC',
              value: 'Backend contract',
              status: 'PENDING',
              color: rcGold),
          _StatusCard(
              label: 'PAYMENT GATEWAY',
              value: 'Production keys',
              status: 'REQUIRED',
              color: rcRed),
        ]),
        const SizedBox(height: 22),
        RcPanel(
            child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
              Text('LIVE OFFER ARCHITECTURE',
                  style: TextStyle(
                      color: rcGold,
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1)),
              SizedBox(height: 16),
              _OfferRow(
                  title: 'Starter Pass',
                  price: '₹49 / 7 days',
                  purpose: 'Low-friction first purchase'),
              _OfferRow(
                  title: '90-Day Rank Mission',
                  price: '₹499 / 90 days',
                  purpose: 'Primary exam-cycle offer',
                  featured: true),
              _OfferRow(
                  title: 'Elite Annual',
                  price: '₹1,499 / year',
                  purpose: 'Retention and full-year access'),
            ])),
        const SizedBox(height: 16),
        RcPanel(
            backgroundColor: rcSurfaceAlt,
            child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Icon(Icons.gpp_maybe_outlined, color: rcGold, size: 24),
                  SizedBox(width: 12),
                  Expanded(
                      child: Text(
                          'Release gate: connect Google Play / Razorpay verification, write purchase events to the backend, and only then enable financial mutations. The UI is ready; this panel intentionally does not simulate a successful payment.',
                          style: TextStyle(
                              color: rcMuted, fontSize: 12, height: 1.45))),
                ])),
        const SizedBox(height: 16),
        RcPanel(
            child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
              Text('ACTIVATION CHECKLIST',
                  style: TextStyle(
                      color: rcGold,
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1)),
              SizedBox(height: 12),
              _ChecklistItem('Student offer screen and plan selection', true),
              _ChecklistItem('Purchase verification endpoint', false),
              _ChecklistItem('Entitlement expiry and renewal listener', false),
              _ChecklistItem('Refund / revoke handling', false),
              _ChecklistItem('Founder revenue audit trail', true),
            ])),
        const SizedBox(height: 16),
        const _CouponOperationsPanel(),
        const SizedBox(height: 16),
        const _OfferOperationsPanel(),
      ]),
    );
  }
}

class _CouponOperationsPanel extends StatefulWidget {
  const _CouponOperationsPanel();
  @override
  State<_CouponOperationsPanel> createState() => _CouponOperationsPanelState();
}

class _OfferOperationsPanel extends StatefulWidget {
  const _OfferOperationsPanel();
  @override
  State<_OfferOperationsPanel> createState() => _OfferOperationsPanelState();
}

class _OfferOperationsPanelState extends State<_OfferOperationsPanel> {
  final _id = TextEditingController(text: 'rank_mission_90d');
  final _title = TextEditingController(text: '90-Day Rank Mission');
  final _amount = TextEditingController(text: '499');
  final _days = TextEditingController(text: '90');
  String? _offerId;
  String? _message;
  bool _busy = false;

  Future<void> _syncCatalog() async {
    setState(() => _busy = true);
    try {
      final result = await FirebaseFunctions.instance
          .httpsCallable('ensureRevenueCatalog')
          .call();
      final data = Map<String, dynamic>.from(result.data as Map);
      final offers = (data['offers'] as List? ?? const [])
          .map((item) => Map<String, dynamic>.from(item as Map))
          .toList();
      setState(() => _message =
          'Catalog checked: ${offers.map((item) => '${item['offerId']}=${item['status']}').join(', ')}');
    } catch (_) {
      setState(() => _message = 'Catalog sync failed.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  void dispose() {
    _id.dispose();
    _title.dispose();
    _amount.dispose();
    _days.dispose();
    super.dispose();
  }

  Future<void> _generate() async {
    setState(() => _busy = true);
    try {
      final result = await FirebaseFunctions.instance
          .httpsCallable('createRevenueOffer')
          .call({
        'offerId': _id.text.trim(),
        'title': _title.text.trim(),
        'amountPaise': (int.tryParse(_amount.text) ?? 0) * 100,
        'durationDays': int.tryParse(_days.text) ?? 30
      });
      final data = Map<String, dynamic>.from(result.data as Map);
      setState(() {
        _offerId = data['offerId']?.toString();
        _message = 'Offer draft generated. Review before publishing.';
      });
    } catch (_) {
      setState(() => _message = 'Offer generation failed.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _publish() async {
    if (_offerId == null) return;
    setState(() => _busy = true);
    try {
      await FirebaseFunctions.instance
          .httpsCallable('publishRevenueOffer')
          .call({'offerId': _offerId});
      setState(() => _message = 'Offer published to the student catalog.');
    } catch (_) {
      setState(() => _message = 'Offer publication failed.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => RcPanel(
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('FOUNDER OFFER OPERATIONS',
            style: TextStyle(
                color: rcGold,
                fontSize: 12,
                fontWeight: FontWeight.w800,
                letterSpacing: 1)),
        const SizedBox(height: 8),
        const Text(
            'Create a versioned offer draft, publish it, then let checkout resolve only published offers.',
            style: TextStyle(color: rcMuted, fontSize: 12)),
        const SizedBox(height: 14),
        Wrap(spacing: 10, runSpacing: 10, children: [
          _field(_id, 'Offer ID', 150),
          _field(_title, 'Title', 180),
          _field(_amount, 'Price ₹', 90),
          _field(_days, 'Days', 70)
        ]),
        const SizedBox(height: 14),
        Row(children: [
          OutlinedButton(
              onPressed: _busy ? null : _syncCatalog,
              child: const Text('SYNC 3 PLAN CATALOG')),
          const SizedBox(width: 10),
          ElevatedButton(
              onPressed: _busy ? null : _generate,
              child: Text(_busy ? 'WORKING…' : 'GENERATE OFFER DRAFT')),
          const SizedBox(width: 10),
          OutlinedButton(
              onPressed: _busy || _offerId == null ? null : _publish,
              child: const Text('PUBLISH OFFER'))
        ]),
        if (_message != null)
          Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(_message!,
                  style: const TextStyle(color: rcGold, fontSize: 12))),
      ]));

  Widget _field(TextEditingController controller, String label, double width) =>
      SizedBox(
          width: width,
          child: TextField(
              controller: controller,
              style: const TextStyle(color: rcText, fontSize: 12),
              decoration: InputDecoration(
                  labelText: label,
                  labelStyle: const TextStyle(color: rcMuted, fontSize: 11),
                  enabledBorder: const UnderlineInputBorder(
                      borderSide: BorderSide(color: rcLine)),
                  focusedBorder: const UnderlineInputBorder(
                      borderSide: BorderSide(color: rcGold)))));
}

class _CouponOperationsPanelState extends State<_CouponOperationsPanel> {
  final _prefix = TextEditingController(text: 'RC');
  final _value = TextEditingController(text: '10');
  final _max = TextEditingController(text: '100');
  final _expiry = TextEditingController(text: '30');
  String? _couponId;
  String? _generatedCode;
  String? _message;
  bool _busy = false;

  @override
  void dispose() {
    _prefix.dispose();
    _value.dispose();
    _max.dispose();
    _expiry.dispose();
    super.dispose();
  }

  Future<void> _generate() async {
    setState(() => _busy = true);
    try {
      final result = await FirebaseFunctions.instance
          .httpsCallable('createRevenueCoupon')
          .call({
        'prefix': _prefix.text,
        'discountType': 'percent',
        'value': int.tryParse(_value.text) ?? 0,
        'maxRedemptions': int.tryParse(_max.text) ?? 0,
        'expiryDays': int.tryParse(_expiry.text) ?? 30
      });
      final data = Map<String, dynamic>.from(result.data as Map);
      setState(() {
        _couponId = data['couponId']?.toString();
        _generatedCode = data['code']?.toString();
        _message = 'Draft generated. Publish it only after review.';
      });
    } catch (_) {
      setState(() => _message = 'Coupon generation failed.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _publish() async {
    if (_couponId == null) return;
    setState(() => _busy = true);
    try {
      await FirebaseFunctions.instance
          .httpsCallable('publishRevenueCoupon')
          .call({'couponId': _couponId});
      setState(() => _message = 'Coupon published for student redemption.');
    } catch (_) {
      setState(() => _message = 'Coupon publication failed.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return RcPanel(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('FOUNDER COUPON OPERATIONS',
          style: TextStyle(
              color: rcGold,
              fontSize: 12,
              fontWeight: FontWeight.w800,
              letterSpacing: 1)),
      const SizedBox(height: 8),
      const Text(
          'Generate a server-owned draft, review the code, then publish it to the student checkout.',
          style: TextStyle(color: rcMuted, fontSize: 12)),
      const SizedBox(height: 14),
      Wrap(spacing: 10, runSpacing: 10, children: [
        _field(_prefix, 'Prefix', 100),
        _field(_value, 'Discount %', 110),
        _field(_max, 'Max uses', 100),
        _field(_expiry, 'Expiry days', 110)
      ]),
      const SizedBox(height: 14),
      Row(children: [
        ElevatedButton(
            onPressed: _busy ? null : _generate,
            child: Text(_busy ? 'WORKING…' : 'GENERATE DRAFT')),
        const SizedBox(width: 10),
        OutlinedButton(
            onPressed: _busy || _couponId == null ? null : _publish,
            child: const Text('PUBLISH COUPON'))
      ]),
      if (_generatedCode != null)
        Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text('Generated code: $_generatedCode',
                style: const TextStyle(
                    color: rcText, fontWeight: FontWeight.w700))),
      if (_message != null)
        Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(_message!,
                style: const TextStyle(color: rcGold, fontSize: 12))),
    ]));
  }

  Widget _field(TextEditingController controller, String label, double width) =>
      SizedBox(
          width: width,
          child: TextField(
              controller: controller,
              style: const TextStyle(color: rcText, fontSize: 12),
              decoration: InputDecoration(
                  labelText: label,
                  labelStyle: const TextStyle(color: rcMuted, fontSize: 11),
                  enabledBorder: const UnderlineInputBorder(
                      borderSide: BorderSide(color: rcLine)),
                  focusedBorder: const UnderlineInputBorder(
                      borderSide: BorderSide(color: rcGold)))));
}

class _StatusCard extends StatelessWidget {
  final String label, value, status;
  final Color color;
  const _StatusCard(
      {required this.label,
      required this.value,
      required this.status,
      required this.color});
  @override
  Widget build(BuildContext context) => SizedBox(
      width: 220,
      child: RcPanel(
          padding: const EdgeInsets.all(14),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label,
                style: const TextStyle(
                    color: rcMuted,
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                    letterSpacing: .8)),
            const SizedBox(height: 8),
            Text(value,
                style: const TextStyle(
                    color: rcText,
                    fontSize: 16,
                    fontWeight: FontWeight.w800)),
            const SizedBox(height: 5),
            Text(status,
                style: TextStyle(
                    color: color, fontSize: 10, fontWeight: FontWeight.w800))
          ])));
}

class _OfferRow extends StatelessWidget {
  final String title, price, purpose;
  final bool featured;
  const _OfferRow(
      {required this.title,
      required this.price,
      required this.purpose,
      this.featured = false});
  @override
  Widget build(BuildContext context) => Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: rcLine))),
      child: Row(children: [
        Icon(featured ? Icons.star_rounded : Icons.radio_button_unchecked,
            color: featured ? rcGold : rcMuted, size: 18),
        const SizedBox(width: 10),
        Expanded(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title,
              style: const TextStyle(
                  color: rcText,
                  fontSize: 13,
                  fontWeight: FontWeight.w700)),
          const SizedBox(height: 3),
          Text(purpose, style: const TextStyle(color: rcMuted, fontSize: 11))
        ])),
        Text(price,
            style: const TextStyle(
                color: rcGold, fontSize: 12, fontWeight: FontWeight.w800))
      ]));
}

class _ChecklistItem extends StatelessWidget {
  final String text;
  final bool done;
  const _ChecklistItem(this.text, this.done);
  @override
  Widget build(BuildContext context) => Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(children: [
        Icon(done ? Icons.check_circle : Icons.radio_button_unchecked,
            size: 17, color: done ? rcGreen : rcMuted),
        const SizedBox(width: 10),
        Text(text,
            style:
                TextStyle(color: done ? rcText : rcMuted, fontSize: 12))
      ]));
}
