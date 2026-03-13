import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";
import { AdmissionLetterPDF } from "@repo/pdf";
import type { AdmissionLetterData } from "@repo/pdf";
import { format } from "date-fns";
import React from "react";

export async function GET() {
  try {
    const { studentProfile } = await requireStudent();

    // Fetch the application with program and session details
    const application = await prisma.lmsApplication.findUnique({
      where: { id: studentProfile.applicationId },
      include: {
        program: {
          include: {
            department: {
              include: {
                faculty: true,
              },
            },
          },
        },
        session: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (application.status !== "accepted") {
      return NextResponse.json(
        { error: "Admission letter is only available for accepted applications" },
        { status: 400 }
      );
    }

    const data: AdmissionLetterData = {
      studentName: `${application.firstName} ${application.lastName}`,
      applicationNumber: application.applicationNumber,
      programName: application.program.name,
      degreeType: application.program.degreeType,
      departmentName: application.program.department.name,
      facultyName: application.program.department.faculty.name,
      sessionName: application.session.name,
      admissionDate: application.reviewedAt
        ? format(new Date(application.reviewedAt), "MMMM d, yyyy")
        : format(new Date(), "MMMM d, yyyy"),
      address: application.address || undefined,
      email: application.email,
    };

    const buffer = await renderToBuffer(
      React.createElement(AdmissionLetterPDF, { data }) as any
    );

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="admission-letter-${studentProfile.studentId}.pdf"`,
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
