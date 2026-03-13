import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Separator,
} from "@repo/ui";
import { BarChart3, Download } from "lucide-react";
import Link from "next/link";

function getLetterGradeColor(grade: string | null) {
  switch (grade) {
    case "A":
      return "bg-green-100 text-green-800";
    case "B":
      return "bg-blue-100 text-blue-800";
    case "C":
      return "bg-yellow-100 text-yellow-800";
    case "D":
      return "bg-orange-100 text-orange-800";
    case "E":
    case "F":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default async function GradesPage() {
  const { studentProfile } = await requireStudent();

  const grades = await prisma.grade.findMany({
    where: {
      studentId: studentProfile.id,
      isReleased: true,
    },
    include: {
      courseEnrollment: {
        include: {
          courseAssignment: {
            include: {
              course: {
                select: { code: true, title: true, creditUnits: true },
              },
            },
          },
        },
      },
      semester: {
        include: { session: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get all semesters that have grades
  const semesters = await prisma.semester.findMany({
    where: {
      grades: {
        some: { studentId: studentProfile.id, isReleased: true },
      },
    },
    include: { session: true },
    orderBy: [
      { session: { startDate: "desc" } },
      { number: "asc" },
    ],
  });

  // Group grades by semester
  const gradesBySemester = new Map<string, typeof grades>();
  for (const grade of grades) {
    const semId = grade.semesterId;
    if (!gradesBySemester.has(semId)) {
      gradesBySemester.set(semId, []);
    }
    gradesBySemester.get(semId)!.push(grade);
  }

  // Calculate CGPA
  let totalWeightedPoints = 0;
  let totalCredits = 0;
  for (const grade of grades) {
    const credits = grade.courseEnrollment.courseAssignment.course.creditUnits;
    totalWeightedPoints += Number(grade.gradePoint) * credits;
    totalCredits += credits;
  }
  const cgpa = totalCredits > 0 ? totalWeightedPoints / totalCredits : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Grades</h1>
          <p className="text-muted-foreground">
            Academic performance and transcripts
          </p>
        </div>
        <Link
          href="/api/transcript"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Download className="h-4 w-4" />
          Download Transcript
        </Link>
      </div>

      {/* CGPA Card */}
      <Card className="bg-gradient-to-r from-primary to-blue-700 text-primary-foreground">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Cumulative Grade Point Average</p>
              <p className="text-4xl font-bold mt-1">{cgpa.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Total Credits</p>
              <p className="text-2xl font-bold mt-1">{totalCredits}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grades by Semester */}
      {semesters.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              No grades have been released yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        semesters.map((semester) => {
          const semGrades = gradesBySemester.get(semester.id) || [];

          // Calculate semester GPA
          let semPoints = 0;
          let semCredits = 0;
          for (const g of semGrades) {
            const cr = g.courseEnrollment.courseAssignment.course.creditUnits;
            semPoints += Number(g.gradePoint) * cr;
            semCredits += cr;
          }
          const semGpa = semCredits > 0 ? semPoints / semCredits : 0;

          return (
            <Card key={semester.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {semester.session.name} - {semester.name}
                  </CardTitle>
                  <Badge variant="secondary">GPA: {semGpa.toFixed(2)}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium">Code</th>
                        <th className="pb-2 font-medium">Course</th>
                        <th className="pb-2 font-medium text-center">Credits</th>
                        <th className="pb-2 font-medium text-center">Test %</th>
                        <th className="pb-2 font-medium text-center">Exam %</th>
                        <th className="pb-2 font-medium text-center">Assignment %</th>
                        <th className="pb-2 font-medium text-center">Total %</th>
                        <th className="pb-2 font-medium text-center">Grade</th>
                        <th className="pb-2 font-medium text-center">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {semGrades.map((g) => {
                        const course =
                          g.courseEnrollment.courseAssignment.course;
                        return (
                          <tr key={g.id} className="border-b last:border-0">
                            <td className="py-3 font-medium">{course.code}</td>
                            <td className="py-3">{course.title}</td>
                            <td className="py-3 text-center">
                              {course.creditUnits}
                            </td>
                            <td className="py-3 text-center">
                              {Number(g.testScore).toFixed(0)}
                            </td>
                            <td className="py-3 text-center">
                              {Number(g.examScore).toFixed(0)}
                            </td>
                            <td className="py-3 text-center">
                              {Number(g.assignmentScore).toFixed(0)}
                            </td>
                            <td className="py-3 text-center font-medium">
                              {Number(g.totalScore).toFixed(0)}
                            </td>
                            <td className="py-3 text-center">
                              <span
                                className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold ${getLetterGradeColor(g.letterGrade)}`}
                              >
                                {g.letterGrade || "-"}
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              {Number(g.gradePoint).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <Separator className="my-3" />

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Total Credits: {semCredits}
                  </span>
                  <span className="font-medium">
                    Semester GPA: {semGpa.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
