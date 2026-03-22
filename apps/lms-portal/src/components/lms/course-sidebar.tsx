"use client";

import { useState } from "react";
import { cn } from "@repo/ui";
import {
  ChevronDown,
  ChevronRight,
  Video,
  FileText,
  BookOpen,
  HelpCircle,
  Link2,
  CheckCircle2,
  Circle,
  PanelLeftClose,
  PanelLeftOpen,
  Gamepad2,
  Brain,
} from "lucide-react";

export interface CourseMaterial {
  id: string;
  title: string;
  description: string | null;
  type: string;
  contentUrl: string;
  sortOrder: number;
  completed: boolean;
}

export interface StudySession {
  number: number;
  title: string;
  materials: CourseMaterial[];
}

export interface CourseAssessment {
  id: string;
  title: string;
  type: "test" | "exam" | "assignment";
  completed: boolean;
  score?: number | null;
  maxScore?: number;
}

interface CourseSidebarProps {
  sessions: StudySession[];
  activeMaterialId: string | null;
  onSelectMaterial: (material: CourseMaterial) => void;
  courseTitle: string;
  courseCode: string;
  progress: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  assessments?: CourseAssessment[];
  onSelectAssessment?: (assessment: CourseAssessment) => void;
}

function getMaterialIcon(type: string, title: string) {
  const lowerTitle = title.toLowerCase();

  // Check for interactive learning types
  if (lowerTitle.includes("interactive learning") || lowerTitle.includes("matching")) {
    return Gamepad2;
  }
  if (lowerTitle.includes("scenario") || lowerTitle.includes("interactive")) {
    return Brain;
  }
  if (lowerTitle.includes("pop quiz")) {
    return HelpCircle;
  }

  switch (type) {
    case "youtube_video":
      return Video;
    case "pdf":
    case "document":
      return FileText;
    case "ebook":
      return BookOpen;
    case "link":
      return Link2;
    default:
      return FileText;
  }
}

function getMaterialSubLabel(type: string, title: string): string | null {
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes("introductory video") || lowerTitle.includes("intro video")) {
    return "Introductory Video";
  }
  if (type === "youtube_video") {
    return "Video Lecture";
  }
  if (lowerTitle.includes("reading")) {
    return "Reading";
  }
  if (lowerTitle.includes("interactive learning: matchi")) {
    return "Interactive Learning: Matching";
  }
  if (lowerTitle.includes("interactive learning: scenari")) {
    return "Interactive Learning: Scenario";
  }
  if (lowerTitle.includes("pop quiz")) {
    return "Pop Quiz";
  }

  switch (type) {
    case "pdf":
      return "Reading Material";
    case "ebook":
      return "Reading";
    case "document":
      return "Document";
    case "link":
      return "External Resource";
    default:
      return null;
  }
}

/** Truncate a string at a max length, adding ellipsis */
function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "...";
}

export function CourseSidebar({
  sessions,
  activeMaterialId,
  onSelectMaterial,
  courseTitle,
  courseCode,
  progress,
  collapsed,
  onToggleCollapse,
  assessments,
  onSelectAssessment,
}: CourseSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["session-1", "assessments"])
  );

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionKey)) {
        next.delete(sectionKey);
      } else {
        next.add(sectionKey);
      }
      return next;
    });
  };

  if (collapsed) {
    return (
      <div className="w-12 bg-[#0D2137] flex flex-col items-center pt-4 shrink-0">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title="Expand sidebar"
        >
          <PanelLeftOpen className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-[#0D2137] text-white flex flex-col shrink-0 h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-300 font-medium">{courseCode}</p>
            <h3 className="text-sm font-semibold truncate">{courseTitle}</h3>
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors ml-2"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-white/60">Progress</span>
            <span className="text-blue-300 font-medium">{progress}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content list */}
      <div className="flex-1 overflow-y-auto">
        {/* Continuous Assessment section */}
        {assessments && assessments.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection("assessments")}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5",
                expandedSections.has("assessments") && "bg-white/5"
              )}
            >
              {expandedSections.has("assessments") ? (
                <ChevronDown className="h-4 w-4 text-white/40 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-white/40 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Continuous Assessment</p>
              </div>
            </button>

            {expandedSections.has("assessments") && (
              <div className="pb-1">
                {assessments.map((assessment) => (
                  <button
                    key={assessment.id}
                    onClick={() => onSelectAssessment?.(assessment)}
                    className="w-full flex items-center gap-3 px-4 pl-10 py-2.5 text-left transition-colors group hover:bg-white/5 border-l-2 border-transparent"
                  >
                    {assessment.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-white/30 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/70 group-hover:text-white/90 truncate">
                        {truncate(assessment.title, 35)}
                      </p>
                      {assessment.score !== null && assessment.score !== undefined && (
                        <p className="text-[10px] text-white/40">
                          Score: {assessment.score}/{assessment.maxScore}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Study Sessions */}
        {sessions.map((session) => {
          const sectionKey = `session-${session.number}`;
          const isExpanded = expandedSections.has(sectionKey);
          const completedCount = session.materials.filter(
            (m) => m.completed
          ).length;
          const totalCount = session.materials.length;
          const allComplete = totalCount > 0 && completedCount === totalCount;

          // Format session title like reference: "Study Session 05 - Implemen..."
          const sessionNumStr = String(session.number).padStart(2, "0");

          // Group materials into parts if applicable
          const parts: { label: string | null; materials: CourseMaterial[] }[] = [];
          let currentPart: { label: string | null; materials: CourseMaterial[] } = {
            label: null,
            materials: [],
          };

          session.materials.forEach((material) => {
            const lowerTitle = material.title.toLowerCase();
            if (lowerTitle.startsWith("part ")) {
              // This is a part header
              if (currentPart.materials.length > 0 || currentPart.label) {
                parts.push(currentPart);
              }
              currentPart = { label: material.title, materials: [] };
            } else {
              currentPart.materials.push(material);
            }
          });
          if (currentPart.materials.length > 0 || currentPart.label) {
            parts.push(currentPart);
          }

          // If no parts structure, just list all materials flat
          const useParts = parts.some((p) => p.label !== null);

          return (
            <div key={session.number}>
              {/* Session header */}
              <button
                onClick={() => toggleSection(sectionKey)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5",
                  isExpanded && "bg-white/5"
                )}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-white/40 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-white/40 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {truncate(session.title, 32)}
                  </p>
                  <p className="text-xs text-white/40">
                    {completedCount}/{totalCount} completed
                  </p>
                </div>
                {allComplete && (
                  <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                )}
              </button>

              {/* Session materials */}
              {isExpanded && (
                <div className="pb-1">
                  {useParts
                    ? parts.map((part, partIdx) => (
                        <div key={partIdx}>
                          {/* Part label header */}
                          {part.label && (
                            <div className="px-4 pl-10 py-2 text-xs font-semibold text-blue-300/80 uppercase tracking-wider">
                              {truncate(part.label, 38)}
                            </div>
                          )}
                          {part.materials.map((material) => (
                            <MaterialItem
                              key={material.id}
                              material={material}
                              sessionNum={sessionNumStr}
                              isActive={material.id === activeMaterialId}
                              onSelect={onSelectMaterial}
                            />
                          ))}
                        </div>
                      ))
                    : session.materials.map((material) => (
                        <MaterialItem
                          key={material.id}
                          material={material}
                          sessionNum={sessionNumStr}
                          isActive={material.id === activeMaterialId}
                          onSelect={onSelectMaterial}
                        />
                      ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MaterialItem({
  material,
  sessionNum,
  isActive,
  onSelect,
}: {
  material: CourseMaterial;
  sessionNum: string;
  isActive: boolean;
  onSelect: (m: CourseMaterial) => void;
}) {
  const Icon = getMaterialIcon(material.type, material.title);
  const subLabel = getMaterialSubLabel(material.type, material.title);

  return (
    <button
      onClick={() => onSelect(material)}
      className={cn(
        "w-full flex items-center gap-3 px-4 pl-10 py-2.5 text-left transition-colors group",
        isActive
          ? "bg-blue-600/20 border-l-2 border-blue-400"
          : "hover:bg-white/5 border-l-2 border-transparent"
      )}
    >
      {material.completed ? (
        <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
      ) : (
        <Circle className="h-4 w-4 text-white/30 shrink-0" />
      )}
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          isActive ? "text-blue-300" : "text-white/50"
        )}
      />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-xs truncate",
            isActive
              ? "text-blue-200 font-medium"
              : "text-white/70 group-hover:text-white/90"
          )}
        >
          {truncate(material.title, 35)}
        </p>
        {subLabel && (
          <p className="text-[10px] text-white/30">{subLabel}</p>
        )}
      </div>
    </button>
  );
}
