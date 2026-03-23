import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    const students = await prisma.studentProfile.findMany({
      include: {
        user: { select: { fullName: true, email: true } },
        program: { select: { name: true, code: true } },
      },
      orderBy: { user: { fullName: "asc" } },
    });

    return NextResponse.json(students);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
