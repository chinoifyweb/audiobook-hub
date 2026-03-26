import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@repo/db";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const type = url.searchParams.get("type");

    let whereClause = "WHERE 1=1";
    const params: string[] = [];

    if (status && status !== "all") {
      whereClause += ` AND sa.status = '${status.replace(/'/g, "''")}'`;
    }
    if (type && type !== "all") {
      whereClause += ` AND sa.scholarship_type = '${type.replace(/'/g, "''")}'`;
    }

    const applications = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        student_id: string;
        scholarship_type: string;
        statement: string | null;
        church_name: string | null;
        pastor_name: string | null;
        ministry_years: number | null;
        documents: unknown;
        status: string;
        approved_percentage: number | null;
        admin_notes: string | null;
        reviewed_by: string | null;
        created_at: Date;
        updated_at: Date;
        student_name: string | null;
        student_email: string;
        student_number: string;
        program_name: string;
        program_code: string;
      }>
    >(`
      SELECT sa.*,
             u.full_name as student_name,
             u.email as student_email,
             sp.student_id as student_number,
             p.name as program_name,
             p.code as program_code
      FROM scholarship_applications sa
      JOIN student_profiles sp ON sp.id = sa.student_id
      JOIN users u ON u.id = sp.user_id
      JOIN programs p ON p.id = sp.program_id
      ${whereClause}
      ORDER BY sa.created_at DESC
      LIMIT 200
    `);

    // Stats
    const stats = await prisma.$queryRaw<
      Array<{ status: string; count: number }>
    >`
      SELECT status, COUNT(*)::integer as count
      FROM scholarship_applications
      GROUP BY status
    `;

    return NextResponse.json({ applications, stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}
