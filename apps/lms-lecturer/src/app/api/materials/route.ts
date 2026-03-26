import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireLecturer, verifyLecturerCourseAccess } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();
    const { searchParams } = new URL(request.url);
    const courseAssignmentId = searchParams.get("courseAssignmentId");

    if (!courseAssignmentId) {
      return NextResponse.json({ error: "courseAssignmentId required" }, { status: 400 });
    }

    await verifyLecturerCourseAccess(lecturer.id, courseAssignmentId);

    const materials = await prisma.courseMaterial.findMany({
      where: { courseAssignmentId },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(materials);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();
    const body = await request.json();

    const { courseAssignmentId, title, description, type, contentUrl, sortOrder, isPublished } = body;

    if (!courseAssignmentId || !title || !type || !contentUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await verifyLecturerCourseAccess(lecturer.id, courseAssignmentId);

    const material = await prisma.courseMaterial.create({
      data: {
        courseAssignmentId,
        title,
        description: description || null,
        type,
        contentUrl,
        sortOrder: sortOrder || 0,
        isPublished: isPublished ?? false,
      },
    });

    return NextResponse.json(material, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();
    const body = await request.json();

    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Material id required" }, { status: 400 });
    }

    // Verify ownership through course assignment
    const material = await prisma.courseMaterial.findUnique({
      where: { id },
      include: { courseAssignment: true },
    });

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    await verifyLecturerCourseAccess(lecturer.id, material.courseAssignmentId);

    const updated = await prisma.courseMaterial.update({
      where: { id },
      data: {
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.contentUrl !== undefined && { contentUrl: updates.contentUrl }),
        ...(updates.sortOrder !== undefined && { sortOrder: updates.sortOrder }),
        ...(updates.isPublished !== undefined && { isPublished: updates.isPublished }),
      },
    });

    return NextResponse.json(updated);
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
      return NextResponse.json({ error: "Material id required" }, { status: 400 });
    }

    const material = await prisma.courseMaterial.findUnique({
      where: { id },
    });

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    await verifyLecturerCourseAccess(lecturer.id, material.courseAssignmentId);

    await prisma.courseMaterial.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
