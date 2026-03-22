import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireLecturer, getActiveSemester } from "@/lib/auth";

export async function GET() {
  try {
    const lecturer = await requireLecturer();
    const activeSemester = await getActiveSemester();

    if (!activeSemester) {
      return NextResponse.json([]);
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
          include: { course: { select: { code: true, title: true } } },
        },
        attempts: {
          select: { id: true, status: true, score: true },
        },
      },
      orderBy: { startTime: "desc" },
    });

    return NextResponse.json(testExams);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
