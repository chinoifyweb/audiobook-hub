import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/db";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authorProfile = await prisma.authorProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        penName: true,
        bio: true,
        websiteUrl: true,
        socialLinks: true,
        bankName: true,
        bankAccountNumber: true,
        bankAccountName: true,
        commissionRate: true,
        isApproved: true,
      },
    });

    if (!authorProfile) {
      return NextResponse.json(
        { error: "Author profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(authorProfile);
  } catch (error) {
    console.error("Error fetching author profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authorProfile = await prisma.authorProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        bankAccountNumber: true,
        paystackSubaccountCode: true,
      },
    });

    if (!authorProfile) {
      return NextResponse.json(
        { error: "Author profile not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      penName,
      bio,
      websiteUrl,
      socialLinks,
      bankName,
      bankAccountNumber,
      bankAccountName,
    } = body;

    const updateData: Record<string, unknown> = {};

    if (penName !== undefined) updateData.penName = penName || null;
    if (bio !== undefined) updateData.bio = bio || null;
    if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl || null;
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
    if (bankName !== undefined) updateData.bankName = bankName || null;
    if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber || null;
    if (bankAccountName !== undefined) updateData.bankAccountName = bankAccountName || null;

    const updated = await prisma.authorProfile.update({
      where: { id: authorProfile.id },
      data: updateData,
      select: {
        id: true,
        penName: true,
        bio: true,
        websiteUrl: true,
        socialLinks: true,
        bankName: true,
        bankAccountNumber: true,
        bankAccountName: true,
        commissionRate: true,
        isApproved: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating author profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
