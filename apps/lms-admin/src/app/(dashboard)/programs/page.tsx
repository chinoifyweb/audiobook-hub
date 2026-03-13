import { prisma } from "@repo/db";
import { Button } from "@repo/ui";
import Link from "next/link";

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

      <div className="rounded-md border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Name</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Code</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Degree</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Department</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Duration</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Tuition/Sem</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Students</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Active</th>
            </tr>
          </thead>
          <tbody>
            {programs.length === 0 ? (
              <tr>
                <td colSpan={8} className="h-24 text-center text-muted-foreground">
                  No programs found. Create one to get started.
                </td>
              </tr>
            ) : (
              programs.map((program) => (
                <tr key={program.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{program.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{program.code}</td>
                  <td className="px-4 py-3 capitalize">{program.degreeType.replace("_", " ")}</td>
                  <td className="px-4 py-3">{program.department.name}</td>
                  <td className="px-4 py-3">{program.durationSemesters} semesters</td>
                  <td className="px-4 py-3">
                    {"\u20A6"}{(program.tuitionPerSemester / 100).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{program._count.students}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        program.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {program.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
