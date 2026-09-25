import 'package:flutter/material.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  final int daysRemaining;
  final bool showCountdown;

  const StatusBadge({
    super.key,
    required this.status,
    required this.daysRemaining,
    this.showCountdown = true,
  });

  @override
  Widget build(BuildContext context) {
    Color bgColor;
    Color textColor;
    String text;

    switch (status.toLowerCase()) {
      case 'today':
        bgColor = Colors.red.shade100;
        textColor = Colors.red.shade800;
        text = 'Expires Today';
        break;
      case 'due_soon':
        bgColor = Colors.amber.shade100;
        textColor = Colors.amber.shade900;
        text = showCountdown
            ? (daysRemaining == 1 ? '1 day left' : '$daysRemaining days left')
            : 'Due Soon';
        break;
      case 'expired':
        bgColor = Colors.red.shade50;
        textColor = Colors.red.shade700;
        text = showCountdown
            ? (daysRemaining == -1
                ? 'Expired 1 day ago'
                : 'Expired ${-daysRemaining}d ago')
            : 'Expired';
        break;
      case 'active':
      default:
        bgColor = const Color(0xFFDCFCE7);
        textColor = const Color(0xFF166534);
        text = showCountdown
            ? '$daysRemaining days left'
            : 'Active';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: textColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            text,
            style: TextStyle(
              color: textColor,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
