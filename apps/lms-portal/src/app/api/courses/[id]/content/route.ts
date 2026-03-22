import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { studentProfile } = await requireStudent();

    const courseAssignment = await prisma.courseAssignment.findUnique({
      where: { id: params.id },
      include: {
        course: true,
        lecturer: {
          include: { user: { select: { fullName: true } } },
        },
        semester: { include: { session: true } },
        materials: {
          where: { isPublished: true },
          orderBy: { sortOrder: "asc" },
        },
        assignments: {
          where: { isPublished: true },
          orderBy: { dueDate: "asc" },
          include: {
            submissions: {
              where: { studentId: studentProfile.id },
            },
          },
        },
        testExams: {
          where: { isPublished: true },
          orderBy: { startTime: "asc" },
          include: {
            attempts: {
              where: { studentId: studentProfile.id },
              orderBy: { startedAt: "desc" },
            },
          },
        },
      },
    });

    if (!courseAssignment) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Verify enrollment
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        studentId_courseAssignmentId: {
          studentId: studentProfile.id,
          courseAssignmentId: courseAssignment.id,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    // Get material progress
    const materialIds = courseAssignment.materials.map((m) => m.id);
    const progressRecords = await prisma.courseMaterialProgress.findMany({
      where: {
        studentId: studentProfile.id,
        courseMaterialId: { in: materialIds },
      },
    });

    const progressMap = new Map(
      progressRecords.map((p) => [p.courseMaterialId, p])
    );

    // Organize materials into study sessions (groups of ~6 items)
    const materialsWithProgress = courseAssignment.materials.map((m) => ({
      ...m,
      completed: progressMap.get(m.id)?.completed ?? false,
      lastAccessedAt: progressMap.get(m.id)?.lastAccessedAt ?? null,
    }));

    // Group materials into sessions
    const SESSION_SIZE = 6;
    const sessions: {
      number: number;
      title: string;
      materials: typeof materialsWithProgress;
    }[] = [];

    for (let i = 0; i < materialsWithProgress.length; i += SESSION_SIZE) {
      const chunk = materialsWithProgress.slice(i, i + SESSION_SIZE);
      sessions.push({
        number: Math.floor(i / SESSION_SIZE) + 1,
        title: `Study Session ${String(Math.floor(i / SESSION_SIZE) + 1).padStart(2, "0")}`,
        materials: chunk,
      });
    }

    // If no materials or few items, create at least one session
    if (sessions.length === 0) {
      sessions.push({
        number: 1,
        title: "Study Session 01",
        materials: materialsWithProgress,
      });
    }

    // Calculate total progress
    const totalMaterials = materialsWithProgress.length;
    const completedMaterials = materialsWithProgress.filter(
      (m) => m.completed
    ).length;
    const progressPercentage =
      totalMaterials > 0
        ? Math.round((completedMaterials / totalMaterials) * 100)
        : 0;

    return NextResponse.json({
      course: courseAssignment.course,
      lecturer: courseAssignment.lecturer,
      semester: courseAssignment.semester,
      sessions,
      assignments: courseAssignment.assignments,
      testExams: courseAssignment.testExams,
      progress: {
        totalMaterials,
        completedMaterials,
        percentage: progressPercentage,
      },
    });
  } catch (error) {
    console.error("Course content GET error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized"
      ? 401
      : message.includes("Forbidden")
        ? 403
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
