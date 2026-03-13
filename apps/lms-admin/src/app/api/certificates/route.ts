import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/auth";
import crypto from "crypto";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Verification code required" }, { status: 400 });
    }

    const certificate = await prisma.lmsCertificate.findUnique({
      where: { verificationCode: code },
      include: {
        student: {
          select: {
            studentId: true,
            user: { select: { fullName: true } },
          },
        },
        program: { select: { name: true, code: true, degreeType: true } },
      },
    });

    if (!certificate || !certificate.isValid) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({ found: true, certificate });
  } catch (error) {
    console.error("Verify certificate error:", error);
    return NextResponse.json({ error: "Failed to verify certificate" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { studentId, programId } = body;

    if (!studentId || !programId) {
      return NextResponse.json({ error: "Student ID and Program ID are required" }, { status: 400 });
    }

    // Check student exists and is graduated
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (student.status !== "graduated") {
      return NextResponse.json({ error: "Student must have graduated status" }, { status: 400 });
    }

    // Check no existing certificate for this student-program
    const existing = await prisma.lmsCertificate.findFirst({
      where: { studentId, programId },
    });

    if (existing) {
      return NextResponse.json({ error: "Certificate already exists for this student and program" }, { status: 400 });
    }

    // Generate certificate number: BBA/CERT/YYYY/NNN
    const year = new Date().getFullYear();
    const lastCert = await prisma.lmsCertificate.findFirst({
      where: { certificateNumber: { startsWith: `BBA/CERT/${year}/` } },
      orderBy: { certificateNumber: "desc" },
    });

    let nextNum = 1;
    if (lastCert) {
      const parts = lastCert.certificateNumber.split("/");
      nextNum = parseInt(parts[3], 10) + 1;
    }
    const certificateNumber = `BBA/CERT/${year}/${String(nextNum).padStart(3, "0")}`;

    // Generate verification code
    const verificationCode = crypto.randomBytes(8).toString("hex").toUpperCase();

    const certificate = await prisma.lmsCertificate.create({
      data: {
        studentId,
        programId,
        certificateNumber,
        verificationCode,
        issueDate: new Date(),
      },
    });

    return NextResponse.json(certificate, { status: 201 });
  } catch (error) {
    console.error("Generate certificate error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to generate certificate" }, { status: 500 });
  }
}
