import { prisma } from "@repo/db";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { Users } from "lucide-react";
import { requireLecturer, getActiveSemester } from "@/lib/auth";

interface Props {
  searchParams: { course?: string };
}

export default async function StudentsPage({ searchParams }: Props) {
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

  // Get all course assignments for this lecturer
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
              user: { select: { fullName: true, email: true } },
              program: true,
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

  // Default to first course or selected course
  const selectedCourseId = searchParams.course || courseAssignments[0]?.id;
  const selectedCourse = courseAssignments.find((ca) => ca.id === selectedCourseId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Students</h1>
        <p className="text-muted-foreground">
          View enrolled students across your courses
        </p>
      </div>

      {courseAssignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">No courses assigned.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Course Selector - rendered as links for server component */}
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
                    {ca.course.code} ({ca.enrollments.length})
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Students Table */}
          {selectedCourse && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedCourse.course.code} - {selectedCourse.course.title}{" "}
                  ({selectedCourse.enrollments.length} students)
                </CardTitle>
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
                        <tr className="border-b text-left">
                          <th className="pb-2 font-medium">#</th>
                          <th className="pb-2 font-medium">Name</th>
                          <th className="pb-2 font-medium">Student ID</th>
                          <th className="pb-2 font-medium">Email</th>
                          <th className="pb-2 font-medium">Program</th>
                          <th className="pb-2 font-medium text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCourse.enrollments.map((enrollment, index) => (
                          <tr
                            key={enrollment.id}
                            className="border-b last:border-0"
                          >
                            <td className="py-2 text-muted-foreground">
                              {index + 1}
                            </td>
                            <td className="py-2 font-medium">
                              {enrollment.student.user.fullName}
                            </td>
                            <td className="py-2">
                              {enrollment.student.studentId}
                            </td>
                            <td className="py-2 text-muted-foreground">
                              {enrollment.student.user.email}
                            </td>
                            <td className="py-2 text-muted-foreground">
                              {enrollment.student.program.code}
                            </td>
                            <td className="py-2 text-center">
                              <Badge
                                variant="outline"
                                className="capitalize text-xs"
                              >
                                {enrollment.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
