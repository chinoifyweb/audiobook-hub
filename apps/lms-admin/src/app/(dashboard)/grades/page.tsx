import { prisma } from "@repo/db";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "@repo/ui";
import { StatsCard } from "@/components/stats-card";
import {
  BarChart3,
  Users,
  AlertTriangle,
  CheckCircle,
  Download,
} from "lucide-react";
import { GradesClient } from "./grades-client";

export const dynamic = "force-dynamic";

export default async function GradesPage() {
  const [grades, semesters, programs, courses] = await Promise.all([
    prisma.grade.findMany({
      include: {
        student: {
          include: {
            user: { select: { fullName: true, email: true } },
            program: { select: { name: true, code: true } },
          },
        },
        courseEnrollment: {
          include: {
            courseAssignment: {
              include: { course: { select: { code: true, title: true } } },
            },
          },
        },
        semester: {
          include: { session: { select: { name: true } } },
        },
      },
      orderBy: [
        { semester: { session: { name: "desc" } } },
        { student: { user: { fullName: "asc" } } },
      ],
    }),
    prisma.semester.findMany({
      include: { session: { select: { name: true } } },
      orderBy: { session: { name: "desc" } },
    }),
    prisma.program.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    }),
    prisma.course.findMany({
      select: { id: true, code: true, title: true },
      orderBy: { code: "asc" },
    }),
  ]);

  // Compute stats
  const totalGrades = grades.length;
  const gradedCount = grades.filter((g) => g.letterGrade).length;
  const releasedCount = grades.filter((g) => g.isReleased).length;
  const atRiskCount = grades.filter(
    (g) => Number(g.totalScore) > 0 && Number(g.totalScore) < 40
  ).length;

  // Grade distribution
  const distribution: Record<string, number> = {};
  grades.forEach((g) => {
    const letter = g.letterGrade || "Ungraded";
    distribution[letter] = (distribution[letter] || 0) + 1;
  });

  const gradeData = grades.map((g) => ({
    id: g.id,
    studentId: g.student.studentId,
    studentName: g.student.user.fullName,
    email: g.student.user.email,
    programCode: g.student.program.code,
    programId: g.student.programId,
    courseCode: g.courseEnrollment.courseAssignment.course.code,
    courseTitle: g.courseEnrollment.courseAssignment.course.title,
    courseId: g.courseEnrollment.courseAssignment.courseId,
    semester: `${g.semester.session.name} - ${g.semester.name}`,
    semesterId: g.semesterId,
    testScore: Number(g.testScore),
    examScore: Number(g.examScore),
    assignmentScore: Number(g.assignmentScore),
    totalScore: Number(g.totalScore),
    letterGrade: g.letterGrade,
    isReleased: g.isReleased,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Grade Reports</h1>
          <p className="text-muted-foreground">
            Overall grade reports across all courses
          </p>
        </div>
        <a href="/api/grades?format=csv" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="gap-1.5">
            <Download className="h-4 w-4" /> Export All CSV
          </Button>
        </a>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Grade Records"
          value={totalGrades}
          icon={BarChart3}
        />
        <StatsCard
          title="Graded"
          value={gradedCount}
          description={`${releasedCount} released`}
          icon={CheckCircle}
        />
        <StatsCard
          title="Students at Risk"
          value={atRiskCount}
          description="Below 40% total score"
          icon={AlertTriangle}
        />
        <StatsCard
          title="Pass Rate"
          value={
            gradedCount > 0
              ? `${Math.round(((gradedCount - atRiskCount) / gradedCount) * 100)}%`
              : "N/A"
          }
          icon={Users}
        />
      </div>

      {/* Grade Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Grade Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {["A", "B", "C", "D", "E", "F", "Ungraded"].map((letter) => {
              const count = distribution[letter] || 0;
              const pct =
                totalGrades > 0 ? Math.round((count / totalGrades) * 100) : 0;
              const colors: Record<string, string> = {
                A: "bg-green-500",
                B: "bg-blue-500",
                C: "bg-yellow-500",
                D: "bg-orange-500",
                E: "bg-red-400",
                F: "bg-red-600",
                Ungraded: "bg-gray-400",
              };
              return (
                <div
                  key={letter}
                  className="flex flex-col items-center gap-1 min-w-[60px]"
                >
                  <div
                    className={`w-10 rounded-t ${colors[letter] || "bg-gray-400"}`}
                    style={{ height: `${Math.max(pct * 1.5, 4)}px` }}
                  />
                  <span className="text-xs font-bold">{letter}</span>
                  <span className="text-xs text-muted-foreground">
                    {count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Grades Table with Filters */}
      <GradesClient
        grades={gradeData}
        semesters={semesters.map((s) => ({
          id: s.id,
          label: `${s.session.name} - ${s.name}`,
        }))}
        programs={programs}
        courses={courses}
      />
    </div>
  );
}
