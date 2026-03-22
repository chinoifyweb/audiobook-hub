"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DocumentReader } from "@/components/lms/document-reader";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Download,
} from "lucide-react";

interface MaterialData {
  id: string;
  title: string;
  description: string | null;
  type: string;
  contentUrl: string;
  sortOrder: number;
  completed: boolean;
}

interface ReadPageData {
  material: MaterialData;
  courseTitle: string;
  courseCode: string;
  courseAssignmentId: string;
  prevMaterial: { id: string; title: string } | null;
  nextMaterial: { id: string; title: string } | null;
}

export default function ReadMaterialPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<ReadPageData | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const courseId = params.id as string;
  const materialId = params.materialId as string;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        // Fetch the course content to find this material and its neighbors
        const res = await fetch(`/api/courses/${courseId}/content`);
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || "Failed to load material");
          return;
        }

        const courseData = await res.json();
        const allMaterials: MaterialData[] = courseData.sessions.flatMap(
          (s: { materials: MaterialData[] }) => s.materials
        );

        const currentIndex = allMaterials.findIndex(
          (m) => m.id === materialId
        );

        if (currentIndex === -1) {
          setError("Material not found");
          return;
        }

        const material = allMaterials[currentIndex];
        const prevMaterial =
          currentIndex > 0
            ? {
                id: allMaterials[currentIndex - 1].id,
                title: allMaterials[currentIndex - 1].title,
              }
            : null;
        const nextMaterial =
          currentIndex < allMaterials.length - 1
            ? {
                id: allMaterials[currentIndex + 1].id,
                title: allMaterials[currentIndex + 1].title,
              }
            : null;

        setData({
          material,
          courseTitle: courseData.course.title,
          courseCode: courseData.course.code,
          courseAssignmentId: courseId,
          prevMaterial,
          nextMaterial,
        });
      } catch {
        setError("Failed to load material");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [courseId, materialId]);

  const handleMarkComplete = useCallback(
    async (completed: boolean) => {
      if (isUpdating || !data) return;
      setIsUpdating(true);

      try {
        const res = await fetch(`/api/courses/${courseId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ materialId, completed }),
        });

        if (res.ok) {
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  material: { ...prev.material, completed },
                }
              : prev
          );
        }
      } catch {
        // Silent fail
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, data, courseId, materialId]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500">Loading document...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-600 mb-4">{error || "Failed to load"}</p>
        <Link
          href={`/courses/${courseId}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Course
        </Link>
      </div>
    );
  }

  const { material, courseTitle, courseCode, prevMaterial, nextMaterial } = data;
  const fileName =
    material.contentUrl.split("/").pop()?.split("?")[0] || material.title;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-4 sm:-m-6">
      {/* Top header bar */}
      <div className="bg-white border-b px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/courses/${courseId}`}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Course</span>
          </Link>
          <div className="h-5 w-px bg-gray-200 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-gray-900 truncate">
              {material.title}
            </h1>
            <p className="text-xs text-gray-500 truncate">
              {courseCode} - {courseTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Mark Complete */}
          <button
            onClick={() => handleMarkComplete(!material.completed)}
            disabled={isUpdating}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              material.completed
                ? "bg-green-50 text-green-700 hover:bg-green-100"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            } ${isUpdating ? "opacity-50" : ""}`}
          >
            {material.completed ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Circle className="h-3.5 w-3.5" />
            )}
            {material.completed ? "Completed" : "Mark Complete"}
          </button>

          {/* Download */}
          <a
            href={material.contentUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download</span>
          </a>
        </div>
      </div>

      {/* Document Reader */}
      <div className="flex-1 min-h-0">
        <DocumentReader
          fileUrl={material.contentUrl}
          fileName={fileName}
          fileType={material.type === "document" ? undefined : material.type}
        />
      </div>

      {/* Bottom navigation bar */}
      <div className="bg-white border-t px-4 py-2.5 flex items-center justify-between shrink-0">
        <div>
          {prevMaterial ? (
            <Link
              href={`/courses/${courseId}/read/${prevMaterial.id}`}
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline max-w-[200px] truncate">
                {prevMaterial.title}
              </span>
              <span className="sm:hidden">Previous</span>
            </Link>
          ) : (
            <span />
          )}
        </div>

        {/* Mobile mark complete */}
        <button
          onClick={() => handleMarkComplete(!material.completed)}
          disabled={isUpdating}
          className={`sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            material.completed
              ? "bg-green-50 text-green-700"
              : "bg-blue-600 text-white"
          } ${isUpdating ? "opacity-50" : ""}`}
        >
          {material.completed ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <Circle className="h-3.5 w-3.5" />
          )}
          {material.completed ? "Done" : "Complete"}
        </button>

        <div>
          {nextMaterial ? (
            <Link
              href={`/courses/${courseId}/read/${nextMaterial.id}`}
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <span className="hidden sm:inline max-w-[200px] truncate">
                {nextMaterial.title}
              </span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  );
}
