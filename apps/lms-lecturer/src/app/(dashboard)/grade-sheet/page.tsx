"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Input,
} from "@repo/ui";
import { Loader2, Save, Table2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface CourseOption {
  id: string;
  course: { code: string; title: string };
}

interface StudentGrade {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  testScore: number;
  examScore: number;
  assignmentScore: number;
  totalScore: number;
  letterGrade: string;
  gradeId: string | null;
}

function calculateLetterGrade(total: number): string {
  if (total >= 70) return "A";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
  if (total >= 45) return "D";
  if (total >= 40) return "E";
  return "F";
}

function calculateGradePoint(grade: string): number {
  switch (grade) {
    case "A": return 5.0;
    case "B": return 4.0;
    case "C": return 3.0;
    case "D": return 2.0;
    case "E": return 1.0;
    case "F": return 0.0;
    default: return 0.0;
  }
}

function GradeSheetPageContent() {
  const searchParams = useSearchParams();
  const preselectedCourse = searchParams.get("course");

  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>(preselectedCourse || "");
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch courses
  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch("/api/grades/submit?action=courses");
        if (res.ok) {
          const data = await res.json();
          setCourses(data);
          if (preselectedCourse) {
            setSelectedCourse(preselectedCourse);
          } else if (data.length > 0) {
            setSelectedCourse(data[0].id);
          }
        }
      } catch {
        setError("Failed to load courses");
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, [preselectedCourse]);

  // Fetch grades when course changes
  const fetchGrades = useCallback(async () => {
    if (!selectedCourse) return;
    setLoadingGrades(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(
        `/api/grades/submit?action=grades&courseAssignmentId=${selectedCourse}`
      );
      if (res.ok) {
        const data = await res.json();
        setGrades(data);
      } else {
        throw new Error("Failed to load grades");
      }
    } catch {
      setError("Failed to load grade data");
    } finally {
      setLoadingGrades(false);
    }
  }, [selectedCourse]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  function updateScore(
    index: number,
    field: "testScore" | "examScore" | "assignmentScore",
    value: number
  ) {
    setGrades((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Auto-compute total and letter grade
      const total =
        (field === "testScore" ? value : updated[index].testScore) +
        (field === "examScore" ? value : updated[index].examScore) +
        (field === "assignmentScore" ? value : updated[index].assignmentScore);

      updated[index].totalScore = total;
      updated[index].letterGrade = calculateLetterGrade(total);

      return updated;
    });
  }

  async function handleSubmit() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/grades/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseAssignmentId: selectedCourse,
          grades: grades.map((g) => ({
            enrollmentId: g.enrollmentId,
            studentId: g.studentId,
            testScore: g.testScore,
            examScore: g.examScore,
            assignmentScore: g.assignmentScore,
            totalScore: g.totalScore,
            letterGrade: g.letterGrade,
            gradePoint: calculateGradePoint(g.letterGrade),
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save grades");
      }

      setSuccess("Grades saved successfully!");
      await fetchGrades();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Grade Sheet</h1>
        <p className="text-muted-foreground">
          Enter and manage student grades for your courses
        </p>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Table2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">No courses assigned.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Course Selector */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                {courses.map((ca) => (
                  <button
                    key={ca.id}
                    onClick={() => setSelectedCourse(ca.id)}
                    className={`inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                      ca.id === selectedCourse
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-accent"
                    }`}
                  >
                    {ca.course.code}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {/* Grade Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Student Grades{" "}
                {grades.length > 0 && (
                  <span className="text-muted-foreground font-normal text-sm">
                    ({grades.length} students)
                  </span>
                )}
              </CardTitle>
              <Button
                onClick={handleSubmit}
                disabled={saving || grades.length === 0}
                className="gap-1.5"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Submit Grades
              </Button>
            </CardHeader>
            <CardContent>
              {loadingGrades ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : grades.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No enrolled students found for this course.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium">#</th>
                        <th className="pb-2 font-medium">Student</th>
                        <th className="pb-2 font-medium">ID</th>
                        <th className="pb-2 font-medium text-center w-28">
                          Test Score
                        </th>
                        <th className="pb-2 font-medium text-center w-28">
                          Exam Score
                        </th>
                        <th className="pb-2 font-medium text-center w-28">
                          Assignment
                        </th>
                        <th className="pb-2 font-medium text-center w-20">
                          Total
                        </th>
                        <th className="pb-2 font-medium text-center w-20">
                          Grade
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {grades.map((g, index) => (
                        <tr key={g.enrollmentId} className="border-b last:border-0">
                          <td className="py-2 text-muted-foreground">
                            {index + 1}
                          </td>
                          <td className="py-2 font-medium">{g.studentName}</td>
                          <td className="py-2 text-muted-foreground text-xs">
                            {g.studentNumber}
                          </td>
                          <td className="py-2">
                            <Input
                              type="number"
                              value={g.testScore}
                              onChange={(e) =>
                                updateScore(
                                  index,
                                  "testScore",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              min={0}
                              max={100}
                              step={0.5}
                              className="h-8 text-center w-24 mx-auto"
                            />
                          </td>
                          <td className="py-2">
                            <Input
                              type="number"
                              value={g.examScore}
                              onChange={(e) =>
                                updateScore(
                                  index,
                                  "examScore",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              min={0}
                              max={100}
                              step={0.5}
                              className="h-8 text-center w-24 mx-auto"
                            />
                          </td>
                          <td className="py-2">
                            <Input
                              type="number"
                              value={g.assignmentScore}
                              onChange={(e) =>
                                updateScore(
                                  index,
                                  "assignmentScore",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              min={0}
                              max={100}
                              step={0.5}
                              className="h-8 text-center w-24 mx-auto"
                            />
                          </td>
                          <td className="py-2 text-center font-bold">
                            {g.totalScore.toFixed(1)}
                          </td>
                          <td className="py-2 text-center">
                            <Badge
                              variant={
                                g.letterGrade === "F" ? "destructive" : "default"
                              }
                              className="text-xs"
                            >
                              {g.letterGrade}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Legend */}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground font-medium mb-2">
                      Grading Scale:
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>A: 70-100 (5.0)</span>
                      <span>B: 60-69 (4.0)</span>
                      <span>C: 50-59 (3.0)</span>
                      <span>D: 45-49 (2.0)</span>
                      <span>E: 40-44 (1.0)</span>
                      <span>F: 0-39 (0.0)</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default function GradeSheetPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GradeSheetPageContent />
    </Suspense>
  );
}
