import { prisma } from "@repo/db";
import { Button } from "@repo/ui";
import { CoursesClient } from "./courses-client";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const [courses, programs, departments] = await Promise.all([
    prisma.course.findMany({
      orderBy: { code: "asc" },
      include: {
        department: { select: { name: true, code: true } },
        program: { select: { name: true, code: true } },
      },
    }),
    prisma.program.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
    prisma.department.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground">Manage courses across programs</p>
        </div>
      </div>

      <CoursesClient
        courses={courses}
        programs={programs}
        departments={departments}
      />
    </div>
  );
}
