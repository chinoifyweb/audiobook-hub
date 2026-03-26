import { prisma } from "@repo/db";
import { LecturersClient } from "./lecturers-client";

export const dynamic = "force-dynamic";

export default async function LecturersPage() {
  const [lecturers, departments] = await Promise.all([
    prisma.lecturerProfile.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true, email: true } },
        department: { select: { name: true, code: true } },
      },
    }),
    prisma.department.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lecturers</h1>
          <p className="text-muted-foreground">Manage lecturers and staff</p>
        </div>
      </div>

      <LecturersClient lecturers={lecturers} departments={departments} />
    </div>
  );
}
