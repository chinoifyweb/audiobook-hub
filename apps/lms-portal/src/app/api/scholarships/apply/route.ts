import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";

export async function POST(request: Request) {
  try {
    const { studentProfile } = await requireStudent();
    const {
      scholarshipType,
      statement,
      churchName,
      pastorName,
      ministryYears,
      documents,
    } = await request.json();

    if (!scholarshipType) {
      return NextResponse.json(
        { error: "Scholarship type is required" },
        { status: 400 }
      );
    }

    if (!statement || !statement.trim()) {
      return NextResponse.json(
        { error: "Personal statement is required" },
        { status: 400 }
      );
    }

    // Check if student already has a pending application for the same type
    const existing = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM scholarship_applications
      WHERE student_id = ${studentProfile.id}
      AND scholarship_type = ${scholarshipType}
      AND status = 'pending'
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "You already have a pending application for this scholarship type" },
        { status: 400 }
      );
    }

    // Insert scholarship application
    await prisma.$executeRaw`
      INSERT INTO scholarship_applications (
        id, student_id, scholarship_type, statement, church_name, pastor_name,
        ministry_years, documents, status, approved_percentage, created_at, updated_at
      ) VALUES (
        gen_random_uuid()::text,
        ${studentProfile.id},
        ${scholarshipType},
        ${statement},
        ${churchName || null},
        ${pastorName || null},
        ${ministryYears ? parseInt(String(ministryYears)) : null}::integer,
        ${documents ? JSON.stringify(documents) : null}::jsonb,
        'pending',
        0,
        NOW(),
        NOW()
      )
    `;

    return NextResponse.json({
      message: "Scholarship application submitted successfully",
    });
  } catch (error) {
    console.error("Scholarship apply error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized" ? 401 : message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
