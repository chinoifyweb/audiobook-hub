import { prisma } from "@repo/db";
import { AssignmentsManagementClient } from "./assignments-management-client";

export const dynamic = "force-dynamic";

export default async function AdminAssignmentsPage() {
  const [assignments, courseAssignments] = await Promise.all([
    prisma.lmsAssignment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        courseAssignment: {
          include: {
            course: { select: { code: true, title: true } },
            lecturer: {
              include: { user: { select: { fullName: true } } },
            },
            semester: {
              include: { session: { select: { name: true } } },
            },
          },
        },
        _count: { select: { submissions: true } },
      },
    }),
    prisma.courseAssignment.findMany({
      where: { isActive: true },
      include: {
        course: { select: { code: true, title: true } },
        lecturer: {
          include: { user: { select: { fullName: true } } },
        },
        semester: {
          include: { session: { select: { name: true } } },
        },
      },
      orderBy: { course: { code: "asc" } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assignments</h1>
        <p className="text-muted-foreground">
          Manage assignments across all courses
        </p>
      </div>

      <AssignmentsManagementClient
        assignments={assignments}
        courseAssignments={courseAssignments}
      />
    </div>
  );
}
