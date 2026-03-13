import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireStudent } from "@/lib/auth";
import { format } from "date-fns";
import { StudentIdCardPDF } from "@repo/pdf";
import type { StudentIdCardData } from "@repo/pdf";
import React from "react";

export async function GET() {
  try {
    const { studentProfile } = await requireStudent();

    const data: StudentIdCardData = {
      studentName: studentProfile.user.fullName || "N/A",
      studentId: studentProfile.studentId,
      programName: studentProfile.program.name,
      departmentName: studentProfile.program.department.name,
      facultyName: studentProfile.program.department.name, // department already included
      enrollmentDate: format(
        new Date(studentProfile.enrollmentDate),
        "MMMM yyyy"
      ),
      expectedGraduation: studentProfile.expectedGraduation
        ? format(new Date(studentProfile.expectedGraduation), "MMMM yyyy")
        : undefined,
      photoUrl: studentProfile.photoUrl || undefined,
    };

    const buffer = await renderToBuffer(
      React.createElement(StudentIdCardPDF, { data }) as any
    );

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="id-card-${studentProfile.studentId}.pdf"`,
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
