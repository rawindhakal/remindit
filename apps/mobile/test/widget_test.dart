import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:renewit_mobile/main.dart';
import 'package:renewit_mobile/providers/auth_provider.dart';

void main() {
  testWidgets('RenewItApp smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthProvider()),
        ],
        child: const RenewItApp(),
      ),
    );
    expect(find.byType(RenewItApp), findsOneWidget);
  });
}
