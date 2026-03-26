import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { rows } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    const programs = await prisma.program.findMany({
      select: { id: true, code: true },
    });
    const semesters = await prisma.semester.findMany({
      include: { session: { select: { name: true } } },
    });

    const programMap = new Map(programs.map((p) => [p.code.toUpperCase(), p.id]));

    let success = 0;
    let errors = 0;
    const messages: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 for 1-index and header

      try {
        const programCode = (row.program_code || row.code || "").toUpperCase().trim();
        const amountStr = (row.amount || "").toString().trim();
        const dueDateStr = (row.due_date || row.duedate || "").trim();
        const description = (row.description || "").trim();
        const semesterStr = (row.semester || "").trim();

        if (!programCode || !amountStr) {
          messages.push(`Row ${rowNum}: Missing program_code or amount`);
          errors++;
          continue;
        }

        const programId = programMap.get(programCode);
        if (!programId) {
          messages.push(`Row ${rowNum}: Program '${programCode}' not found`);
          errors++;
          continue;
        }

        const amount = Math.round(parseFloat(amountStr) * 100);
        if (isNaN(amount) || amount <= 0) {
          messages.push(`Row ${rowNum}: Invalid amount '${amountStr}'`);
          errors++;
          continue;
        }

        // Try to find matching semester
        let semesterId: string | null = null;
        if (semesterStr) {
          const matchingSemester = semesters.find((s) => {
            const fullName = `${s.session.name} - ${s.name}`;
            return (
              fullName.toLowerCase() === semesterStr.toLowerCase() ||
              s.name.toLowerCase() === semesterStr.toLowerCase() ||
              s.id === semesterStr
            );
          });
          if (matchingSemester) {
            semesterId = matchingSemester.id;
          }
        }

        if (!semesterId) {
          // Use first semester as fallback
          if (semesters.length > 0) {
            semesterId = semesters[0].id;
            messages.push(`Row ${rowNum}: Semester not matched, using '${semesters[0].session.name} - ${semesters[0].name}'`);
          } else {
            messages.push(`Row ${rowNum}: No semesters available`);
            errors++;
            continue;
          }
        }

        const dueDate = dueDateStr ? new Date(dueDateStr) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        if (isNaN(dueDate.getTime())) {
          messages.push(`Row ${rowNum}: Invalid date '${dueDateStr}', using 90 days from now`);
        }

        // Check for existing fee with same program + semester
        const existing = await prisma.tuitionFee.findFirst({
          where: { programId, semesterId },
        });

        if (existing) {
          await prisma.tuitionFee.update({
            where: { id: existing.id },
            data: { amount, description: description || null, dueDate },
          });
          messages.push(`Row ${rowNum}: Updated existing fee for ${programCode}`);
        } else {
          await prisma.tuitionFee.create({
            data: {
              programId,
              semesterId,
              amount,
              description: description || null,
              dueDate,
            },
          });
        }

        success++;
      } catch (err) {
        messages.push(`Row ${rowNum}: ${err instanceof Error ? err.message : "Unknown error"}`);
        errors++;
      }
    }

    return NextResponse.json({ success, errors, messages });
  } catch (error) {
    console.error("Fee import error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
