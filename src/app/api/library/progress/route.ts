import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface ProgressBody {
  bookId: string;
  listeningProgress?: {
    chapter: number;
    position_seconds: number;
  };
  readingProgress?: {
    page: number;
    percentage: number;
  };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ProgressBody = await req.json();
    const { bookId, listeningProgress, readingProgress } = body;

    if (!bookId) {
      return NextResponse.json({ error: "bookId is required" }, { status: 400 });
    }

    if (!listeningProgress && !readingProgress) {
      return NextResponse.json(
        { error: "At least one of listeningProgress or readingProgress is required" },
        { status: 400 }
      );
    }

    // Validate listening progress shape
    if (listeningProgress) {
      if (
        typeof listeningProgress.chapter !== "number" ||
        typeof listeningProgress.position_seconds !== "number"
      ) {
        return NextResponse.json(
          { error: "Invalid listeningProgress format" },
          { status: 400 }
        );
      }
    }

    // Validate reading progress shape
    if (readingProgress) {
      if (
        typeof readingProgress.page !== "number" ||
        typeof readingProgress.percentage !== "number"
      ) {
        return NextResponse.json(
          { error: "Invalid readingProgress format" },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      lastAccessedAt: new Date(),
    };

    if (listeningProgress) {
      updateData.listeningProgress = listeningProgress;
    }

    if (readingProgress) {
      updateData.readingProgress = readingProgress;
    }

    // Update the user_library record (only if it exists — user must have access)
    const updated = await prisma.userLibrary.updateMany({
      where: {
        userId: session.user.id,
        bookId,
      },
      data: updateData,
    });

    if (updated.count === 0) {
      return NextResponse.json(
        { error: "Book not found in your library" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
