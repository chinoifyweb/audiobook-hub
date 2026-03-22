import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/auth";
import bcrypt from "bcryptjs";

function generateAppNumber(index: number): string {
  const year = new Date().getFullYear();
  const ts = Date.now().toString().slice(-6);
  return `APP/${year}/${ts}${String(index).padStart(3, "0")}`;
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const { rows } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    const programs = await prisma.program.findMany({
      select: { id: true, name: true, code: true },
    });

    const progMap = new Map<string, string>();
    programs.forEach((p) => {
      progMap.set(p.code.toLowerCase(), p.id);
      progMap.set(p.name.toLowerCase(), p.id);
    });

    // Get active session for applications
    const activeSession = await prisma.academicSession.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    if (!activeSession) {
      return NextResponse.json(
        { error: "No active academic session found. Please create one first." },
        { status: 400 }
      );
    }

    // Get next student ID number
    const year = new Date().getFullYear();
    const lastStudent = await prisma.studentProfile.findFirst({
      where: { studentId: { startsWith: `BBA/STU/${year}/` } },
      orderBy: { studentId: "desc" },
    });
    let nextNum = 1;
    if (lastStudent) {
      const parts = lastStudent.studentId.split("/");
      nextNum = parseInt(parts[3], 10) + 1;
    }

    let success = 0;
    let errors = 0;
    const messages: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        const fullName = (row.name || row.full_name || row.fullname || "").trim();
        const email = (row.email || "").trim().toLowerCase();
        const phone = (row.phone || "").trim();
        const programStr = (row.program || row.program_code || "").trim();

        if (!fullName || !email) {
          messages.push(`Row ${rowNum}: Missing name or email`);
          errors++;
          continue;
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
          const existingProfile = await prisma.studentProfile.findFirst({
            where: { userId: existingUser.id },
          });
          if (existingProfile) {
            messages.push(`Row ${rowNum}: Student with email '${email}' already exists (${existingProfile.studentId})`);
            errors++;
            continue;
          }
        }

        // Find program
        let programId: string | null = null;
        if (programStr) {
          programId = progMap.get(programStr.toLowerCase()) || null;
          if (!programId) {
            messages.push(`Row ${rowNum}: Program '${programStr}' not found`);
            errors++;
            continue;
          }
        } else if (programs.length > 0) {
          programId = programs[0].id;
          messages.push(`Row ${rowNum}: No program specified, using '${programs[0].code}'`);
        } else {
          messages.push(`Row ${rowNum}: No programs available`);
          errors++;
          continue;
        }

        const studentId = `BBA/STU/${year}/${String(nextNum).padStart(4, "0")}`;
        const defaultPassword = `BBA${year}!${String(nextNum).padStart(4, "0")}`;
        const hashedPassword = await bcrypt.hash(defaultPassword, 12);
        const appNumber = generateAppNumber(nextNum);

        const expectedGraduation = new Date();
        expectedGraduation.setFullYear(expectedGraduation.getFullYear() + 2);

        // Parse name into first/last
        const nameParts = fullName.split(" ");
        const firstName = nameParts[0] || fullName;
        const lastName = nameParts.slice(1).join(" ") || firstName;

        if (existingUser) {
          // Create application + student profile for existing user
          await prisma.$transaction(async (tx) => {
            const app = await tx.lmsApplication.create({
              data: {
                userId: existingUser.id,
                programId: programId!,
                sessionId: activeSession.id,
                applicationNumber: appNumber,
                status: "accepted",
                firstName,
                lastName,
                email,
                phone: phone || null,
                reviewedById: session.user.id,
                reviewedAt: new Date(),
              },
            });

            await tx.studentProfile.create({
              data: {
                userId: existingUser.id,
                studentId,
                programId: programId!,
                applicationId: app.id,
                currentSemester: 1,
                expectedGraduation,
                status: "active",
              },
            });

            await tx.user.update({
              where: { id: existingUser.id },
              data: {
                role: "student",
                fullName: fullName || existingUser.fullName,
                phone: phone || existingUser.phone,
              },
            });
          });
        } else {
          // Create user, application, and student profile
          await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
              data: {
                email,
                fullName,
                phone: phone || null,
                passwordHash: hashedPassword,
                role: "student",
                isActive: true,
                isVerified: true,
              },
            });

            const app = await tx.lmsApplication.create({
              data: {
                userId: user.id,
                programId: programId!,
                sessionId: activeSession.id,
                applicationNumber: appNumber,
                status: "accepted",
                firstName,
                lastName,
                email,
                phone: phone || null,
                reviewedById: session.user.id,
                reviewedAt: new Date(),
              },
            });

            await tx.studentProfile.create({
              data: {
                userId: user.id,
                studentId,
                programId: programId!,
                applicationId: app.id,
                currentSemester: 1,
                expectedGraduation,
                status: "active",
              },
            });
          });
        }

        messages.push(`Row ${rowNum}: Created student ${studentId} (${email}), default password: ${defaultPassword}`);
        nextNum++;
        success++;
      } catch (err) {
        messages.push(`Row ${rowNum}: ${err instanceof Error ? err.message : "Unknown error"}`);
        errors++;
      }
    }

    return NextResponse.json({ success, errors, messages });
  } catch (error) {
    console.error("Student import error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
