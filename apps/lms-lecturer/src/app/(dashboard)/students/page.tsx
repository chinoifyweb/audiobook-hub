import { prisma } from "@repo/db";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from "@repo/ui";
import { Users, MessageCircle, Phone, Mail, AlertTriangle, Search } from "lucide-react";
import { requireLecturer, getActiveSemester } from "@/lib/auth";
import Link from "next/link";

interface Props {
  searchParams: { course?: string };
}

export default async function StudentsPage({ searchParams }: Props) {
  try {
    const lecturer = await requireLecturer();
    const activeSemester = await getActiveSemester();

    if (!activeSemester) {
      return (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Students</h1>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No active semester found.</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Get all course assignments for this lecturer with enrolled students
    const courseAssignments = await prisma.courseAssignment.findMany({
      where: {
        lecturerId: lecturer.id,
        semesterId: activeSemester.id,
        isActive: true,
      },
      include: {
        course: true,
        enrollments: {
          where: { status: "enrolled" },
          include: {
            student: {
              include: {
                user: { select: { fullName: true, email: true, phone: true } },
                program: { select: { name: true, code: true } },
              },
            },
          },
          orderBy: {
            student: { user: { fullName: "asc" } },
          },
        },
      },
      orderBy: { course: { code: "asc" } },
    });

    // Also get WhatsApp numbers from application data
    const studentIds = courseAssignments.flatMap((ca) =>
      ca.enrollments.map((e) => e.student.userId)
    );

    const applicationData = studentIds.length > 0
      ? await prisma.lmsApplication.findMany({
          where: {
            userId: { in: studentIds },
            status: "accepted",
          },
          select: {
            userId: true,
            whatsappNumber: true,
          },
        })
      : [];

    const whatsappMap = new Map(
      applicationData.map((a) => [a.userId, a.whatsappNumber])
    );

    // Default to first course or selected course
    const selectedCourseId = searchParams.course || courseAssignments[0]?.id;
    const selectedCourse = courseAssignments.find((ca) => ca.id === selectedCourseId);

    // Calculate total unique students
    const allStudentIds = new Set(
      courseAssignments.flatMap((ca) => ca.enrollments.map((e) => e.studentId))
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Students</h1>
            <p className="text-muted-foreground">
              {allStudentIds.size} unique students across {courseAssignments.length} courses
            </p>
          </div>
        </div>

        {courseAssignments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                No courses assigned to you this semester.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Course Selector */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2">
                  {courseAssignments.map((ca) => (
                    <a
                      key={ca.id}
                      href={`/students?course=${ca.id}`}
                      className={`inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                        ca.id === selectedCourseId
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-accent"
                      }`}
                    >
                      {ca.course.code}
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {ca.enrollments.length}
                      </Badge>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Students Table */}
            {selectedCourse && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {selectedCourse.course.code} — {selectedCourse.course.title}
                    </CardTitle>
                    <Badge variant="outline">
                      {selectedCourse.enrollments.length} students
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedCourse.enrollments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No students enrolled in this course.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left bg-muted/50">
                            <th className="p-3 font-medium">#</th>
                            <th className="p-3 font-medium">Name</th>
                            <th className="p-3 font-medium">Student ID</th>
                            <th className="p-3 font-medium">Program</th>
                            <th className="p-3 font-medium">Contact</th>
                            <th className="p-3 font-medium text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedCourse.enrollments.map((enrollment, index) => {
                            const student = enrollment.student;
                            const whatsapp = whatsappMap.get(student.userId) || null;
                            const phone = student.user.phone;

                            return (
                              <tr
                                key={enrollment.id}
                                className="border-b last:border-0 hover:bg-muted/30"
                              >
                                <td className="p-3 text-muted-foreground">
                                  {index + 1}
                                </td>
                                <td className="p-3">
                                  <p className="font-medium">{student.user.fullName}</p>
                                </td>
                                <td className="p-3 font-mono text-xs">
                                  {student.studentId}
                                </td>
                                <td className="p-3 text-muted-foreground">
                                  {student.program.code}
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    {/* Email */}
                                    <a
                                      href={`mailto:${student.user.email}`}
                                      title={student.user.email}
                                      className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                    >
                                      <Mail className="h-3.5 w-3.5" />
                                    </a>

                                    {/* Phone */}
                                    {phone && (
                                      <a
                                        href={`tel:${phone}`}
                                        title={phone}
                                        className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                                      >
                                        <Phone className="h-3.5 w-3.5" />
                                      </a>
                                    )}

                                    {/* WhatsApp */}
                                    {whatsapp && (
                                      <a
                                        href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={`WhatsApp: ${whatsapp}`}
                                        className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                      >
                                        <MessageCircle className="h-3.5 w-3.5" />
                                      </a>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 text-center">
                                  <Badge
                                    variant="outline"
                                    className="capitalize text-xs"
                                  >
                                    {enrollment.status}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick WhatsApp Group Message */}
            {selectedCourse && selectedCourse.enrollments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    Quick Communication
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border p-4 space-y-2">
                      <h4 className="text-sm font-medium">Email All Students</h4>
                      <p className="text-xs text-muted-foreground">
                        Send an email to all {selectedCourse.enrollments.length} students in this course
                      </p>
                      <a
                        href={`mailto:${selectedCourse.enrollments.map((e) => e.student.user.email).join(",")}`}
                        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 transition-colors"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        Compose Email
                      </a>
                    </div>

                    <div className="rounded-lg border p-4 space-y-2">
                      <h4 className="text-sm font-medium">WhatsApp Broadcast</h4>
                      <p className="text-xs text-muted-foreground">
                        Copy all WhatsApp numbers to create a broadcast list
                      </p>
                      <button
                        onClick={() => {}}
                        id="copy-whatsapp-btn"
                        className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Copy Numbers
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    );
  } catch {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Students</h1>
        <Card className="border-destructive">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <p className="text-muted-foreground">Failed to load students. Please refresh the page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
}
