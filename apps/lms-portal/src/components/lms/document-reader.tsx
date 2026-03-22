"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Download,
  Maximize2,
  Minimize2,
  Loader2,
  FileText,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Printer,
  Menu,
  X,
} from "lucide-react";

interface DocumentReaderProps {
  fileUrl: string;
  fileName: string;
  fileType?: string; // pdf, pptx, docx, epub, etc.
  onClose?: () => void;
}

function getFileExtension(url: string, fileType?: string): string {
  if (fileType) return fileType.toLowerCase();
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match ? match[1].toLowerCase() : "pdf";
}

function isPdfType(ext: string): boolean {
  return ext === "pdf";
}

function isGoogleViewerType(ext: string): boolean {
  return ["pptx", "ppt", "docx", "doc", "xlsx", "xls", "txt"].includes(ext);
}

export function DocumentReader({
  fileUrl,
  fileName,
  fileType,
  onClose,
}: DocumentReaderProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [useGoogleFallback, setUseGoogleFallback] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const ext = getFileExtension(fileUrl, fileType);
  const isPdf = isPdfType(ext);
  const isGoogleDoc = isGoogleViewerType(ext);

  // Build the viewer URL
  const getViewerUrl = useCallback(() => {
    if (isPdf && !useGoogleFallback) {
      // Native browser PDF viewer with toolbar and sidebar
      return `${fileUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`;
    }
    // Google Docs Viewer for non-PDFs or as PDF fallback
    return `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
  }, [fileUrl, isPdf, useGoogleFallback]);

  const handleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch {
        // Fallback: use CSS fullscreen
        setIsFullscreen(true);
      }
    } else {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      } catch {
        setIsFullscreen(false);
      }
    }
  }, [isFullscreen]);

  // Listen for fullscreen change events
  useEffect(() => {
    function handleFullscreenChange() {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    if (isPdf && !useGoogleFallback) {
      // Try Google Docs Viewer as fallback for PDFs
      setUseGoogleFallback(true);
      setIsLoading(true);
    } else {
      setHasError(true);
    }
  }, [isPdf, useGoogleFallback]);

  const handleDownload = useCallback(() => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [fileUrl, fileName]);

  const handlePrint = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.print();
      } catch {
        // Cross-origin restriction — open in new tab for printing
        window.open(fileUrl, "_blank");
      }
    } else {
      window.open(fileUrl, "_blank");
    }
  }, [fileUrl]);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-white rounded-lg overflow-hidden border shadow-sm ${
        isFullscreen
          ? "fixed inset-0 z-[100] rounded-none border-0"
          : "h-[80vh]"
      }`}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 bg-gray-900 text-white px-4 py-2.5 shrink-0">
        {/* Left: File info */}
        <div className="flex items-center gap-3 min-w-0">
          <FileText className="h-4 w-4 text-gray-400 shrink-0" />
          <span className="text-sm font-medium truncate">{fileName}</span>
          <span className="text-xs text-gray-400 uppercase shrink-0">
            {ext}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {isPdf && (
            <button
              onClick={handlePrint}
              className="p-2 rounded-md hover:bg-gray-700 transition-colors"
              title="Print"
            >
              <Printer className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={handleDownload}
            className="p-2 rounded-md hover:bg-gray-700 transition-colors"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </button>

          <button
            onClick={handleFullscreen}
            className="p-2 rounded-md hover:bg-gray-700 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>

          {isFullscreen && onClose && (
            <button
              onClick={() => {
                setIsFullscreen(false);
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                }
                onClose();
              }}
              className="p-2 rounded-md hover:bg-gray-700 transition-colors ml-1"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Document content area */}
      <div className="flex-1 relative bg-gray-100">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
            <p className="text-sm text-gray-500">Loading document...</p>
            {(isGoogleDoc || useGoogleFallback) && (
              <p className="text-xs text-gray-400 mt-1">
                Using Google Docs Viewer
              </p>
            )}
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50">
            <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
            <p className="text-sm font-medium text-gray-700 mb-1">
              Unable to display document
            </p>
            <p className="text-xs text-gray-500 mb-4 text-center max-w-sm">
              The document could not be loaded in the viewer. You can download it
              to view on your device.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
              >
                Open in New Tab
              </a>
            </div>
          </div>
        )}

        {/* Document iframe */}
        <iframe
          ref={iframeRef}
          src={getViewerUrl()}
          className="w-full h-full border-0"
          title={fileName}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          sandbox={isPdf && !useGoogleFallback ? undefined : "allow-scripts allow-same-origin allow-popups allow-forms"}
          allow="fullscreen"
        />
      </div>
    </div>
  );
}
