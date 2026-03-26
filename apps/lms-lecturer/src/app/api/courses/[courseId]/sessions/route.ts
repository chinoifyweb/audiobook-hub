import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireLecturer, verifyLecturerCourseAccess } from "@/lib/auth";

/**
 * GET /api/courses/[courseId]/sessions
 * Returns materials grouped by session (using description field as session group).
 * Materials with the same description prefix "Session:XX" are grouped together.
 * We use sortOrder ranges to represent sessions: 0-99 = Session 1, 100-199 = Session 2, etc.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const lecturer = await requireLecturer();
    await verifyLecturerCourseAccess(lecturer.id, params.courseId);

    const materials = await prisma.courseMaterial.findMany({
      where: { courseAssignmentId: params.courseId },
      orderBy: { sortOrder: "asc" },
    });

    // Group materials by session. We use a convention:
    // sortOrder 0-99 = Session 1, 100-199 = Session 2, etc.
    // The session name is stored as a prefix in the first material's description: "[Session:Week 1]"
    const sessionMap = new Map<number, {
      sessionNumber: number;
      sessionTitle: string;
      materials: typeof materials;
    }>();

    for (const m of materials) {
      const sessionNum = Math.floor(m.sortOrder / 100);
      if (!sessionMap.has(sessionNum)) {
        sessionMap.set(sessionNum, {
          sessionNumber: sessionNum,
          sessionTitle: `Week ${sessionNum + 1}`,
          materials: [],
        });
      }
      sessionMap.get(sessionNum)!.materials.push(m);
    }

    // Extract session titles from description field: format "[Session:title]rest"
    Array.from(sessionMap.values()).forEach((session) => {
      for (const m of session.materials) {
        const match = m.description?.match(/^\[Session:([^\]]+)\]/);
        if (match) {
          session.sessionTitle = match[1]!;
          break;
        }
      }
    });

    const sessions = Array.from(sessionMap.values()).sort(
      (a, b) => a.sessionNumber - b.sessionNumber
    );

    return NextResponse.json(sessions);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/courses/[courseId]/sessions
 * Create or rename a session. Body: { sessionNumber, title }
 * Creates a placeholder material to mark the session.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const lecturer = await requireLecturer();
    await verifyLecturerCourseAccess(lecturer.id, params.courseId);

    const body = await request.json();
    const { sessionNumber, title } = body;

    if (sessionNumber === undefined || !title) {
      return NextResponse.json({ error: "sessionNumber and title required" }, { status: 400 });
    }

    const baseOrder = sessionNumber * 100;

    // Check if there's already any material in this session range
    const existing = await prisma.courseMaterial.findFirst({
      where: {
        courseAssignmentId: params.courseId,
        sortOrder: { gte: baseOrder, lt: baseOrder + 100 },
      },
      orderBy: { sortOrder: "asc" },
    });

    if (existing) {
      // Update the session title by updating description prefix on first material
      const desc = existing.description || "";
      const cleanDesc = desc.replace(/^\[Session:[^\]]*\]\s*/, "");
      await prisma.courseMaterial.update({
        where: { id: existing.id },
        data: { description: `[Session:${title}] ${cleanDesc}`.trim() },
      });
    } else {
      // Create a placeholder "session header" material
      await prisma.courseMaterial.create({
        data: {
          courseAssignmentId: params.courseId,
          title: `${title} - Overview`,
          description: `[Session:${title}]`,
          type: "link",
          contentUrl: "#",
          sortOrder: baseOrder,
          isPublished: false,
        },
      });
    }

    return NextResponse.json({ success: true, sessionNumber, title });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
