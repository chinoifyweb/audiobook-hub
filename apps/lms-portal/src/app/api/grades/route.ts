import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";

export async function GET(request: Request) {
  try {
    const { studentProfile } = await requireStudent();

    const url = new URL(request.url);
    const semesterId = url.searchParams.get("semesterId");

    const whereClause: Record<string, unknown> = {
      studentId: studentProfile.id,
      isReleased: true,
    };

    if (semesterId) {
      whereClause.semesterId = semesterId;
    }

    const grades = await prisma.grade.findMany({
      where: whereClause,
      include: {
        courseEnrollment: {
          include: {
            courseAssignment: {
              include: {
                course: {
                  select: { code: true, title: true, creditUnits: true },
                },
              },
            },
          },
        },
        semester: {
          include: { session: true },
        },
      },
      orderBy: [
        { semester: { session: { startDate: "desc" } } },
        { courseEnrollment: { courseAssignment: { course: { code: "asc" } } } },
      ],
    });

    // Get all semesters for the filter
    const semesters = await prisma.semester.findMany({
      include: { session: true },
      orderBy: [
        { session: { startDate: "desc" } },
        { number: "asc" },
      ],
    });

    return NextResponse.json({ grades, semesters });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized" ? 401 : message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
