import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../models/category_model.dart';
import '../models/reminder_model.dart';
import '../models/dashboard_model.dart';

class ApiService {
  static const String _defaultBaseUrl = 'https://renewitnp.netlify.app';
  static const String _prefBaseUrlKey = 'vps_base_url';
  static const String _prefTokenKey = 'auth_token';
  static const String _prefUserKey = 'auth_user';

  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String _baseUrl = _defaultBaseUrl;
  String? _token;
  UserModel? _currentUser;

  String get baseUrl => _baseUrl;
  String? get token => _token;
  UserModel? get currentUser => _currentUser;
  bool get isAuthenticated => _token != null && _token!.isNotEmpty;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _baseUrl = prefs.getString(_prefBaseUrlKey) ?? _defaultBaseUrl;
    _token = prefs.getString(_prefTokenKey);
    final userJson = prefs.getString(_prefUserKey);
    if (userJson != null) {
      try {
        _currentUser = UserModel.fromJson(jsonDecode(userJson));
      } catch (_) {}
    }
  }

  Future<void> setBaseUrl(String url) async {
    String cleanUrl = url.trim();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.substring(0, cleanUrl.length - 1);
    }
    _baseUrl = cleanUrl;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefBaseUrlKey, cleanUrl);
  }

  Future<void> resetBaseUrl() async {
    await setBaseUrl(_defaultBaseUrl);
  }

  Map<String, String> _headers([bool isJson = true]) {
    final headers = <String, String>{};
    if (isJson) {
      headers['Content-Type'] = 'application/json';
      headers['Accept'] = 'application/json';
    }
    if (_token != null && _token!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $_token';
    }
    return headers;
  }

  // ─── AUTH ──────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> login(String email, String password) async {
    final url = Uri.parse('$_baseUrl/api/mobile/auth/login');
    try {
      final response = await http
          .post(
            url,
            headers: _headers(),
            body: jsonEncode({'email': email, 'password': password}),
          )
          .timeout(const Duration(seconds: 15));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        _token = data['token'];
        _currentUser = UserModel.fromJson(data['user']);

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_prefTokenKey, _token!);
        await prefs.setString(_prefUserKey, jsonEncode(_currentUser!.toJson()));

        return {'success': true, 'user': _currentUser};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Login failed. Please check credentials.',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  Future<Map<String, dynamic>> register(
      String name, String email, String password) async {
    final url = Uri.parse('$_baseUrl/api/mobile/auth/register');
    try {
      final response = await http
          .post(
            url,
            headers: _headers(),
            body: jsonEncode({'name': name, 'email': email, 'password': password}),
          )
          .timeout(const Duration(seconds: 15));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        _token = data['token'];
        _currentUser = UserModel.fromJson(data['user']);

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_prefTokenKey, _token!);
        await prefs.setString(_prefUserKey, jsonEncode(_currentUser!.toJson()));

        return {'success': true, 'user': _currentUser};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Registration failed',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  Future<void> logout() async {
    _token = null;
    _currentUser = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_prefTokenKey);
    await prefs.remove(_prefUserKey);
  }

  // ─── DASHBOARD ──────────────────────────────────────────────────────────

  Future<DashboardData?> getDashboard() async {
    final url = Uri.parse('$_baseUrl/api/mobile/dashboard');
    try {
      final response = await http
          .get(url, headers: _headers())
          .timeout(const Duration(seconds: 15));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return DashboardData.fromJson(data);
        }
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  // ─── CATEGORIES ─────────────────────────────────────────────────────────

  Future<List<CategoryModel>> getCategories() async {
    final url = Uri.parse('$_baseUrl/api/mobile/categories');
    try {
      final response = await http
          .get(url, headers: _headers())
          .timeout(const Duration(seconds: 15));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['data'] is List) {
          return (data['data'] as List)
              .whereType<Map<String, dynamic>>()
              .map((c) => CategoryModel.fromJson(c))
              .toList();
        }
      }
    } catch (_) {}
    return [];
  }

  // ─── REMINDERS ──────────────────────────────────────────────────────────

  Future<List<ReminderModel>> getReminders({
    String? status,
    String? categoryId,
    String? search,
    int page = 1,
    int pageSize = 50,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'pageSize': pageSize.toString(),
    };
    if (status != null && status.isNotEmpty) queryParams['status'] = status;
    if (categoryId != null && categoryId.isNotEmpty) {
      queryParams['categoryId'] = categoryId;
    }
    if (search != null && search.isNotEmpty) queryParams['search'] = search;

    final url = Uri.parse('$_baseUrl/api/mobile/reminders')
        .replace(queryParameters: queryParams);

    try {
      final response = await http
          .get(url, headers: _headers())
          .timeout(const Duration(seconds: 15));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['data'] is List) {
          return (data['data'] as List)
              .whereType<Map<String, dynamic>>()
              .map((r) => ReminderModel.fromJson(r))
              .toList();
        }
      }
    } catch (_) {}
    return [];
  }

  Future<ReminderModel?> getReminder(String id) async {
    final url = Uri.parse('$_baseUrl/api/mobile/reminders/$id');
    try {
      final response = await http
          .get(url, headers: _headers())
          .timeout(const Duration(seconds: 15));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['data'] != null) {
          return ReminderModel.fromJson(data['data']);
        }
      }
    } catch (_) {}
    return null;
  }

  Future<Map<String, dynamic>> createReminder(Map<String, dynamic> reminderData) async {
    final url = Uri.parse('$_baseUrl/api/mobile/reminders');
    try {
      final response = await http
          .post(url, headers: _headers(), body: jsonEncode(reminderData))
          .timeout(const Duration(seconds: 15));
      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        return {'success': true, 'data': ReminderModel.fromJson(data['data'])};
      }
      return {'success': false, 'message': data['message'] ?? 'Failed to save'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  Future<Map<String, dynamic>> updateReminder(
      String id, Map<String, dynamic> reminderData) async {
    final url = Uri.parse('$_baseUrl/api/mobile/reminders/$id');
    try {
      final response = await http
          .patch(url, headers: _headers(), body: jsonEncode(reminderData))
          .timeout(const Duration(seconds: 15));
      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        return {'success': true, 'data': ReminderModel.fromJson(data['data'])};
      }
      return {'success': false, 'message': data['message'] ?? 'Failed to update'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  Future<Map<String, dynamic>> renewReminder(
      String id, String newExpiryDate, String? notes) async {
    final url = Uri.parse('$_baseUrl/api/mobile/reminders/$id/renew');
    try {
      final response = await http
          .post(
            url,
            headers: _headers(),
            body: jsonEncode({
              'newExpiryDate': newExpiryDate,
              'notes': notes,
            }),
          )
          .timeout(const Duration(seconds: 15));
      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        return {'success': true, 'data': ReminderModel.fromJson(data['data'])};
      }
      return {'success': false, 'message': data['message'] ?? 'Renewal failed'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  Future<bool> deleteReminder(String id) async {
    final url = Uri.parse('$_baseUrl/api/mobile/reminders/$id');
    try {
      final response = await http
          .delete(url, headers: _headers())
          .timeout(const Duration(seconds: 15));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['success'] == true;
      }
    } catch (_) {}
    return false;
  }

  // ─── UPLOAD DOCUMENT / CAMERA SCAN ──────────────────────────────────────

  Future<DocumentAttachment?> uploadDocument(File file, [String? customName]) async {
    final url = Uri.parse('$_baseUrl/api/mobile/upload');
    try {
      final request = http.MultipartRequest('POST', url);
      request.headers.addAll(_headers(false));
      if (customName != null && customName.isNotEmpty) {
        request.fields['name'] = customName;
      }

      final multipartFile = await http.MultipartFile.fromPath('file', file.path);
      request.files.add(multipartFile);

      final streamedResponse = await request.send().timeout(const Duration(seconds: 30));
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['data'] != null) {
          return DocumentAttachment.fromJson(data['data']);
        }
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  // ─── SETTINGS ───────────────────────────────────────────────────────────

  Future<Map<String, dynamic>?> getSettings() async {
    final url = Uri.parse('$_baseUrl/api/mobile/settings');
    try {
      final response = await http
          .get(url, headers: _headers())
          .timeout(const Duration(seconds: 15));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data['data'];
        }
      }
    } catch (_) {}
    return null;
  }

  Future<Map<String, dynamic>> updateSettings(Map<String, dynamic> settingsData) async {
    final url = Uri.parse('$_baseUrl/api/mobile/settings');
    try {
      final response = await http
          .patch(url, headers: _headers(), body: jsonEncode(settingsData))
          .timeout(const Duration(seconds: 15));
      final data = jsonDecode(response.body);
      return data;
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }
}
