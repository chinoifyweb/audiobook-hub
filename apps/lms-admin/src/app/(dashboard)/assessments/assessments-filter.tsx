"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
} from "lucide-react";
import { format } from "date-fns";

interface Assessment {
  id: string;
  title: string;
  type: string;
  courseCode: string;
  courseTitle: string;
  courseId: string;
  lecturerName: string | null;
  lecturerId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  totalMarks: number;
  isPublished: boolean;
  totalStudents: number;
  attemptCount: number;
  gradedCount: number;
  passedCount: number;
  completionRate: number;
  isActive: boolean;
  isOverdue: boolean;
}

interface Props {
  assessments: Assessment[];
  courses: { id: string; code: string; title: string }[];
  lecturers: { id: string; name: string }[];
}

export function AssessmentsFilter({ assessments, courses, lecturers }: Props) {
  const [courseFilter, setCourseFilter] = useState("all");
  const [lecturerFilter, setLecturerFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = assessments.filter((a) => {
    if (courseFilter !== "all" && a.courseId !== courseFilter) return false;
    if (lecturerFilter !== "all" && a.lecturerId !== lecturerFilter) return false;
    if (typeFilter !== "all" && a.type !== typeFilter) return false;
    if (statusFilter === "active" && !a.isActive) return false;
    if (statusFilter === "overdue" && !a.isOverdue) return false;
    if (statusFilter === "draft" && a.isPublished) return false;
    return true;
  });

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
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

        <select
          value={lecturerFilter}
          onChange={(e) => setLecturerFilter(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Lecturers</option>
          {lecturers.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Types</option>
          <option value="test">Test (CA)</option>
          <option value="exam">Exam</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active Now</option>
          <option value="overdue">Overdue</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Assessments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assessments ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No assessments match the selected filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-3 text-left font-medium text-muted-foreground">Assessment</th>
                    <th className="h-10 px-3 text-left font-medium text-muted-foreground">Course</th>
                    <th className="h-10 px-3 text-left font-medium text-muted-foreground">Lecturer</th>
                    <th className="h-10 px-3 text-left font-medium text-muted-foreground">Schedule</th>
                    <th className="h-10 px-3 text-center font-medium text-muted-foreground">Completion</th>
                    <th className="h-10 px-3 text-center font-medium text-muted-foreground">Graded</th>
                    <th className="h-10 px-3 text-center font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id} className={`border-b hover:bg-muted/50 ${a.isOverdue ? "bg-yellow-50/50" : ""}`}>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{a.title}</span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {a.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {a.totalMarks} marks | {a.durationMinutes} min
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-mono text-xs">{a.courseCode}</span>
                      </td>
                      <td className="px-3 py-3 text-xs">
                        {a.lecturerName}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(a.startTime), "MMM d")} -{" "}
                          {format(new Date(a.endTime), "MMM d")}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-3 w-3" />
                          <span className="text-xs">
                            {a.attemptCount}/{a.totalStudents}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({a.completionRate}%)
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center text-xs">
                        {a.gradedCount}/{a.attemptCount}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {!a.isPublished && (
                          <Badge variant="secondary" className="text-xs">Draft</Badge>
                        )}
                        {a.isActive && (
                          <Badge className="text-xs bg-green-100 text-green-700">Active</Badge>
                        )}
                        {a.isOverdue && (
                          <Badge className="text-xs bg-yellow-100 text-yellow-700">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Overdue
                          </Badge>
                        )}
                        {!a.isActive && !a.isOverdue && a.isPublished && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" /> Completed
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
