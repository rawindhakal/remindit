"use client";

import React, { useState } from "react";
import {
  FileText,
  Eye,
  Download,
  Trash2,
  Camera,
  X,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Calendar,
} from "lucide-react";
import { DocumentScannerModal, ScannedDocument } from "@/components/document-scanner-modal";

interface DocumentAttachmentsProps {
  documents: ScannedDocument[];
  onChange?: (docs: ScannedDocument[]) => void;
  readOnly?: boolean;
  onSave?: (docs: ScannedDocument[]) => Promise<void>;
}

export function DocumentAttachments({
  documents = [],
  onChange,
  readOnly = false,
  onSave,
}: DocumentAttachmentsProps) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ScannedDocument | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  async function handleDocumentsAttached(newDocs: ScannedDocument[]) {
    if (onChange) {
      onChange(newDocs);
    }
    if (onSave) {
      setIsSaving(true);
      try {
        await onSave(newDocs);
      } finally {
        setIsSaving(false);
      }
    }
  }

  function handleRemove(id: string) {
    const updated = documents.filter((d) => d.id !== id);
    if (onChange) {
      onChange(updated);
    }
    if (onSave) {
      onSave(updated);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header / Action Row */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-600" />
            Documents & Scans
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
              {documents.length}
            </span>
          </h3>
          <p className="text-xs text-gray-500">
            Citizenship, Driving License, Bluebook, Policy copies & receipts
          </p>
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition shadow-sm"
          >
            <Camera className="w-3.5 h-3.5" />
            Scan / Attach
          </button>
        )}
      </div>

      {/* Empty State */}
      {documents.length === 0 ? (
        <div
          onClick={() => (!readOnly ? setScannerOpen(true) : null)}
          className={`p-6 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 text-center space-y-2 transition ${
            !readOnly ? "cursor-pointer hover:border-blue-400 hover:bg-blue-50/20" : ""
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
            <Camera className="w-5 h-5" />
          </div>
          <div className="text-xs font-semibold text-gray-700">No documents attached yet</div>
          <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
            {!readOnly
              ? "Click to open the camera scanner or upload photos of your document to keep copies safe."
              : "No scanned document files attached to this reminder."}
          </p>
        </div>
      ) : (
        /* Document Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {documents.map((doc) => (
            <div
              key={doc.id || doc.url}
              className="group relative rounded-2xl border border-gray-200 bg-white p-3 hover:border-blue-300 hover:shadow-md transition overflow-hidden flex flex-col justify-between"
            >
              <div className="flex items-start gap-3">
                {/* Thumbnail */}
                <div
                  onClick={() => setPreviewDoc(doc)}
                  className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 cursor-pointer flex items-center justify-center relative group/thumb"
                >
                  {doc.type === "application/pdf" ? (
                    <FileText className="w-8 h-8 text-rose-500" />
                  ) : (
                    <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition flex items-center justify-center text-white">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs text-gray-900 truncate" title={doc.name}>
                    {doc.page || doc.name}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {(doc.size / 1024).toFixed(0)} KB &bull; {doc.type.split("/")[1]?.toUpperCase() || "FILE"}
                  </div>
                  {doc.uploadedAt && (
                    <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-1.5 pt-2.5 mt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(doc)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition text-xs flex items-center gap-1 font-medium"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </button>

                <a
                  href={doc.url}
                  download={doc.name}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition text-xs flex items-center gap-1 font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>

                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemove(doc.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                    title="Delete document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scanner Modal */}
      <DocumentScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDocumentsAttached={handleDocumentsAttached}
        initialDocuments={documents}
      />

      {/* Fullscreen Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-white truncate max-w-xs">
                  {previewDoc.page ? `${previewDoc.page} — ` : ""} {previewDoc.name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {previewDoc.type !== "application/pdf" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] text-slate-400 w-10 text-center font-mono">
                      {(zoomLevel * 100).toFixed(0)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </>
                )}

                <a
                  href={previewDoc.url}
                  download={previewDoc.name}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setPreviewDoc(null);
                    setZoomLevel(1);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Body */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/60">
              {previewDoc.type === "application/pdf" ? (
                <iframe
                  src={previewDoc.url}
                  className="w-full h-[70vh] rounded-xl border border-slate-800"
                  title="PDF Viewer"
                />
              ) : (
                <div className="overflow-auto max-h-[75vh] flex items-center justify-center">
                  <img
                    src={previewDoc.url}
                    alt={previewDoc.name}
                    style={{ transform: `scale(${zoomLevel})`, transition: "transform 0.15s ease" }}
                    className="max-h-[70vh] object-contain rounded-xl shadow-2xl origin-center"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
