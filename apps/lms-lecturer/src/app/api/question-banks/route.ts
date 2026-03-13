import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireLecturer, verifyLecturerCourseAccess } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();
    const { searchParams } = new URL(request.url);

    // Get single bank by id
    const id = searchParams.get("id");
    if (id) {
      const bank = await prisma.questionBank.findUnique({
        where: { id },
        include: {
          courseAssignment: {
            include: { course: true },
          },
          questions: {
            orderBy: { sortOrder: "asc" },
          },
        },
      });

      if (!bank) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      if (bank.courseAssignment.lecturerId !== lecturer.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      return NextResponse.json(bank);
    }

    // List banks for a course
    const courseAssignmentId = searchParams.get("courseAssignmentId");
    if (courseAssignmentId) {
      await verifyLecturerCourseAccess(lecturer.id, courseAssignmentId);

      const banks = await prisma.questionBank.findMany({
        where: { courseAssignmentId },
        include: { questions: true },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(banks);
    }

    return NextResponse.json({ error: "id or courseAssignmentId required" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();
    const body = await request.json();

    const { courseAssignmentId, title } = body;

    if (!courseAssignmentId || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await verifyLecturerCourseAccess(lecturer.id, courseAssignmentId);

    const bank = await prisma.questionBank.create({
      data: {
        courseAssignmentId,
        title,
      },
    });

    return NextResponse.json(bank, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const bank = await prisma.questionBank.findUnique({
      where: { id },
      include: { courseAssignment: true },
    });

    if (!bank) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (bank.courseAssignment.lecturerId !== lecturer.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.questionBank.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
