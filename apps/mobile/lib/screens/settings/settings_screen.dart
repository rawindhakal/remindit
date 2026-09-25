import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../auth/login_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final ApiService _api = ApiService();
  bool _emailEnabled = true;
  bool _expiryDayEnabled = true;
  bool _overdueEnabled = false;
  bool _weeklySummaryEnabled = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final settings = await _api.getSettings();
    if (mounted && settings != null) {
      final prefs = settings['preferences'] as Map<String, dynamic>?;
      if (prefs != null) {
        setState(() {
          _emailEnabled = prefs['emailEnabled'] ?? true;
          _expiryDayEnabled = prefs['expiryDayEnabled'] ?? true;
          _overdueEnabled = prefs['overdueEnabled'] ?? false;
          _weeklySummaryEnabled = prefs['weeklySummaryEnabled'] ?? true;
        });
        return;
      }
    }
  }

  Future<void> _savePreference(String key, bool val) async {
    await _api.updateSettings({
      'preferences': {key: val}
    });
  }

  void _showServerConfigModal() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final urlController = TextEditingController(text: authProvider.baseUrl);
    String? testStatus;
    bool isTesting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 24,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.dns, color: Color(0xFF2563EB)),
                  SizedBox(width: 8),
                  Text(
                    'Shared VPS Server Configuration',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Text(
                'Enter the backend domain or IP address of your shared VPS hosting:',
                style: TextStyle(fontSize: 13, color: Colors.black87),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: urlController,
                decoration: InputDecoration(
                  hintText: 'https://renewit.yourdomain.com',
                  prefixIcon: const Icon(Icons.link, size: 20),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              if (testStatus != null) ...[
                Text(
                  testStatus!,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: testStatus!.contains('Successful')
                        ? Colors.green
                        : Colors.red,
                  ),
                ),
                const SizedBox(height: 8),
              ],
              Row(
                children: [
                  OutlinedButton.icon(
                    onPressed: isTesting
                        ? null
                        : () async {
                            setModalState(() {
                              isTesting = true;
                              testStatus = 'Pinging server...';
                            });
                            try {
                              var url = urlController.text.trim();
                              if (url.endsWith('/')) {
                                url = url.substring(0, url.length - 1);
                              }
                              final res = await http
                                  .get(Uri.parse('$url/api/mobile/categories'))
                                  .timeout(const Duration(seconds: 8));
                              setModalState(() {
                                isTesting = false;
                                testStatus = res.statusCode == 200
                                    ? '✓ Connection Successful! (HTTP 200)'
                                    : 'Server returned code: ${res.statusCode}';
                              });
                            } catch (e) {
                              setModalState(() {
                                isTesting = false;
                                testStatus = '✗ Connection failed: $e';
                              });
                            }
                          },
                    icon: isTesting
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.network_check, size: 16),
                    label: const Text('Test Connection'),
                  ),
                  const Spacer(),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      foregroundColor: Colors.white,
                    ),
                    onPressed: () async {
                      if (urlController.text.trim().isNotEmpty) {
                        final messenger = ScaffoldMessenger.of(context);
                        final nav = Navigator.of(ctx);
                        await authProvider
                            .updateServerUrl(urlController.text.trim());
                        nav.pop();
                        messenger.showSnackBar(
                          SnackBar(
                            content: Text(
                                'Server URL updated to: ${authProvider.baseUrl}'),
                            backgroundColor: Colors.green,
                          ),
                        );
                      }
                    },
                    child: const Text('Save URL'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _handleLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out from RenewIt?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final nav = Navigator.of(context);
      await auth.logout();
      nav.pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (r) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.currentUser;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Settings',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: Color(0xFF0F172A),
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // User Profile Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: const Color(0xFF2563EB),
                    child: Text(
                      (user?.name != null && user!.name!.isNotEmpty)
                          ? user.name![0].toUpperCase()
                          : 'U',
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.name ?? 'RenewIt User',
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          user?.email ?? '',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey.shade600,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDBEAFE),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            (user?.role ?? 'user').toUpperCase(),
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1D4ED8),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Server / VPS Connection Card
            const Text(
              'SERVER & HOSTING',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.8,
                color: Color(0xFF64748B),
              ),
            ),
            const SizedBox(height: 8),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.cloud_outlined,
                      color: Color(0xFF2563EB)),
                ),
                title: const Text(
                  'Connected VPS Server',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                ),
                subtitle: Text(
                  auth.baseUrl,
                  style: const TextStyle(fontSize: 12),
                  overflow: TextOverflow.ellipsis,
                ),
                trailing: const Icon(Icons.edit_outlined, size: 20),
                onTap: _showServerConfigModal,
              ),
            ),

            const SizedBox(height: 20),

            // Notification Preferences
            const Text(
              'NOTIFICATIONS',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.8,
                color: Color(0xFF64748B),
              ),
            ),
            const SizedBox(height: 8),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                children: [
                  SwitchListTile(
                    title: const Text('Email Notifications',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                    subtitle: const Text('Receive reminders before expiry',
                        style: TextStyle(fontSize: 12)),
                    value: _emailEnabled,
                    
                    onChanged: (val) {
                      setState(() => _emailEnabled = val);
                      _savePreference('emailEnabled', val);
                    },
                  ),
                  const Divider(height: 1),
                  SwitchListTile(
                    title: const Text('Expiry Day Notification',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                    subtitle: const Text('Receive an alert on the day of expiry',
                        style: TextStyle(fontSize: 12)),
                    value: _expiryDayEnabled,
                    
                    onChanged: (val) {
                      setState(() => _expiryDayEnabled = val);
                      _savePreference('expiryDayEnabled', val);
                    },
                  ),
                  const Divider(height: 1),
                  SwitchListTile(
                    title: const Text('Overdue Reminders',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                    subtitle: const Text('Follow-up alerts for expired items',
                        style: TextStyle(fontSize: 12)),
                    value: _overdueEnabled,
                    
                    onChanged: (val) {
                      setState(() => _overdueEnabled = val);
                      _savePreference('overdueEnabled', val);
                    },
                  ),
                  const Divider(height: 1),
                  SwitchListTile(
                    title: const Text('Weekly Digest Summary',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                    subtitle: const Text('A weekly roundup of upcoming renewals',
                        style: TextStyle(fontSize: 12)),
                    value: _weeklySummaryEnabled,
                    
                    onChanged: (val) {
                      setState(() => _weeklySummaryEnabled = val);
                      _savePreference('weeklySummaryEnabled', val);
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // About Card
            const Text(
              'ABOUT',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.8,
                color: Color(0xFF64748B),
              ),
            ),
            const SizedBox(height: 8),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: const Column(
                children: [
                  ListTile(
                    leading: Icon(Icons.info_outline, color: Color(0xFF64748B)),
                    title: Text('Version', style: TextStyle(fontSize: 14)),
                    trailing: Text('1.0.0+1',
                        style: TextStyle(fontSize: 13, color: Colors.grey)),
                  ),
                  Divider(height: 1),
                  ListTile(
                    leading: Icon(Icons.verified_user_outlined,
                        color: Color(0xFF64748B)),
                    title: Text('Platform', style: TextStyle(fontSize: 14)),
                    trailing: Text('Android & iOS',
                        style: TextStyle(fontSize: 13, color: Colors.grey)),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Sign Out Button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.red.shade600,
                  side: BorderSide(color: Colors.red.shade300),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                icon: const Icon(Icons.logout, size: 18),
                label: const Text('Sign Out',
                    style: TextStyle(fontWeight: FontWeight.bold)),
                onPressed: _handleLogout,
              ),
            ),

            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
