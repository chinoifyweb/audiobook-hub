import { prisma } from "@repo/db";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "@repo/ui";
import { ClipboardCheck, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { requireLecturer, getActiveSemester } from "@/lib/auth";

export default async function AssignmentsPage() {
  const lecturer = await requireLecturer();
  const activeSemester = await getActiveSemester();

  if (!activeSemester) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Assignments</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No active semester found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const assignments = await prisma.lmsAssignment.findMany({
    where: {
      courseAssignment: {
        lecturerId: lecturer.id,
        semesterId: activeSemester.id,
      },
    },
    include: {
      courseAssignment: {
        include: { course: true },
      },
      submissions: true,
    },
    orderBy: { dueDate: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Assignments</h1>
        <p className="text-muted-foreground">All assignments across your courses</p>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              No assignments yet. Create one from a course page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => {
            const graded = assignment.submissions.filter((s) => s.score !== null).length;
            const total = assignment.submissions.length;
            const isPastDue = new Date(assignment.dueDate) < new Date();

            return (
              <Card key={assignment.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {assignment.courseAssignment.course.code}
                      </Badge>
                      <p className="font-medium">{assignment.title}</p>
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
                      Submissions
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
