"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { Loader2, CheckCircle } from "lucide-react";

interface GradeData {
  id: string;
  testScore: unknown;
  examScore: unknown;
  assignmentScore: unknown;
  totalScore: unknown;
  letterGrade: string | null;
  isReleased: boolean;
  student: {
    studentId: string;
    user: { fullName: string | null };
  };
  courseEnrollment: {
    courseAssignment: {
      course: { code: string; title: string };
    };
  };
  semester: {
    id: string;
    name: string;
    session: { name: string };
  };
}

interface SemesterData {
  id: string;
  name: string;
  session: { name: string };
}

interface Props {
  semesters: SemesterData[];
  grades: GradeData[];
}

export function ResultsClient({ semesters, grades }: Props) {
  const router = useRouter();
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredGrades =
    selectedSemester === "all"
      ? grades
      : grades.filter((g) => g.semester.id === selectedSemester);

  const unreleasedCount = filteredGrades.filter((g) => !g.isReleased).length;

  async function handleReleaseAll() {
    if (selectedSemester === "all") return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "release", semesterId: selectedSemester }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to release results");
        return;
      }
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Semesters</option>
          {semesters.map((s) => (
            <option key={s.id} value={s.id}>
              {s.session.name} - {s.name}
            </option>
          ))}
        </select>

        {selectedSemester !== "all" && unreleasedCount > 0 && (
          <Button onClick={handleReleaseAll} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Release All ({unreleasedCount})
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="rounded-md border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Student</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Course</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Semester</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Test</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Exam</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Assignment</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Total</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Grade</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Released</th>
            </tr>
          </thead>
          <tbody>
            {filteredGrades.length === 0 ? (
              <tr>
                <td colSpan={9} className="h-24 text-center text-muted-foreground">
                  No grades found for this selection.
                </td>
              </tr>
            ) : (
              filteredGrades.map((grade) => (
                <tr key={grade.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{grade.student.user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{grade.student.studentId}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs">{grade.courseEnrollment.courseAssignment.course.code}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {grade.semester.session.name} - {grade.semester.name}
                  </td>
                  <td className="px-4 py-3">{String(grade.testScore)}</td>
                  <td className="px-4 py-3">{String(grade.examScore)}</td>
                  <td className="px-4 py-3">{String(grade.assignmentScore)}</td>
                  <td className="px-4 py-3 font-medium">{String(grade.totalScore)}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold">{grade.letterGrade || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    {grade.isReleased ? (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                        Released
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
