"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { AlertTriangle } from "lucide-react";

interface GradeRecord {
  id: string;
  studentId: string;
  studentName: string | null;
  email: string | null;
  programCode: string;
  programId: string;
  courseCode: string;
  courseTitle: string;
  courseId: string;
  semester: string;
  semesterId: string;
  testScore: number;
  examScore: number;
  assignmentScore: number;
  totalScore: number;
  letterGrade: string | null;
  isReleased: boolean;
}

interface Props {
  grades: GradeRecord[];
  semesters: { id: string; label: string }[];
  programs: { id: string; code: string; name: string }[];
  courses: { id: string; code: string; title: string }[];
}

export function GradesClient({ grades, semesters, programs, courses }: Props) {
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState(false);

  const filtered = grades.filter((g) => {
    if (semesterFilter !== "all" && g.semesterId !== semesterFilter) return false;
    if (programFilter !== "all" && g.programId !== programFilter) return false;
    if (courseFilter !== "all" && g.courseId !== courseFilter) return false;
    if (riskFilter && g.totalScore >= 40) return false;
    return true;
  });

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={semesterFilter}
          onChange={(e) => setSemesterFilter(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Semesters</option>
          {semesters.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          value={programFilter}
          onChange={(e) => setProgramFilter(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Programs</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} - {p.name}
            </option>
          ))}
        </select>

        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} - {c.title}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={riskFilter}
            onChange={(e) => setRiskFilter(e.target.checked)}
            className="h-4 w-4 rounded"
          />
          <span className="text-sm flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
            At Risk Only
          </span>
        </label>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Grade Records ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No grades match the selected filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-3 text-left font-medium text-muted-foreground">
                      Student
                    </th>
                    <th className="h-10 px-3 text-left font-medium text-muted-foreground">
                      Program
                    </th>
                    <th className="h-10 px-3 text-left font-medium text-muted-foreground">
                      Course
                    </th>
                    <th className="h-10 px-3 text-left font-medium text-muted-foreground">
                      Semester
                    </th>
                    <th className="h-10 px-3 text-center font-medium text-muted-foreground">
                      Test
                    </th>
                    <th className="h-10 px-3 text-center font-medium text-muted-foreground">
                      Exam
                    </th>
                    <th className="h-10 px-3 text-center font-medium text-muted-foreground">
                      Assign
                    </th>
                    <th className="h-10 px-3 text-center font-medium text-muted-foreground">
                      Total
                    </th>
                    <th className="h-10 px-3 text-center font-medium text-muted-foreground">
                      Grade
                    </th>
                    <th className="h-10 px-3 text-center font-medium text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((g) => {
                    const isAtRisk = g.totalScore > 0 && g.totalScore < 40;
                    return (
                      <tr
                        key={g.id}
                        className={`border-b hover:bg-muted/50 ${
                          isAtRisk ? "bg-yellow-50/50" : ""
                        }`}
                      >
                        <td className="px-3 py-3">
                          <p className="font-medium">{g.studentName}</p>
                          <p className="text-xs text-muted-foreground">
                            {g.studentId}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-xs">{g.programCode}</td>
                        <td className="px-3 py-3">
                          <p className="font-mono text-xs">{g.courseCode}</p>
                        </td>
                        <td className="px-3 py-3 text-xs">{g.semester}</td>
                        <td className="px-3 py-3 text-center">
                          {g.testScore.toFixed(1)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {g.examScore.toFixed(1)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {g.assignmentScore.toFixed(1)}
                        </td>
                        <td className="px-3 py-3 text-center font-semibold">
                          {g.totalScore.toFixed(1)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {g.letterGrade ? (
                            <Badge
                              variant="outline"
                              className={
                                isAtRisk
                                  ? "bg-red-50 text-red-700"
                                  : ""
                              }
                            >
                              {g.letterGrade}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {g.isReleased ? (
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
