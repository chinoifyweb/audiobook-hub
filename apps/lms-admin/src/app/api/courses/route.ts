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

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, code, title, description, departmentId, programId, creditUnits, semesterNumber, isElective } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing course ID" }, { status: 400 });
    }

    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (code) {
      const upper = code.toUpperCase();
      if (upper !== existing.code) {
        const dup = await prisma.course.findUnique({ where: { code: upper } });
        if (dup) return NextResponse.json({ error: "Course code already exists" }, { status: 400 });
        updateData.code = upper;
      }
    }
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description || null;
    if (departmentId) updateData.departmentId = departmentId;
    if (programId !== undefined) updateData.programId = programId || null;
    if (creditUnits) updateData.creditUnits = parseInt(creditUnits, 10);
    if (semesterNumber) updateData.semesterNumber = parseInt(semesterNumber, 10);
    if (isElective !== undefined) updateData.isElective = isElective === true || isElective === "true";

    const course = await prisma.course.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error("Update course error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
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
