import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { programId, semesterId, amount, description, dueDate } = body;

    if (!programId || !semesterId || !amount || !dueDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const fee = await prisma.tuitionFee.create({
      data: {
        programId,
        semesterId,
        amount: parseInt(amount, 10),
        description: description || null,
        dueDate: new Date(dueDate),
      },
    });

    return NextResponse.json(fee, { status: 201 });
  } catch (error) {
    console.error("Create fee error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to create fee" }, { status: 500 });
  }
}
