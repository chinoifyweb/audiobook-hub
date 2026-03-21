import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    const assignments = await prisma.courseAssignment.findMany({
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
    });

    return NextResponse.json(assignments);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json(
        { error: message },
        { status: message === "Unauthorized" ? 401 : 403 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch course assignments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { courseId, lecturerId, semesterId } = body;

    if (!courseId || !lecturerId || !semesterId) {
      return NextResponse.json(
        { error: "Course, lecturer, and semester are required" },
        { status: 400 }
      );
    }

    // Check for existing assignment with same combination
    const existing = await prisma.courseAssignment.findUnique({
      where: {
        courseId_lecturerId_semesterId: {
          courseId,
          lecturerId,
          semesterId,
        },
      },
    });

    if (existing) {
      if (existing.isActive) {
        return NextResponse.json(
          { error: "This course is already assigned to this lecturer for this semester" },
          { status: 400 }
        );
      }
      // Re-activate existing deactivated assignment
      const reactivated = await prisma.courseAssignment.update({
        where: { id: existing.id },
        data: { isActive: true },
        include: {
          course: { select: { code: true, title: true } },
          lecturer: {
            select: {
              staffId: true,
              user: { select: { fullName: true } },
            },
          },
          semester: {
            select: { name: true, session: { select: { name: true } } },
          },
        },
      });
      return NextResponse.json(reactivated, { status: 200 });
    }

    const assignment = await prisma.courseAssignment.create({
      data: { courseId, lecturerId, semesterId },
      include: {
        course: { select: { code: true, title: true } },
        lecturer: {
          select: {
            staffId: true,
            user: { select: { fullName: true } },
          },
        },
        semester: {
          select: { name: true, session: { select: { name: true } } },
        },
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("Create course assignment error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json(
        { error: message },
        { status: message === "Unauthorized" ? 401 : 403 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create course assignment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      );
    }

    const assignment = await prisma.courseAssignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    await prisma.courseAssignment.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Deactivate course assignment error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json(
        { error: message },
        { status: message === "Unauthorized" ? 401 : 403 }
      );
    }
    return NextResponse.json(
      { error: "Failed to remove course assignment" },
      { status: 500 }
    );
  }
}
