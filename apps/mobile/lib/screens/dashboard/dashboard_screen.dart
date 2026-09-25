import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../models/dashboard_model.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/reminder_card.dart';
import '../reminders/reminder_detail_screen.dart';
import '../reminders/add_edit_reminder_screen.dart';

class DashboardScreen extends StatefulWidget {
  final Function(String status)? onNavigateToReminders;
  const DashboardScreen({super.key, this.onNavigateToReminders});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiService _api = ApiService();
  DashboardData? _dashboardData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDashboard();
  }

  Future<void> _loadDashboard() async {
    setState(() => _isLoading = true);
    final data = await _api.getDashboard();
    if (mounted) {
      setState(() {
        _dashboardData = data;
        _isLoading = false;
      });
    }
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  Widget _buildStatCard({
    required String label,
    required int count,
    required Color color,
    required Color bgColor,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: color.withValues(alpha: 0.2)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Icon(icon, color: color, size: 20),
                  Text(
                    count.toString(),
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey.shade800,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final userName = authProvider.currentUser?.name ?? 'there';
    final dateStr = DateFormat('EEEE, MMM d').format(DateTime.now());

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF2563EB),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.autorenew, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 8),
            const Text(
              'RenewIt',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 18,
                color: Color(0xFF0F172A),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Color(0xFF64748B)),
            onPressed: _loadDashboard,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadDashboard,
        color: const Color(0xFF2563EB),
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(color: Color(0xFF2563EB)),
              )
            : SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header Greeting Card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      color: Colors.white,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            dateStr.toUpperCase(),
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 1.1,
                              color: Colors.grey.shade500,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${_getGreeting()}, $userName 👋',
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _dashboardData?.counts.expired != null &&
                                    _dashboardData!.counts.expired > 0
                                ? 'You have ${_dashboardData!.counts.expired} expired item(s) requiring attention.'
                                : 'All your renewal schedules are up to date.',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Stats Grid Row 1 (Active & Due Soon)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Row(
                        children: [
                          _buildStatCard(
                            label: 'Active',
                            count: _dashboardData?.counts.active ?? 0,
                            color: const Color(0xFF16A34A),
                            bgColor: const Color(0xFFF0FDF4),
                            icon: Icons.check_circle_outline,
                            onTap: () => widget.onNavigateToReminders?.call('active'),
                          ),
                          const SizedBox(width: 12),
                          _buildStatCard(
                            label: 'Due Soon',
                            count: _dashboardData?.counts.dueSoon ?? 0,
                            color: const Color(0xFFD97706),
                            bgColor: const Color(0xFFFFFBEB),
                            icon: Icons.hourglass_top_outlined,
                            onTap: () => widget.onNavigateToReminders?.call('due_soon'),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Stats Grid Row 2 (Today & Expired)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Row(
                        children: [
                          _buildStatCard(
                            label: 'Expiring Today',
                            count: _dashboardData?.counts.today ?? 0,
                            color: const Color(0xFFDC2626),
                            bgColor: const Color(0xFFFEF2F2),
                            icon: Icons.error_outline,
                            onTap: () => widget.onNavigateToReminders?.call('today'),
                          ),
                          const SizedBox(width: 12),
                          _buildStatCard(
                            label: 'Expired',
                            count: _dashboardData?.counts.expired ?? 0,
                            color: const Color(0xFF475569),
                            bgColor: const Color(0xFFF1F5F9),
                            icon: Icons.warning_amber_rounded,
                            onTap: () => widget.onNavigateToReminders?.call('expired'),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Needs Attention Section (if any expired)
                    if (_dashboardData?.needsAttention != null &&
                        _dashboardData!.needsAttention.isNotEmpty) ...[
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Row(
                          children: [
                            const Icon(Icons.warning, color: Color(0xFFDC2626), size: 18),
                            const SizedBox(width: 6),
                            const Text(
                              'NEEDS ATTENTION',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.8,
                                color: Color(0xFFDC2626),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),
                      ..._dashboardData!.needsAttention.map((reminder) {
                        return ReminderCard(
                          reminder: reminder,
                          onTap: () async {
                            final res = await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) =>
                                    ReminderDetailScreen(reminderId: reminder.id),
                              ),
                            );
                            if (res == true) _loadDashboard();
                          },
                        );
                      }),
                      const SizedBox(height: 16),
                    ],

                    // Upcoming Section
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'UPCOMING RENEWALS',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.8,
                              color: Color(0xFF334155),
                            ),
                          ),
                          TextButton(
                            onPressed: () => widget.onNavigateToReminders?.call('all'),
                            child: const Text('View All'),
                          ),
                        ],
                      ),
                    ),

                    if (_dashboardData?.upcoming == null ||
                        _dashboardData!.upcoming.isEmpty) ...[
                      Padding(
                        padding: const EdgeInsets.all(32),
                        child: Center(
                          child: Column(
                            children: [
                              Icon(Icons.event_available,
                                  size: 48, color: Colors.grey.shade400),
                              const SizedBox(height: 12),
                              const Text(
                                'No upcoming renewals',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF334155),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Add a reminder to track expiration dates.',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Colors.grey.shade500,
                                ),
                              ),
                              const SizedBox(height: 16),
                              ElevatedButton.icon(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF2563EB),
                                  foregroundColor: Colors.white,
                                ),
                                icon: const Icon(Icons.add, size: 18),
                                label: const Text('Add First Reminder'),
                                onPressed: () async {
                                  final res = await Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => const AddEditReminderScreen(),
                                    ),
                                  );
                                  if (res == true) _loadDashboard();
                                },
                              ),
                            ],
                          ),
                        ),
                      ),
                    ] else ...[
                      ..._dashboardData!.upcoming.map((reminder) {
                        return ReminderCard(
                          reminder: reminder,
                          onTap: () async {
                            final res = await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) =>
                                    ReminderDetailScreen(reminderId: reminder.id),
                              ),
                            );
                            if (res == true) _loadDashboard();
                          },
                        );
                      }),
                    ],

                    const SizedBox(height: 80),
                  ],
                ),
              ),
      ),
    );
  }
}
