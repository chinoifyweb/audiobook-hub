import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/db";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    // Programs list is public — no auth required
    if (url.searchParams.get("programs") === "true") {
      const programs = await prisma.program.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          code: true,
          degreeType: true,
          durationSemesters: true,
        },
        orderBy: { name: "asc" },
      });
      return NextResponse.json({ programs });
    }

    // All other queries require auth
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return user's applications
    const applications = await prisma.lmsApplication.findMany({
      where: { userId: session.user.id },
      include: {
        program: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Application GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      previousEducation,
      programId,
      documents,
    } = body;

    if (!firstName || !lastName || !email || !programId) {
      return NextResponse.json(
        { error: "First name, last name, email, and program are required" },
        { status: 400 }
      );
    }

    // Verify program exists
    const program = await prisma.program.findUnique({
      where: { id: programId },
    });
    if (!program) {
      return NextResponse.json({ error: "Invalid program" }, { status: 400 });
    }

    // Get current active session
    const activeSession = await prisma.academicSession.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!activeSession) {
      return NextResponse.json(
        { error: "No active academic session found" },
        { status: 400 }
      );
    }

    // Generate application number: BBA/APP/YYYY/NNNN
    const year = new Date().getFullYear();
    const count = await prisma.lmsApplication.count({
      where: {
        applicationNumber: { startsWith: `BBA/APP/${year}/` },
      },
    });
    const applicationNumber = `BBA/APP/${year}/${String(count + 1).padStart(4, "0")}`;

    const application = await prisma.lmsApplication.create({
      data: {
        userId: session.user.id,
        programId,
        sessionId: activeSession.id,
        applicationNumber,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || null,
        address: address?.trim() || null,
        previousEducation: previousEducation || null,
        documents: documents || null,
        status: "submitted",
      },
      include: {
        program: { select: { name: true, code: true } },
      },
    });

    return NextResponse.json(
      {
        message: "Application submitted successfully",
        application,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Application POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
