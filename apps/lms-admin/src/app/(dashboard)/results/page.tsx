import { prisma } from "@repo/db";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { ResultsClient } from "./results-client";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const semesters = await prisma.semester.findMany({
    orderBy: { startDate: "desc" },
    include: {
      session: { select: { name: true } },
    },
  });

  const grades = await prisma.grade.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      student: {
        select: {
          studentId: true,
          user: { select: { fullName: true } },
        },
      },
      courseEnrollment: {
        include: {
          courseAssignment: {
            include: {
              course: { select: { code: true, title: true } },
            },
          },
        },
      },
      semester: {
        select: { name: true, id: true, session: { select: { name: true } } },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Results Management</h1>
        <p className="text-muted-foreground">Review and release student grades</p>
      </div>

      <ResultsClient semesters={semesters} grades={grades} />
    </div>
  );
}
