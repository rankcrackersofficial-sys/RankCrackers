import 'package:flutter/material.dart';

import 'rc_colors.dart';

class RcPagePad extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;

  const RcPagePad({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(24),
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding,
      child: child,
    );
  }
}

class RcPageTitle extends StatelessWidget {
  final String title;
  final String? subtitle;

  const RcPageTitle({
    super.key,
    required this.title,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            color: rcGold,
            fontSize: 24,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.2,
          ),
        ),
        if (subtitle != null && subtitle!.isNotEmpty) ...[
          const SizedBox(height: 6),
          Text(
            subtitle!,
            style: const TextStyle(
              color: rcMuted,
              fontSize: 12,
            ),
          ),
        ],
      ],
    );
  }
}

class RcCenteredLoader extends StatelessWidget {
  final bool compact;
  const RcCenteredLoader({super.key, this.compact = false});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SizedBox(
        width: compact ? 24 : 48,
        height: compact ? 24 : 48,
        child: const CircularProgressIndicator(strokeWidth: 2.5),
      ),
    );
  }
}

class RcDataStateMessage extends StatelessWidget {
  final String title;
  final String? message;
  final IconData icon;

  const RcDataStateMessage({
    super.key,
    required this.title,
    this.message,
    this.icon = Icons.info_outline_rounded,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: rcGold, size: 28),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(
                color: rcText,
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
            if (message != null && message!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                message!,
                style: const TextStyle(
                  color: rcMuted,
                  fontSize: 12,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
