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

    const departments = await prisma.department.findMany({
      select: { id: true, name: true, code: true },
    });
    const programs = await prisma.program.findMany({
      select: { id: true, name: true, code: true },
    });

    const deptMap = new Map<string, string>();
    departments.forEach((d) => {
      deptMap.set(d.name.toLowerCase(), d.id);
      deptMap.set(d.code.toLowerCase(), d.id);
    });

    const progMap = new Map<string, string>();
    programs.forEach((p) => {
      progMap.set(p.name.toLowerCase(), p.id);
      progMap.set(p.code.toLowerCase(), p.id);
    });

    let success = 0;
    let errors = 0;
    const messages: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        const code = (row.code || row.course_code || "").toUpperCase().trim();
        const title = (row.title || row.course_title || "").trim();
        const deptStr = (row.department || row.dept || "").trim();
        const progStr = (row.program || "").trim();
        const credits = parseInt(row.credits || row.credit_units || "3", 10);
        const semester = parseInt(row.semester || row.semester_number || "1", 10);
        const isElective = (row.is_elective || row.elective || row.type || "").toLowerCase();

        if (!code || !title) {
          messages.push(`Row ${rowNum}: Missing code or title`);
          errors++;
          continue;
        }

        // Find department
        let departmentId: string | null = null;
        if (deptStr) {
          departmentId = deptMap.get(deptStr.toLowerCase()) || null;
          if (!departmentId) {
            messages.push(`Row ${rowNum}: Department '${deptStr}' not found`);
            errors++;
            continue;
          }
        } else if (departments.length > 0) {
          departmentId = departments[0].id;
          messages.push(`Row ${rowNum}: No department specified, using '${departments[0].name}'`);
        } else {
          messages.push(`Row ${rowNum}: No departments available`);
          errors++;
          continue;
        }

        // Find program (optional)
        let programId: string | null = null;
        if (progStr) {
          programId = progMap.get(progStr.toLowerCase()) || null;
          if (!programId) {
            messages.push(`Row ${rowNum}: Program '${progStr}' not found, skipping program assignment`);
          }
        }

        const elective = isElective === "true" || isElective === "yes" || isElective === "elective";

        // Check for existing course
        const existing = await prisma.course.findUnique({ where: { code } });
        if (existing) {
          await prisma.course.update({
            where: { id: existing.id },
            data: {
              title,
              departmentId,
              programId,
              creditUnits: isNaN(credits) ? 3 : credits,
              semesterNumber: isNaN(semester) ? 1 : semester,
              isElective: elective,
            },
          });
          messages.push(`Row ${rowNum}: Updated existing course ${code}`);
        } else {
          await prisma.course.create({
            data: {
              code,
              title,
              departmentId,
              programId,
              creditUnits: isNaN(credits) ? 3 : credits,
              semesterNumber: isNaN(semester) ? 1 : semester,
              isElective: elective,
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
    console.error("Course import error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
