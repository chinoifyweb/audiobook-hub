import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { studentProfile } = await requireStudent();

    const assignment = await prisma.lmsAssignment.findUnique({
      where: { id: params.id },
      include: {
        courseAssignment: {
          include: { course: { select: { code: true, title: true } } },
        },
        submissions: {
          where: { studentId: studentProfile.id },
          take: 1,
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    return NextResponse.json({
      assignment: {
        ...assignment,
        submission: assignment.submissions[0] || null,
        submissions: undefined,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized" ? 401 : message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { studentProfile } = await requireStudent();
    const { submissionText, fileUrl } = await request.json();

    const assignment = await prisma.lmsAssignment.findUnique({
      where: { id: params.id },
      include: {
        courseAssignment: {
          include: {
            enrollments: {
              where: { studentId: studentProfile.id, status: "enrolled" },
            },
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Verify student is enrolled
    if (assignment.courseAssignment.enrollments.length === 0) {
      return NextResponse.json(
        { error: "You are not enrolled in this course" },
        { status: 403 }
      );
    }

    // Check if already submitted
    const existing = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId: params.id,
          studentId: studentProfile.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already submitted this assignment" },
        { status: 409 }
      );
    }

    // Check if past due
    const isPastDue = new Date(assignment.dueDate) < new Date();
    if (isPastDue && !assignment.allowLateSubmission) {
      return NextResponse.json(
        { error: "This assignment is past due" },
        { status: 400 }
      );
    }

    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId: params.id,
        studentId: studentProfile.id,
        submissionText: submissionText || null,
        fileUrl: fileUrl || null,
        isLate: isPastDue,
      },
    });

    return NextResponse.json(
      { message: "Assignment submitted successfully", submission },
      { status: 201 }
    );
  } catch (error) {
    console.error("Assignment submit error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized" ? 401 : message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
