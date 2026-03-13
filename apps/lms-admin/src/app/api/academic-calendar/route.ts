import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const sessions = await prisma.academicSession.findMany({
      orderBy: { startDate: "desc" },
      include: {
        semesters: {
          orderBy: { number: "asc" },
          include: { calendarEvents: { orderBy: { startDate: "asc" } } },
        },
      },
    });
    return NextResponse.json(sessions);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { type } = body;

    if (type === "session") {
      const { name, startDate, endDate } = body;
      if (!name || !startDate || !endDate) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const session = await prisma.academicSession.create({
        data: {
          name,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
      });

      return NextResponse.json(session, { status: 201 });
    }

    if (type === "semester") {
      const { sessionId, name, number, startDate, endDate } = body;
      if (!sessionId || !name || !number || !startDate || !endDate) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const semester = await prisma.semester.create({
        data: {
          sessionId,
          name,
          number: parseInt(number, 10),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
      });

      return NextResponse.json(semester, { status: 201 });
    }

    if (type === "event") {
      const { semesterId, title, description, eventType, startDate, endDate } = body;
      if (!semesterId || !title || !eventType || !startDate) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const event = await prisma.academicCalendarEvent.create({
        data: {
          semesterId,
          title,
          description: description || null,
          eventType,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
        },
      });

      return NextResponse.json(event, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Create calendar item error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to create calendar item" }, { status: 500 });
  }
}
