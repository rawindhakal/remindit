import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/reminder_model.dart';
import '../../services/api_service.dart';
import '../../widgets/reminder_card.dart';
import '../reminders/reminder_detail_screen.dart';

class CalendarScreen extends StatefulWidget {
  const CalendarScreen({super.key});

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  final ApiService _api = ApiService();
  DateTime _currentMonth = DateTime.now();
  DateTime _selectedDate = DateTime.now();
  List<ReminderModel> _allReminders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadReminders();
  }

  Future<void> _loadReminders() async {
    setState(() => _isLoading = true);
    final reminders = await _api.getReminders(pageSize: 100);
    if (mounted) {
      setState(() {
        _allReminders = reminders;
        _isLoading = false;
      });
    }
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  List<ReminderModel> _getRemindersForDay(DateTime day) {
    return _allReminders.where((r) => _isSameDay(r.expiryDate, day)).toList();
  }

  @override
  Widget build(BuildContext context) {
    final daysInMonth =
        DateTime(_currentMonth.year, _currentMonth.month + 1, 0).day;
    final firstDayWeekday =
        DateTime(_currentMonth.year, _currentMonth.month, 1).weekday; // 1 = Mon

    final selectedReminders = _getRemindersForDay(_selectedDate);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Renewal Calendar',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: Color(0xFF0F172A),
          ),
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF2563EB)),
            )
          : Column(
              children: [
                // Month Navigation Header
                Container(
                  color: Colors.white,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.chevron_left),
                        onPressed: () {
                          setState(() {
                            _currentMonth = DateTime(
                              _currentMonth.year,
                              _currentMonth.month - 1,
                            );
                          });
                        },
                      ),
                      Text(
                        DateFormat('MMMM yyyy').format(_currentMonth),
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.chevron_right),
                        onPressed: () {
                          setState(() {
                            _currentMonth = DateTime(
                              _currentMonth.year,
                              _currentMonth.month + 1,
                            );
                          });
                        },
                      ),
                    ],
                  ),
                ),

                // Calendar Grid
                Container(
                  color: Colors.white,
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Column(
                    children: [
                      // Weekday row
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: ['M', 'T', 'W', 'T', 'F', 'S', 'S']
                              .map(
                                (d) => SizedBox(
                                  width: 36,
                                  child: Center(
                                    child: Text(
                                      d,
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.grey.shade500,
                                      ),
                                    ),
                                  ),
                                ),
                              )
                              .toList(),
                        ),
                      ),
                      const SizedBox(height: 8),

                      // Days grid
                      GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        itemCount: (firstDayWeekday - 1) + daysInMonth,
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 7,
                          childAspectRatio: 1.1,
                        ),
                        itemBuilder: (context, index) {
                          if (index < firstDayWeekday - 1) {
                            return const SizedBox.shrink();
                          }
                          final dayNum = index - (firstDayWeekday - 1) + 1;
                          final date = DateTime(_currentMonth.year,
                              _currentMonth.month, dayNum);
                          final isSelected = _isSameDay(date, _selectedDate);
                          final isToday = _isSameDay(date, DateTime.now());
                          final dayReminders = _getRemindersForDay(date);

                          return GestureDetector(
                            onTap: () {
                              setState(() {
                                _selectedDate = date;
                              });
                            },
                            child: Container(
                              margin: const EdgeInsets.all(2),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? const Color(0xFF2563EB)
                                    : (isToday
                                        ? const Color(0xFFEFF6FF)
                                        : Colors.transparent),
                                borderRadius: BorderRadius.circular(10),
                                border: isToday && !isSelected
                                    ? Border.all(
                                        color: const Color(0xFF2563EB), width: 1)
                                    : null,
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    dayNum.toString(),
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: isSelected || isToday
                                          ? FontWeight.bold
                                          : FontWeight.normal,
                                      color: isSelected
                                          ? Colors.white
                                          : (isToday
                                              ? const Color(0xFF2563EB)
                                              : Colors.black87),
                                    ),
                                  ),
                                  if (dayReminders.isNotEmpty) ...[
                                    const SizedBox(height: 2),
                                    Container(
                                      width: 5,
                                      height: 5,
                                      decoration: BoxDecoration(
                                        color: isSelected
                                            ? Colors.white
                                            : const Color(0xFFDC2626),
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 12),

                // Selected Day Header
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        DateFormat('EEEE, MMM d, yyyy')
                            .format(_selectedDate)
                            .toUpperCase(),
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey.shade600,
                          letterSpacing: 0.8,
                        ),
                      ),
                      Text(
                        '${selectedReminders.length} reminder(s)',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade500,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 8),

                // Selected Day List
                Expanded(
                  child: selectedReminders.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.event_note,
                                  size: 40, color: Colors.grey.shade400),
                              const SizedBox(height: 8),
                              Text(
                                'No renewals due on this date',
                                style: TextStyle(
                                  color: Colors.grey.shade600,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          itemCount: selectedReminders.length,
                          itemBuilder: (ctx, i) {
                            final r = selectedReminders[i];
                            return ReminderCard(
                              reminder: r,
                              onTap: () async {
                                final res = await Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) =>
                                        ReminderDetailScreen(reminderId: r.id),
                                  ),
                                );
                                if (res == true) _loadReminders();
                              },
                            );
                          },
                        ),
                ),
              ],
            ),
    );
  }
}
