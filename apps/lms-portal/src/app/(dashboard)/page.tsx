import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";
import { checkCurrentSemesterPayment } from "@/lib/payment-status";
import { PaymentBanner } from "@/components/payment-gate";
import { Card, CardContent, CardHeader, CardTitle, Badge, Progress } from "@repo/ui";
import {
  BookOpen,
  FileText,
  ClipboardCheck,
  BarChart3,
  Clock,
  Calendar,
  AlertTriangle,
  GraduationCap,
  TrendingUp,
  ArrowRight,
  PlayCircle,
} from "lucide-react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";

export default async function DashboardPage() {
  try {
    const { studentProfile } = await requireStudent();

    // Run all queries in parallel
    const [
      activeSemester,
      enrollments,
      pendingAssignments,
      upcomingTests,
      recentGrades,
      allGrades,
      calendarEvents,
      paymentStatus,
    ] = await Promise.all([
      prisma.semester
        .findFirst({
          where: { isActive: true },
          include: { session: true },
        })
        .catch(() => null),

      // Get enrolled courses with progress data
      prisma.semester
        .findFirst({ where: { isActive: true } })
        .then((sem) =>
          sem
            ? prisma.courseEnrollment.findMany({
                where: {
                  studentId: studentProfile.id,
                  semesterId: sem.id,
                  status: "enrolled",
                },
                include: {
                  courseAssignment: {
                    include: {
                      course: { select: { code: true, title: true, creditUnits: true } },
                      lecturer: {
                        include: { user: { select: { fullName: true } } },
                      },
                      materials: {
                        where: { isPublished: true },
                        select: { id: true },
                      },
                    },
                  },
                },
              })
            : []
        )
        .catch(() => []),

      prisma.lmsAssignment
        .findMany({
          where: {
            isPublished: true,
            dueDate: { gte: new Date() },
            courseAssignment: {
              enrollments: {
                some: { studentId: studentProfile.id, status: "enrolled" },
              },
            },
            submissions: { none: { studentId: studentProfile.id } },
          },
          include: {
            courseAssignment: {
              include: { course: { select: { code: true, title: true } } },
            },
          },
          orderBy: { dueDate: "asc" },
          take: 5,
        })
        .catch(() => []),

      prisma.testExam
        .findMany({
          where: {
            isPublished: true,
            endTime: { gte: new Date() },
            courseAssignment: {
              enrollments: {
                some: { studentId: studentProfile.id, status: "enrolled" },
              },
            },
            attempts: {
              none: {
                studentId: studentProfile.id,
                status: { in: ["submitted", "graded"] },
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
        })
        .catch(() => []),

      prisma.grade
        .findMany({
          where: { studentId: studentProfile.id, isReleased: true },
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
        })
        .catch(() => []),

      prisma.grade
        .findMany({
          where: { studentId: studentProfile.id, isReleased: true },
          select: {
            gradePoint: true,
            courseEnrollment: {
              select: {
                courseAssignment: {
                  select: { course: { select: { creditUnits: true } } },
                },
              },
            },
          },
        })
        .catch(() => []),

      // Get upcoming calendar events
      prisma.semester
        .findFirst({ where: { isActive: true } })
        .then((sem) =>
          sem
            ? prisma.academicCalendarEvent.findMany({
                where: {
                  semesterId: sem.id,
                  startDate: { gte: new Date() },
                },
                orderBy: { startDate: "asc" },
                take: 5,
              })
            : []
        )
        .catch(() => []),

      // Check tuition payment status
      checkCurrentSemesterPayment(studentProfile.id).catch(() => ({
        hasPaid: true,
        hasScholarship: false,
        amountDue: 0,
        amountPaid: 0,
        balance: 0,
        programName: "",
        programCode: "",
        semesterName: "",
        sessionName: "",
      })),
    ]);

    // Calculate CGPA
    let cgpa = 0;
    if (allGrades.length > 0) {
      let totalPoints = 0;
      let totalCredits = 0;
      for (const grade of allGrades) {
        const credits =
          grade.courseEnrollment.courseAssignment.course.creditUnits;
        totalPoints += Number(grade.gradePoint) * credits;
        totalCredits += credits;
      }
      cgpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    }

    // Get material progress for courses
    const allMaterialIds = enrollments.flatMap((e) =>
      e.courseAssignment.materials.map((m) => m.id)
    );
    const completedProgress = allMaterialIds.length > 0
      ? await prisma.courseMaterialProgress
          .findMany({
            where: {
              studentId: studentProfile.id,
              courseMaterialId: { in: allMaterialIds },
              completed: true,
            },
            select: { courseMaterialId: true },
          })
          .catch(() => [])
      : [];
    const completedSet = new Set(completedProgress.map((p) => p.courseMaterialId));

    // Build course progress data
    const coursesWithProgress = enrollments.map((enrollment) => {
      const totalMaterials = enrollment.courseAssignment.materials.length;
      const completedMaterials = enrollment.courseAssignment.materials.filter(
        (m) => completedSet.has(m.id)
      ).length;
      const progress =
        totalMaterials > 0
          ? Math.round((completedMaterials / totalMaterials) * 100)
          : 0;
      return {
        id: enrollment.courseAssignment.id,
        code: enrollment.courseAssignment.course.code,
        title: enrollment.courseAssignment.course.title,
        lecturer: enrollment.courseAssignment.lecturer,
        progress,
        totalMaterials,
        completedMaterials,
      };
    });

    // Find "continue learning" course (highest progress that isn't 100%, or the first course)
    const continueLearnCourse = coursesWithProgress.find(
      (c) => c.progress > 0 && c.progress < 100
    ) || coursesWithProgress[0] || null;

    const totalCreditsEnrolled = enrollments.reduce(
      (sum, e) => sum + e.courseAssignment.course.creditUnits,
      0
    );

    return (
      <div className="space-y-6">
        {/* Welcome Card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#0D2137] via-[#1a3a5c] to-[#2563eb] text-white p-6 sm:p-8">
          <div className="relative z-10">
            <p className="text-blue-200 text-sm font-medium">
              {activeSemester
                ? `${activeSemester.session.name} - ${activeSemester.name}`
                : "Welcome back"}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1">
              Welcome back, {studentProfile.user?.fullName?.split(" ")[0] || "Student"}
            </h1>
            <p className="mt-2 text-blue-200/80 text-sm">
              {studentProfile.program.name} | Semester{" "}
              {studentProfile.currentSemester} | ID: {studentProfile.studentId}
            </p>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 right-20 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        </div>

        {/* Payment Banner */}
        <PaymentBanner paymentStatus={paymentStatus} />

        {/* Stat Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="rounded-xl bg-blue-50 p-3">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Courses</p>
                <p className="text-2xl font-bold">{enrollments.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="rounded-xl bg-orange-50 p-3">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Due Tasks</p>
                <p className="text-2xl font-bold">
                  {pendingAssignments.length + upcomingTests.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="rounded-xl bg-green-50 p-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">CGPA</p>
                <p className="text-2xl font-bold">{cgpa.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="rounded-xl bg-purple-50 p-3">
                <GraduationCap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Credits</p>
                <p className="text-2xl font-bold">{totalCreditsEnrolled}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Continue Learning */}
        {continueLearnCourse && (
          <Link href={`/courses/${continueLearnCourse.id}`}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="py-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-900">
                      Continue Learning
                    </h3>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">
                      {continueLearnCourse.code}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {continueLearnCourse.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {continueLearnCourse.completedMaterials} of{" "}
                      {continueLearnCourse.totalMaterials} items completed
                    </p>
                    <div className="mt-2">
                      <Progress
                        value={continueLearnCourse.progress}
                        className="h-2"
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-blue-600 shrink-0">
                    {continueLearnCourse.progress}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Current Semester Courses Grid */}
        {coursesWithProgress.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Current Courses</h2>
              <Link
                href="/courses"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {coursesWithProgress.slice(0, 6).map((course) => (
                <Link key={course.id} href={`/courses/${course.id}`}>
                  <Card className="h-full border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                    <CardContent className="py-5">
                      <div className="flex items-start justify-between mb-3">
                        <Badge
                          variant="secondary"
                          className="text-xs font-semibold"
                        >
                          {course.code}
                        </Badge>
                        <span className="text-xs font-bold text-blue-600">
                          {course.progress}%
                        </span>
                      </div>
                      <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-xs text-gray-500 mb-3">
                        {course.lecturer.title
                          ? `${course.lecturer.title} `
                          : ""}
                        {course.lecturer.user.fullName}
                      </p>
                      <Progress value={course.progress} className="h-1.5" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Deadlines & Recent Grades */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upcoming Assessments */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5 text-orange-500" />
                Upcoming Assessments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingAssignments.length === 0 &&
              upcomingTests.length === 0 ? (
                <div className="py-6 text-center">
                  <ClipboardCheck className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No upcoming deadlines
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingTests.map((t) => {
                    const now = new Date();
                    const isOpen = new Date(t.startTime) <= now && new Date(t.endTime) >= now;
                    return (
                    <Link
                      key={t.id}
                      href={`/tests/${t.id}`}
                      className="flex items-center gap-3 rounded-lg border p-3 hover:bg-blue-50/50 transition-colors group"
                    >
                      <div className={`rounded-lg p-2 shrink-0 ${isOpen ? "bg-green-100" : "bg-purple-100"}`}>
                        <ClipboardCheck className={`h-4 w-4 ${isOpen ? "text-green-600" : "text-purple-600"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-blue-600">
                          {t.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t.courseAssignment.course.code} -{" "}
                          {t.type === "test" ? "Test" : "Exam"}
                          {" | "}{t.durationMinutes} min
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {isOpen ? (
                          <Badge className="text-xs bg-green-600">Open Now</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {format(new Date(t.startTime), "MMM d")}
                          </Badge>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {isOpen
                            ? `Closes ${formatDistanceToNow(new Date(t.endTime), { addSuffix: true })}`
                            : formatDistanceToNow(new Date(t.startTime), { addSuffix: true })
                          }
                        </p>
                      </div>
                    </Link>
                    );
                  })}
                  {pendingAssignments.map((a) => {
                    const daysUntilDue = Math.ceil(
                      (new Date(a.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const isUrgent = daysUntilDue <= 2;
                    return (
                    <Link
                      key={a.id}
                      href={`/assignments/${a.id}`}
                      className="flex items-center gap-3 rounded-lg border p-3 hover:bg-blue-50/50 transition-colors group"
                    >
                      <div className={`rounded-lg p-2 shrink-0 ${isUrgent ? "bg-red-100" : "bg-orange-100"}`}>
                        <FileText className={`h-4 w-4 ${isUrgent ? "text-red-600" : "text-orange-600"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-blue-600">
                          {a.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.courseAssignment.course.code} - Assignment
                          {" | Max: "}{a.maxScore} pts
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant={isUrgent ? "destructive" : "outline"} className="text-xs">
                          Due {format(new Date(a.dueDate), "MMM d")}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(a.dueDate), { addSuffix: true })}
                        </p>
                      </div>
                    </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Grades */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-green-500" />
                Recent Grades
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentGrades.length === 0 ? (
                <div className="py-6 text-center">
                  <BarChart3 className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No grades released yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentGrades.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <div className="rounded-lg bg-green-100 p-2 shrink-0">
                        <GraduationCap className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {g.courseEnrollment.courseAssignment.course.code}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {g.courseEnrollment.courseAssignment.course.title}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold">{g.letterGrade || "-"}</p>
                        <p className="text-xs text-muted-foreground">
                          {Number(g.totalScore).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-3 border-t">
                <Link
                  href="/grades"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  View all grades <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Academic Calendar & Quick Links */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Calendar Events */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5 text-blue-500" />
                Academic Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {calendarEvents.length === 0 ? (
                <div className="py-6 text-center">
                  <Calendar className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No upcoming events
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {calendarEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 rounded-lg border p-3"
                    >
                      <div className="text-center shrink-0 w-12">
                        <p className="text-xs text-muted-foreground uppercase">
                          {format(new Date(event.startDate), "MMM")}
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                          {format(new Date(event.startDate), "d")}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{event.title}</p>
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {event.description}
                          </p>
                        )}
                        <Badge variant="outline" className="text-[10px] mt-1">
                          {event.eventType.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Access</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    href: "/courses",
                    icon: BookOpen,
                    label: "My Courses",
                    color: "bg-blue-50 text-blue-600",
                  },
                  {
                    href: "/assignments",
                    icon: FileText,
                    label: "Assignments",
                    color: "bg-orange-50 text-orange-600",
                  },
                  {
                    href: "/tests",
                    icon: ClipboardCheck,
                    label: "Tests & Exams",
                    color: "bg-purple-50 text-purple-600",
                  },
                  {
                    href: "/grades",
                    icon: BarChart3,
                    label: "Grades",
                    color: "bg-green-50 text-green-600",
                  },
                  {
                    href: "/payments",
                    icon: Calendar,
                    label: "Payments",
                    color: "bg-pink-50 text-pink-600",
                  },
                  {
                    href: "/id-card",
                    icon: GraduationCap,
                    label: "ID Card",
                    color: "bg-indigo-50 text-indigo-600",
                  },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-xl border p-3.5 hover:shadow-sm hover:border-blue-200 transition-all group"
                  >
                    <div className={`rounded-lg p-2 ${item.color}`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h2 className="text-lg font-bold mb-2">Unable to Load Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              There was an error loading your dashboard. Please try refreshing
              the page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
}
