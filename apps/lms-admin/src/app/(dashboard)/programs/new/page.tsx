import { prisma } from "@repo/db";
import { CreateProgramForm } from "./create-program-form";

export const dynamic = "force-dynamic";

export default async function NewProgramPage() {
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Program</h1>
        <p className="text-muted-foreground">Add a new academic program</p>
      </div>

      <CreateProgramForm departments={departments} />
    </div>
  );
}
