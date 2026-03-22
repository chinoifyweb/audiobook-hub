import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
import { checkCurrentSemesterPayment } from "@/lib/payment-status";

export async function GET() {
  try {
    const { studentProfile } = await requireStudent();
    const status = await checkCurrentSemesterPayment(studentProfile.id);
    return NextResponse.json(status);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to check payment status";
    const statusCode = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
