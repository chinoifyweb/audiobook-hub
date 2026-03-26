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
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { requireLecturer } from "@/lib/auth";

interface Props {
  params: { id: string };
}

export default async function AttemptsPage({ params }: Props) {
  const lecturer = await requireLecturer();

  const testExam = await prisma.testExam.findUnique({
    where: { id: params.id },
    include: {
      courseAssignment: {
        include: { course: true },
      },
      attempts: {
        include: {
          student: {
            include: { user: { select: { fullName: true } } },
          },
        },
        orderBy: { startedAt: "desc" },
      },
    },
  });

  if (!testExam) notFound();

  if (testExam.courseAssignment.lecturerId !== lecturer.id) {
    notFound();
  }

  const gradedCount = testExam.attempts.filter((a) => a.status === "graded").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/courses/${testExam.courseAssignmentId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{testExam.title}</h1>
          <p className="text-muted-foreground">
            {testExam.courseAssignment.course.code} &middot;{" "}
            <span className="capitalize">{testExam.type}</span> &middot;{" "}
            {testExam.totalMarks} marks &middot; {gradedCount}/{testExam.attempts.length} graded
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Attempts ({testExam.attempts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {testExam.attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No attempts yet.
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
                    <th className="pb-2 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {testExam.attempts.map((attempt) => (
                    <tr key={attempt.id} className="border-b last:border-0">
                      <td className="py-3">
                        <div>
                          <p className="font-medium">
                            {attempt.student.user.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {attempt.student.studentId}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {format(new Date(attempt.startedAt), "MMM d, h:mm a")}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {attempt.submittedAt
                          ? format(new Date(attempt.submittedAt), "MMM d, h:mm a")
                          : "-"}
                      </td>
                      <td className="py-3 text-center font-medium">
                        {attempt.totalScore !== null
                          ? `${attempt.totalScore}/${attempt.maxScore}`
                          : "-"}
                      </td>
                      <td className="py-3 text-center">
                        <Badge
                          variant={
                            attempt.status === "graded"
                              ? "default"
                              : attempt.status === "submitted"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-xs capitalize"
                        >
                          {attempt.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        {attempt.status !== "in_progress" && (
                          <Link
                            href={`/tests/${params.id}/attempts/${attempt.id}/grade`}
                          >
                            <Button size="sm" variant="outline">
                              {attempt.status === "graded" ? "Review" : "Grade"}
                            </Button>
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
