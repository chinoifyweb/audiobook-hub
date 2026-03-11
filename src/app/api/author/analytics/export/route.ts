import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authorProfile = await prisma.authorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, commissionRate: true },
    });

    if (!authorProfile) {
      return NextResponse.json(
        { error: "Author profile not found" },
        { status: 404 }
      );
    }

    // Get all books with sales data
    const books = await prisma.book.findMany({
      where: { authorId: authorProfile.id },
      select: {
        id: true,
        title: true,
        price: true,
        bookType: true,
        status: true,
        createdAt: true,
        purchases: {
          where: { status: "successful" },
          select: {
            amountPaid: true,
            authorEarnings: true,
            platformFee: true,
            purchasedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Build CSV
    const rows: string[] = [];
    rows.push(
      "Book Title,Book Type,Status,Price (Naira),Units Sold,Total Revenue (Naira),Author Earnings (Naira),Platform Fee (Naira),Published Date"
    );

    for (const book of books) {
      const unitsSold = book.purchases.length;
      const totalRevenue = book.purchases.reduce(
        (sum, p) => sum + p.amountPaid,
        0
      );
      const authorEarnings = book.purchases.reduce(
        (sum, p) => sum + p.authorEarnings,
        0
      );
      const platformFee = book.purchases.reduce(
        (sum, p) => sum + p.platformFee,
        0
      );

      rows.push(
        [
          `"${book.title.replace(/"/g, '""')}"`,
          book.bookType,
          book.status,
          (book.price / 100).toFixed(2),
          unitsSold,
          (totalRevenue / 100).toFixed(2),
          (authorEarnings / 100).toFixed(2),
          (platformFee / 100).toFixed(2),
          new Date(book.createdAt).toISOString().split("T")[0],
        ].join(",")
      );
    }

    const csv = rows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="sales-report-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Analytics export error:", error);
    return NextResponse.json(
      { error: "Failed to export analytics" },
      { status: 500 }
    );
  }
}
