import { prisma } from "@repo/db";
import { StudentsClient } from "./students-client";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const [students, programs] = await Promise.all([
    prisma.studentProfile.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
        program: { select: { id: true, name: true, code: true } },
      },
    }),
    prisma.program.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Students</h1>
        <p className="text-muted-foreground">Manage enrolled students</p>
      </div>

      <StudentsClient students={students} programs={programs} />
    </div>
  );
}
