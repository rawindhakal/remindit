import 'dart:ui' as ui;
import 'package:flutter/foundation.dart';
import 'package:image/image.dart' as img;

enum ScannerFilter {
  original,
  magicColor,
  cleanBw,
  grayscale,
  lighten,
}

class ImageProcessor {
  static Uint8List processDocument({
    required Uint8List rawBytes,
    required ui.Rect normalizedCropRect, // 0.0 to 1.0 (left, top, width, height)
    required int rotationDegrees, // 0, 90, 180, 270
    required ScannerFilter filter,
  }) {
    img.Image? decoded = img.decodeImage(rawBytes);
    if (decoded == null) return rawBytes;

    // 1. Rotate if needed
    if (rotationDegrees != 0) {
      decoded = img.copyRotate(decoded, angle: rotationDegrees);
    }

    // 2. Crop
    final cropX = (normalizedCropRect.left * decoded.width)
        .clamp(0.0, (decoded.width - 1).toDouble())
        .toInt();
    final cropY = (normalizedCropRect.top * decoded.height)
        .clamp(0.0, (decoded.height - 1).toDouble())
        .toInt();
    final cropW = (normalizedCropRect.width * decoded.width)
        .clamp(1.0, (decoded.width - cropX).toDouble())
        .toInt();
    final cropH = (normalizedCropRect.height * decoded.height)
        .clamp(1.0, (decoded.height - cropY).toDouble())
        .toInt();

    decoded = img.copyCrop(
      decoded,
      x: cropX,
      y: cropY,
      width: cropW,
      height: cropH,
    );

    // 3. Apply CamScanner filters
    switch (filter) {
      case ScannerFilter.magicColor:
        // Magic Color: enhance contrast, saturate colors, sharpen text
        decoded = img.adjustColor(
          decoded,
          contrast: 1.25,
          saturation: 1.3,
          brightness: 1.08,
          gamma: 0.95,
        );
        break;

      case ScannerFilter.cleanBw:
        // Clean B&W: high-contrast document look with paper whitening
        decoded = img.grayscale(decoded);
        decoded = img.adjustColor(
          decoded,
          contrast: 1.6,
          brightness: 1.15,
        );
        break;

      case ScannerFilter.grayscale:
        decoded = img.grayscale(decoded);
        decoded = img.adjustColor(decoded, contrast: 1.15);
        break;

      case ScannerFilter.lighten:
        decoded = img.adjustColor(decoded, brightness: 1.2, contrast: 1.1);
        break;

      case ScannerFilter.original:
        break;
    }

    return Uint8List.fromList(img.encodeJpg(decoded, quality: 90));
  }
}
