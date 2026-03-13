import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";
import { Card, CardContent, Badge, Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui";
import { FileText } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function AssignmentsPage() {
  const { studentProfile } = await requireStudent();

  // Get all assignments for enrolled courses
  const enrollments = await prisma.courseEnrollment.findMany({
    where: {
      studentId: studentProfile.id,
      status: "enrolled",
    },
    select: { courseAssignmentId: true },
  });

  const courseAssignmentIds = enrollments.map((e) => e.courseAssignmentId);

  const assignments = await prisma.lmsAssignment.findMany({
    where: {
      courseAssignmentId: { in: courseAssignmentIds },
      isPublished: true,
    },
    include: {
      courseAssignment: {
        include: { course: { select: { code: true, title: true } } },
      },
      submissions: {
        where: { studentId: studentProfile.id },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  const now = new Date();

  const pending = assignments.filter(
    (a) => a.submissions.length === 0 && new Date(a.dueDate) >= now
  );
  const overdue = assignments.filter(
    (a) => a.submissions.length === 0 && new Date(a.dueDate) < now
  );
  const submitted = assignments.filter(
    (a) => a.submissions.length > 0 && a.submissions[0].score === null
  );
  const graded = assignments.filter(
    (a) => a.submissions.length > 0 && a.submissions[0].score !== null
  );

  function AssignmentList({
    items,
    emptyMessage,
  }: {
    items: typeof assignments;
    emptyMessage: string;
  }) {
    if (items.length === 0) {
      return (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-muted-foreground">{emptyMessage}</p>
          </CardContent>
        </Card>
      );
    }
    return (
      <div className="space-y-3">
        {items.map((a) => {
          const submission = a.submissions[0];
          return (
            <Link key={a.id} href={`/assignments/${a.id}`}>
              <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="font-medium">{a.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {a.courseAssignment.course.code} -{" "}
                        {a.courseAssignment.course.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Due: {format(new Date(a.dueDate), "MMM d, HH:mm")}
                      </span>
                      {submission?.score !== null && submission?.score !== undefined && (
                        <Badge>
                          {submission.score}/{a.maxScore}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Assignments</h1>
        <p className="text-muted-foreground">
          View and submit your assignments
        </p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pending.length + overdue.length})
          </TabsTrigger>
          <TabsTrigger value="submitted">
            Submitted ({submitted.length})
          </TabsTrigger>
          <TabsTrigger value="graded">
            Graded ({graded.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <AssignmentList
            items={[...pending, ...overdue]}
            emptyMessage="No pending assignments"
          />
        </TabsContent>

        <TabsContent value="submitted">
          <AssignmentList
            items={submitted}
            emptyMessage="No submitted assignments awaiting grading"
          />
        </TabsContent>

        <TabsContent value="graded">
          <AssignmentList
            items={graded}
            emptyMessage="No graded assignments yet"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
