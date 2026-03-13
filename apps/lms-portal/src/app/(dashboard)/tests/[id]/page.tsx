import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Separator } from "@repo/ui";
import { ClipboardCheck, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default async function TestInfoPage({
  params,
}: {
  params: { id: string };
}) {
  const { studentProfile } = await requireStudent();

  const testExam = await prisma.testExam.findUnique({
    where: { id: params.id },
    include: {
      courseAssignment: {
        include: {
          course: { select: { code: true, title: true } },
          enrollments: {
            where: { studentId: studentProfile.id, status: "enrolled" },
          },
        },
      },
      attempts: {
        where: { studentId: studentProfile.id },
        orderBy: { startedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!testExam) {
    notFound();
  }

  if (testExam.courseAssignment.enrollments.length === 0) {
    notFound();
  }

  const now = new Date();
  const isWithinWindow =
    new Date(testExam.startTime) <= now && new Date(testExam.endTime) >= now;
  const isPast = new Date(testExam.endTime) < now;
  const attempt = testExam.attempts[0];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="text-sm text-muted-foreground">
          {testExam.courseAssignment.course.code} -{" "}
          {testExam.courseAssignment.course.title}
        </p>
        <h1 className="text-2xl font-bold">{testExam.title}</h1>
      </div>

      {/* Test Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardCheck className="h-5 w-5" />
            {testExam.type === "test" ? "Test" : "Examination"} Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-muted-foreground">Type</div>
            <div>
              <Badge variant="outline">
                {testExam.type === "test" ? "Test" : "Exam"}
              </Badge>
            </div>
            <div className="text-muted-foreground">Duration</div>
            <div>{testExam.durationMinutes} minutes</div>
            <div className="text-muted-foreground">Total Marks</div>
            <div>{testExam.totalMarks}</div>
            <div className="text-muted-foreground">Pass Mark</div>
            <div>{testExam.passMark}</div>
            <div className="text-muted-foreground">Start Time</div>
            <div>{format(new Date(testExam.startTime), "MMM d, yyyy HH:mm")}</div>
            <div className="text-muted-foreground">End Time</div>
            <div>{format(new Date(testExam.endTime), "MMM d, yyyy HH:mm")}</div>
            {testExam.shuffleQuestions && (
              <>
                <div className="text-muted-foreground">Questions</div>
                <div>Shuffled order</div>
              </>
            )}
          </div>

          {testExam.description && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {testExam.description}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rules & Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
            <li>Once you start the test, the timer will begin counting down.</li>
            <li>
              You have {testExam.durationMinutes} minutes to complete the test.
            </li>
            <li>The test will auto-submit when the timer expires.</li>
            <li>You can navigate between questions using the question panel.</li>
            <li>Make sure to save your answers before moving to the next question.</li>
            <li>Do not refresh the page during the test.</li>
            {testExam.showResultsImmediately && (
              <li>Results will be available immediately after submission.</li>
            )}
          </ul>
        </CardContent>
      </Card>

      {/* Action Section */}
      {attempt && (attempt.status === "submitted" || attempt.status === "graded") ? (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-bold">Test Completed</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Status</div>
              <div>
                <Badge>
                  {attempt.status === "graded" ? "Graded" : "Submitted"}
                </Badge>
              </div>
              {attempt.totalScore !== null && (
                <>
                  <div className="text-muted-foreground">Score</div>
                  <div className="font-bold">
                    {attempt.totalScore}/{attempt.maxScore}
                    {attempt.isPassed !== null && (
                      <Badge
                        variant={attempt.isPassed ? "default" : "destructive"}
                        className="ml-2"
                      >
                        {attempt.isPassed ? "Passed" : "Failed"}
                      </Badge>
                    )}
                  </div>
                </>
              )}
              <div className="text-muted-foreground">Submitted</div>
              <div>
                {attempt.submittedAt
                  ? format(new Date(attempt.submittedAt), "MMM d, yyyy HH:mm")
                  : "N/A"}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : attempt && attempt.status === "in_progress" ? (
        <Card>
          <CardContent className="py-6 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-orange-500 mb-3" />
            <p className="font-medium mb-3">You have a test in progress.</p>
            <Link href={`/tests/${params.id}/take`}>
              <Button>Continue Test</Button>
            </Link>
          </CardContent>
        </Card>
      ) : isWithinWindow ? (
        <Card>
          <CardContent className="py-6 text-center">
            <Clock className="mx-auto h-8 w-8 text-green-600 mb-3" />
            <p className="font-medium mb-1">This test is available now.</p>
            <p className="text-sm text-muted-foreground mb-4">
              Once you start, you will have {testExam.durationMinutes} minutes.
            </p>
            <Link href={`/tests/${params.id}/take`}>
              <Button size="lg">Start Test</Button>
            </Link>
          </CardContent>
        </Card>
      ) : isPast ? (
        <Card>
          <CardContent className="py-6 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-destructive/50 mb-3" />
            <p className="text-muted-foreground">
              This test window has closed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-6 text-center">
            <Clock className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              This test will be available starting{" "}
              {format(new Date(testExam.startTime), "MMM d, yyyy 'at' HH:mm")}.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
