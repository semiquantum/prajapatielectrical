import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'employee_app.dart';
import 'owner_app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Supabase
  await Supabase.initialize(
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY',
  );
  
  runApp(const PrajapatiApp());
}

class PrajapatiApp extends StatelessWidget {
  const PrajapatiApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Prajapati Electrical',
      theme: ThemeData(
        primaryColor: const Color(0xFFFF6B00),
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        colorScheme: ColorScheme.fromSwatch().copyWith(
          secondary: const Color(0xFFFF8C38),
          brightness: Brightness.dark,
        ),
      ),
      home: const RoleSelectionScreen(),
    );
  }
}

class RoleSelectionScreen extends StatelessWidget {
  const RoleSelectionScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Select App Portal')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EmployeeApp())),
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFFF6B00)),
              child: const Text('Employee / Technician Portal'),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const OwnerApp())),
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1E293B)),
              child: const Text('Owner / Admin Portal'),
            ),
          ],
        ),
      ),
    );
  }
}
