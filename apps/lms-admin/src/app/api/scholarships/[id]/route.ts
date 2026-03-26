import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@repo/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { action, approvedPercentage, adminNotes } = body;

    // Verify application exists
    const existing = await prisma.$queryRaw<Array<{ id: string; student_id: string }>>`
      SELECT id, student_id FROM scholarship_applications WHERE id = ${id} LIMIT 1
    `;

    if (existing.length === 0) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (action === "approve") {
      if (!approvedPercentage || approvedPercentage < 1 || approvedPercentage > 100) {
        return NextResponse.json(
          { error: "Approved percentage must be between 1 and 100" },
          { status: 400 }
        );
      }

      await prisma.$executeRaw`
        UPDATE scholarship_applications
        SET status = 'approved',
            approved_percentage = ${parseInt(String(approvedPercentage))}::integer,
            admin_notes = ${adminNotes || 'Approved'},
            reviewed_by = ${session.user.id},
            updated_at = NOW()
        WHERE id = ${id}
      `;

      return NextResponse.json({ message: "Scholarship approved" });
    } else if (action === "reject") {
      await prisma.$executeRaw`
        UPDATE scholarship_applications
        SET status = 'rejected',
            approved_percentage = 0,
            admin_notes = ${adminNotes || 'Rejected'},
            reviewed_by = ${session.user.id},
            updated_at = NOW()
        WHERE id = ${id}
      `;

      return NextResponse.json({ message: "Scholarship rejected" });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Scholarship update error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}
