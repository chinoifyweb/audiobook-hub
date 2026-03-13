import { prisma } from "@repo/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { format } from "date-fns";
import { StudentActions } from "./student-actions";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  suspended: "bg-red-100 text-red-800",
  graduated: "bg-blue-100 text-blue-800",
  withdrawn: "bg-gray-100 text-gray-800",
  deferred: "bg-yellow-100 text-yellow-800",
};

interface Props {
  params: { id: string };
}

export default async function StudentDetailPage({ params }: Props) {
  const student = await prisma.studentProfile.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { fullName: true, email: true, phone: true, avatarUrl: true } },
      program: {
        select: { name: true, code: true, degreeType: true, department: { select: { name: true } } },
      },
      enrollments: {
        orderBy: { enrolledAt: "desc" },
        include: {
          courseAssignment: {
            include: {
              course: { select: { code: true, title: true, creditUnits: true } },
              semester: { select: { name: true, session: { select: { name: true } } } },
            },
          },
          grade: true,
        },
      },
      tuitionPayments: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          tuitionFee: {
            select: { amount: true, semester: { select: { name: true } } },
          },
        },
      },
    },
  });

  if (!student) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {student.user.fullName}
          </h1>
          <p className="text-muted-foreground">{student.studentId}</p>
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusColors[student.status] || ""}`}>
          {student.status}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{student.user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{student.user.phone || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Program</p>
                <p className="font-medium">{student.program.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{student.program.department.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Semester</p>
                <p className="font-medium">{student.currentSemester}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Enrollment Date</p>
                <p className="font-medium">
                  {format(new Date(student.enrollmentDate), "MMM d, yyyy")}
                </p>
              </div>
              {student.expectedGraduation && (
                <div>
                  <p className="text-sm text-muted-foreground">Expected Graduation</p>
                  <p className="font-medium">
                    {format(new Date(student.expectedGraduation), "MMM yyyy")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <StudentActions studentId={student.id} status={student.status} />
      </div>

      {/* Course Enrollments & Grades */}
      <Card>
        <CardHeader>
          <CardTitle>Course Enrollments & Grades</CardTitle>
        </CardHeader>
        <CardContent>
          {student.enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No course enrollments yet.
            </p>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Course</th>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Semester</th>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Credits</th>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Status</th>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Grade</th>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {student.enrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="border-b">
                      <td className="px-4 py-3">
                        <p className="font-medium">{enrollment.courseAssignment.course.code}</p>
                        <p className="text-xs text-muted-foreground">{enrollment.courseAssignment.course.title}</p>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {enrollment.courseAssignment.semester.session.name} - {enrollment.courseAssignment.semester.name}
                      </td>
                      <td className="px-4 py-3">{enrollment.courseAssignment.course.creditUnits}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${enrollment.status === "completed" ? "bg-green-100 text-green-800" : enrollment.status === "enrolled" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}`}>
                          {enrollment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{enrollment.grade?.letterGrade || "—"}</td>
                      <td className="px-4 py-3">{enrollment.grade?.totalScore?.toString() || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {student.tuitionPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No payments recorded.
            </p>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Semester</th>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Amount</th>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Status</th>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {student.tuitionPayments.map((payment) => (
                    <tr key={payment.id} className="border-b">
                      <td className="px-4 py-3">{payment.tuitionFee.semester.name}</td>
                      <td className="px-4 py-3">{"\u20A6"}{(payment.amount / 100).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${payment.status === "successful" ? "bg-green-100 text-green-800" : payment.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {payment.paidAt ? format(new Date(payment.paidAt), "MMM d, yyyy") : "—"}
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
  );
}
