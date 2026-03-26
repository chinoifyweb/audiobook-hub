import { prisma } from "@repo/db";
import { Button } from "@repo/ui";
import Link from "next/link";
import { ProgramsClient } from "./programs-client";

export const dynamic = "force-dynamic";

export default async function ProgramsPage() {
  const programs = await prisma.program.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      department: { select: { name: true } },
      _count: { select: { students: true, courses: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Programs</h1>
          <p className="text-muted-foreground">Manage academic programs</p>
        </div>
        <Button asChild>
          <Link href="/programs/new">Add Program</Link>
        </Button>
      </div>

      <ProgramsClient programs={programs} />
    </div>
  );
}
