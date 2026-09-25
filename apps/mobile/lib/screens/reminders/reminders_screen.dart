import 'package:flutter/material.dart';
import '../../models/reminder_model.dart';
import '../../models/category_model.dart';
import '../../services/api_service.dart';
import '../../widgets/reminder_card.dart';
import 'reminder_detail_screen.dart';

class RemindersScreen extends StatefulWidget {
  final String? initialStatus;
  const RemindersScreen({super.key, this.initialStatus});

  @override
  State<RemindersScreen> createState() => _RemindersScreenState();
}

class _RemindersScreenState extends State<RemindersScreen> {
  final ApiService _api = ApiService();
  final TextEditingController _searchController = TextEditingController();

  List<ReminderModel> _reminders = [];
  List<CategoryModel> _categories = [];
  bool _isLoading = true;

  String _selectedStatus = 'all'; // all, due_soon, today, expired, active
  String? _selectedCategoryId;

  @override
  void initState() {
    super.initState();
    if (widget.initialStatus != null) {
      _selectedStatus = widget.initialStatus!;
    }
    _loadInitial();
  }

  Future<void> _loadInitial() async {
    setState(() => _isLoading = true);
    final categories = await _api.getCategories();
    if (mounted) {
      setState(() {
        _categories = categories;
      });
    }
    await _loadReminders();
  }

  Future<void> _loadReminders() async {
    final reminders = await _api.getReminders(
      status: _selectedStatus == 'all' ? null : _selectedStatus,
      categoryId: _selectedCategoryId,
      search: _searchController.text.trim().isEmpty ? null : _searchController.text.trim(),
    );

    if (mounted) {
      setState(() {
        _reminders = reminders;
        _isLoading = false;
      });
    }
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _selectedStatus == value;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedStatus = value;
          _isLoading = true;
        });
        _loadReminders();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF2563EB) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF2563EB) : Colors.grey.shade300,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : Colors.grey.shade700,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Reminders',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: Color(0xFF0F172A),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Color(0xFF64748B)),
            onPressed: () {
              setState(() => _isLoading = true);
              _loadReminders();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Search & Filters Header Container
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            child: Column(
              children: [
                // Search Input
                TextField(
                  controller: _searchController,
                  onChanged: (val) {
                    _loadReminders();
                  },
                  decoration: InputDecoration(
                    hintText: 'Search title, owner, provider...',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              _loadReminders();
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: const Color(0xFFF1F5F9),
                    contentPadding: const EdgeInsets.symmetric(vertical: 10),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Status Tabs Carousel
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFilterChip('All', 'all'),
                      const SizedBox(width: 8),
                      _buildFilterChip('Due Soon', 'due_soon'),
                      const SizedBox(width: 8),
                      _buildFilterChip('Today', 'today'),
                      const SizedBox(width: 8),
                      _buildFilterChip('Expired', 'expired'),
                      const SizedBox(width: 8),
                      _buildFilterChip('Active', 'active'),
                    ],
                  ),
                ),

                if (_categories.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  // Category Dropdown Filter
                  SizedBox(
                    height: 34,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: [
                        FilterChip(
                          label: const Text('All Categories', style: TextStyle(fontSize: 12)),
                          selected: _selectedCategoryId == null,
                          onSelected: (_) {
                            setState(() => _selectedCategoryId = null);
                            _loadReminders();
                          },
                          backgroundColor: Colors.grey.shade100,
                          selectedColor: const Color(0xFFDBEAFE),
                        ),
                        const SizedBox(width: 6),
                        ..._categories.map((c) {
                          final isSel = _selectedCategoryId == c.id;
                          return Padding(
                            padding: const EdgeInsets.only(right: 6),
                            child: FilterChip(
                              avatar: Text(c.icon ?? '📁', style: const TextStyle(fontSize: 12)),
                              label: Text(c.name, style: const TextStyle(fontSize: 12)),
                              selected: isSel,
                              onSelected: (_) {
                                setState(() {
                                  _selectedCategoryId = isSel ? null : c.id;
                                });
                                _loadReminders();
                              },
                              backgroundColor: Colors.grey.shade100,
                              selectedColor: const Color(0xFFDBEAFE),
                            ),
                          );
                        }),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),

          // Reminders List or Loading
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: Color(0xFF2563EB)),
                  )
                : RefreshIndicator(
                    onRefresh: _loadReminders,
                    color: const Color(0xFF2563EB),
                    child: _reminders.isEmpty
                        ? ListView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            children: [
                              SizedBox(height: MediaQuery.of(context).size.height * 0.15),
                              Center(
                                child: Column(
                                  children: [
                                    Icon(Icons.inbox_outlined,
                                        size: 56, color: Colors.grey.shade400),
                                    const SizedBox(height: 12),
                                    Text(
                                      'No reminders found',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.grey.shade700,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Try adjusting your search or filters.',
                                      style: TextStyle(
                                        fontSize: 13,
                                        color: Colors.grey.shade500,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.only(top: 8, bottom: 80),
                            itemCount: _reminders.length,
                            itemBuilder: (ctx, i) {
                              final item = _reminders[i];
                              return ReminderCard(
                                reminder: item,
                                onTap: () async {
                                  final res = await Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) =>
                                          ReminderDetailScreen(reminderId: item.id),
                                    ),
                                  );
                                  if (res == true) _loadReminders();
                                },
                              );
                            },
                          ),
                  ),
          ),
        ],
      ),
    );
  }
}
