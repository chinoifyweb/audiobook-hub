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
  ListChecks,
  Bookmark,
  Link2,
  CheckCircle2,
  Circle,
  PanelLeftClose,
  PanelLeftOpen,
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

interface CourseSidebarProps {
  sessions: StudySession[];
  activeMaterialId: string | null;
  onSelectMaterial: (material: CourseMaterial) => void;
  courseTitle: string;
  courseCode: string;
  progress: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function getMaterialIcon(type: string) {
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

function getMaterialLabel(type: string, index: number): string {
  switch (type) {
    case "youtube_video":
      return index === 0 ? "Introductory Video" : "Video Lecture";
    case "pdf":
      return "Reading Material";
    case "ebook":
      return "Reading";
    case "document":
      return "Document";
    case "link":
      return "External Resource";
    default:
      return "Material";
  }
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
}: CourseSidebarProps) {
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(
    new Set([1])
  );

  const toggleSession = (sessionNumber: number) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(sessionNumber)) {
        next.delete(sessionNumber);
      } else {
        next.add(sessionNumber);
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

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto">
        {sessions.map((session) => {
          const isExpanded = expandedSessions.has(session.number);
          const completedCount = session.materials.filter(
            (m) => m.completed
          ).length;
          const totalCount = session.materials.length;
          const allComplete = totalCount > 0 && completedCount === totalCount;

          return (
            <div key={session.number}>
              {/* Session header */}
              <button
                onClick={() => toggleSession(session.number)}
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
                  <p className="text-sm font-medium">{session.title}</p>
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
                  {session.materials.map((material, idx) => {
                    const Icon = getMaterialIcon(material.type);
                    const isActive = material.id === activeMaterialId;

                    return (
                      <button
                        key={material.id}
                        onClick={() => onSelectMaterial(material)}
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
                            {material.title}
                          </p>
                          <p className="text-[10px] text-white/30">
                            {getMaterialLabel(material.type, idx)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
