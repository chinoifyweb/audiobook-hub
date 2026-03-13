import { prisma } from "@repo/db";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui";
import {
  FileText,
  ClipboardCheck,
  FileQuestion,
  Users,
  Plus,
  ExternalLink,
  Calendar,
  Table2,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { requireLecturer, verifyLecturerCourseAccess } from "@/lib/auth";

interface Props {
  params: { id: string };
}

export default async function CourseDetailPage({ params }: Props) {
  const lecturer = await requireLecturer();
  await verifyLecturerCourseAccess(lecturer.id, params.id);

  const courseAssignment = await prisma.courseAssignment.findUnique({
    where: { id: params.id },
    include: {
      course: {
        include: { department: true },
      },
      semester: { include: { session: true } },
      materials: { orderBy: { sortOrder: "asc" } },
      assignments: {
        include: {
          submissions: {
            include: {
              student: {
                include: { user: { select: { fullName: true } } },
              },
            },
          },
        },
        orderBy: { dueDate: "desc" },
      },
      testExams: {
        orderBy: { startTime: "desc" },
        include: {
          attempts: true,
        },
      },
      enrollments: {
        where: { status: "enrolled" },
        include: {
          student: {
            include: {
              user: { select: { fullName: true, email: true } },
            },
          },
          grade: true,
        },
        orderBy: {
          student: { user: { fullName: "asc" } },
        },
      },
    },
  });

  if (!courseAssignment) notFound();

  const { course, materials, assignments, testExams, enrollments, semester } = courseAssignment;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="secondary">{course.code}</Badge>
          <Badge variant="outline">{course.creditUnits} Credits</Badge>
        </div>
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <p className="text-muted-foreground">
          {course.department.name} &middot; {semester.name}, {semester.session.name}
        </p>
        {course.description && (
          <p className="mt-2 text-sm text-muted-foreground">{course.description}</p>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="materials">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="materials" className="gap-1.5">
            <FileText className="h-3.5 w-3.5 hidden sm:inline" />
            Materials
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-1.5">
            <ClipboardCheck className="h-3.5 w-3.5 hidden sm:inline" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="tests" className="gap-1.5">
            <FileQuestion className="h-3.5 w-3.5 hidden sm:inline" />
            Tests
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-1.5">
            <Users className="h-3.5 w-3.5 hidden sm:inline" />
            Students
          </TabsTrigger>
          <TabsTrigger value="grades" className="gap-1.5">
            <Table2 className="h-3.5 w-3.5 hidden sm:inline" />
            Grades
          </TabsTrigger>
        </TabsList>

        {/* Materials Tab */}
        <TabsContent value="materials">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Course Materials</CardTitle>
              <Link href={`/materials/${params.id}/new`}>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" /> Add Material
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {materials.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No materials uploaded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {materials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{material.title}</p>
                          <Badge variant="outline" className="text-xs capitalize">
                            {material.type.replace("_", " ")}
                          </Badge>
                          {!material.isPublished && (
                            <Badge variant="secondary" className="text-xs">Draft</Badge>
                          )}
                        </div>
                        {material.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {material.description}
                          </p>
                        )}
                      </div>
                      <a
                        href={material.contentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" variant="ghost">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Assignments</CardTitle>
              <Link href={`/assignments/new?courseId=${params.id}`}>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" /> Create Assignment
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No assignments created yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {assignments.map((assignment) => {
                    const graded = assignment.submissions.filter((s) => s.score !== null).length;
                    const total = assignment.submissions.length;
                    const isPastDue = new Date(assignment.dueDate) < new Date();

                    return (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{assignment.title}</p>
                            {!assignment.isPublished && (
                              <Badge variant="secondary" className="text-xs">Draft</Badge>
                            )}
                            {isPastDue && (
                              <Badge variant="destructive" className="text-xs">Past Due</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due {format(new Date(assignment.dueDate), "MMM d, yyyy")}
                            </span>
                            <span>Max: {assignment.maxScore} pts</span>
                            <span>{graded}/{total} graded</span>
                          </div>
                        </div>
                        <Link href={`/assignments/${assignment.id}/submissions`}>
                          <Button size="sm" variant="outline">
                            View Submissions
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tests Tab */}
        <TabsContent value="tests">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tests & Exams</CardTitle>
              <Link href={`/tests/new?courseId=${params.id}`}>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" /> Create Test
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {testExams.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No tests or exams created yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {testExams.map((te) => {
                    const now = new Date();
                    const isUpcoming = new Date(te.startTime) > now;
                    const isActive = new Date(te.startTime) <= now && new Date(te.endTime) >= now;
                    const isEnded = new Date(te.endTime) < now;

                    return (
                      <div
                        key={te.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{te.title}</p>
                            <Badge variant="outline" className="text-xs capitalize">
                              {te.type}
                            </Badge>
                            {!te.isPublished && (
                              <Badge variant="secondary" className="text-xs">Draft</Badge>
                            )}
                            {isUpcoming && (
                              <Badge className="text-xs bg-blue-100 text-blue-700">Upcoming</Badge>
                            )}
                            {isActive && (
                              <Badge className="text-xs bg-green-100 text-green-700">Active</Badge>
                            )}
                            {isEnded && (
                              <Badge className="text-xs bg-gray-100 text-gray-600">Ended</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>
                              {format(new Date(te.startTime), "MMM d, h:mm a")} -{" "}
                              {format(new Date(te.endTime), "MMM d, h:mm a")}
                            </span>
                            <span>{te.durationMinutes} min</span>
                            <span>{te.totalMarks} marks</span>
                            <span>{te.attempts.length} attempts</span>
                          </div>
                        </div>
                        <Link href={`/tests/${te.id}/attempts`}>
                          <Button size="sm" variant="outline">
                            View Attempts
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Students ({enrollments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No students enrolled.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium">Name</th>
                        <th className="pb-2 font-medium">Student ID</th>
                        <th className="pb-2 font-medium">Email</th>
                        <th className="pb-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((enrollment) => (
                        <tr key={enrollment.id} className="border-b last:border-0">
                          <td className="py-2">{enrollment.student.user.fullName}</td>
                          <td className="py-2">{enrollment.student.studentId}</td>
                          <td className="py-2 text-muted-foreground">
                            {enrollment.student.user.email}
                          </td>
                          <td className="py-2">
                            <Badge variant="outline" className="capitalize text-xs">
                              {enrollment.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grades Tab */}
        <TabsContent value="grades">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Grades Overview</CardTitle>
              <Link href={`/grade-sheet?course=${params.id}`}>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Table2 className="h-4 w-4" /> Full Grade Sheet
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No students enrolled.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium">Student</th>
                        <th className="pb-2 font-medium text-center">Test</th>
                        <th className="pb-2 font-medium text-center">Exam</th>
                        <th className="pb-2 font-medium text-center">Assignment</th>
                        <th className="pb-2 font-medium text-center">Total</th>
                        <th className="pb-2 font-medium text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((enrollment) => {
                        const grade = enrollment.grade;
                        return (
                          <tr key={enrollment.id} className="border-b last:border-0">
                            <td className="py-2">{enrollment.student.user.fullName}</td>
                            <td className="py-2 text-center">
                              {grade ? Number(grade.testScore).toFixed(1) : "-"}
                            </td>
                            <td className="py-2 text-center">
                              {grade ? Number(grade.examScore).toFixed(1) : "-"}
                            </td>
                            <td className="py-2 text-center">
                              {grade ? Number(grade.assignmentScore).toFixed(1) : "-"}
                            </td>
                            <td className="py-2 text-center font-medium">
                              {grade ? Number(grade.totalScore).toFixed(1) : "-"}
                            </td>
                            <td className="py-2 text-center">
                              {grade?.letterGrade ? (
                                <Badge variant="outline">{grade.letterGrade}</Badge>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
