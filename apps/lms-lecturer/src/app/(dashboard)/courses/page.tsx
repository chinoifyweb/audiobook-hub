import { Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { BookOpen, Users, FileText, ClipboardCheck, FileQuestion } from "lucide-react";
import Link from "next/link";
import { requireLecturer, getLecturerCourseAssignments } from "@/lib/auth";

export default async function CoursesPage() {
  const lecturer = await requireLecturer();
  const courseAssignments = await getLecturerCourseAssignments(lecturer.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Courses</h1>
        <p className="text-muted-foreground">
          Courses assigned to you this semester
        </p>
      </div>

      {courseAssignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              No courses assigned to you this semester.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courseAssignments.map((ca) => (
            <Link key={ca.id} href={`/courses/${ca.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Badge variant="secondary" className="mb-2">
                      {ca.course.code}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {ca.course.creditUnits} Credits
                    </Badge>
                  </div>
                  <CardTitle className="text-lg leading-tight">
                    {ca.course.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>{ca.enrollments.length} Students</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      <span>{ca.materials.length} Materials</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ClipboardCheck className="h-3.5 w-3.5" />
                      <span>{ca.assignments.length} Assignments</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileQuestion className="h-3.5 w-3.5" />
                      <span>{ca.testExams.length} Tests</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
