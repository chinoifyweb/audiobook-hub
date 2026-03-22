import { prisma } from "@repo/db";
import { StatsCard } from "@/components/stats-card";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { Users, UserCheck, GraduationCap, FileText, CreditCard, FileQuestion, Eye, Table2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const now = new Date();

  const [
    totalStudents,
    totalLecturers,
    totalPrograms,
    pendingApplications,
    recentApplications,
    revenueThisMonth,
    activeAssessments,
    totalMaterials,
    coursesWithNoContent,
  ] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.lecturerProfile.count(),
    prisma.program.count(),
    prisma.lmsApplication.count({ where: { status: { in: ["submitted", "under_review"] } } }),
    prisma.lmsApplication.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true, email: true } },
        program: { select: { name: true, code: true } },
      },
    }),
    prisma.tuitionPayment.aggregate({
      where: {
        status: "successful",
        paidAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
        },
      },
      _sum: { amount: true },
    }),
    prisma.testExam.count({
      where: {
        isPublished: true,
        startTime: { lte: now },
        endTime: { gte: now },
      },
    }),
    prisma.courseMaterial.count(),
    prisma.courseAssignment.count({
      where: {
        isActive: true,
        materials: { none: {} },
      },
    }),
  ]);

  return {
    totalStudents,
    totalLecturers,
    totalPrograms,
    pendingApplications,
    recentApplications,
    revenueThisMonth: revenueThisMonth._sum.amount || 0,
    activeAssessments,
    totalMaterials,
    coursesWithNoContent,
  };
}

const statusColors: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  withdrawn: "bg-gray-100 text-gray-800",
};

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to Berean Bible Academy Admin Portal
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value={data.totalStudents}
          icon={Users}
        />
        <StatsCard
          title="Total Lecturers"
          value={data.totalLecturers}
          icon={UserCheck}
        />
        <StatsCard
          title="Pending Applications"
          value={data.pendingApplications}
          icon={FileText}
        />
        <StatsCard
          title="Revenue This Month"
          value={`\u20A6${(data.revenueThisMonth / 100).toLocaleString()}`}
          icon={CreditCard}
        />
      </div>

      {/* Learning Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Active Assessments"
          value={data.activeAssessments}
          description="Currently open for students"
          icon={FileQuestion}
        />
        <StatsCard
          title="Course Materials"
          value={data.totalMaterials}
          description="Videos, readings, documents"
          icon={Eye}
        />
        <StatsCard
          title="Courses Without Content"
          value={data.coursesWithNoContent}
          description="Need lecturer attention"
          icon={Table2}
        />
      </div>

      {/* Quick Actions + Recent Applications */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/applications">
                <FileText className="mr-2 h-4 w-4" />
                Review Applications
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/programs/new">
                <GraduationCap className="mr-2 h-4 w-4" />
                Add Program
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/lecturers">
                <UserCheck className="mr-2 h-4 w-4" />
                Add Lecturer
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/assessments">
                <FileQuestion className="mr-2 h-4 w-4" />
                View Assessments
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/grades">
                <Table2 className="mr-2 h-4 w-4" />
                Grade Reports
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/content-monitoring">
                <Eye className="mr-2 h-4 w-4" />
                Content Monitoring
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Applications</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/applications">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.recentApplications.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No applications yet.
              </p>
            ) : (
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                        Applicant
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
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentApplications.map((app) => (
                      <tr key={app.id} className="border-b">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">
                              {app.firstName} {app.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {app.email}
                            </p>
                          </div>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
