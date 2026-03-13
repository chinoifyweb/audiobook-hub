import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const programs = await prisma.program.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        department: { select: { name: true, code: true } },
        _count: { select: { students: true, courses: true } },
      },
    });
    return NextResponse.json(programs);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to fetch programs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const {
      name,
      code,
      description,
      departmentId,
      degreeType,
      durationSemesters,
      totalCredits,
      tuitionPerSemester,
    } = body;

    if (!name || !code || !departmentId || !degreeType || !durationSemesters || !totalCredits) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check for duplicate code
    const existing = await prisma.program.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: "Program code already exists" }, { status: 400 });
    }

    const program = await prisma.program.create({
      data: {
        name,
        code: code.toUpperCase(),
        description: description || null,
        departmentId,
        degreeType,
        durationSemesters: parseInt(durationSemesters, 10),
        totalCredits: parseInt(totalCredits, 10),
        tuitionPerSemester: parseInt(tuitionPerSemester, 10),
      },
    });

    return NextResponse.json(program, { status: 201 });
  } catch (error) {
    console.error("Create program error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to create program" }, { status: 500 });
  }
}
