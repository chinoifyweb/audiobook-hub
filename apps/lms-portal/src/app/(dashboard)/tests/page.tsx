import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";
import { Card, CardContent, Badge, Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui";
import { ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function TestsPage() {
  const { studentProfile } = await requireStudent();

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { studentId: studentProfile.id, status: "enrolled" },
    select: { courseAssignmentId: true },
  });

  const courseAssignmentIds = enrollments.map((e) => e.courseAssignmentId);

  const testExams = await prisma.testExam.findMany({
    where: {
      courseAssignmentId: { in: courseAssignmentIds },
      isPublished: true,
    },
    include: {
      courseAssignment: {
        include: { course: { select: { code: true, title: true } } },
      },
      attempts: {
        where: { studentId: studentProfile.id },
        take: 1,
      },
    },
    orderBy: { startTime: "asc" },
  });

  const now = new Date();

  const upcoming = testExams.filter(
    (t) => new Date(t.startTime) > now && t.attempts.length === 0
  );
  const available = testExams.filter(
    (t) =>
      new Date(t.startTime) <= now &&
      new Date(t.endTime) >= now &&
      (t.attempts.length === 0 || t.attempts[0].status === "in_progress")
  );
  const completed = testExams.filter(
    (t) =>
      t.attempts.length > 0 &&
      (t.attempts[0].status === "submitted" || t.attempts[0].status === "graded")
  );

  function TestList({
    items,
    emptyMessage,
  }: {
    items: typeof testExams;
    emptyMessage: string;
  }) {
    if (items.length === 0) {
      return (
        <Card>
          <CardContent className="py-8 text-center">
            <ClipboardCheck className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-muted-foreground">{emptyMessage}</p>
          </CardContent>
        </Card>
      );
    }
    return (
      <div className="space-y-3">
        {items.map((t) => {
          const attempt = t.attempts[0];
          return (
            <Link key={t.id} href={`/tests/${t.id}`}>
              <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{t.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {t.type === "test" ? "Test" : "Exam"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t.courseAssignment.course.code} -{" "}
                        {t.courseAssignment.course.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(t.startTime), "MMM d, HH:mm")} -{" "}
                        {format(new Date(t.endTime), "HH:mm")}
                        {" | "}Duration: {t.durationMinutes} min
                        {" | "}{t.totalMarks} marks
                      </p>
                    </div>
                    {attempt ? (
                      <Badge
                        variant={
                          attempt.status === "graded" ? "default" : "secondary"
                        }
                      >
                        {attempt.status === "graded"
                          ? `Score: ${attempt.totalScore}/${attempt.maxScore}`
                          : attempt.status === "submitted"
                            ? "Submitted"
                            : "In Progress"}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Not Started</Badge>
                    )}
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
        <h1 className="text-2xl font-bold">Tests & Exams</h1>
        <p className="text-muted-foreground">
          View and take your tests and examinations
        </p>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="available">
            Available ({available.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completed.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <TestList items={upcoming} emptyMessage="No upcoming tests" />
        </TabsContent>
        <TabsContent value="available">
          <TestList items={available} emptyMessage="No tests available right now" />
        </TabsContent>
        <TabsContent value="completed">
          <TestList items={completed} emptyMessage="No completed tests" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
