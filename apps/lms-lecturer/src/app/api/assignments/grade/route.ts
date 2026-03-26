import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireLecturer } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();
    const body = await request.json();

    const { submissionId, score, feedback } = body;

    if (!submissionId || score === undefined || score === null) {
      return NextResponse.json({ error: "submissionId and score are required" }, { status: 400 });
    }

    // Fetch submission and verify access
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: { courseAssignment: true },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (submission.assignment.courseAssignment.lecturerId !== lecturer.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Validate score
    if (score < 0 || score > submission.assignment.maxScore) {
      return NextResponse.json(
        { error: `Score must be between 0 and ${submission.assignment.maxScore}` },
        { status: 400 }
      );
    }

    // Update submission with grade
    const updated = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score,
        feedback: feedback || null,
        gradedById: lecturer.userId,
        gradedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
