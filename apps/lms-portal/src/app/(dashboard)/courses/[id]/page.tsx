"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  CourseSidebar,
  MaterialViewer,
  type CourseMaterial,
  type StudySession,
  type CourseAssessment,
} from "@/components/lms";
import { Badge, Card, CardContent, Button, Progress, Separator } from "@repo/ui";
import {
  ArrowLeft,
  Loader2,
  BookOpen,
  AlertTriangle,
  FileText,
  ClipboardCheck,
  Calendar,
  User,
  ChevronRight,
  Video,
  Download,
  ExternalLink,
} from "lucide-react";

interface CourseContentData {
  course: {
    id: string;
    code: string;
    title: string;
    description: string | null;
    creditUnits: number;
  };
  lecturer: {
    title: string | null;
    user: { fullName: string | null };
  };
  semester: {
    name: string;
    session: { name: string };
  };
  sessions: StudySession[];
  assignments: Array<{
    id: string;
    title: string;
    dueDate: string;
    maxScore: number;
    submissions: Array<{
      score: number | null;
    }>;
  }>;
  testExams: Array<{
    id: string;
    title: string;
    type: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    totalMarks: number;
    attempts: Array<{
      status: string;
      totalScore: number | null;
      maxScore: number;
    }>;
  }>;
  progress: {
    totalMaterials: number;
    completedMaterials: number;
    percentage: number;
  };
}

type ViewMode = "content" | "materials" | "assignments" | "tests" | "overview";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<CourseContentData | null>(null);
  const [activeMaterial, setActiveMaterial] = useState<CourseMaterial | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("content");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    async function fetchContent() {
      try {
        const res = await fetch(`/api/courses/${params.id}/content`);
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || "Failed to load course content");
          return;
        }
        const courseData: CourseContentData = await res.json();
        setData(courseData);

        // Set first material as active
        if (courseData.sessions.length > 0 && courseData.sessions[0].materials.length > 0) {
          // Find first uncompleted material, or first material
          const firstUncompleted = courseData.sessions
            .flatMap((s) => s.materials)
            .find((m) => !m.completed);
          setActiveMaterial(firstUncompleted || courseData.sessions[0].materials[0]);
        }
      } catch {
        setError("Failed to load course content");
      } finally {
        setLoading(false);
      }
    }
    fetchContent();
  }, [params.id]);

  const handleMarkComplete = useCallback(
    async (materialId: string, completed: boolean) => {
      if (isUpdating || !data) return;
      setIsUpdating(true);

      try {
        const res = await fetch(`/api/courses/${params.id}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ materialId, completed }),
        });

        if (res.ok) {
          const result = await res.json();
          // Update local state
          setData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              sessions: prev.sessions.map((session) => ({
                ...session,
                materials: session.materials.map((m) =>
                  m.id === materialId ? { ...m, completed } : m
                ),
              })),
              progress: result.courseProgress,
            };
          });
          // Update active material
          setActiveMaterial((prev) =>
            prev && prev.id === materialId ? { ...prev, completed } : prev
          );
        }
      } catch {
        // Silent fail
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, data, params.id]
  );

  const handleSelectMaterial = useCallback((material: CourseMaterial) => {
    setActiveMaterial(material);
    setViewMode("content");
  }, []);

  const handleNext = useCallback(() => {
    if (!data || !activeMaterial) return;
    const allMaterials = data.sessions.flatMap((s) => s.materials);
    const currentIndex = allMaterials.findIndex(
      (m) => m.id === activeMaterial.id
    );
    if (currentIndex < allMaterials.length - 1) {
      setActiveMaterial(allMaterials[currentIndex + 1]);
    }
  }, [data, activeMaterial]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading course content...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <p className="text-destructive mb-4">{error || "Failed to load course"}</p>
          <Button onClick={() => router.push("/courses")}>Back to Courses</Button>
        </CardContent>
      </Card>
    );
  }

  const allMaterials = data.sessions.flatMap((s) => s.materials);
  const currentIndex = activeMaterial
    ? allMaterials.findIndex((m) => m.id === activeMaterial.id)
    : -1;
  const hasNext = currentIndex < allMaterials.length - 1;

  // Build assessment list for sidebar
  const sidebarAssessments: CourseAssessment[] = [
    ...data.testExams.map((t) => {
      const bestAttempt = t.attempts.reduce(
        (best: typeof t.attempts[0] | null, current) => {
          if (!best) return current;
          if (
            current.totalScore !== null &&
            (best.totalScore === null || current.totalScore > best.totalScore)
          ) {
            return current;
          }
          return best;
        },
        t.attempts[0] ?? null
      );
      const isCompleted = t.attempts.some(
        (a) => a.status === "submitted" || a.status === "graded"
      );
      return {
        id: t.id,
        title: t.title,
        type: (t.type === "test" ? "test" : "exam") as "test" | "exam",
        completed: isCompleted,
        score: bestAttempt?.totalScore ?? null,
        maxScore: t.totalMarks,
      };
    }),
    ...data.assignments.map((a) => ({
      id: a.id,
      title: a.title,
      type: "assignment" as const,
      completed: a.submissions.length > 0,
      score: a.submissions[0]?.score ?? null,
      maxScore: a.maxScore,
    })),
  ];

  const handleSelectAssessment = (assessment: CourseAssessment) => {
    if (assessment.type === "test" || assessment.type === "exam") {
      router.push(`/courses/${params.id}/quiz/${assessment.id}`);
    } else {
      router.push(`/assignments/${assessment.id}`);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-4 sm:-m-6">
      {/* Course Sidebar */}
      <CourseSidebar
        sessions={data.sessions}
        activeMaterialId={activeMaterial?.id ?? null}
        onSelectMaterial={handleSelectMaterial}
        courseTitle={data.course.title}
        courseCode={data.course.code}
        progress={data.progress.percentage}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        assessments={sidebarAssessments}
        onSelectAssessment={handleSelectAssessment}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {/* Top navigation bar */}
        <div className="sticky top-0 z-20 bg-white border-b px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/courses"
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Courses
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
            <span className="text-sm font-medium text-gray-900">
              {data.course.code}
            </span>
          </div>

          {/* View tabs */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {(
              [
                { key: "content", label: "Content", icon: BookOpen },
                { key: "assignments", label: "Assignments", icon: FileText },
                { key: "tests", label: "Tests", icon: ClipboardCheck },
                { key: "overview", label: "Overview", icon: Calendar },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === tab.key
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {viewMode === "content" && activeMaterial ? (
            <MaterialViewer
              material={activeMaterial}
              onMarkComplete={handleMarkComplete}
              onNext={hasNext ? handleNext : null}
              isUpdating={isUpdating}
            />
          ) : viewMode === "content" && !activeMaterial ? (
            <div className="max-w-2xl mx-auto text-center py-16">
              <BookOpen className="mx-auto h-14 w-14 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No materials available yet
              </h3>
              <p className="text-sm text-gray-500">
                Course materials will appear here once uploaded by your lecturer.
              </p>
            </div>
          ) : viewMode === "assignments" ? (
            <AssignmentsView
              assignments={data.assignments}
              courseAssignmentId={params.id as string}
            />
          ) : viewMode === "tests" ? (
            <TestsView
              testExams={data.testExams}
              courseAssignmentId={params.id as string}
            />
          ) : viewMode === "overview" ? (
            <OverviewView data={data} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Assignments sub-view
function AssignmentsView({
  assignments,
  courseAssignmentId,
}: {
  assignments: CourseContentData["assignments"];
  courseAssignmentId: string;
}) {
  if (assignments.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <FileText className="mx-auto h-14 w-14 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No assignments posted yet
        </h3>
        <p className="text-sm text-gray-500">
          Assignments will appear here when your lecturer posts them.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      <h2 className="text-lg font-bold mb-4">Assignments</h2>
      {assignments.map((assignment) => {
        const submission = assignment.submissions[0];
        const isPastDue = new Date(assignment.dueDate) < new Date();
        const status = submission
          ? submission.score !== null
            ? "graded"
            : "submitted"
          : isPastDue
            ? "overdue"
            : "pending";

        return (
          <Link key={assignment.id} href={`/assignments/${assignment.id}`}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-lg p-2 ${
                        status === "graded"
                          ? "bg-green-100"
                          : status === "submitted"
                            ? "bg-blue-100"
                            : status === "overdue"
                              ? "bg-red-100"
                              : "bg-orange-100"
                      }`}
                    >
                      <FileText
                        className={`h-4 w-4 ${
                          status === "graded"
                            ? "text-green-600"
                            : status === "submitted"
                              ? "text-blue-600"
                              : status === "overdue"
                                ? "text-red-600"
                                : "text-orange-600"
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{assignment.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        Due: {format(new Date(assignment.dueDate), "MMM d, yyyy HH:mm")}
                        {" | "}Max Score: {assignment.maxScore}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      status === "graded"
                        ? "default"
                        : status === "submitted"
                          ? "secondary"
                          : status === "overdue"
                            ? "destructive"
                            : "outline"
                    }
                  >
                    {status === "graded"
                      ? `${submission!.score}/${assignment.maxScore}`
                      : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

// Tests sub-view
function TestsView({
  testExams,
  courseAssignmentId,
}: {
  testExams: CourseContentData["testExams"];
  courseAssignmentId: string;
}) {
  if (testExams.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <ClipboardCheck className="mx-auto h-14 w-14 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No tests or exams scheduled
        </h3>
        <p className="text-sm text-gray-500">
          Tests and exams will appear here once scheduled.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      <h2 className="text-lg font-bold mb-4">Tests & Exams</h2>
      {testExams.map((test) => {
        const attempt = test.attempts[0];
        const now = new Date();
        const isUpcoming = new Date(test.startTime) > now;
        const isActive =
          new Date(test.startTime) <= now && new Date(test.endTime) >= now;
        const isPast = new Date(test.endTime) < now;

        return (
          <Link
            key={test.id}
            href={`/courses/${courseAssignmentId}/quiz/${test.id}`}
          >
            <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-lg p-2 ${
                        attempt && attempt.status === "graded"
                          ? "bg-green-100"
                          : isActive
                            ? "bg-blue-100"
                            : "bg-purple-100"
                      }`}
                    >
                      <ClipboardCheck
                        className={`h-4 w-4 ${
                          attempt && attempt.status === "graded"
                            ? "text-green-600"
                            : isActive
                              ? "text-blue-600"
                              : "text-purple-600"
                        }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm">{test.title}</h3>
                        <Badge variant="outline" className="text-[10px]">
                          {test.type === "test" ? "Test" : "Exam"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(test.startTime), "MMM d, yyyy HH:mm")}
                        {" | "}{test.durationMinutes} min | {test.totalMarks} marks
                      </p>
                    </div>
                  </div>
                  {attempt ? (
                    <Badge
                      variant={
                        attempt.status === "graded" ? "default" : "secondary"
                      }
                    >
                      {attempt.status === "graded"
                        ? `${attempt.totalScore}/${attempt.maxScore}`
                        : attempt.status === "submitted"
                          ? "Submitted"
                          : "In Progress"}
                    </Badge>
                  ) : isActive ? (
                    <Badge className="bg-green-600">Available Now</Badge>
                  ) : isUpcoming ? (
                    <Badge variant="outline">Upcoming</Badge>
                  ) : (
                    <Badge variant="destructive">Missed</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

// Overview sub-view
function OverviewView({ data }: { data: CourseContentData }) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Course info */}
      <Card className="border-0 shadow-sm">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-bold">
                {data.course.code}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{data.course.title}</h2>
              {data.course.description && (
                <p className="mt-2 text-sm text-gray-500">
                  {data.course.description}
                </p>
              )}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {data.lecturer.title ? `${data.lecturer.title} ` : ""}
                  {data.lecturer.user.fullName}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {data.semester.session.name} - {data.semester.name}
                </div>
                <Badge variant="secondary">
                  {data.course.creditUnits} Credit Units
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card className="border-0 shadow-sm">
        <CardContent className="py-5">
          <h3 className="text-sm font-semibold mb-3">Course Progress</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={data.progress.percentage} className="h-3" />
            </div>
            <span className="text-lg font-bold text-blue-600">
              {data.progress.percentage}%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {data.progress.completedMaterials} of {data.progress.totalMaterials}{" "}
            materials completed
          </p>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="py-4 text-center">
            <BookOpen className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{data.progress.totalMaterials}</p>
            <p className="text-xs text-gray-500">Materials</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="py-4 text-center">
            <FileText className="h-5 w-5 text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{data.assignments.length}</p>
            <p className="text-xs text-gray-500">Assignments</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="py-4 text-center">
            <ClipboardCheck className="h-5 w-5 text-purple-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{data.testExams.length}</p>
            <p className="text-xs text-gray-500">Tests/Exams</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
