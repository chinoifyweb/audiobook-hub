import { prisma } from "@repo/db";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { FeesClient } from "./fees-client";

export const dynamic = "force-dynamic";

export default async function FeesPage() {
  const [tuitionFees, programs, semesters, paymentStats] = await Promise.all([
    prisma.tuitionFee.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        program: { select: { name: true, code: true } },
        semester: {
          select: { name: true, session: { select: { name: true } } },
        },
        _count: { select: { payments: true } },
      },
    }),
    prisma.program.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
    prisma.semester.findMany({
      orderBy: { startDate: "desc" },
      select: { id: true, name: true, session: { select: { name: true } } },
    }),
    prisma.tuitionPayment.groupBy({
      by: ["status"],
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const totalPaid = paymentStats.find((s) => s.status === "successful")?._sum.amount || 0;
  const totalPending = paymentStats.find((s) => s.status === "pending")?._sum.amount || 0;
  const paidCount = paymentStats.find((s) => s.status === "successful")?._count || 0;
  const pendingCount = paymentStats.find((s) => s.status === "pending")?._count || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fee Management</h1>
        <p className="text-muted-foreground">Set tuition fees and track payments</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{"\u20A6"}{(Number(totalPaid) / 100).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{paidCount} payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{"\u20A6"}{(Number(totalPending) / 100).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{pendingCount} payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fee Structures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tuitionFees.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{programs.length}</div>
          </CardContent>
        </Card>
      </div>

      <FeesClient tuitionFees={tuitionFees} programs={programs} semesters={semesters} />
    </div>
  );
}
