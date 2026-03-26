import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";
import { checkCurrentSemesterPayment } from "@/lib/payment-status";
import { PaymentGate } from "@/components/payment-gate";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Separator,
} from "@repo/ui";
import {
  ClipboardCheck,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  FileText,
  ArrowLeft,
  ShieldCheck,
  Info,
  Trophy,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default async function QuizLandingPage({
  params,
}: {
  params: { id: string; quizId: string };
}) {
  const { studentProfile } = await requireStudent();

  const testExam = await prisma.testExam.findUnique({
    where: { id: params.quizId },
    include: {
      courseAssignment: {
        include: {
          course: { select: { code: true, title: true } },
          enrollments: {
            where: { studentId: studentProfile.id, status: "enrolled" },
          },
        },
      },
      questions: {
        select: { id: true },
      },
      attempts: {
        where: { studentId: studentProfile.id },
        orderBy: { startedAt: "desc" },
      },
    },
  });

  if (!testExam) {
    notFound();
  }

  if (testExam.courseAssignment.enrollments.length === 0) {
    notFound();
  }

  const paymentStatus = await checkCurrentSemesterPayment(studentProfile.id);

  const now = new Date();
  const isOpen =
    new Date(testExam.startTime) <= now && new Date(testExam.endTime) >= now;
  const isPast = new Date(testExam.endTime) < now;
  const isUpcoming = new Date(testExam.startTime) > now;
  const maxAttempts = 2 as number;
  const completedAttempts = testExam.attempts.filter(
    (a) => a.status === "submitted" || a.status === "graded"
  );
  const inProgressAttempt = testExam.attempts.find(
    (a) => a.status === "in_progress"
  );
  const canAttempt =
    isOpen && completedAttempts.length < maxAttempts && !inProgressAttempt;
  const bestAttempt = completedAttempts.reduce(
    (best, current) => {
      if (!best) return current;
      if (
        current.totalScore !== null &&
        (best.totalScore === null || current.totalScore > best.totalScore)
      ) {
        return current;
      }
      return best;
    },
    completedAttempts[0] ?? null
  );

  return (
    <PaymentGate paymentStatus={paymentStatus} message="Complete your tuition payment to access quizzes and assessments.">
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/courses" className="hover:text-blue-600">
          Courses
        </Link>
        <span>/</span>
        <Link
          href={`/courses/${params.id}`}
          className="hover:text-blue-600"
        >
          {testExam.courseAssignment.course.code}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Quiz</span>
      </div>

      {/* Quiz header */}
      <div className="bg-gradient-to-r from-[#0D2137] to-[#1a3a5c] rounded-xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-white/10 p-3">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-blue-200">
              {testExam.courseAssignment.course.code} -{" "}
              {testExam.courseAssignment.course.title}
            </p>
            <h1 className="text-2xl font-bold mt-1">{testExam.title}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
              <Badge
                variant="secondary"
                className="bg-white/10 text-white border-0"
              >
                {testExam.type === "test" ? "Test" : "Examination"}
              </Badge>
              <span className="text-blue-200">
                {testExam.questions.length} Questions
              </span>
              <span className="text-blue-200">
                {testExam.totalMarks} Marks
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            icon: Clock,
            label: "Time Limit",
            value: `${testExam.durationMinutes} minutes`,
            color: "bg-blue-50 text-blue-600",
          },
          {
            icon: FileText,
            label: "Questions",
            value: `${testExam.questions.length}`,
            color: "bg-purple-50 text-purple-600",
          },
          {
            icon: Trophy,
            label: "Pass Mark",
            value: `${testExam.passMark}/${testExam.totalMarks}`,
            color: "bg-green-50 text-green-600",
          },
          {
            icon: ShieldCheck,
            label: "Attempts",
            value: `${completedAttempts.length}/${maxAttempts}`,
            color: "bg-orange-50 text-orange-600",
          },
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="py-4 text-center">
              <div
                className={`inline-flex rounded-lg p-2 mb-2 ${stat.color}`}
              >
                <stat.icon className="h-4 w-4" />
              </div>
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Assessment Window */}
      <Card className="border-0 shadow-sm">
        <CardContent className="py-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold">Assessment Window</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Opens</p>
              <p className="font-medium">
                {format(new Date(testExam.startTime), "EEEE, MMMM d, yyyy")}
              </p>
              <p className="text-gray-500">
                {format(new Date(testExam.startTime), "h:mm a")}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Closes</p>
              <p className="font-medium">
                {format(new Date(testExam.endTime), "EEEE, MMMM d, yyyy")}
              </p>
              <p className="text-gray-500">
                {format(new Date(testExam.endTime), "h:mm a")}
              </p>
            </div>
          </div>
          <div className="mt-3">
            {isOpen ? (
              <Badge className="bg-green-100 text-green-700 border-0">
                Assessment is currently open
              </Badge>
            ) : isUpcoming ? (
              <Badge className="bg-blue-100 text-blue-700 border-0">
                Assessment has not started yet
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-700 border-0">
                Assessment window has closed
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {testExam.description && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-5">
            <h3 className="text-sm font-semibold mb-2">Description</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {testExam.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Guidelines */}
      <Card className="border-0 shadow-sm border-l-4 border-l-blue-500">
        <CardContent className="py-5">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold">
              Assessment Guidelines
            </h3>
          </div>
          <ul className="space-y-2.5">
            {[
              "Take your time to read each question thoroughly before selecting an answer.",
              `You are allowed ${maxAttempts === 1 ? "one (1) attempt" : `two (${maxAttempts}) attempts`} for this assessment.`,
              "Each attempt is timed\u2014manage your time wisely.",
              `No additional attempts will be granted after the ${maxAttempts === 1 ? "first" : "second"} submission.`,
              "The highest score from your attempts will be recorded as your Continuous Assessment (CA) mark.",
              "This assessment contributes to your final score\u2014ensure timely submission to avoid penalties.",
            ].map((guideline, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <div className="mt-0.5 h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </div>
                <span className="text-gray-600">{guideline}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Previous Attempts */}
      {completedAttempts.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-5">
            <h3 className="text-sm font-semibold mb-3">Previous Attempts</h3>
            <div className="space-y-3">
              {completedAttempts.map((attempt, i) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Attempt {i + 1}
                      </p>
                      <p className="text-xs text-gray-500">
                        {attempt.submittedAt
                          ? format(
                              new Date(attempt.submittedAt),
                              "MMM d, yyyy h:mm a"
                            )
                          : "Submitted"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {attempt.totalScore !== null && (
                      <div className="text-right">
                        <p className="text-sm font-bold">
                          {attempt.totalScore}/{attempt.maxScore}
                        </p>
                        <p className="text-xs text-gray-500">
                          {Math.round(
                            (attempt.totalScore / attempt.maxScore) * 100
                          )}
                          %
                        </p>
                      </div>
                    )}
                    {attempt.isPassed !== null && (
                      <Badge
                        variant={attempt.isPassed ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {attempt.isPassed ? "Passed" : "Failed"}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {bestAttempt && bestAttempt.totalScore !== null && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  <span className="font-semibold">Best Score:</span>{" "}
                  {bestAttempt.totalScore}/{bestAttempt.maxScore} (
                  {Math.round(
                    (bestAttempt.totalScore / bestAttempt.maxScore) * 100
                  )}
                  %)
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Section */}
      <Card className="border-0 shadow-sm">
        <CardContent className="py-6">
          {inProgressAttempt ? (
            <div className="text-center">
              <AlertTriangle className="mx-auto h-10 w-10 text-orange-500 mb-3" />
              <h3 className="text-lg font-bold mb-2">
                You have an attempt in progress
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Continue your current attempt before starting a new one.
              </p>
              <Link
                href={`/courses/${params.id}/quiz/${params.quizId}/take`}
              >
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Continue Attempt
                </Button>
              </Link>
            </div>
          ) : canAttempt ? (
            <div className="text-center">
              <div className="inline-flex rounded-full bg-green-100 p-4 mb-4">
                <ClipboardCheck className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold mb-2">Ready to begin?</h3>
              <p className="text-sm text-gray-500 mb-1">
                Once you start, you will have{" "}
                <span className="font-semibold">
                  {testExam.durationMinutes} minutes
                </span>{" "}
                to complete the assessment.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                This will be attempt{" "}
                <span className="font-semibold">
                  {completedAttempts.length + 1}
                </span>{" "}
                of{" "}
                <span className="font-semibold">{maxAttempts}</span>.
              </p>
              <Link
                href={`/courses/${params.id}/quiz/${params.quizId}/take`}
              >
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 px-8"
                >
                  Attempt Quiz
                </Button>
              </Link>
            </div>
          ) : completedAttempts.length >= maxAttempts ? (
            <div className="text-center">
              <CheckCircle className="mx-auto h-10 w-10 text-green-600 mb-3" />
              <h3 className="text-lg font-bold mb-2">
                All attempts completed
              </h3>
              <p className="text-sm text-gray-500">
                You have used all {maxAttempts} attempts for this assessment.
                {bestAttempt?.totalScore !== null &&
                  ` Your best score of ${bestAttempt.totalScore}/${bestAttempt.maxScore} will be recorded.`}
              </p>
              {testExam.showResultsImmediately && (
                <Link
                  href={`/courses/${params.id}/quiz/${params.quizId}/results`}
                  className="mt-4 inline-block"
                >
                  <Button variant="outline">View Results</Button>
                </Link>
              )}
            </div>
          ) : isPast ? (
            <div className="text-center">
              <AlertTriangle className="mx-auto h-10 w-10 text-red-400 mb-3" />
              <h3 className="text-lg font-bold mb-2">Assessment Closed</h3>
              <p className="text-sm text-gray-500">
                The assessment window has closed. No further attempts can be
                made.
              </p>
            </div>
          ) : (
            <div className="text-center">
              <Clock className="mx-auto h-10 w-10 text-blue-400 mb-3" />
              <h3 className="text-lg font-bold mb-2">Not Yet Available</h3>
              <p className="text-sm text-gray-500">
                This assessment will open on{" "}
                {format(
                  new Date(testExam.startTime),
                  "EEEE, MMMM d, yyyy 'at' h:mm a"
                )}
                .
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back link */}
      <div className="pb-6">
        <Link
          href={`/courses/${params.id}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to course
        </Link>
      </div>
    </div>
    </PaymentGate>
  );
}
