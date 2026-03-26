import { prisma } from "@repo/db";
import { AssignmentsClient } from "./assignments-client";

export const dynamic = "force-dynamic";

export default async function CourseAssignmentsPage() {
  const [assignments, courses, lecturers, semesters] = await Promise.all([
    prisma.courseAssignment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        course: {
          select: { id: true, code: true, title: true, creditUnits: true },
        },
        lecturer: {
          select: {
            id: true,
            staffId: true,
            user: { select: { fullName: true, email: true } },
          },
        },
        semester: {
          select: {
            id: true,
            name: true,
            isActive: true,
            session: { select: { name: true } },
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    }),
    prisma.course.findMany({
      orderBy: { code: "asc" },
      select: { id: true, code: true, title: true },
    }),
    prisma.lecturerProfile.findMany({
      where: { isActive: true },
      orderBy: { staffId: "asc" },
      select: {
        id: true,
        staffId: true,
        user: { select: { fullName: true } },
      },
    }),
    prisma.semester.findMany({
      orderBy: [{ isActive: "desc" }, { startDate: "desc" }],
      select: {
        id: true,
        name: true,
        isActive: true,
        session: { select: { name: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Course Assignments
          </h1>
          <p className="text-muted-foreground">
            Assign courses to lecturers for each semester
          </p>
        </div>
      </div>

      <AssignmentsClient
        assignments={assignments}
        courses={courses}
        lecturers={lecturers}
        semesters={semesters}
      />
    </div>
  );
}
