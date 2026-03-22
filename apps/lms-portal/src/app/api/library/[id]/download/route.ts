import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireStudent } from "@/lib/auth";
import { checkCurrentSemesterPayment } from "@/lib/payment-status";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { studentProfile } = await requireStudent();

    // Check payment status before allowing download
    const paymentStatus = await checkCurrentSemesterPayment(studentProfile.id);
    if (!paymentStatus.hasPaid && !paymentStatus.hasScholarship) {
      return NextResponse.json(
        { error: "Tuition payment required to download books. Please complete your payment first." },
        { status: 403 },
      );
    }

    const book = await prisma.libraryBook.findUnique({
      where: { id: params.id, isActive: true },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Increment download count
    await prisma.libraryBook.update({
      where: { id: params.id },
      data: { downloadCount: { increment: 1 } },
    });

    return NextResponse.json({ fileUrl: book.fileUrl });
  } catch (error) {
    console.error("Library download error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process download";
    const statusCode = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json(
      { error: message },
      { status: statusCode },
    );
  }
}
