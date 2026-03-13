import { prisma } from "@repo/db";
import { Button } from "@repo/ui";
import Link from "next/link";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  suspended: "bg-red-100 text-red-800",
  graduated: "bg-blue-100 text-blue-800",
  withdrawn: "bg-gray-100 text-gray-800",
  deferred: "bg-yellow-100 text-yellow-800",
};

interface Props {
  searchParams: { q?: string };
}

export default async function StudentsPage({ searchParams }: Props) {
  const search = searchParams.q || "";

  const students = await prisma.studentProfile.findMany({
    where: search
      ? {
          OR: [
            { studentId: { contains: search, mode: "insensitive" } },
            { user: { fullName: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { fullName: true, email: true } },
      program: { select: { name: true, code: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Students</h1>
        <p className="text-muted-foreground">Manage enrolled students</p>
      </div>

      <form className="flex gap-2 max-w-md">
        <input
          type="text"
          name="q"
          defaultValue={search}
          placeholder="Search by name, email, or student ID..."
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit">Search</Button>
      </form>

      <div className="rounded-md border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Student ID</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Name</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Email</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Program</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Semester</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Status</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={7} className="h-24 text-center text-muted-foreground">
                  No students found.
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3 font-mono text-xs">{student.studentId}</td>
                  <td className="px-4 py-3 font-medium">{student.user.fullName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{student.user.email}</td>
                  <td className="px-4 py-3">{student.program.code}</td>
                  <td className="px-4 py-3">{student.currentSemester}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[student.status] || ""}`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/students/${student.id}`}>View</Link>
                    </Button>
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
