import { prisma } from "@repo/db";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "@repo/ui";
import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { requireLecturer, getActiveSemester } from "@/lib/auth";

export default async function TestsPage() {
  const lecturer = await requireLecturer();
  const activeSemester = await getActiveSemester();

  if (!activeSemester) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Tests & Exams</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No active semester found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const testExams = await prisma.testExam.findMany({
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
      attempts: true,
    },
    orderBy: { startTime: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tests & Exams</h1>
        <p className="text-muted-foreground">All tests and exams across your courses</p>
      </div>

      {testExams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              No tests or exams yet. Create one from a course page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {testExams.map((te) => {
            const now = new Date();
            const isUpcoming = new Date(te.startTime) > now;
            const isActive = new Date(te.startTime) <= now && new Date(te.endTime) >= now;
            const isEnded = new Date(te.endTime) < now;
            const gradedCount = te.attempts.filter((a) => a.status === "graded").length;

            return (
              <Card key={te.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {te.courseAssignment.course.code}
                      </Badge>
                      <p className="font-medium">{te.title}</p>
                      <Badge variant="outline" className="text-xs capitalize">
                        {te.type}
                      </Badge>
                      {!te.isPublished && (
                        <Badge variant="secondary" className="text-xs">Draft</Badge>
                      )}
                      {isUpcoming && (
                        <Badge className="text-xs bg-blue-100 text-blue-700">Upcoming</Badge>
                      )}
                      {isActive && (
                        <Badge className="text-xs bg-green-100 text-green-700">Active</Badge>
                      )}
                      {isEnded && (
                        <Badge className="text-xs bg-gray-100 text-gray-600">Ended</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {format(new Date(te.startTime), "MMM d, h:mm a")} -{" "}
                        {format(new Date(te.endTime), "MMM d, h:mm a")}
                      </span>
                      <span>{te.durationMinutes} min</span>
                      <span>{te.totalMarks} marks</span>
                      <span>{gradedCount}/{te.attempts.length} graded</span>
                    </div>
                  </div>
                  <Link href={`/tests/${te.id}/attempts`}>
                    <Button size="sm" variant="outline">
                      View Attempts
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
