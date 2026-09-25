import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../../models/category_model.dart';
import '../../models/reminder_model.dart';
import '../../services/api_service.dart';

class AddEditReminderScreen extends StatefulWidget {
  final ReminderModel? existingReminder;
  const AddEditReminderScreen({super.key, this.existingReminder});

  @override
  State<AddEditReminderScreen> createState() => _AddEditReminderScreenState();
}

class _AddEditReminderScreenState extends State<AddEditReminderScreen> {
  final ApiService _api = ApiService();
  final _formKey = GlobalKey<FormState>();

  final _titleController = TextEditingController();
  final _ownerController = TextEditingController();
  final _referenceController = TextEditingController();
  final _providerController = TextEditingController();
  final _notesController = TextEditingController();

  DateTime? _selectedExpiryDate;
  CategoryModel? _selectedCategory;
  List<CategoryModel> _categories = [];
  bool _isLoadingCategories = true;
  bool _isSaving = false;
  bool _isUploadingDocument = false;

  // Notification schedules
  final Map<int, bool> _scheduleDays = {
    90: false,
    60: false,
    30: true,
    15: true,
    7: true,
    3: true,
    1: true,
    0: true, // Expiry day
  };

  // Uploaded document attachments
  List<DocumentAttachment> _documents = [];

  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _loadCategories();

    if (widget.existingReminder != null) {
      final r = widget.existingReminder!;
      _titleController.text = r.title;
      _ownerController.text = r.ownerName ?? '';
      _referenceController.text = r.referenceNumber ?? '';
      _providerController.text = r.providerName ?? '';
      _notesController.text = r.description ?? '';
      _selectedExpiryDate = r.expiryDate;
      _documents = List.from(r.documents);

      // Populate schedules
      if (r.schedules.isNotEmpty) {
        for (var k in _scheduleDays.keys) {
          _scheduleDays[k] = false;
        }
        for (var s in r.schedules) {
          if (_scheduleDays.containsKey(s.daysBefore)) {
            _scheduleDays[s.daysBefore] = s.enabled;
          }
        }
      }
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _ownerController.dispose();
    _referenceController.dispose();
    _providerController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _loadCategories() async {
    final list = await _api.getCategories();
    if (mounted) {
      setState(() {
        _categories = list;
        _isLoadingCategories = false;
        if (widget.existingReminder?.categoryId != null) {
          _selectedCategory = list.firstWhere(
            (c) => c.id == widget.existingReminder!.categoryId,
            orElse: () => list.first,
          );
        }
      });
    }
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final initialDate = _selectedExpiryDate ?? now.add(const Duration(days: 30));
    final picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime(2020),
      lastDate: DateTime(2040),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF2563EB),
              onPrimary: Colors.white,
              onSurface: Color(0xFF0F172A),
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _selectedExpiryDate = picked;
      });
    }
  }

  Future<void> _captureDocument(ImageSource source) async {
    try {
      final XFile? image = await _picker.pickImage(
        source: source,
        imageQuality: 85,
        maxWidth: 1920,
        maxHeight: 1920,
      );

      if (image == null) return;

      setState(() => _isUploadingDocument = true);

      final uploaded = await _api.uploadDocument(
        image,
        _titleController.text.trim().isNotEmpty
            ? _titleController.text.trim()
            : 'scanned_doc',
      );

      if (mounted) {
        setState(() {
          _isUploadingDocument = false;
          if (uploaded != null) {
            _documents.add(uploaded);
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Document uploaded to server successfully!'),
                backgroundColor: Colors.green,
              ),
            );
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Failed to upload document to server'),
                backgroundColor: Colors.red,
              ),
            );
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isUploadingDocument = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Camera error: $e')),
        );
      }
    }
  }

  void _showDocumentSourceModal() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Scan or Attach Document',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 12),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.camera_alt, color: Color(0xFF2563EB)),
                ),
                title: const Text('Scan with Camera'),
                subtitle: const Text('Capture bluebook, citizenship, license'),
                onTap: () {
                  Navigator.pop(ctx);
                  _captureDocument(ImageSource.camera);
                },
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.photo_library, color: Color(0xFF475569)),
                ),
                title: const Text('Choose from Gallery'),
                subtitle: const Text('Select an existing photo or document'),
                onTap: () {
                  Navigator.pop(ctx);
                  _captureDocument(ImageSource.gallery);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _saveReminder() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedExpiryDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select an expiry date'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isSaving = true);

    // Selected schedules
    final activeSchedules = _scheduleDays.entries
        .where((e) => e.value)
        .map((e) => e.key)
        .toList();

    final payload = {
      'title': _titleController.text.trim(),
      'categoryId': _selectedCategory?.id,
      'expiryDate': _selectedExpiryDate!.toIso8601String(),
      'ownerName': _ownerController.text.trim().isEmpty ? null : _ownerController.text.trim(),
      'referenceNumber':
          _referenceController.text.trim().isEmpty ? null : _referenceController.text.trim(),
      'providerName':
          _providerController.text.trim().isEmpty ? null : _providerController.text.trim(),
      'description': _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
      'schedules': activeSchedules,
      'documents': _documents.map((d) => d.toJson()).toList(),
    };

    Map<String, dynamic> result;
    if (widget.existingReminder != null) {
      result = await _api.updateReminder(widget.existingReminder!.id, payload);
    } else {
      result = await _api.createReminder(payload);
    }

    if (!mounted) return;
    setState(() => _isSaving = false);

    if (result['success'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(widget.existingReminder != null
              ? 'Reminder updated successfully!'
              : 'Reminder saved successfully!'),
          backgroundColor: Colors.green,
        ),
      );
      Navigator.pop(context, true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message'] ?? 'Failed to save reminder'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('EEE, MMM d, yyyy');

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          widget.existingReminder != null ? 'Edit Reminder' : 'New Reminder',
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            color: Color(0xFF0F172A),
          ),
        ),
        actions: [
          TextButton(
            onPressed: _isSaving ? null : _saveReminder,
            child: _isSaving
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text(
                    'Save',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: Color(0xFF2563EB),
                    ),
                  ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ─── CATEGORY PICKER ─────────────────────────────────────────
              const Text(
                'Category',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF334155),
                ),
              ),
              const SizedBox(height: 8),
              if (_isLoadingCategories)
                const LinearProgressIndicator()
              else
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<CategoryModel>(
                      isExpanded: true,
                      value: _selectedCategory,
                      hint: const Text('Select a category'),
                      items: _categories.map((c) {
                        return DropdownMenuItem<CategoryModel>(
                          value: c,
                          child: Row(
                            children: [
                              Text(c.icon ?? '📁', style: const TextStyle(fontSize: 18)),
                              const SizedBox(width: 10),
                              Text(c.name, style: const TextStyle(fontSize: 14)),
                              if (c.group != null) ...[
                                const Spacer(),
                                Text(
                                  c.group!,
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: Colors.grey.shade400,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        );
                      }).toList(),
                      onChanged: (cat) {
                        setState(() {
                          _selectedCategory = cat;
                          if (_titleController.text.isEmpty && cat != null) {
                            _titleController.text = cat.name;
                          }
                        });
                      },
                    ),
                  ),
                ),

              const SizedBox(height: 20),

              // ─── BASIC DETAILS ───────────────────────────────────────────
              Container(
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
                      'Title *',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF334155),
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _titleController,
                      decoration: InputDecoration(
                        hintText: 'e.g., Driving License, Car Bluebook',
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      validator: (v) =>
                          v == null || v.trim().isEmpty ? 'Title is required' : null,
                    ),

                    const SizedBox(height: 16),

                    const Text(
                      'Expiry Date *',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF334155),
                      ),
                    ),
                    const SizedBox(height: 6),
                    InkWell(
                      onTap: _pickDate,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.grey.shade300),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.calendar_today,
                                size: 18, color: Color(0xFF2563EB)),
                            const SizedBox(width: 10),
                            Text(
                              _selectedExpiryDate != null
                                  ? dateFormat.format(_selectedExpiryDate!)
                                  : 'Select Expiry Date',
                              style: TextStyle(
                                fontSize: 14,
                                color: _selectedExpiryDate != null
                                    ? const Color(0xFF0F172A)
                                    : Colors.grey.shade500,
                                fontWeight: _selectedExpiryDate != null
                                    ? FontWeight.w600
                                    : FontWeight.normal,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    const Text(
                      'For / Owner Name',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF334155),
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _ownerController,
                      decoration: InputDecoration(
                        hintText: 'e.g., Myself, Wife, Dad, Company',
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Reference / Policy #',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF334155),
                                ),
                              ),
                              const SizedBox(height: 6),
                              TextFormField(
                                controller: _referenceController,
                                decoration: InputDecoration(
                                  hintText: 'e.g., DL-928172',
                                  filled: true,
                                  fillColor: const Color(0xFFF8FAFC),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Provider / Issuer',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF334155),
                                ),
                              ),
                              const SizedBox(height: 6),
                              TextFormField(
                                controller: _providerController,
                                decoration: InputDecoration(
                                  hintText: 'e.g., Yatayat, Shikhar',
                                  filled: true,
                                  fillColor: const Color(0xFFF8FAFC),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // ─── DOCUMENT SCANNER & CAMERA ───────────────────────────────
              Container(
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
                        const Text(
                          'Scanned Documents',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF334155),
                          ),
                        ),
                        OutlinedButton.icon(
                          onPressed:
                              _isUploadingDocument ? null : _showDocumentSourceModal,
                          icon: const Icon(Icons.document_scanner, size: 16),
                          label: const Text('Scan / Add'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFF2563EB),
                            side: const BorderSide(color: Color(0xFF2563EB)),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Attach photos of your bluebook, driving license, or citizenship certificate stored securely on your server.',
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                    ),
                    if (_isUploadingDocument) ...[
                      const SizedBox(height: 12),
                      const Row(
                        children: [
                          SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                          SizedBox(width: 8),
                          Text('Uploading document to server...',
                              style: TextStyle(fontSize: 12)),
                        ],
                      ),
                    ],
                    if (_documents.isNotEmpty) ...[
                      const SizedBox(height: 14),
                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: _documents.map((doc) {
                          final fullUrl = doc.url.startsWith('http')
                              ? doc.url
                              : '${_api.baseUrl}${doc.url}';
                          return Stack(
                            children: [
                              Container(
                                width: 80,
                                height: 80,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: Colors.grey.shade300),
                                  image: DecorationImage(
                                    image: NetworkImage(fullUrl),
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              ),
                              Positioned(
                                top: 2,
                                right: 2,
                                child: GestureDetector(
                                  onTap: () {
                                    setState(() {
                                      _documents.remove(doc);
                                    });
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.all(2),
                                    decoration: const BoxDecoration(
                                      color: Colors.red,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(
                                      Icons.close,
                                      size: 14,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          );
                        }).toList(),
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // ─── REMINDER SCHEDULE CHECKBOXES ─────────────────────────────
              Container(
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
                      'Reminder Schedule',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF334155),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Choose when to receive notifications before the renewal date:',
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _scheduleDays.keys.map((days) {
                        final isEnabled = _scheduleDays[days] ?? false;
                        final label = days == 0
                            ? 'On expiry day'
                            : (days == 1 ? '1 day before' : '$days days before');

                        return FilterChip(
                          label: Text(label, style: const TextStyle(fontSize: 12)),
                          selected: isEnabled,
                          onSelected: (selected) {
                            setState(() {
                              _scheduleDays[days] = selected;
                            });
                          },
                          selectedColor: const Color(0xFFDBEAFE),
                          checkmarkColor: const Color(0xFF2563EB),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // ─── NOTES ───────────────────────────────────────────────────
              Container(
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
                      'Notes & Instructions',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF334155),
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _notesController,
                      maxLines: 3,
                      decoration: InputDecoration(
                        hintText: 'e.g., Renewal fee is Rs. 1,500 at Ekantakuna office...',
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // ─── SAVE BUTTON ─────────────────────────────────────────────
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _saveReminder,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: _isSaving
                      ? const CircularProgressIndicator(color: Colors.white)
                      : Text(
                          widget.existingReminder != null
                              ? 'Update Reminder'
                              : 'Create Reminder',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }
}
