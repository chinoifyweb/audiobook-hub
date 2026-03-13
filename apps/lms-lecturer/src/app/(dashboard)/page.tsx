import { prisma } from "@repo/db";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@repo/ui";
import {
  BookOpen,
  Users,
  ClipboardCheck,
  FileQuestion,
  FileText,
  Plus,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { requireLecturer, getActiveSemester } from "@/lib/auth";

export default async function DashboardPage() {
  const lecturer = await requireLecturer();
  const activeSemester = await getActiveSemester();

  if (!activeSemester) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">
          Welcome, {lecturer.title ? `${lecturer.title} ` : ""}{lecturer.user.fullName}
        </h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No active semester found. Please contact the administration.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get course assignments
  const courseAssignments = await prisma.courseAssignment.findMany({
    where: {
      lecturerId: lecturer.id,
      semesterId: activeSemester.id,
      isActive: true,
    },
    include: {
      course: true,
      enrollments: { where: { status: "enrolled" } },
      materials: true,
      assignments: {
        include: {
          submissions: { where: { score: null } },
        },
      },
      testExams: {
        where: {
          endTime: { gte: new Date() },
        },
      },
    },
  });

  const totalStudents = courseAssignments.reduce(
    (sum, ca) => sum + ca.enrollments.length,
    0
  );

  const pendingSubmissions = courseAssignments.reduce(
    (sum, ca) =>
      sum + ca.assignments.reduce((s, a) => s + a.submissions.length, 0),
    0
  );

  const upcomingTests = courseAssignments.reduce(
    (sum, ca) => sum + ca.testExams.length,
    0
  );

  // Recent ungraded submissions
  const recentSubmissions = await prisma.assignmentSubmission.findMany({
    where: {
      score: null,
      assignment: {
        courseAssignment: {
          lecturerId: lecturer.id,
          semesterId: activeSemester.id,
        },
      },
    },
    include: {
      student: {
        include: { user: { select: { fullName: true } } },
      },
      assignment: {
        include: {
          courseAssignment: {
            include: { course: true },
          },
        },
      },
    },
    orderBy: { submittedAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome, {lecturer.title ? `${lecturer.title} ` : ""}{lecturer.user.fullName}
        </h1>
        <p className="text-muted-foreground">
          {lecturer.department.name} &middot; {activeSemester.name}, {activeSemester.session.name}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assigned Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{courseAssignments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalStudents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Submissions
            </CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingSubmissions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Tests
            </CardTitle>
            <FileQuestion className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{upcomingTests}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Submissions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Submissions to Grade</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSubmissions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No pending submissions.
              </p>
            ) : (
              <div className="space-y-3">
                {recentSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {sub.student.user.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sub.assignment.title} &middot;{" "}
                        {sub.assignment.courseAssignment.course.code}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {format(new Date(sub.submittedAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {sub.isLate && (
                        <Badge variant="destructive" className="text-xs">Late</Badge>
                      )}
                      <Link href={`/assignments/${sub.assignmentId}/submissions/${sub.id}/grade`}>
                        <Button size="sm" variant="outline">
                          Grade
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/courses" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <FileText className="h-4 w-4" />
                Upload Material
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/courses" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" />
                Create Assignment
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/courses" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <FileQuestion className="h-4 w-4" />
                Create Test
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/grade-sheet" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Grade Sheet
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
