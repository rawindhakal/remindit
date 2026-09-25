class UserModel {
  final String id;
  final String email;
  final String? name;
  final String role;
  final String? timezone;

  UserModel({
    required this.id,
    required this.email,
    this.name,
    required this.role,
    this.timezone,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      name: json['name'],
      role: json['role'] ?? 'user',
      timezone: json['timezone'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'role': role,
      'timezone': timezone,
    };
  }
}
