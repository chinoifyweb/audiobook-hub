import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@repo/db";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const method = url.searchParams.get("method");
    const search = url.searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (status && status !== "all") {
      where.status = status;
    }
    if (method && method !== "all") {
      where.paymentMethod = method;
    }

    const payments = await prisma.tuitionPayment.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { fullName: true, email: true } },
            program: { select: { name: true, code: true } },
          },
        },
        tuitionFee: {
          include: {
            semester: {
              include: { session: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    // Filter by search if provided
    let filtered = payments;
    if (search) {
      const q = search.toLowerCase();
      filtered = payments.filter(
        (p) =>
          p.student.user.fullName?.toLowerCase().includes(q) ||
          p.student.user.email.toLowerCase().includes(q) ||
          p.student.studentId.toLowerCase().includes(q) ||
          p.paystackReference?.toLowerCase().includes(q) ||
          p.bankReference?.toLowerCase().includes(q)
      );
    }

    // Stats
    const stats = await prisma.tuitionPayment.groupBy({
      by: ["status"],
      _sum: { amount: true },
      _count: true,
    });

    const receiptsPending = await prisma.tuitionPayment.count({
      where: {
        paymentMethod: "bank_transfer",
        status: "pending",
      },
    });

    return NextResponse.json({
      payments: filtered,
      stats,
      receiptsPending,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
