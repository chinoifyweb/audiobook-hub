import { prisma } from "@repo/db";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "@repo/ui";
import {
  Plus,
  ArrowLeft,
  FileQuestion,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Pencil,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { requireLecturer, verifyLecturerCourseAccess } from "@/lib/auth";

interface Props {
  params: { id: string };
}

export default async function CourseAssessmentsPage({ params }: Props) {
  const lecturer = await requireLecturer();
  await verifyLecturerCourseAccess(lecturer.id, params.id);

  const courseAssignment = await prisma.courseAssignment.findUnique({
    where: { id: params.id },
    include: {
      course: true,
      testExams: {
        include: {
          questions: true,
          attempts: {
            include: {
              student: {
                include: { user: { select: { fullName: true } } },
              },
            },
          },
        },
        orderBy: { startTime: "desc" },
      },
      enrollments: { where: { status: "enrolled" } },
    },
  });

  if (!courseAssignment) notFound();

  const { course, testExams, enrollments } = courseAssignment;
  const totalStudents = enrollments.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/courses/${params.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Assessments</h1>
            <p className="text-muted-foreground">
              {course.code} - {course.title}
            </p>
          </div>
        </div>
        <Link href={`/courses/${params.id}/assessments/new`}>
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" /> Create Assessment
          </Button>
        </Link>
      </div>

      {/* Assessment List */}
      {testExams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              No assessments created yet. Create your first quiz or exam.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {testExams.map((te) => {
            const now = new Date();
            const isUpcoming = new Date(te.startTime) > now;
            const isActive =
              new Date(te.startTime) <= now && new Date(te.endTime) >= now;
            const isEnded = new Date(te.endTime) < now;
            const attemptCount = te.attempts.length;
            const gradedCount = te.attempts.filter(
              (a) => a.status === "graded"
            ).length;
            const passedCount = te.attempts.filter(
              (a) => a.isPassed === true
            ).length;
            const completionRate =
              totalStudents > 0
                ? Math.round((attemptCount / totalStudents) * 100)
                : 0;

            return (
              <Card key={te.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold">{te.title}</h3>
                        <Badge
                          variant="outline"
                          className="text-xs capitalize"
                        >
                          {te.type}
                        </Badge>
                        {!te.isPublished && (
                          <Badge variant="secondary" className="text-xs">
                            Draft
                          </Badge>
                        )}
                        {isUpcoming && (
                          <Badge className="text-xs bg-blue-100 text-blue-700">
                            Upcoming
                          </Badge>
                        )}
                        {isActive && (
                          <Badge className="text-xs bg-green-100 text-green-700">
                            Active Now
                          </Badge>
                        )}
                        {isEnded && (
                          <Badge className="text-xs bg-gray-100 text-gray-600">
                            Ended
                          </Badge>
                        )}
                      </div>

                      {te.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {te.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(te.startTime), "MMM d, h:mm a")} -{" "}
                          {format(new Date(te.endTime), "MMM d, h:mm a")}
                        </span>
                        <span>{te.durationMinutes} min</span>
                        <span>{te.totalMarks} marks (pass: {te.passMark})</span>
                        <span>{te.questions.length} questions</span>
                      </div>

                      {/* Stats bar */}
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {attemptCount}/{totalStudents} attempted ({completionRate}%)
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          {gradedCount} graded
                        </span>
                        {isEnded && (
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 text-blue-600" />
                            {passedCount}/{gradedCount} passed
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <Link href={`/courses/${params.id}/assessments/${te.id}`}>
                        <Button size="sm" variant="outline" className="gap-1.5 w-full">
                          <Eye className="h-3.5 w-3.5" /> View Details
                        </Button>
                      </Link>
                      <Link href={`/tests/${te.id}/attempts`}>
                        <Button size="sm" variant="ghost" className="w-full">
                          View Attempts
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
