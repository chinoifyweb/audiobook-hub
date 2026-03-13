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
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { requireLecturer } from "@/lib/auth";

interface Props {
  params: { id: string };
}

export default async function SubmissionsPage({ params }: Props) {
  const lecturer = await requireLecturer();

  const assignment = await prisma.lmsAssignment.findUnique({
    where: { id: params.id },
    include: {
      courseAssignment: {
        include: { course: true },
      },
      submissions: {
        include: {
          student: {
            include: { user: { select: { fullName: true, email: true } } },
          },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!assignment) notFound();

  // Verify access
  if (assignment.courseAssignment.lecturerId !== lecturer.id) {
    notFound();
  }

  const graded = assignment.submissions.filter((s) => s.score !== null).length;
  const total = assignment.submissions.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/courses/${assignment.courseAssignmentId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{assignment.title}</h1>
          <p className="text-muted-foreground">
            {assignment.courseAssignment.course.code} &middot; Due{" "}
            {format(new Date(assignment.dueDate), "MMM d, yyyy")} &middot; Max{" "}
            {assignment.maxScore} pts &middot; {graded}/{total} graded
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submissions ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {total === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No submissions yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Student</th>
                    <th className="pb-2 font-medium">Submitted</th>
                    <th className="pb-2 font-medium text-center">Late</th>
                    <th className="pb-2 font-medium">File</th>
                    <th className="pb-2 font-medium text-center">Score</th>
                    <th className="pb-2 font-medium text-center">Status</th>
                    <th className="pb-2 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignment.submissions.map((sub) => (
                    <tr key={sub.id} className="border-b last:border-0">
                      <td className="py-3">
                        <div>
                          <p className="font-medium">{sub.student.user.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {sub.student.studentId}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {format(new Date(sub.submittedAt), "MMM d, h:mm a")}
                      </td>
                      <td className="py-3 text-center">
                        {sub.isLate ? (
                          <Badge variant="destructive" className="text-xs">Yes</Badge>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </td>
                      <td className="py-3">
                        {sub.fileUrl ? (
                          <a
                            href={sub.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            View <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </td>
                      <td className="py-3 text-center font-medium">
                        {sub.score !== null ? (
                          <span>{sub.score}/{assignment.maxScore}</span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-3 text-center">
                        <Badge
                          variant={sub.score !== null ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {sub.score !== null ? "Graded" : "Pending"}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/assignments/${params.id}/submissions/${sub.id}/grade`}
                        >
                          <Button size="sm" variant="outline">
                            {sub.score !== null ? "Edit Grade" : "Grade"}
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
    </div>
  );
}
