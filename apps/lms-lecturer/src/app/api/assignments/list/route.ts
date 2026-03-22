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

    return NextResponse.json(assignments);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
