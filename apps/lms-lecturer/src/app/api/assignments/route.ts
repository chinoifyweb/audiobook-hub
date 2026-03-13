import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireLecturer, verifyLecturerCourseAccess } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();
    const { searchParams } = new URL(request.url);

    // If requesting a single submission
    const submissionId = searchParams.get("submissionId");
    if (submissionId) {
      const submission = await prisma.assignmentSubmission.findUnique({
        where: { id: submissionId },
        include: {
          student: {
            include: { user: { select: { fullName: true } } },
          },
          assignment: {
            include: {
              courseAssignment: {
                include: { course: true },
              },
            },
          },
        },
      });

      if (!submission) {
        return NextResponse.json({ error: "Submission not found" }, { status: 404 });
      }

      // Verify lecturer access
      if (submission.assignment.courseAssignment.lecturerId !== lecturer.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      return NextResponse.json(submission);
    }

    // List assignments for a course
    const courseAssignmentId = searchParams.get("courseAssignmentId");
    if (!courseAssignmentId) {
      return NextResponse.json({ error: "courseAssignmentId required" }, { status: 400 });
    }

    await verifyLecturerCourseAccess(lecturer.id, courseAssignmentId);

    const assignments = await prisma.lmsAssignment.findMany({
      where: { courseAssignmentId },
      include: {
        submissions: {
          include: {
            student: {
              include: { user: { select: { fullName: true } } },
            },
          },
        },
      },
      orderBy: { dueDate: "desc" },
    });

    return NextResponse.json(assignments);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();
    const body = await request.json();

    const {
      courseAssignmentId,
      title,
      description,
      instructions,
      dueDate,
      maxScore,
      fileRequired,
      allowLateSubmission,
      isPublished,
    } = body;

    if (!courseAssignmentId || !title || !dueDate || !maxScore) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await verifyLecturerCourseAccess(lecturer.id, courseAssignmentId);

    const assignment = await prisma.lmsAssignment.create({
      data: {
        courseAssignmentId,
        title,
        description: description || null,
        instructions: instructions || null,
        dueDate: new Date(dueDate),
        maxScore,
        fileRequired: fileRequired ?? true,
        allowLateSubmission: allowLateSubmission ?? false,
        isPublished: isPublished ?? false,
      },
    });

    return NextResponse.json(assignment, { status: 201 });
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
      return NextResponse.json({ error: "Assignment id required" }, { status: 400 });
    }

    const assignment = await prisma.lmsAssignment.findUnique({
      where: { id },
      include: { courseAssignment: true },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (assignment.courseAssignment.lecturerId !== lecturer.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.lmsAssignment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
