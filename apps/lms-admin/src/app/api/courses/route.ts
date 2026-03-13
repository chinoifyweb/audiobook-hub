import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const courses = await prisma.course.findMany({
      orderBy: { code: "asc" },
      include: {
        department: { select: { name: true, code: true } },
        program: { select: { name: true, code: true } },
      },
    });
    return NextResponse.json(courses);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { code, title, description, departmentId, programId, creditUnits, semesterNumber, isElective } = body;

    if (!code || !title || !departmentId || !creditUnits || !semesterNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.course.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) {
      return NextResponse.json({ error: "Course code already exists" }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        code: code.toUpperCase(),
        title,
        description: description || null,
        departmentId,
        programId: programId || null,
        creditUnits: parseInt(creditUnits, 10),
        semesterNumber: parseInt(semesterNumber, 10),
        isElective: isElective === true || isElective === "true",
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error("Create course error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
