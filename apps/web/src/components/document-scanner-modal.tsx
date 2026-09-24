"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  X,
  RotateCw,
  Crop,
  Sliders,
  Check,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Zap,
  ZapOff,
  SwitchCamera,
  Trash2,
  Plus,
  Loader2,
  Sparkles,
} from "lucide-react";

export interface ScannedDocument {
  id: string;
  url: string;
  filename: string;
  name: string;
  size: number;
  type: string;
  page?: string;
  uploadedAt: string;
}

interface DocumentScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentsAttached: (documents: ScannedDocument[]) => void;
  initialDocuments?: ScannedDocument[];
  title?: string;
}

type FilterMode = "original" | "magic" | "bw" | "grayscale";

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function DocumentScannerModal({
  isOpen,
  onClose,
  onDocumentsAttached,
  initialDocuments = [],
  title = "Scan or Attach Document",
}: DocumentScannerModalProps) {
  // Modes: 'camera' | 'edit' | 'gallery'
  const [mode, setMode] = useState<"camera" | "edit">("camera");

  // Camera stream state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  // Current captured / selected image
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [filterMode, setFilterMode] = useState<FilterMode>("magic");
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(115);

  // Interactive crop rectangle (in % of image width/height)
  const [crop, setCrop] = useState<CropRect>({ x: 5, y: 5, width: 90, height: 90 });
  const [isCropping, setIsCropping] = useState(true);
  const [pageLabel, setPageLabel] = useState<string>("Front Side");

  // Uploaded / scanned list of documents in this session
  const [scannedList, setScannedList] = useState<ScannedDocument[]>(initialDocuments);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize or stop camera when modal opens/closes or facingMode changes
  useEffect(() => {
    if (isOpen && mode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, mode, facingMode]);

  // Start device camera
  async function startCamera() {
    setCameraError(null);
    stopCamera();
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Camera API is not supported on this browser. Please use file upload.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);

      // Check for torch capability
      const track = stream.getVideoTracks()[0];
      const capabilities = (track as any)?.getCapabilities?.() || {};
      setHasTorch(Boolean(capabilities.torch));
    } catch (err: any) {
      console.warn("[scanner camera error]", err);
      setCameraActive(false);
      setCameraError(
        err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError"
          ? "Camera permission was denied. Please allow camera access in your browser settings, or upload an image file."
          : "Unable to access camera on this device. You can still upload files directly."
      );
    }
  }

  // Stop device camera
  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setTorchOn(false);
  }

  // Toggle Torch/Flashlight
  async function toggleTorch() {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      const nextTorch = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch (err) {
      console.warn("Torch failed", err);
    }
  }

  // Capture frame from live video
  function handleCaptureShutter() {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);

    stopCamera();
    setCapturedImage(dataUrl);
    setRotation(0);
    setCrop({ x: 4, y: 4, width: 92, height: 92 });
    setFilterMode("magic");
    setBrightness(100);
    setContrast(115);
    setMode("edit");
  }

  // File upload input handler
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      // Direct upload PDF without canvas edit
      uploadFileDirectly(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      stopCamera();
      setCapturedImage(reader.result as string);
      setRotation(0);
      setCrop({ x: 2, y: 2, width: 96, height: 96 });
      setFilterMode("magic");
      setBrightness(100);
      setContrast(115);
      setMode("edit");
    };
    reader.readAsDataURL(file);
  }

  // Direct file uploader for PDF or raw files
  async function uploadFileDirectly(file: File) {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        setScannedList((prev) => [...prev, { ...json.data, page: pageLabel }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }

  // Render processed image with filters and crop onto preview canvas
  const renderProcessedCanvas = useCallback(() => {
    if (!capturedImage) return null;

    const img = new Image();
    img.src = capturedImage;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 1. Calculate rotated source dimensions
      const is90or270 = rotation % 180 !== 0;
      const origW = is90or270 ? img.height : img.width;
      const origH = is90or270 ? img.width : img.height;

      // 2. Compute crop rectangle in source pixels
      const cropX = (crop.x / 100) * origW;
      const cropY = (crop.y / 100) * origH;
      const cropW = (crop.width / 100) * origW;
      const cropH = (crop.height / 100) * origH;

      canvas.width = Math.max(10, Math.floor(cropW));
      canvas.height = Math.max(10, Math.floor(cropH));

      // 3. Draw with rotation & crop offset
      ctx.save();
      ctx.translate(-cropX, -cropY);

      if (rotation !== 0) {
        ctx.translate(origW / 2, origH / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
      } else {
        ctx.drawImage(img, 0, 0);
      }
      ctx.restore();

      // 4. Apply document filter algorithm
      applyFilterToCanvas(ctx, canvas.width, canvas.height, filterMode, brightness, contrast);
    };
  }, [capturedImage, rotation, crop, filterMode, brightness, contrast]);

  useEffect(() => {
    if (mode === "edit") {
      renderProcessedCanvas();
    }
  }, [mode, renderProcessedCanvas]);

  // CamScanner-style pixel algorithms
  function applyFilterToCanvas(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    filter: FilterMode,
    bFactor: number,
    cFactor: number
  ) {
    if (filter === "original" && bFactor === 100 && cFactor === 100) {
      return;
    }

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // Contrast factor formula
    const contrastRatio = cFactor / 100;
    const brightnessOffset = (bFactor - 100) * 1.2;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Grayscale luminance
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      if (filter === "magic") {
        // Magic Color: adaptive background whitening & contrast boost
        r = (r - 128) * contrastRatio + 128 + brightnessOffset;
        g = (g - 128) * contrastRatio + 128 + brightnessOffset;
        b = (b - 128) * contrastRatio + 128 + brightnessOffset;

        // Whiten near-white background (paper)
        if (gray > 175) {
          r = Math.min(255, r + 25);
          g = Math.min(255, g + 25);
          b = Math.min(255, b + 25);
        }
      } else if (filter === "bw") {
        // High-contrast clean Black & White document threshold
        const threshold = 135 + (brightnessOffset * 0.5);
        const val = gray > threshold ? 255 : 0;
        r = val;
        g = val;
        b = val;
      } else if (filter === "grayscale") {
        const val = (gray - 128) * contrastRatio + 128 + brightnessOffset;
        r = val;
        g = val;
        b = val;
      } else {
        // Original with adjustments
        r = (r - 128) * contrastRatio + 128 + brightnessOffset;
        g = (g - 128) * contrastRatio + 128 + brightnessOffset;
        b = (b - 128) * contrastRatio + 128 + brightnessOffset;
      }

      data[i] = Math.min(255, Math.max(0, r));
      data[i + 1] = Math.min(255, Math.max(0, g));
      data[i + 2] = Math.min(255, Math.max(0, b));
    }

    ctx.putImageData(imgData, 0, 0);
  }

  // Save and upload the processed document
  async function handleSaveCurrentScan() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsProcessing(true);
    try {
      // Convert canvas to Blob
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/webp", 0.92)
      );

      if (!blob) throw new Error("Could not generate image blob");

      const file = new File([blob], `${pageLabel.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}.webp`, {
        type: "image/webp",
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", `${pageLabel} (${new Date().toLocaleDateString()})`);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        const newDoc: ScannedDocument = {
          ...json.data,
          page: pageLabel,
        };
        setScannedList((prev) => [...prev, newDoc]);
        // Reset editor state
        setCapturedImage(null);
        setPageLabel(scannedList.length === 0 ? "Back Side" : `Page ${scannedList.length + 2}`);
        setMode("camera");
      }
    } catch (err) {
      console.error("[save scan error]", err);
    } finally {
      setIsProcessing(false);
    }
  }

  // Complete and return all scanned documents to parent
  function handleFinishAndAttach() {
    onDocumentsAttached(scannedList);
    onClose();
  }

  // Remove a document from this session's list
  function handleRemoveDoc(id: string) {
    setScannedList((prev) => prev.filter((d) => d.id !== id));
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{title}</h3>
              <p className="text-[11px] text-slate-400">
                {scannedList.length} document{scannedList.length !== 1 ? "s" : ""} scanned &bull; Mobile Camera Ready
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* CAMERA MODE */}
          {mode === "camera" && (
            <div className="space-y-4">
              {/* Viewfinder container */}
              <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraActive ? "opacity-100" : "opacity-0"}`}
                />

                {/* Viewfinder Document Boundary Guide Overlay */}
                {cameraActive && (
                  <div className="absolute inset-6 pointer-events-none border-2 border-dashed border-blue-400/70 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.25)]">
                    {/* Corner Crosshairs */}
                    <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-blue-400 -mt-1 -ml-1 rounded-tl-sm" />
                    <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-blue-400 -mt-1 -mr-1 rounded-tr-sm" />
                    <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-blue-400 -mb-1 -ml-1 rounded-bl-sm" />
                    <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-blue-400 -mb-1 -mr-1 rounded-br-sm" />

                    <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-medium text-blue-200 border border-blue-400/30">
                      Align document inside box
                    </div>
                  </div>
                )}

                {/* Error / Fallback State */}
                {!cameraActive && (
                  <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center space-y-3 bg-slate-950">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="space-y-1 max-w-xs">
                      <div className="font-semibold text-sm text-slate-200">
                        {cameraError ? "Camera Access Notice" : "Connecting Camera..."}
                      </div>
                      <p className="text-xs text-slate-400">
                        {cameraError || "Please allow browser camera permissions to scan documents directly."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition"
                    >
                      <UploadCloud className="w-4 h-4" />
                      Upload File / Photos Instead
                    </button>
                  </div>
                )}

                {/* Camera Top Controls */}
                {cameraActive && (
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-auto">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/10">
                      Scanning: {pageLabel}
                    </span>
                    <div className="flex items-center gap-2">
                      {hasTorch && (
                        <button
                          type="button"
                          onClick={toggleTorch}
                          className={`p-2 rounded-xl backdrop-blur-md border transition ${
                            torchOn
                              ? "bg-amber-500 text-black border-amber-400"
                              : "bg-black/60 text-white border-white/10 hover:bg-black/80"
                          }`}
                        >
                          {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))}
                        className="p-2 rounded-xl bg-black/60 text-white border border-white/10 backdrop-blur-md hover:bg-black/80 transition"
                        title="Switch Camera"
                      >
                        <SwitchCamera className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Shutter / Capture Row */}
              <div className="flex items-center justify-between gap-4 px-2">
                {/* File picker button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition"
                >
                  <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-medium">Gallery / PDF</span>
                </button>

                {/* Shutter Button */}
                <button
                  type="button"
                  onClick={handleCaptureShutter}
                  disabled={!cameraActive}
                  className="relative p-1 rounded-full border-4 border-blue-500 hover:scale-105 active:scale-95 transition disabled:opacity-40 disabled:hover:scale-100"
                >
                  <div className="w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border-2 border-slate-900 bg-blue-600" />
                  </div>
                </button>

                {/* Page Label Selector */}
                <select
                  value={pageLabel}
                  onChange={(e) => setPageLabel(e.target.value)}
                  className="px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="Front Side">Front Side</option>
                  <option value="Back Side">Back Side</option>
                  <option value="Page 1">Page 1</option>
                  <option value="Page 2">Page 2</option>
                  <option value="Full Document">Full Document</option>
                  <option value="Receipt / Bill">Receipt / Bill</option>
                </select>
              </div>
            </div>
          )}

          {/* EDIT & POST-PROCESSING MODE */}
          {mode === "edit" && (
            <div className="space-y-4">
              {/* Canvas Preview Area with Crop Overlay */}
              <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
              </div>

              {/* Filter Tabs (Original, Magic Color, B&W, Grayscale) */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Document Enhancements (CamScanner Filter)
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "magic", label: "Magic Color", icon: Sparkles },
                    { id: "bw", label: "Clean B&W", icon: FileText },
                    { id: "grayscale", label: "Grayscale", icon: Sliders },
                    { id: "original", label: "Original", icon: ImageIcon },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilterMode(f.id as FilterMode)}
                      className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-xs font-semibold border transition ${
                        filterMode === f.id
                          ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20"
                          : "bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white"
                      }`}
                    >
                      <f.icon className="w-3.5 h-3.5" />
                      <span className="text-[11px] truncate">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Crop & Rotate Tools */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  Rotate 90°
                </button>

                <button
                  type="button"
                  onClick={() => setCrop({ x: 0, y: 0, width: 100, height: 100 })}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                >
                  <Crop className="w-3.5 h-3.5" />
                  Full Document
                </button>

                {/* Retake */}
                <button
                  type="button"
                  onClick={() => {
                    setCapturedImage(null);
                    setMode("camera");
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium px-3 py-2 transition"
                >
                  Retake
                </button>
              </div>

              {/* Adjustments Sliders */}
              <div className="grid grid-cols-2 gap-4 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Brightness</span>
                    <span>{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Contrast</span>
                    <span>{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Save / Next Page Action */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setCapturedImage(null);
                    setMode("camera");
                  }}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveCurrentScan}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-600/30 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Processing & Uploading...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Save & Add to Document List
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* SCANNED DOCUMENTS TRAY */}
          {scannedList.length > 0 && (
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-300">
                  Ready to Attach ({scannedList.length}):
                </div>
                {mode === "camera" && (
                  <button
                    type="button"
                    onClick={() => {
                      setPageLabel(`Page ${scannedList.length + 1}`);
                      startCamera();
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Scan Another Side
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {scannedList.map((doc, idx) => (
                  <div
                    key={doc.id || idx}
                    className="group relative p-2 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-2.5 overflow-hidden"
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {doc.type === "application/pdf" ? (
                        <FileText className="w-6 h-6 text-red-400" />
                      ) : (
                        <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs text-white truncate">{doc.page || doc.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {(doc.size / 1024).toFixed(0)} KB
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveDoc(doc.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-900 transition"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Modal Bottom Action Bar */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleFinishAndAttach}
            disabled={scannedList.length === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/30 disabled:opacity-40"
          >
            <Check className="w-4 h-4" />
            Attach {scannedList.length} Document{scannedList.length !== 1 ? "s" : ""} to Reminder
          </button>
        </div>
      </div>
    </div>
  );
}
