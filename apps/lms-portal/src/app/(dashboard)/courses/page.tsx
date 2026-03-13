import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { BookOpen, User, Clock } from "lucide-react";
import Link from "next/link";

export default async function CoursesPage() {
  const { studentProfile } = await requireStudent();

  const activeSemester = await prisma.semester.findFirst({
    where: { isActive: true },
    include: { session: true },
  });

  const enrollments = activeSemester
    ? await prisma.courseEnrollment.findMany({
        where: {
          studentId: studentProfile.id,
          semesterId: activeSemester.id,
        },
        include: {
          courseAssignment: {
            include: {
              course: true,
              lecturer: {
                include: {
                  user: { select: { fullName: true } },
                },
              },
            },
          },
        },
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Courses</h1>
        <p className="text-muted-foreground">
          {activeSemester
            ? `${activeSemester.session.name} - ${activeSemester.name}`
            : "No active semester"}
        </p>
      </div>

      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              You are not enrolled in any courses this semester.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment) => {
            const { course, lecturer } = enrollment.courseAssignment;
            return (
              <Link
                key={enrollment.id}
                href={`/courses/${enrollment.courseAssignment.id}`}
              >
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {course.code}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {course.creditUnits} units
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-2">{course.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>
                          {lecturer.title ? `${lecturer.title} ` : ""}
                          {lecturer.user.fullName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Semester {course.semesterNumber}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
