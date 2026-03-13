import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import {
  BookOpen,
  FileText,
  ClipboardCheck,
  BarChart3,
  Clock,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function DashboardPage() {
  const { studentProfile } = await requireStudent();

  // Get current active semester
  const activeSemester = await prisma.semester.findFirst({
    where: { isActive: true },
    include: { session: true },
  });

  // Count enrolled courses
  const enrolledCoursesCount = activeSemester
    ? await prisma.courseEnrollment.count({
        where: {
          studentId: studentProfile.id,
          semesterId: activeSemester.id,
          status: "enrolled",
        },
      })
    : 0;

  // Count pending assignments
  const pendingAssignments = await prisma.lmsAssignment.findMany({
    where: {
      isPublished: true,
      dueDate: { gte: new Date() },
      courseAssignment: {
        enrollments: {
          some: { studentId: studentProfile.id, status: "enrolled" },
        },
      },
      submissions: {
        none: { studentId: studentProfile.id },
      },
    },
    include: {
      courseAssignment: {
        include: { course: { select: { code: true, title: true } } },
      },
    },
    orderBy: { dueDate: "asc" },
    take: 5,
  });

  // Count upcoming tests
  const upcomingTests = await prisma.testExam.findMany({
    where: {
      isPublished: true,
      startTime: { gte: new Date() },
      courseAssignment: {
        enrollments: {
          some: { studentId: studentProfile.id, status: "enrolled" },
        },
      },
    },
    include: {
      courseAssignment: {
        include: { course: { select: { code: true, title: true } } },
      },
    },
    orderBy: { startTime: "asc" },
    take: 5,
  });

  // Get recent released grades
  const recentGrades = await prisma.grade.findMany({
    where: {
      studentId: studentProfile.id,
      isReleased: true,
    },
    include: {
      courseEnrollment: {
        include: {
          courseAssignment: {
            include: { course: { select: { code: true, title: true } } },
          },
        },
      },
    },
    orderBy: { releasedAt: "desc" },
    take: 5,
  });

  // Calculate GPA from released grades
  const allGrades = await prisma.grade.findMany({
    where: { studentId: studentProfile.id, isReleased: true },
    include: {
      courseEnrollment: {
        include: {
          courseAssignment: {
            include: { course: { select: { creditUnits: true } } },
          },
        },
      },
    },
  });

  let cgpa = 0;
  if (allGrades.length > 0) {
    let totalPoints = 0;
    let totalCredits = 0;
    for (const grade of allGrades) {
      const credits = grade.courseEnrollment.courseAssignment.course.creditUnits;
      totalPoints += Number(grade.gradePoint) * credits;
      totalCredits += credits;
    }
    cgpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-primary to-blue-700 text-primary-foreground">
        <CardContent className="py-6">
          <h1 className="text-2xl font-bold">
            Welcome back, {studentProfile.user?.fullName || "Student"}
          </h1>
          <p className="mt-1 opacity-90">
            {studentProfile.program.name} | Semester {studentProfile.currentSemester}
            {activeSemester && ` | ${activeSemester.session.name} - ${activeSemester.name}`}
          </p>
          <p className="mt-1 text-sm opacity-75">
            Student ID: {studentProfile.studentId}
          </p>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-lg bg-blue-100 p-3">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Enrolled Courses</p>
              <p className="text-2xl font-bold">{enrolledCoursesCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-lg bg-orange-100 p-3">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Assignments</p>
              <p className="text-2xl font-bold">{pendingAssignments.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-lg bg-purple-100 p-3">
              <ClipboardCheck className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Upcoming Tests</p>
              <p className="text-2xl font-bold">{upcomingTests.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-lg bg-green-100 p-3">
              <BarChart3 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current CGPA</p>
              <p className="text-2xl font-bold">{cgpa.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines & Recent Grades */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingAssignments.length === 0 && upcomingTests.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No upcoming deadlines
              </p>
            ) : (
              <div className="space-y-3">
                {pendingAssignments.map((a) => (
                  <Link
                    key={a.id}
                    href={`/assignments/${a.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.courseAssignment.course.code} - Assignment
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Due {format(new Date(a.dueDate), "MMM d")}
                    </Badge>
                  </Link>
                ))}
                {upcomingTests.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tests/${t.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.courseAssignment.course.code} -{" "}
                        {t.type === "test" ? "Test" : "Exam"}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {format(new Date(t.startTime), "MMM d, HH:mm")}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Recent Grades
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentGrades.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No grades released yet
              </p>
            ) : (
              <div className="space-y-3">
                {recentGrades.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {g.courseEnrollment.courseAssignment.course.code}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {g.courseEnrollment.courseAssignment.course.title}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{g.letterGrade || "-"}</p>
                      <p className="text-xs text-muted-foreground">
                        {Number(g.totalScore).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link
                href="/grades"
                className="text-sm text-primary hover:underline"
              >
                View all grades
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/courses"
              className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-muted/50 transition-colors text-center"
            >
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">My Courses</span>
            </Link>
            <Link
              href="/assignments"
              className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-muted/50 transition-colors text-center"
            >
              <FileText className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Assignments</span>
            </Link>
            <Link
              href="/payments"
              className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-muted/50 transition-colors text-center"
            >
              <BarChart3 className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Payments</span>
            </Link>
            <Link
              href="/id-card"
              className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-muted/50 transition-colors text-center"
            >
              <Calendar className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">ID Card</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
