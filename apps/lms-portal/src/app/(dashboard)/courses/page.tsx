import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";
import { checkCurrentSemesterPayment } from "@/lib/payment-status";
import { Card, CardContent, Badge, Progress } from "@repo/ui";
import {
  BookOpen,
  User,
  Clock,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Lock,
} from "lucide-react";
import Link from "next/link";

export default async function CoursesPage() {
  try {
    const { studentProfile } = await requireStudent();

    const [activeSemester, paymentStatus] = await Promise.all([
      prisma.semester.findFirst({
        where: { isActive: true },
        include: { session: true },
      }),
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

    const isUnpaid = !paymentStatus.hasPaid && !paymentStatus.hasScholarship;

    const enrollments = activeSemester
      ? await prisma.courseEnrollment.findMany({
          where: {
            studentId: studentProfile.id,
            semesterId: activeSemester.id,
          },
          include: {
            courseAssignment: {
              include: {
                course: true,
                lecturer: {
                  include: {
                    user: { select: { fullName: true } },
                  },
                },
                materials: {
                  where: { isPublished: true },
                  select: { id: true },
                },
                testExams: {
                  where: { isPublished: true },
                  select: { id: true },
                },
                assignments: {
                  where: { isPublished: true },
                  select: { id: true },
                },
              },
            },
            grade: true,
          },
        })
      : [];

    // Get material progress for all enrolled courses
    const allMaterialIds = enrollments.flatMap((e) =>
      e.courseAssignment.materials.map((m) => m.id)
    );
    const completedProgress =
      allMaterialIds.length > 0
        ? await prisma.courseMaterialProgress.findMany({
            where: {
              studentId: studentProfile.id,
              courseMaterialId: { in: allMaterialIds },
              completed: true,
            },
            select: { courseMaterialId: true },
          })
        : [];
    const completedSet = new Set(
      completedProgress.map((p) => p.courseMaterialId)
    );

    const coursesData = enrollments.map((enrollment) => {
      const { courseAssignment, grade } = enrollment;
      const { course, lecturer, materials, testExams, assignments } =
        courseAssignment;
      const totalMaterials = materials.length;
      const completedMaterials = materials.filter((m) =>
        completedSet.has(m.id)
      ).length;
      const progress =
        totalMaterials > 0
          ? Math.round((completedMaterials / totalMaterials) * 100)
          : 0;

      return {
        id: courseAssignment.id,
        code: course.code,
        title: course.title,
        description: course.description,
        creditUnits: course.creditUnits,
        semesterNumber: course.semesterNumber,
        lecturer: {
          name: lecturer.user.fullName,
          title: lecturer.title,
        },
        progress,
        totalMaterials,
        completedMaterials,
        totalTests: testExams.length,
        totalAssignments: assignments.length,
        grade: grade
          ? {
              letterGrade: grade.letterGrade,
              totalScore: Number(grade.totalScore),
            }
          : null,
        enrollmentStatus: enrollment.status,
      };
    });

    // Color palette for course cards
    const courseColors = [
      "from-blue-600 to-blue-800",
      "from-purple-600 to-purple-800",
      "from-emerald-600 to-emerald-800",
      "from-orange-600 to-orange-800",
      "from-rose-600 to-rose-800",
      "from-indigo-600 to-indigo-800",
      "from-teal-600 to-teal-800",
      "from-amber-600 to-amber-800",
    ];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Courses</h1>
            <p className="text-muted-foreground text-sm">
              {activeSemester
                ? `${activeSemester.session.name} - ${activeSemester.name}`
                : "No active semester"}
              {enrollments.length > 0 &&
                ` | ${enrollments.length} course${enrollments.length !== 1 ? "s" : ""} enrolled`}
            </p>
          </div>
        </div>

        {coursesData.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <BookOpen className="mx-auto h-14 w-14 text-muted-foreground/30" />
              <p className="mt-4 text-lg font-medium text-muted-foreground">
                No courses this semester
              </p>
              <p className="mt-1 text-sm text-muted-foreground/70">
                You are not enrolled in any courses for the current semester.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {coursesData.map((course, index) => (
              <Link key={course.id} href={`/courses/${course.id}`}>
                <Card className={`h-full border-0 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden relative ${isUnpaid ? "opacity-75" : ""}`}>
                  {/* Lock overlay for unpaid students */}
                  {isUnpaid && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className="flex items-center gap-1.5 bg-orange-100 text-orange-700 rounded-full px-2.5 py-1 text-[10px] font-semibold">
                        <Lock className="h-3 w-3" />
                        <span>Locked</span>
                      </div>
                    </div>
                  )}
                  {/* Color header bar */}
                  <div
                    className={`h-2 bg-gradient-to-r ${courseColors[index % courseColors.length]}`}
                  />
                  <CardContent className="pt-5 pb-4">
                    {/* Code and credits */}
                    <div className="flex items-start justify-between mb-3">
                      <Badge
                        variant="secondary"
                        className="text-xs font-semibold"
                      >
                        {course.code}
                      </Badge>
                      {!isUnpaid && (
                        <Badge variant="outline" className="text-xs">
                          {course.creditUnits} CU
                        </Badge>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-3 group-hover:text-blue-600 transition-colors min-h-[40px]">
                      {course.title}
                    </h3>

                    {/* Lecturer */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <User className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {course.lecturer.title
                          ? `${course.lecturer.title} `
                          : ""}
                        {course.lecturer.name}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-500">
                          {course.completedMaterials}/{course.totalMaterials}{" "}
                          completed
                        </span>
                        <span className="font-semibold text-blue-600">
                          {course.progress}%
                        </span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-3 text-xs text-gray-400 pt-3 border-t">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {course.totalMaterials} materials
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {course.totalTests} tests
                      </span>
                      {course.grade && (
                        <span className="flex items-center gap-1 ml-auto font-semibold text-green-600">
                          <GraduationCap className="h-3 w-3" />
                          {course.grade.letterGrade}
                        </span>
                      )}
                    </div>

                    {/* Completion badge */}
                    {course.progress === 100 && !isUnpaid && (
                      <div className="flex items-center gap-1.5 mt-3 text-xs text-green-600 bg-green-50 rounded-lg px-3 py-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span className="font-medium">Course completed</span>
                      </div>
                    )}

                    {/* Pay tuition prompt for unpaid */}
                    {isUnpaid && (
                      <div className="flex items-center gap-1.5 mt-3 text-xs text-orange-700 bg-orange-50 rounded-lg px-3 py-1.5">
                        <Lock className="h-3.5 w-3.5" />
                        <span className="font-medium">Pay tuition to unlock</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  } catch {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Courses</h1>
        </div>
        <Card className="border-destructive">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <p className="text-muted-foreground">
              Failed to load courses. Please refresh the page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
}
