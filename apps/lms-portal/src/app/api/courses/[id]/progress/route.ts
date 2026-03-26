import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { studentProfile } = await requireStudent();
    const { materialId, completed } = (await request.json()) as {
      materialId: string;
      completed: boolean;
    };

    if (!materialId) {
      return NextResponse.json(
        { error: "materialId is required" },
        { status: 400 }
      );
    }

    // Verify enrollment
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        studentId_courseAssignmentId: {
          studentId: studentProfile.id,
          courseAssignmentId: params.id,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    // Verify material belongs to this course
    const material = await prisma.courseMaterial.findFirst({
      where: {
        id: materialId,
        courseAssignmentId: params.id,
      },
    });

    if (!material) {
      return NextResponse.json(
        { error: "Material not found in this course" },
        { status: 404 }
      );
    }

    // Upsert progress
    const progress = await prisma.courseMaterialProgress.upsert({
      where: {
        studentId_courseMaterialId: {
          studentId: studentProfile.id,
          courseMaterialId: materialId,
        },
      },
      create: {
        studentId: studentProfile.id,
        courseMaterialId: materialId,
        completed,
        completedAt: completed ? new Date() : null,
        lastAccessedAt: new Date(),
      },
      update: {
        completed,
        completedAt: completed ? new Date() : null,
        lastAccessedAt: new Date(),
      },
    });

    // Get updated course progress
    const allMaterials = await prisma.courseMaterial.count({
      where: { courseAssignmentId: params.id, isPublished: true },
    });

    const completedMaterials = await prisma.courseMaterialProgress.count({
      where: {
        studentId: studentProfile.id,
        completed: true,
        courseMaterial: {
          courseAssignmentId: params.id,
          isPublished: true,
        },
      },
    });

    return NextResponse.json({
      progress,
      courseProgress: {
        totalMaterials: allMaterials,
        completedMaterials,
        percentage:
          allMaterials > 0
            ? Math.round((completedMaterials / allMaterials) * 100)
            : 0,
      },
    });
  } catch (error) {
    console.error("Progress update error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized"
      ? 401
      : message.includes("Forbidden")
        ? 403
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
