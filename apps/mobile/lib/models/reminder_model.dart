import 'category_model.dart';

class DocumentAttachment {
  final String url;
  final String filename;
  final String? originalName;
  final int? size;
  final String? type;
  final String? uploadedAt;

  DocumentAttachment({
    required this.url,
    required this.filename,
    this.originalName,
    this.size,
    this.type,
    this.uploadedAt,
  });

  factory DocumentAttachment.fromJson(Map<String, dynamic> json) {
    return DocumentAttachment(
      url: json['url'] ?? '',
      filename: json['filename'] ?? json['name'] ?? '',
      originalName: json['originalName'] ?? json['name'],
      size: json['size'] is int ? json['size'] : int.tryParse(json['size']?.toString() ?? ''),
      type: json['type'],
      uploadedAt: json['uploadedAt'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'url': url,
      'filename': filename,
      'originalName': originalName,
      'size': size,
      'type': type,
      'uploadedAt': uploadedAt,
    };
  }
}

class ReminderScheduleModel {
  final String? id;
  final int daysBefore;
  final String channel;
  final bool enabled;
  final String sendTime;

  ReminderScheduleModel({
    this.id,
    required this.daysBefore,
    this.channel = 'email',
    this.enabled = true,
    this.sendTime = '08:00',
  });

  factory ReminderScheduleModel.fromJson(Map<String, dynamic> json) {
    return ReminderScheduleModel(
      id: json['id'],
      daysBefore: json['daysBefore'] ?? 0,
      channel: json['channel'] ?? 'email',
      enabled: json['enabled'] ?? true,
      sendTime: json['sendTime'] ?? '08:00',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'daysBefore': daysBefore,
      'channel': channel,
      'enabled': enabled,
      'sendTime': sendTime,
    };
  }
}

class RenewalHistoryModel {
  final String id;
  final DateTime previousExpiryDate;
  final DateTime newExpiryDate;
  final DateTime renewedAt;
  final String? notes;

  RenewalHistoryModel({
    required this.id,
    required this.previousExpiryDate,
    required this.newExpiryDate,
    required this.renewedAt,
    this.notes,
  });

  factory RenewalHistoryModel.fromJson(Map<String, dynamic> json) {
    return RenewalHistoryModel(
      id: json['id'] ?? '',
      previousExpiryDate: DateTime.parse(json['previousExpiryDate']),
      newExpiryDate: DateTime.parse(json['newExpiryDate']),
      renewedAt: DateTime.parse(json['renewedAt'] ?? DateTime.now().toIso8601String()),
      notes: json['notes'],
    );
  }
}

class ReminderModel {
  final String id;
  final String userId;
  final String? categoryId;
  final String title;
  final String? description;
  final String? ownerName;
  final String? referenceNumber;
  final String? providerName;
  final DateTime? startDate;
  final DateTime expiryDate;
  final String status;
  final bool isRecurring;
  final String? recurrenceType;
  final int daysRemaining;
  final String computedStatus; // 'active', 'due_soon', 'today', 'expired'
  final CategoryModel? category;
  final List<DocumentAttachment> documents;
  final List<ReminderScheduleModel> schedules;
  final List<RenewalHistoryModel> renewalHistory;
  final DateTime createdAt;

  ReminderModel({
    required this.id,
    required this.userId,
    this.categoryId,
    required this.title,
    this.description,
    this.ownerName,
    this.referenceNumber,
    this.providerName,
    this.startDate,
    required this.expiryDate,
    this.status = 'active',
    this.isRecurring = false,
    this.recurrenceType,
    required this.daysRemaining,
    required this.computedStatus,
    this.category,
    this.documents = const [],
    this.schedules = const [],
    this.renewalHistory = const [],
    required this.createdAt,
  });

  factory ReminderModel.fromJson(Map<String, dynamic> json) {
    List<DocumentAttachment> docs = [];
    if (json['metadata'] != null && json['metadata'] is Map) {
      final metaDocs = json['metadata']['documents'];
      if (metaDocs is List) {
        docs = metaDocs
            .whereType<Map<String, dynamic>>()
            .map((d) => DocumentAttachment.fromJson(d))
            .toList();
      }
    }

    List<ReminderScheduleModel> scheds = [];
    if (json['reminderSchedules'] is List) {
      scheds = (json['reminderSchedules'] as List)
          .whereType<Map<String, dynamic>>()
          .map((s) => ReminderScheduleModel.fromJson(s))
          .toList();
    }

    List<RenewalHistoryModel> history = [];
    if (json['renewalHistory'] is List) {
      history = (json['renewalHistory'] as List)
          .whereType<Map<String, dynamic>>()
          .map((h) => RenewalHistoryModel.fromJson(h))
          .toList();
    }

    return ReminderModel(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      categoryId: json['categoryId'],
      title: json['title'] ?? '',
      description: json['description'],
      ownerName: json['ownerName'],
      referenceNumber: json['referenceNumber'],
      providerName: json['providerName'],
      startDate: json['startDate'] != null ? DateTime.tryParse(json['startDate']) : null,
      expiryDate: DateTime.parse(json['expiryDate']),
      status: json['status'] ?? 'active',
      isRecurring: json['isRecurring'] ?? false,
      recurrenceType: json['recurrenceType'],
      daysRemaining: json['daysRemaining'] is int
          ? json['daysRemaining']
          : int.tryParse(json['daysRemaining']?.toString() ?? '0') ?? 0,
      computedStatus: json['computedStatus'] ?? 'active',
      category: json['category'] != null ? CategoryModel.fromJson(json['category']) : null,
      documents: docs,
      schedules: scheds,
      renewalHistory: history,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }
}
