class CategoryModel {
  final String id;
  final String name;
  final String slug;
  final String? icon;
  final String? color;
  final String? group;
  final List<int> defaultSchedule;

  CategoryModel({
    required this.id,
    required this.name,
    required this.slug,
    this.icon,
    this.color,
    this.group,
    this.defaultSchedule = const [30, 15, 7, 3, 1, 0],
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    List<int> schedule = [30, 15, 7, 3, 1, 0];
    if (json['defaultSchedule'] != null) {
      if (json['defaultSchedule'] is List) {
        schedule = (json['defaultSchedule'] as List)
            .map((e) => int.tryParse(e.toString()) ?? 0)
            .toList();
      }
    }
    return CategoryModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
      icon: json['icon'],
      color: json['color'],
      group: json['group'],
      defaultSchedule: schedule,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'slug': slug,
      'icon': icon,
      'color': color,
      'group': group,
      'defaultSchedule': defaultSchedule,
    };
  }
}
