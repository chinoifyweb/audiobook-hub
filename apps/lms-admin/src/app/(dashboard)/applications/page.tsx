import { prisma } from "@repo/db";
import { Badge, Button } from "@repo/ui";
import Link from "next/link";
import { format } from "date-fns";
import { ApplicationsFilter } from "./applications-filter";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  withdrawn: "bg-gray-100 text-gray-800",
};

interface Props {
  searchParams: { status?: string };
}

export default async function ApplicationsPage({ searchParams }: Props) {
  const statusFilter = searchParams.status;

  const applications = await prisma.lmsApplication.findMany({
    where: statusFilter && statusFilter !== "all"
      ? { status: statusFilter as "submitted" | "under_review" | "accepted" | "rejected" | "withdrawn" }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { fullName: true, email: true } },
      program: { select: { name: true, code: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground">
            Manage student applications
          </p>
        </div>
      </div>

      <ApplicationsFilter currentStatus={statusFilter || "all"} />

      <div className="rounded-md border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                Application #
              </th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                Name
              </th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                Email
              </th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                Program
              </th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                Status
              </th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                Date
              </th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 ? (
              <tr>
                <td colSpan={7} className="h-24 text-center text-muted-foreground">
                  No applications found.
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr key={app.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3 font-mono text-xs">
                    {app.applicationNumber}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {app.firstName} {app.lastName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {app.email}
                  </td>
                  <td className="px-4 py-3">{app.program.code}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[app.status] || ""}`}
                    >
                      {app.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(app.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/applications/${app.id}`}>Review</Link>
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
