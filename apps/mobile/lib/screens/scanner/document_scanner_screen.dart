import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../services/image_processor.dart';

class ScannedPage {
  final Uint8List originalBytes;
  final String originalName;
  Rect cropRect; // Normalized 0.0 - 1.0
  int rotation; // 0, 90, 180, 270
  ScannerFilter filter;

  ScannedPage({
    required this.originalBytes,
    required this.originalName,
    this.cropRect = const Rect.fromLTWH(0.05, 0.05, 0.9, 0.9),
    this.rotation = 0,
    this.filter = ScannerFilter.magicColor,
  });
}

class DocumentScannerScreen extends StatefulWidget {
  final XFile initialImage;
  final String documentTitle;

  const DocumentScannerScreen({
    super.key,
    required this.initialImage,
    this.documentTitle = 'Document',
  });

  @override
  State<DocumentScannerScreen> createState() => _DocumentScannerScreenState();
}

class _DocumentScannerScreenState extends State<DocumentScannerScreen> {
  final List<ScannedPage> _pages = [];
  int _currentPageIndex = 0;
  bool _isLoading = true;
  bool _isProcessing = false;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _loadInitialPage();
  }

  Future<void> _loadInitialPage() async {
    final bytes = await widget.initialImage.readAsBytes();
    if (mounted) {
      setState(() {
        _pages.add(
          ScannedPage(
            originalBytes: bytes,
            originalName: widget.initialImage.name.isNotEmpty
                ? widget.initialImage.name
                : 'scan_page_1.jpg',
          ),
        );
        _isLoading = false;
      });
    }
  }

  ScannedPage get _currentPage => _pages[_currentPageIndex];

  void _rotateClockwise() {
    setState(() {
      _currentPage.rotation = (_currentPage.rotation + 90) % 360;
    });
  }

  void _setFilter(ScannerFilter filter) {
    setState(() {
      _currentPage.filter = filter;
    });
  }

  void _applyAspectRatio(double? ratio) {
    setState(() {
      if (ratio == null) {
        // Full / Reset
        _currentPage.cropRect = const Rect.fromLTWH(0.0, 0.0, 1.0, 1.0);
      } else {
        // Center aspect ratio box
        double w = 0.85;
        double h = w / ratio;
        if (h > 0.85) {
          h = 0.85;
          w = h * ratio;
        }
        final left = (1.0 - w) / 2;
        final top = (1.0 - h) / 2;
        _currentPage.cropRect = Rect.fromLTWH(left, top, w, h);
      }
    });
  }

  Future<void> _addNewPage(ImageSource source) async {
    try {
      final XFile? image = await _picker.pickImage(
        source: source,
        imageQuality: 90,
      );
      if (image == null) return;

      final bytes = await image.readAsBytes();
      if (mounted) {
        setState(() {
          _pages.add(
            ScannedPage(
              originalBytes: bytes,
              originalName:
                  'scan_page_${_pages.length + 1}.jpg',
            ),
          );
          _currentPageIndex = _pages.length - 1;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error adding page: $e')),
        );
      }
    }
  }

  Future<void> _finishScanning() async {
    setState(() => _isProcessing = true);

    try {
      final List<XFile> processedFiles = [];

      for (int i = 0; i < _pages.length; i++) {
        final page = _pages[i];
        final processedBytes = await compute(
          _processInWorker,
          _ProcessJob(
            rawBytes: page.originalBytes,
            cropRect: page.cropRect,
            rotation: page.rotation,
            filter: page.filter,
          ),
        );

        final fileName = _pages.length > 1
            ? '${widget.documentTitle.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '_')}_page_${i + 1}.jpg'
            : '${widget.documentTitle.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '_')}_scan.jpg';

        final xfile = XFile.fromData(
          processedBytes,
          name: fileName,
          mimeType: 'image/jpeg',
        );
        processedFiles.add(xfile);
      }

      if (mounted) {
        Navigator.pop(context, processedFiles);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isProcessing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error processing scan: $e')),
        );
      }
    }
  }

  static Uint8List _processInWorker(_ProcessJob job) {
    return ImageProcessor.processDocument(
      rawBytes: job.rawBytes,
      normalizedCropRect: job.cropRect,
      rotationDegrees: job.rotation,
      filter: job.filter,
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: CircularProgressIndicator(color: Colors.white),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A), // Dark slate
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text(
          _pages.length > 1
              ? 'Scan Document (Page ${_currentPageIndex + 1}/${_pages.length})'
              : 'Scan & Crop Document',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.rotate_90_degrees_cw, color: Colors.white),
            tooltip: 'Rotate 90°',
            onPressed: _rotateClockwise,
          ),
          TextButton(
            onPressed: _isProcessing ? null : _finishScanning,
            child: _isProcessing
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Text(
                    'Done',
                    style: TextStyle(
                      color: Color(0xFF38BDF8), // Sky blue
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Multi-page selector bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: const Color(0xFF1E293B),
            child: Row(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: List.generate(_pages.length, (idx) {
                        final isSel = idx == _currentPageIndex;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text(
                              idx == 0
                                  ? 'Front Side'
                                  : (idx == 1
                                      ? 'Back Side'
                                      : 'Page ${idx + 1}'),
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: isSel ? Colors.white : Colors.grey.shade400,
                              ),
                            ),
                            selected: isSel,
                            selectedColor: const Color(0xFF2563EB),
                            backgroundColor: const Color(0xFF334155),
                            onSelected: (_) {
                              setState(() {
                                _currentPageIndex = idx;
                              });
                            },
                          ),
                        );
                      }),
                    ),
                  ),
                ),
                // Add page popup
                PopupMenuButton<ImageSource>(
                  tooltip: 'Add another side / page',
                  icon: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF2563EB),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.add_a_photo, size: 14, color: Colors.white),
                        SizedBox(width: 4),
                        Text(
                          '+ Back',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  onSelected: _addNewPage,
                  itemBuilder: (ctx) => const [
                    PopupMenuItem(
                      value: ImageSource.camera,
                      child: Row(
                        children: [
                          Icon(Icons.camera_alt, size: 18),
                          SizedBox(width: 8),
                          Text('Camera (Back Side)'),
                        ],
                      ),
                    ),
                    PopupMenuItem(
                      value: ImageSource.gallery,
                      child: Row(
                        children: [
                          Icon(Icons.photo_library, size: 18),
                          SizedBox(width: 8),
                          Text('Gallery (Back Side)'),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Main Interactive Crop & Preview Area
          Expanded(
            child: Container(
              color: Colors.black,
              child: LayoutBuilder(
                builder: (context, constraints) {
                  return Stack(
                    fit: StackFit.expand,
                    children: [
                      // Rotated & Filtered Image Preview
                      Center(
                        child: RotatedBox(
                          quarterTurns: _currentPage.rotation ~/ 90,
                          child: Image.memory(
                            _currentPage.originalBytes,
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),

                      // Interactive Drag-to-Crop Overlay
                      CropOverlay(
                        cropRect: _currentPage.cropRect,
                        onCropChanged: (newRect) {
                          setState(() {
                            _currentPage.cropRect = newRect;
                          });
                        },
                      ),
                    ],
                  );
                },
              ),
            ),
          ),

          // Aspect Ratio Presets Bar
          Container(
            color: const Color(0xFF1E293B),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildAspectBtn('Free', () => _applyAspectRatio(null)),
                _buildAspectBtn('ID Card (3:2)', () => _applyAspectRatio(3 / 2)),
                _buildAspectBtn('A4 Doc (1:1.41)', () => _applyAspectRatio(1 / 1.41)),
                _buildAspectBtn('Full', () => _applyAspectRatio(null)),
              ],
            ),
          ),

          // CamScanner Filter Presets Bar
          Container(
            color: const Color(0xFF0F172A),
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildFilterItem(
                  filter: ScannerFilter.magicColor,
                  label: 'Magic Color',
                  icon: Icons.auto_awesome,
                  color: Colors.amber,
                ),
                _buildFilterItem(
                  filter: ScannerFilter.cleanBw,
                  label: 'Clean B&W',
                  icon: Icons.filter_b_and_w,
                  color: Colors.white,
                ),
                _buildFilterItem(
                  filter: ScannerFilter.grayscale,
                  label: 'Grayscale',
                  icon: Icons.contrast,
                  color: Colors.grey.shade400,
                ),
                _buildFilterItem(
                  filter: ScannerFilter.lighten,
                  label: 'Lighten',
                  icon: Icons.wb_sunny_outlined,
                  color: Colors.orangeAccent,
                ),
                _buildFilterItem(
                  filter: ScannerFilter.original,
                  label: 'Original',
                  icon: Icons.image_outlined,
                  color: Colors.blueAccent,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAspectBtn(String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: const Color(0xFF334155),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
      ),
    );
  }

  Widget _buildFilterItem({
    required ScannerFilter filter,
    required String label,
    required IconData icon,
    required Color color,
  }) {
    final isSelected = _currentPage.filter == filter;

    return GestureDetector(
      onTap: () => _setFilter(filter),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: isSelected
                  ? const Color(0xFF2563EB)
                  : const Color(0xFF1E293B),
              shape: BoxShape.circle,
              border: Border.all(
                color: isSelected ? Colors.white : Colors.transparent,
                width: 2,
              ),
            ),
            child: Icon(icon, color: isSelected ? Colors.white : color, size: 20),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              color: isSelected ? Colors.white : Colors.grey.shade400,
            ),
          ),
        ],
      ),
    );
  }
}

class _ProcessJob {
  final Uint8List rawBytes;
  final Rect cropRect;
  final int rotation;
  final ScannerFilter filter;

  _ProcessJob({
    required this.rawBytes,
    required this.cropRect,
    required this.rotation,
    required this.filter,
  });
}

/// Interactive draggable crop bounding box with 4 corners and semi-transparent mask
class CropOverlay extends StatefulWidget {
  final Rect cropRect;
  final ValueChanged<Rect> onCropChanged;

  const CropOverlay({
    super.key,
    required this.cropRect,
    required this.onCropChanged,
  });

  @override
  State<CropOverlay> createState() => _CropOverlayState();
}

class _CropOverlayState extends State<CropOverlay> {
  int? _activeCorner; // 0: TL, 1: TR, 2: BR, 3: BL, 4: Center Drag

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final w = constraints.maxWidth;
        final h = constraints.maxHeight;

        final rectPx = Rect.fromLTWH(
          widget.cropRect.left * w,
          widget.cropRect.top * h,
          widget.cropRect.width * w,
          widget.cropRect.height * h,
        );

        return GestureDetector(
          onPanStart: (details) {
            final pos = details.localPosition;
            const handleRadius = 36.0;

            final tl = rectPx.topLeft;
            final tr = rectPx.topRight;
            final br = rectPx.bottomRight;
            final bl = rectPx.bottomLeft;

            if ((pos - tl).distance <= handleRadius) {
              _activeCorner = 0;
            } else if ((pos - tr).distance <= handleRadius) {
              _activeCorner = 1;
            } else if ((pos - br).distance <= handleRadius) {
              _activeCorner = 2;
            } else if ((pos - bl).distance <= handleRadius) {
              _activeCorner = 3;
            } else if (rectPx.contains(pos)) {
              _activeCorner = 4; // Move entire rect
            } else {
              _activeCorner = null;
            }
          },
          onPanUpdate: (details) {
            if (_activeCorner == null) return;

            final dxNorm = details.delta.dx / w;
            final dyNorm = details.delta.dy / h;

            double left = widget.cropRect.left;
            double top = widget.cropRect.top;
            double right = widget.cropRect.right;
            double bottom = widget.cropRect.bottom;

            const minSize = 0.15;

            switch (_activeCorner) {
              case 0: // Top-Left
                left = (left + dxNorm).clamp(0.0, right - minSize);
                top = (top + dyNorm).clamp(0.0, bottom - minSize);
                break;
              case 1: // Top-Right
                right = (right + dxNorm).clamp(left + minSize, 1.0);
                top = (top + dyNorm).clamp(0.0, bottom - minSize);
                break;
              case 2: // Bottom-Right
                right = (right + dxNorm).clamp(left + minSize, 1.0);
                bottom = (bottom + dyNorm).clamp(top + minSize, 1.0);
                break;
              case 3: // Bottom-Left
                left = (left + dxNorm).clamp(0.0, right - minSize);
                bottom = (bottom + dyNorm).clamp(top + minSize, 1.0);
                break;
              case 4: // Move center
                final rw = widget.cropRect.width;
                final rh = widget.cropRect.height;
                left = (left + dxNorm).clamp(0.0, 1.0 - rw);
                top = (top + dyNorm).clamp(0.0, 1.0 - rh);
                right = left + rw;
                bottom = top + rh;
                break;
            }

            widget.onCropChanged(
              Rect.fromLTRB(left, top, right, bottom),
            );
          },
          onPanEnd: (_) {
            _activeCorner = null;
          },
          child: CustomPaint(
            size: Size(w, h),
            painter: _CropPainter(rectPx: rectPx),
          ),
        );
      },
    );
  }
}

class _CropPainter extends CustomPainter {
  final Rect rectPx;

  _CropPainter({required this.rectPx});

  @override
  void paint(Canvas canvas, Size size) {
    // 1. Dark mask outside crop rect
    final maskPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.6)
      ..style = PaintingStyle.fill;

    final fullPath = Path()..addRect(Rect.fromLTWH(0, 0, size.width, size.height));
    final cropPath = Path()..addRect(rectPx);
    final diffPath = Path.combine(PathOperation.difference, fullPath, cropPath);
    canvas.drawPath(diffPath, maskPaint);

    // 2. Crop border box
    final borderPaint = Paint()
      ..color = const Color(0xFF38BDF8) // Sky blue
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;
    canvas.drawRect(rectPx, borderPaint);

    // 3. Grid guide lines
    final gridPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    final thirdW = rectPx.width / 3;
    final thirdH = rectPx.height / 3;

    canvas.drawLine(
      Offset(rectPx.left + thirdW, rectPx.top),
      Offset(rectPx.left + thirdW, rectPx.bottom),
      gridPaint,
    );
    canvas.drawLine(
      Offset(rectPx.left + thirdW * 2, rectPx.top),
      Offset(rectPx.left + thirdW * 2, rectPx.bottom),
      gridPaint,
    );
    canvas.drawLine(
      Offset(rectPx.left, rectPx.top + thirdH),
      Offset(rectPx.right, rectPx.top + thirdH),
      gridPaint,
    );
    canvas.drawLine(
      Offset(rectPx.left, rectPx.top + thirdH * 2),
      Offset(rectPx.right, rectPx.top + thirdH * 2),
      gridPaint,
    );

    // 4. Corner handles
    final cornerPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    const cornerRadius = 9.0;
    canvas.drawCircle(rectPx.topLeft, cornerRadius, cornerPaint);
    canvas.drawCircle(rectPx.topRight, cornerRadius, cornerPaint);
    canvas.drawCircle(rectPx.bottomRight, cornerRadius, cornerPaint);
    canvas.drawCircle(rectPx.bottomLeft, cornerRadius, cornerPaint);
  }

  @override
  bool shouldRepaint(covariant _CropPainter oldDelegate) {
    return oldDelegate.rectPx != rectPx;
  }
}
