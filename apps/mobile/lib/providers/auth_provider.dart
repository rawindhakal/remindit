import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _api = ApiService();
  bool _isLoading = true;
  String? _errorMessage;

  bool get isLoading => _isLoading;
  bool get isAuthenticated => _api.isAuthenticated;
  UserModel? get currentUser => _api.currentUser;
  String get baseUrl => _api.baseUrl;
  String? get errorMessage => _errorMessage;

  Future<void> init() async {
    _isLoading = true;
    notifyListeners();
    await _api.init();
    _isLoading = false;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final result = await _api.login(email, password);
    _isLoading = false;

    if (result['success'] == true) {
      notifyListeners();
      return true;
    } else {
      _errorMessage = result['message'];
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(String name, String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final result = await _api.register(name, email, password);
    _isLoading = false;

    if (result['success'] == true) {
      notifyListeners();
      return true;
    } else {
      _errorMessage = result['message'];
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _api.logout();
    notifyListeners();
  }

  Future<void> updateServerUrl(String newUrl) async {
    await _api.setBaseUrl(newUrl);
    notifyListeners();
  }
}
