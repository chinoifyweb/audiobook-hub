import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";

export async function GET() {
  try {
    const { studentProfile } = await requireStudent();

    const applications = await prisma.$queryRaw<
      Array<{
        id: string;
        scholarship_type: string;
        statement: string | null;
        church_name: string | null;
        pastor_name: string | null;
        ministry_years: number | null;
        documents: unknown;
        status: string;
        approved_percentage: number | null;
        admin_notes: string | null;
        created_at: Date;
      }>
    >`
      SELECT id, scholarship_type, statement, church_name, pastor_name,
             ministry_years, documents, status, approved_percentage,
             admin_notes, created_at
      FROM scholarship_applications
      WHERE student_id = ${studentProfile.id}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ applications });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized" ? 401 : message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
