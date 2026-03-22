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
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  FileQuestion,
  Download,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { requireLecturer, verifyLecturerCourseAccess } from "@/lib/auth";

interface Props {
  params: { id: string; assessmentId: string };
}

export default async function AssessmentDetailPage({ params }: Props) {
  const lecturer = await requireLecturer();
  await verifyLecturerCourseAccess(lecturer.id, params.id);

  const testExam = await prisma.testExam.findUnique({
    where: { id: params.assessmentId },
    include: {
      courseAssignment: {
        include: {
          course: true,
          enrollments: { where: { status: "enrolled" } },
        },
      },
      questions: {
        include: { question: true },
        orderBy: { sortOrder: "asc" },
      },
      attempts: {
        include: {
          student: {
            include: { user: { select: { fullName: true, email: true } } },
          },
          answers: {
            include: { question: true },
          },
        },
        orderBy: { startedAt: "desc" },
      },
    },
  });

  if (!testExam || testExam.courseAssignmentId !== params.id) notFound();

  const totalStudents = testExam.courseAssignment.enrollments.length;
  const attemptCount = testExam.attempts.length;
  const gradedAttempts = testExam.attempts.filter((a) => a.status === "graded");
  const passedCount = gradedAttempts.filter((a) => a.isPassed).length;
  const avgScore =
    gradedAttempts.length > 0
      ? (
          gradedAttempts.reduce((sum, a) => sum + (a.totalScore || 0), 0) /
          gradedAttempts.length
        ).toFixed(1)
      : "N/A";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/courses/${params.id}/assessments`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="capitalize">
                {testExam.type}
              </Badge>
              <Badge variant="secondary">
                {testExam.courseAssignment.course.code}
              </Badge>
              {!testExam.isPublished && <Badge variant="secondary">Draft</Badge>}
            </div>
            <h1 className="text-2xl font-bold">{testExam.title}</h1>
            <p className="text-muted-foreground text-sm">
              {testExam.durationMinutes} min | {testExam.totalMarks} marks
              (pass: {testExam.passMark}) |{" "}
              {format(new Date(testExam.startTime), "MMM d")} -{" "}
              {format(new Date(testExam.endTime), "MMM d, yyyy")}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Attempts</p>
            <p className="text-2xl font-bold">
              {attemptCount}/{totalStudents}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Graded</p>
            <p className="text-2xl font-bold">{gradedAttempts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Pass Rate</p>
            <p className="text-2xl font-bold">
              {gradedAttempts.length > 0
                ? `${Math.round((passedCount / gradedAttempts.length) * 100)}%`
                : "N/A"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Avg Score</p>
            <p className="text-2xl font-bold">
              {avgScore}
              {avgScore !== "N/A" && `/${testExam.totalMarks}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="attempts">
        <TabsList>
          <TabsTrigger value="attempts">
            Student Attempts ({attemptCount})
          </TabsTrigger>
          <TabsTrigger value="questions">
            Questions ({testExam.questions.length})
          </TabsTrigger>
        </TabsList>

        {/* Attempts Tab */}
        <TabsContent value="attempts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Student Attempts</CardTitle>
              <Link
                href={`/api/courses/${params.id}/students?format=csv`}
                target="_blank"
              >
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Download className="h-4 w-4" /> Export CSV
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {testExam.attempts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No student attempts yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium">Student</th>
                        <th className="pb-2 font-medium">Started</th>
                        <th className="pb-2 font-medium">Submitted</th>
                        <th className="pb-2 font-medium text-center">Score</th>
                        <th className="pb-2 font-medium text-center">Status</th>
                        <th className="pb-2 font-medium text-center">Pass</th>
                        <th className="pb-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testExam.attempts.map((attempt) => (
                        <tr key={attempt.id} className="border-b last:border-0">
                          <td className="py-2">
                            <div>
                              <p className="font-medium">
                                {attempt.student.user.fullName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {attempt.student.studentId}
                              </p>
                            </div>
                          </td>
                          <td className="py-2 text-xs">
                            {format(
                              new Date(attempt.startedAt),
                              "MMM d, h:mm a"
                            )}
                          </td>
                          <td className="py-2 text-xs">
                            {attempt.submittedAt
                              ? format(
                                  new Date(attempt.submittedAt),
                                  "MMM d, h:mm a"
                                )
                              : "-"}
                          </td>
                          <td className="py-2 text-center font-medium">
                            {attempt.totalScore !== null
                              ? `${attempt.totalScore}/${attempt.maxScore}`
                              : "-"}
                          </td>
                          <td className="py-2 text-center">
                            <Badge
                              variant="outline"
                              className={`text-xs capitalize ${
                                attempt.status === "graded"
                                  ? "bg-green-50 text-green-700"
                                  : attempt.status === "submitted"
                                  ? "bg-yellow-50 text-yellow-700"
                                  : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              {attempt.status.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="py-2 text-center">
                            {attempt.isPassed === true && (
                              <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                            )}
                            {attempt.isPassed === false && (
                              <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                            )}
                            {attempt.isPassed === null && (
                              <span className="text-xs text-muted-foreground">
                                -
                              </span>
                            )}
                          </td>
                          <td className="py-2">
                            <Link
                              href={`/tests/${testExam.id}/attempts/${attempt.id}/grade`}
                            >
                              <Button size="sm" variant="outline" className="text-xs">
                                {attempt.status === "graded" ? "Review" : "Grade"}
                              </Button>
                            </Link>
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

        {/* Questions Tab */}
        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>
                Questions Preview ({testExam.questions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testExam.questions.map((tq, idx) => {
                  const q = tq.question;
                  const opts = q.options as
                    | { text: string; isCorrect: boolean }[]
                    | null;
                  return (
                    <div key={tq.id} className="rounded-lg border p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          Q{idx + 1}
                        </Badge>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {q.questionType.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {q.points} pts
                        </span>
                      </div>
                      <p className="text-sm mb-2">{q.questionText}</p>

                      {opts && (
                        <div className="space-y-1">
                          {opts.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              className={`flex items-center gap-2 text-sm px-2 py-1 rounded ${
                                opt.isCorrect
                                  ? "bg-green-50 text-green-800"
                                  : ""
                              }`}
                            >
                              <span className="text-xs font-medium">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <span>{opt.text}</span>
                              {opt.isCorrect && (
                                <CheckCircle className="h-3 w-3 text-green-600 ml-auto" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.correctAnswer && (
                        <p className="text-sm mt-1">
                          <span className="text-muted-foreground">
                            Answer:{" "}
                          </span>
                          <span className="font-medium text-green-700">
                            {q.correctAnswer}
                          </span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
