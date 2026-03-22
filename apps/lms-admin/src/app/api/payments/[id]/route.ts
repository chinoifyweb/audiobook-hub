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
    const { action, adminNotes } = body;

    const payment = await prisma.tuitionPayment.findUnique({
      where: { id },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (action === "approve") {
      await prisma.tuitionPayment.update({
        where: { id },
        data: {
          status: "successful",
          paidAt: new Date(),
          adminNotes: adminNotes || "Approved by admin",
          reviewedBy: session.user.id,
        },
      });
      return NextResponse.json({ message: "Payment approved" });
    } else if (action === "reject") {
      await prisma.tuitionPayment.update({
        where: { id },
        data: {
          status: "failed",
          adminNotes: adminNotes || "Rejected by admin",
          reviewedBy: session.user.id,
        },
      });
      return NextResponse.json({ message: "Payment rejected" });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }
}
