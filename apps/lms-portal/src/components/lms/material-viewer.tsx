"use client";

import { VideoPlayer } from "./video-player";
import { DocumentReader } from "./document-reader";
import { Button } from "@repo/ui";
import {
  FileText,
  Download,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  Circle,
  ChevronRight,
  Maximize2,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { CourseMaterial } from "./course-sidebar";

interface MaterialViewerProps {
  material: CourseMaterial;
  onMarkComplete: (materialId: string, completed: boolean) => void;
  onNext: (() => void) | null;
  isUpdating: boolean;
}

function isReadableType(type: string): boolean {
  return ["pdf", "document", "ebook"].includes(type);
}

export function MaterialViewer({
  material,
  onMarkComplete,
  onNext,
  isUpdating,
}: MaterialViewerProps) {
  const params = useParams();
  const courseId = params.id as string;

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
          <div>
            {/* Action bar */}
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-8 bg-red-50 rounded flex items-center justify-center">
                  <FileText className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">{material.title}</p>
                  <p className="text-xs text-gray-500">PDF Document</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/courses/${courseId}/read/${material.id}`}>
                  <Button size="sm" className="gap-1.5">
                    <BookOpen className="h-4 w-4" />
                    Read Online
                  </Button>
                </Link>
                <a href={material.contentUrl} download>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </a>
              </div>
            </div>
            {/* Embedded PDF viewer */}
            <div>
              <DocumentReader
                fileUrl={material.contentUrl}
                fileName={material.title}
                fileType="pdf"
              />
            </div>
          </div>
        )}

        {material.type === "ebook" && (
          <div>
            {/* Action bar */}
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-8 bg-blue-50 rounded flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">{material.title}</p>
                  <p className="text-xs text-gray-500">E-Book</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/courses/${courseId}/read/${material.id}`}>
                  <Button size="sm" className="gap-1.5">
                    <BookOpen className="h-4 w-4" />
                    Read Online
                  </Button>
                </Link>
                <a href={material.contentUrl} download>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </a>
              </div>
            </div>
            {/* Embedded viewer */}
            <div>
              <DocumentReader
                fileUrl={material.contentUrl}
                fileName={material.title}
                fileType="ebook"
              />
            </div>
          </div>
        )}

        {material.type === "document" && (
          <div>
            {/* Action bar */}
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-8 bg-purple-50 rounded flex items-center justify-center">
                  <FileText className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">{material.title}</p>
                  <p className="text-xs text-gray-500">Document</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/courses/${courseId}/read/${material.id}`}>
                  <Button size="sm" className="gap-1.5">
                    <BookOpen className="h-4 w-4" />
                    Read Online
                  </Button>
                </Link>
                <a href={material.contentUrl} download>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </a>
              </div>
            </div>
            {/* Embedded viewer */}
            <div>
              <DocumentReader
                fileUrl={material.contentUrl}
                fileName={material.title}
              />
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
