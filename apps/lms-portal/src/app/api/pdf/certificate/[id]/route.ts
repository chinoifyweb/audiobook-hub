import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";
import { CertificatePDF } from "@repo/pdf";
import type { CertificateData } from "@repo/pdf";
import { format } from "date-fns";
import React from "react";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { studentProfile } = await requireStudent();

    const certificate = await prisma.lmsCertificate.findUnique({
      where: { id: params.id },
      include: {
        student: {
          include: {
            user: { select: { fullName: true } },
          },
        },
        program: {
          include: {
            department: {
              include: { faculty: true },
            },
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    // Ensure student can only access their own certificate
    if (certificate.studentId !== studentProfile.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only access your own certificates" },
        { status: 403 }
      );
    }

    if (!certificate.isValid) {
      return NextResponse.json(
        { error: "This certificate has been invalidated" },
        { status: 400 }
      );
    }

    const data: CertificateData = {
      studentName: certificate.student.user.fullName || "N/A",
      programName: certificate.program.name,
      degreeType: certificate.program.degreeType,
      certificateNumber: certificate.certificateNumber,
      verificationCode: certificate.verificationCode,
      issueDate: format(new Date(certificate.issueDate), "MMMM d, yyyy"),
      facultyName: certificate.program.department.faculty.name,
      departmentName: certificate.program.department.name,
    };

    const buffer = await renderToBuffer(
      React.createElement(CertificatePDF, { data }) as any
    );

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="certificate-${certificate.certificateNumber}.pdf"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status =
      message === "Unauthorized"
        ? 401
        : message.includes("Forbidden")
          ? 403
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
