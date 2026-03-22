"use client";

import { VideoPlayer } from "./video-player";
import { Button } from "@repo/ui";
import {
  FileText,
  Download,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  Circle,
  ChevronRight,
} from "lucide-react";
import type { CourseMaterial } from "./course-sidebar";

interface MaterialViewerProps {
  material: CourseMaterial;
  onMarkComplete: (materialId: string, completed: boolean) => void;
  onNext: (() => void) | null;
  isUpdating: boolean;
}

export function MaterialViewer({
  material,
  onMarkComplete,
  onNext,
  isUpdating,
}: MaterialViewerProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Material header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{material.title}</h2>
            {material.description && (
              <p className="mt-1 text-sm text-gray-500">{material.description}</p>
            )}
          </div>
          <button
            onClick={() => onMarkComplete(material.id, !material.completed)}
            disabled={isUpdating}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              material.completed
                ? "bg-green-50 text-green-700 hover:bg-green-100"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {material.completed ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
            {material.completed ? "Completed" : "Mark Complete"}
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {material.type === "youtube_video" && (
          <VideoPlayer
            url={material.contentUrl}
            title={material.title}
            type="youtube_video"
          />
        )}

        {material.type === "pdf" && (
          <div className="p-6">
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-20 w-16 bg-red-50 rounded-lg flex items-center justify-center">
                <FileText className="h-10 w-10 text-red-500" />
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-900">{material.title}</p>
                <p className="text-sm text-gray-500 mt-1">PDF Document</p>
              </div>
              <div className="flex gap-3">
                <a
                  href={material.contentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in new tab
                  </Button>
                </a>
                <a href={material.contentUrl} download>
                  <Button size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </a>
              </div>
            </div>
            {/* Embed PDF */}
            <div className="mt-4">
              <iframe
                src={`${material.contentUrl}#view=FitH`}
                className="w-full rounded-lg border"
                style={{ height: "70vh" }}
                title={material.title}
              />
            </div>
          </div>
        )}

        {material.type === "ebook" && (
          <div className="p-6">
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-20 w-16 bg-blue-50 rounded-lg flex items-center justify-center">
                <BookOpen className="h-10 w-10 text-blue-500" />
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-900">{material.title}</p>
                <p className="text-sm text-gray-500 mt-1">E-Book</p>
              </div>
              <div className="flex gap-3">
                <a
                  href={material.contentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Reader
                  </Button>
                </a>
                <a href={material.contentUrl} download>
                  <Button size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}

        {material.type === "document" && (
          <div className="p-6">
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-20 w-16 bg-purple-50 rounded-lg flex items-center justify-center">
                <FileText className="h-10 w-10 text-purple-500" />
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-900">{material.title}</p>
                <p className="text-sm text-gray-500 mt-1">Document</p>
              </div>
              <div className="flex gap-3">
                <a
                  href={material.contentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Document
                  </Button>
                </a>
                <a href={material.contentUrl} download>
                  <Button size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}

        {material.type === "link" && (
          <div className="p-6">
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-20 w-16 bg-indigo-50 rounded-lg flex items-center justify-center">
                <ExternalLink className="h-10 w-10 text-indigo-500" />
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-900">{material.title}</p>
                <p className="text-sm text-gray-500 mt-1">External Resource</p>
              </div>
              <a
                href={material.contentUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Link
                </Button>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => onMarkComplete(material.id, !material.completed)}
          disabled={isUpdating}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            material.completed
              ? "bg-green-100 text-green-700"
              : "bg-blue-600 text-white hover:bg-blue-700"
          } ${isUpdating ? "opacity-50" : ""}`}
        >
          {material.completed ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Completed
            </>
          ) : (
            <>
              <Circle className="h-4 w-4" />
              Mark as Complete
            </>
          )}
        </button>

        {onNext && (
          <Button onClick={onNext} variant="outline">
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
