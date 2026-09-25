import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../../models/reminder_model.dart';
import '../../services/api_service.dart';
import '../../widgets/document_viewer.dart';
import '../../widgets/status_badge.dart';
import 'add_edit_reminder_screen.dart';

class ReminderDetailScreen extends StatefulWidget {
  final String reminderId;
  const ReminderDetailScreen({super.key, required this.reminderId});

  @override
  State<ReminderDetailScreen> createState() => _ReminderDetailScreenState();
}

class _ReminderDetailScreenState extends State<ReminderDetailScreen> {
  final ApiService _api = ApiService();
  ReminderModel? _reminder;
  bool _isLoading = true;
  bool _isActionLoading = false;

  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _loadReminder();
  }

  Future<void> _loadReminder() async {
    setState(() => _isLoading = true);
    final data = await _api.getReminder(widget.reminderId);
    if (mounted) {
      setState(() {
        _reminder = data;
        _isLoading = false;
      });
    }
  }

  Future<void> _showRenewModal() async {
    if (_reminder == null) return;

    DateTime newExpiry = _reminder!.expiryDate.add(const Duration(days: 365));
    final notesController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
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
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDCFCE7),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.check_circle_outline,
                        color: Color(0xFF16A34A)),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'Mark as Renewed',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Text(
                'Next Expiry Date',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF334155),
                ),
              ),
              const SizedBox(height: 8),
              InkWell(
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: newExpiry,
                    firstDate: DateTime.now(),
                    lastDate: DateTime(2040),
                  );
                  if (picked != null) {
                    setModalState(() {
                      newExpiry = picked;
                    });
                  }
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        DateFormat('MMM dd, yyyy').format(newExpiry),
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const Icon(Icons.edit_calendar,
                          size: 18, color: Color(0xFF2563EB)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Renewal Notes (optional)',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF334155),
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: notesController,
                decoration: InputDecoration(
                  hintText: 'e.g., Renewed for 1 year, receipt #89218',
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF16A34A),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: () async {
                    Navigator.pop(ctx);
                    final messenger = ScaffoldMessenger.of(context);
                    setState(() => _isActionLoading = true);
                    final res = await _api.renewReminder(
                      widget.reminderId,
                      newExpiry.toIso8601String(),
                      notesController.text.trim().isEmpty
                          ? null
                          : notesController.text.trim(),
                    );
                    setState(() => _isActionLoading = false);
                    if (res['success'] == true) {
                      _loadReminder();
                      messenger.showSnackBar(
                        const SnackBar(
                          content: Text('Renewal recorded successfully!'),
                          backgroundColor: Colors.green,
                        ),
                      );
                    } else {
                      messenger.showSnackBar(
                        SnackBar(
                          content: Text(res['message'] ?? 'Renewal failed'),
                          backgroundColor: Colors.red,
                        ),
                      );
                    }
                  },
                  child: const Text(
                    'Confirm Renewal',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _scanAndAttachDocument(ImageSource source) async {
    if (_reminder == null) return;
    try {
      final XFile? image = await _picker.pickImage(
        source: source,
        imageQuality: 85,
        maxWidth: 1920,
        maxHeight: 1920,
      );
      if (image == null) return;

      setState(() => _isActionLoading = true);

      final uploaded = await _api.uploadDocument(
        image,
        _reminder!.title,
      );

      if (uploaded != null) {
        final currentDocs = List<DocumentAttachment>.from(_reminder!.documents);
        currentDocs.add(uploaded);

        await _api.updateReminder(widget.reminderId, {
          'documents': currentDocs.map((d) => d.toJson()).toList(),
        });

        await _loadReminder();

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Document scanned and attached successfully!'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
      setState(() => _isActionLoading = false);
    } catch (e) {
      setState(() => _isActionLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error uploading document: $e')),
      );
    }
  }

  Future<void> _deleteReminder() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Reminder?'),
        content: const Text(
            'Are you sure you want to remove this reminder? This action cannot be undone.'),
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
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final messenger = ScaffoldMessenger.of(context);
      final nav = Navigator.of(context);
      setState(() => _isActionLoading = true);
      final success = await _api.deleteReminder(widget.reminderId);
      if (mounted) {
        if (success) {
          nav.pop(true);
        } else {
          setState(() => _isActionLoading = false);
          messenger.showSnackBar(
            const SnackBar(
              content: Text('Failed to delete reminder'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: Colors.grey.shade500),
          const SizedBox(width: 12),
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                color: Colors.grey.shade600,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF0F172A),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFF2563EB)),
        ),
      );
    }

    if (_reminder == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: Text('Reminder not found')),
      );
    }

    final r = _reminder!;
    final dateFormat = DateFormat('EEEE, MMMM d, yyyy');

    Color countdownBg;
    Color countdownText;
    String countdownLabel;

    if (r.computedStatus == 'today') {
      countdownBg = const Color(0xFFFEF2F2);
      countdownText = const Color(0xFFDC2626);
      countdownLabel = 'EXPIRES TODAY';
    } else if (r.computedStatus == 'due_soon') {
      countdownBg = const Color(0xFFFFFBEB);
      countdownText = const Color(0xFFD97706);
      countdownLabel = 'EXPIRES IN ${r.daysRemaining} DAYS';
    } else if (r.computedStatus == 'expired') {
      countdownBg = const Color(0xFFF1F5F9);
      countdownText = const Color(0xFF475569);
      countdownLabel = 'EXPIRED ${-r.daysRemaining} DAYS AGO';
    } else {
      countdownBg = const Color(0xFFF0FDF4);
      countdownText = const Color(0xFF16A34A);
      countdownLabel = 'EXPIRES IN ${r.daysRemaining} DAYS';
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.pop(context, true),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined, color: Color(0xFF2563EB)),
            onPressed: () async {
              final res = await Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => AddEditReminderScreen(existingReminder: r),
                ),
              );
              if (res == true) _loadReminder();
            },
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline, color: Color(0xFFDC2626)),
            onPressed: _deleteReminder,
          ),
        ],
      ),
      body: _isActionLoading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF2563EB)),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title Card Header
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEFF6FF),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                r.category?.icon ?? '📄',
                                style: const TextStyle(fontSize: 28),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    r.title,
                                    style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF0F172A),
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  StatusBadge(
                                    status: r.computedStatus,
                                    daysRemaining: r.daysRemaining,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),

                        // Countdown Banner
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(
                              vertical: 14, horizontal: 16),
                          decoration: BoxDecoration(
                            color: countdownBg,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Center(
                            child: Text(
                              countdownLabel,
                              style: TextStyle(
                                color: countdownText,
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                                letterSpacing: 0.8,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Action Buttons: Renew Now
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF16A34A),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      icon: const Icon(Icons.autorenew),
                      label: const Text(
                        'Mark as Renewed',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      onPressed: _showRenewModal,
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Details Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Reminder Details',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Divider(height: 1),
                        const SizedBox(height: 8),
                        _buildDetailRow(Icons.calendar_today, 'Expiry Date',
                            dateFormat.format(r.expiryDate)),
                        if (r.category != null)
                          _buildDetailRow(Icons.category_outlined, 'Category',
                              r.category!.name),
                        if (r.ownerName != null && r.ownerName!.isNotEmpty)
                          _buildDetailRow(Icons.person_outline, 'Owner / For',
                              r.ownerName!),
                        if (r.referenceNumber != null &&
                            r.referenceNumber!.isNotEmpty)
                          _buildDetailRow(Icons.confirmation_number_outlined,
                              'Reference #', r.referenceNumber!),
                        if (r.providerName != null &&
                            r.providerName!.isNotEmpty)
                          _buildDetailRow(Icons.business_outlined, 'Provider',
                              r.providerName!),
                        if (r.description != null &&
                            r.description!.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          const Divider(height: 1),
                          const SizedBox(height: 8),
                          const Text(
                            'Notes & Instructions',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF64748B),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            r.description!,
                            style: const TextStyle(
                              fontSize: 14,
                              color: Color(0xFF334155),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // ─── SCANNED DOCUMENTS ATTACHMENTS ───────────────────────
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Documents & Scans (${r.documents.length})',
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            PopupMenuButton<ImageSource>(
                              onSelected: _scanAndAttachDocument,
                              itemBuilder: (ctx) => [
                                const PopupMenuItem(
                                  value: ImageSource.camera,
                                  child: Row(
                                    children: [
                                      Icon(Icons.camera_alt,
                                          size: 18, color: Color(0xFF2563EB)),
                                      SizedBox(width: 8),
                                      Text('Scan with Camera'),
                                    ],
                                  ),
                                ),
                                const PopupMenuItem(
                                  value: ImageSource.gallery,
                                  child: Row(
                                    children: [
                                      Icon(Icons.photo_library,
                                          size: 18, color: Color(0xFF475569)),
                                      SizedBox(width: 8),
                                      Text('From Gallery'),
                                    ],
                                  ),
                                ),
                              ],
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEFF6FF),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Row(
                                  children: [
                                    Icon(Icons.add,
                                        size: 16, color: Color(0xFF2563EB)),
                                    SizedBox(width: 4),
                                    Text(
                                      'Add Scan',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF2563EB),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        if (r.documents.isEmpty) ...[
                          Center(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              child: Text(
                                'No documents attached yet.\nTap "Add Scan" to photograph your bluebook or license.',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey.shade500,
                                ),
                              ),
                            ),
                          ),
                        ] else ...[
                          GridView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: r.documents.length,
                            gridDelegate:
                                const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 3,
                              crossAxisSpacing: 10,
                              mainAxisSpacing: 10,
                              childAspectRatio: 1,
                            ),
                            itemBuilder: (ctx, i) {
                              final doc = r.documents[i];
                              final fullUrl = doc.url.startsWith('http')
                                  ? doc.url
                                  : '${_api.baseUrl}${doc.url}';

                              return GestureDetector(
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => FullscreenImageViewer(
                                        imageUrl: fullUrl,
                                        title: doc.originalName ?? 'Document Scan',
                                      ),
                                    ),
                                  );
                                },
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(10),
                                  child: Stack(
                                    fit: StackFit.expand,
                                    children: [
                                      Image.network(
                                        fullUrl,
                                        fit: BoxFit.cover,
                                        errorBuilder: (context, error, stackTrace) =>
                                            Container(
                                          color: Colors.grey.shade200,
                                          child: const Icon(Icons.picture_as_pdf),
                                        ),
                                      ),
                                      Positioned(
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        child: Container(
                                          color: Colors.black54,
                                          padding: const EdgeInsets.symmetric(
                                              vertical: 2, horizontal: 4),
                                          child: Text(
                                            doc.originalName ?? 'Scan ${i + 1}',
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 10,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // ─── RENEWAL HISTORY LOG ──────────────────────────────────
                  if (r.renewalHistory.isNotEmpty) ...[
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Renewal History',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                          const SizedBox(height: 12),
                          ...r.renewalHistory.map((h) {
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 6),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Icon(Icons.history,
                                      size: 16, color: Color(0xFF16A34A)),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Renewed on ${DateFormat('MMM dd, yyyy').format(h.renewedAt)}',
                                          style: const TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                        Text(
                                          'New expiry: ${DateFormat('MMM dd, yyyy').format(h.newExpiryDate)}',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey.shade600,
                                          ),
                                        ),
                                        if (h.notes != null &&
                                            h.notes!.isNotEmpty)
                                          Text(
                                            'Note: ${h.notes!}',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: Colors.grey.shade500,
                                              fontStyle: FontStyle.italic,
                                            ),
                                          ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 60),
                ],
              ),
            ),
    );
  }
}
