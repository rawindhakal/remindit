import 'reminder_model.dart';

class DashboardCounts {
  final int active;
  final int dueSoon;
  final int today;
  final int expired;

  DashboardCounts({
    required this.active,
    required this.dueSoon,
    required this.today,
    required this.expired,
  });

  factory DashboardCounts.fromJson(Map<String, dynamic> json) {
    return DashboardCounts(
      active: json['active'] ?? 0,
      dueSoon: json['due_soon'] ?? json['dueSoon'] ?? 0,
      today: json['today'] ?? 0,
      expired: json['expired'] ?? 0,
    );
  }
}

class DashboardData {
  final DashboardCounts counts;
  final List<ReminderModel> upcoming;
  final List<ReminderModel> needsAttention;
  final int total;

  DashboardData({
    required this.counts,
    required this.upcoming,
    required this.needsAttention,
    required this.total,
  });

  factory DashboardData.fromJson(Map<String, dynamic> json) {
    List<ReminderModel> upcomingList = [];
    if (json['upcoming'] is List) {
      upcomingList = (json['upcoming'] as List)
          .whereType<Map<String, dynamic>>()
          .map((r) => ReminderModel.fromJson(r))
          .toList();
    }

    List<ReminderModel> attentionList = [];
    if (json['needsAttention'] is List) {
      attentionList = (json['needsAttention'] as List)
          .whereType<Map<String, dynamic>>()
          .map((r) => ReminderModel.fromJson(r))
          .toList();
    }

    return DashboardData(
      counts: DashboardCounts.fromJson(json['counts'] ?? {}),
      upcoming: upcomingList,
      needsAttention: attentionList,
      total: json['total'] ?? 0,
    );
  }
}
