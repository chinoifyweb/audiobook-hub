import { prisma } from "@repo/db";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { StatsCard } from "@/components/stats-card";
import { Users, GraduationCap, CreditCard, BookOpen } from "lucide-react";
import { RevenueChart } from "./revenue-chart";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const currentYear = new Date().getFullYear();

  const [
    totalStudents,
    activeStudents,
    graduatedStudents,
    totalLecturers,
    totalPrograms,
    totalCourses,
    totalPayments,
    monthlyPayments,
  ] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.studentProfile.count({ where: { status: "active" } }),
    prisma.studentProfile.count({ where: { status: "graduated" } }),
    prisma.lecturerProfile.count(),
    prisma.program.count(),
    prisma.course.count(),
    prisma.tuitionPayment.aggregate({
      where: { status: "successful" },
      _sum: { amount: true },
      _count: true,
    }),
    // Get monthly revenue for the current year
    prisma.$queryRaw<Array<{ month: number; total: bigint }>>`
      SELECT
        EXTRACT(MONTH FROM paid_at)::int as month,
        SUM(amount)::bigint as total
      FROM tuition_payments
      WHERE status = 'successful'
        AND EXTRACT(YEAR FROM paid_at) = ${currentYear}
      GROUP BY EXTRACT(MONTH FROM paid_at)
      ORDER BY month
    `,
  ]);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const chartData = months.map((name, idx) => {
    const found = monthlyPayments.find((p) => p.month === idx + 1);
    return {
      name,
      revenue: found ? Number(found.total) / 100 : 0,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Overview of academy performance and statistics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value={totalStudents}
          description={`${activeStudents} active, ${graduatedStudents} graduated`}
          icon={Users}
        />
        <StatsCard
          title="Total Lecturers"
          value={totalLecturers}
          icon={GraduationCap}
        />
        <StatsCard
          title="Programs & Courses"
          value={`${totalPrograms} / ${totalCourses}`}
          description="Programs / Courses"
          icon={BookOpen}
        />
        <StatsCard
          title="Total Revenue"
          value={`\u20A6${(Number(totalPayments._sum.amount || 0) / 100).toLocaleString()}`}
          description={`${totalPayments._count} payments`}
          icon={CreditCard}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue ({currentYear})</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={chartData} />
        </CardContent>
      </Card>

      {/* Student Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Student Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Active", count: activeStudents, color: "bg-green-500" },
                { label: "Graduated", count: graduatedStudents, color: "bg-blue-500" },
                {
                  label: "Other",
                  count: totalStudents - activeStudents - graduatedStudents,
                  color: "bg-gray-400",
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${item.color}`} />
                  <span className="text-sm flex-1">{item.label}</span>
                  <span className="text-sm font-medium">{item.count}</span>
                  <div className="w-24 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full`}
                      style={{
                        width: `${totalStudents > 0 ? (item.count / totalStudents) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
