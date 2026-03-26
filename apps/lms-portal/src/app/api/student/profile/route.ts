import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: { select: { fullName: true, email: true, avatarUrl: true, phone: true } },
        program: {
          include: {
            department: { select: { name: true } },
          },
        },
      },
    });

    if (!studentProfile) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      student: {
        fullName: studentProfile.user.fullName || "Student",
        email: studentProfile.user.email,
        phone: studentProfile.user.phone,
        avatarUrl: studentProfile.user.avatarUrl,
        studentId: studentProfile.studentId,
        programName: studentProfile.program.name,
        programCode: studentProfile.program.code,
        departmentName: studentProfile.program.department.name,
        photoUrl: studentProfile.photoUrl,
        enrollmentDate: studentProfile.enrollmentDate.toISOString(),
        expectedGraduation: studentProfile.expectedGraduation?.toISOString() || null,
        status: studentProfile.status,
        currentSemester: studentProfile.currentSemester,
      },
    });
  } catch (error) {
    console.error("Student profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
