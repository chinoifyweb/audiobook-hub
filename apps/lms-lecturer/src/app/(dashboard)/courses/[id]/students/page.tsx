"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui";
import {
  ArrowLeft,
  Loader2,
  Download,
  Users,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface TestScore {
  testTitle: string;
  score: number | null;
  maxScore: number;
}

interface ExamScore {
  examTitle: string;
  score: number | null;
  maxScore: number;
}

interface AssignmentScore {
  assignmentTitle: string;
  score: number | null;
  maxScore: number;
}

interface StudentPerformance {
  studentId: string;
  name: string | null;
  email: string | null;
  grade: {
    testScore: number;
    examScore: number;
    assignmentScore: number;
    totalScore: number;
    letterGrade: string | null;
    isReleased: boolean;
  } | null;
  testScores: TestScore[];
  examScores: ExamScore[];
  assignmentScores: AssignmentScore[];
}

interface CourseInfo {
  code: string;
  title: string;
}

interface Props {
  params: { id: string };
}

export default function CourseStudentsPage({ params }: Props) {
  const courseId = params.id;
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentPerformance[]>([]);
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentPerformance | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "total">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/students`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
        setCourse(data.course);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  function toggleSort(field: "name" | "total") {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  }

  const sortedStudents = [...students].sort((a, b) => {
    let cmp = 0;
    if (sortBy === "name") {
      cmp = (a.name || "").localeCompare(b.name || "");
    } else {
      cmp = (a.grade?.totalScore || 0) - (b.grade?.totalScore || 0);
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const studentsAtRisk = students.filter(
    (s) => s.grade && s.grade.totalScore < 40
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/courses/${courseId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Student Performance</h1>
            <p className="text-muted-foreground">
              {course?.code} - {course?.title}
            </p>
          </div>
        </div>
        <a
          href={`/api/courses/${courseId}/students?format=csv`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" className="gap-1.5">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </a>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Enrolled</p>
            </div>
            <p className="text-2xl font-bold mt-1">{students.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Average Score</p>
            </div>
            <p className="text-2xl font-bold mt-1">
              {students.filter((s) => s.grade).length > 0
                ? (
                    students
                      .filter((s) => s.grade)
                      .reduce((sum, s) => sum + (s.grade?.totalScore || 0), 0) /
                    students.filter((s) => s.grade).length
                  ).toFixed(1)
                : "N/A"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <p className="text-sm text-muted-foreground">At Risk (below 40)</p>
            </div>
            <p className="text-2xl font-bold mt-1 text-yellow-600">
              {studentsAtRisk.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Enrolled Students ({students.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No students enrolled.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th
                      className="pb-2 font-medium cursor-pointer hover:text-primary"
                      onClick={() => toggleSort("name")}
                    >
                      <span className="flex items-center gap-1">
                        Student
                        {sortBy === "name" &&
                          (sortDir === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          ))}
                      </span>
                    </th>
                    <th className="pb-2 font-medium">Student ID</th>
                    <th className="pb-2 font-medium text-center">Test</th>
                    <th className="pb-2 font-medium text-center">Exam</th>
                    <th className="pb-2 font-medium text-center">Assignment</th>
                    <th
                      className="pb-2 font-medium text-center cursor-pointer hover:text-primary"
                      onClick={() => toggleSort("total")}
                    >
                      <span className="flex items-center justify-center gap-1">
                        Total
                        {sortBy === "total" &&
                          (sortDir === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          ))}
                      </span>
                    </th>
                    <th className="pb-2 font-medium text-center">Grade</th>
                    <th className="pb-2 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStudents.map((student) => {
                    const isAtRisk =
                      student.grade && student.grade.totalScore < 40;

                    return (
                      <tr
                        key={student.studentId}
                        className={`border-b last:border-0 ${
                          isAtRisk ? "bg-yellow-50/50" : ""
                        }`}
                      >
                        <td className="py-2">
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {student.email}
                            </p>
                          </div>
                        </td>
                        <td className="py-2 text-xs font-mono">
                          {student.studentId}
                        </td>
                        <td className="py-2 text-center">
                          {student.grade
                            ? student.grade.testScore.toFixed(1)
                            : "-"}
                        </td>
                        <td className="py-2 text-center">
                          {student.grade
                            ? student.grade.examScore.toFixed(1)
                            : "-"}
                        </td>
                        <td className="py-2 text-center">
                          {student.grade
                            ? student.grade.assignmentScore.toFixed(1)
                            : "-"}
                        </td>
                        <td className="py-2 text-center font-semibold">
                          {student.grade
                            ? student.grade.totalScore.toFixed(1)
                            : "-"}
                        </td>
                        <td className="py-2 text-center">
                          {student.grade?.letterGrade ? (
                            <Badge
                              variant="outline"
                              className={
                                isAtRisk
                                  ? "bg-red-50 text-red-700"
                                  : "bg-green-50 text-green-700"
                              }
                            >
                              {student.grade.letterGrade}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs"
                            onClick={() => setSelectedStudent(student)}
                          >
                            View
                          </Button>
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

      {/* Student Detail Dialog */}
      {selectedStudent && (
        <Dialog
          open={!!selectedStudent}
          onOpenChange={() => setSelectedStudent(null)}
        >
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedStudent.name} ({selectedStudent.studentId})
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Test Scores */}
              {selectedStudent.testScores.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">
                    Test Scores (CA)
                  </h4>
                  <div className="space-y-1">
                    {selectedStudent.testScores.map((t, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm border rounded px-3 py-1.5"
                      >
                        <span>{t.testTitle}</span>
                        <span className="font-medium">
                          {t.score !== null
                            ? `${t.score}/${t.maxScore}`
                            : "Not attempted"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exam Scores */}
              {selectedStudent.examScores.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Exam Scores</h4>
                  <div className="space-y-1">
                    {selectedStudent.examScores.map((e, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm border rounded px-3 py-1.5"
                      >
                        <span>{e.examTitle}</span>
                        <span className="font-medium">
                          {e.score !== null
                            ? `${e.score}/${e.maxScore}`
                            : "Not attempted"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assignment Scores */}
              {selectedStudent.assignmentScores.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">
                    Assignment Scores
                  </h4>
                  <div className="space-y-1">
                    {selectedStudent.assignmentScores.map((a, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm border rounded px-3 py-1.5"
                      >
                        <span>{a.assignmentTitle}</span>
                        <span className="font-medium">
                          {a.score !== null
                            ? `${a.score}/${a.maxScore}`
                            : "Not submitted"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Overall Grade */}
              {selectedStudent.grade && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <h4 className="text-sm font-semibold mb-2">Overall Grade</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      Test: {selectedStudent.grade.testScore.toFixed(1)}
                    </div>
                    <div>
                      Exam: {selectedStudent.grade.examScore.toFixed(1)}
                    </div>
                    <div>
                      Assignment:{" "}
                      {selectedStudent.grade.assignmentScore.toFixed(1)}
                    </div>
                    <div className="font-bold">
                      Total: {selectedStudent.grade.totalScore.toFixed(1)}
                    </div>
                  </div>
                  {selectedStudent.grade.letterGrade && (
                    <div className="mt-2">
                      <Badge
                        variant="outline"
                        className="text-lg px-3 py-1"
                      >
                        {selectedStudent.grade.letterGrade}
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
