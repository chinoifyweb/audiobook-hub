import { prisma } from "@repo/db";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from "@repo/ui";
import { StatsCard } from "@/components/stats-card";
import {
  FileQuestion,
  Clock,
  AlertTriangle,
  CheckCircle,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { AssessmentsFilter } from "./assessments-filter";

export const dynamic = "force-dynamic";

export default async function AssessmentsPage() {
  const now = new Date();

  const [allAssessments, courses, lecturers] = await Promise.all([
    prisma.testExam.findMany({
      include: {
        courseAssignment: {
          include: {
            course: true,
            lecturer: {
              include: { user: { select: { fullName: true } } },
            },
            enrollments: { where: { status: "enrolled" }, select: { id: true } },
          },
        },
        attempts: {
          select: {
            id: true,
            status: true,
            isPassed: true,
          },
        },
      },
      orderBy: { startTime: "desc" },
    }),
    prisma.course.findMany({
      select: { id: true, code: true, title: true },
      orderBy: { code: "asc" },
    }),
    prisma.lecturerProfile.findMany({
      select: {
        id: true,
        user: { select: { fullName: true } },
      },
      orderBy: { user: { fullName: "asc" } },
    }),
  ]);

  const totalAssessments = allAssessments.length;
  const activeNow = allAssessments.filter(
    (a) => new Date(a.startTime) <= now && new Date(a.endTime) >= now && a.isPublished
  ).length;
  const overdueCount = allAssessments.filter((a) => {
    const totalStudents = a.courseAssignment.enrollments.length;
    return (
      new Date(a.endTime) < now &&
      a.isPublished &&
      a.attempts.length < totalStudents
    );
  }).length;
  const totalAttempts = allAssessments.reduce(
    (sum, a) => sum + a.attempts.length,
    0
  );

  const assessmentData = allAssessments.map((a) => {
    const totalStudents = a.courseAssignment.enrollments.length;
    const attemptCount = a.attempts.length;
    const gradedCount = a.attempts.filter((at) => at.status === "graded").length;
    const passedCount = a.attempts.filter((at) => at.isPassed === true).length;
    const isActive =
      new Date(a.startTime) <= now && new Date(a.endTime) >= now;
    const isOverdue =
      new Date(a.endTime) < now && a.isPublished && attemptCount < totalStudents;

    return {
      id: a.id,
      title: a.title,
      type: a.type,
      courseCode: a.courseAssignment.course.code,
      courseTitle: a.courseAssignment.course.title,
      courseId: a.courseAssignment.courseId,
      lecturerName: a.courseAssignment.lecturer.user.fullName,
      lecturerId: a.courseAssignment.lecturerId,
      startTime: a.startTime.toISOString(),
      endTime: a.endTime.toISOString(),
      durationMinutes: a.durationMinutes,
      totalMarks: a.totalMarks,
      isPublished: a.isPublished,
      totalStudents,
      attemptCount,
      gradedCount,
      passedCount,
      completionRate: totalStudents > 0 ? Math.round((attemptCount / totalStudents) * 100) : 0,
      isActive,
      isOverdue,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assessments Overview</h1>
        <p className="text-muted-foreground">
          Monitor all quizzes and exams across courses
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Assessments"
          value={totalAssessments}
          icon={FileQuestion}
        />
        <StatsCard
          title="Active Now"
          value={activeNow}
          icon={Clock}
        />
        <StatsCard
          title="Overdue / Incomplete"
          value={overdueCount}
          description="Ended with students who didn't attempt"
          icon={AlertTriangle}
        />
        <StatsCard
          title="Total Attempts"
          value={totalAttempts}
          icon={Users}
        />
      </div>

      {/* Assessments List with Filters */}
      <AssessmentsFilter
        assessments={assessmentData}
        courses={courses}
        lecturers={lecturers.map((l) => ({ id: l.id, name: l.user.fullName || "" }))}
      />
    </div>
  );
}
