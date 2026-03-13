import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { type } = body;

    if (type === "faculty") {
      const { name, code, description } = body;
      if (!name || !code) {
        return NextResponse.json({ error: "Name and code are required" }, { status: 400 });
      }

      const existing = await prisma.faculty.findUnique({ where: { code: code.toUpperCase() } });
      if (existing) {
        return NextResponse.json({ error: "Faculty code already exists" }, { status: 400 });
      }

      const faculty = await prisma.faculty.create({
        data: {
          name,
          code: code.toUpperCase(),
          description: description || null,
        },
      });

      return NextResponse.json(faculty, { status: 201 });
    }

    if (type === "department") {
      const { facultyId, name, code, description } = body;
      if (!facultyId || !name || !code) {
        return NextResponse.json({ error: "Faculty ID, name, and code are required" }, { status: 400 });
      }

      const existing = await prisma.department.findUnique({ where: { code: code.toUpperCase() } });
      if (existing) {
        return NextResponse.json({ error: "Department code already exists" }, { status: 400 });
      }

      const department = await prisma.department.create({
        data: {
          facultyId,
          name,
          code: code.toUpperCase(),
          description: description || null,
        },
      });

      return NextResponse.json(department, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Settings POST error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
