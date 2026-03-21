"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from "@repo/ui";
import { Plus, Loader2, Trash2, Search, X, AlertTriangle } from "lucide-react";

interface Assignment {
  id: string;
  courseId: string;
  lecturerId: string;
  semesterId: string;
  isActive: boolean;
  course: { id: string; code: string; title: string; creditUnits: number };
  lecturer: {
    id: string;
    staffId: string;
    user: { fullName: string | null; email: string };
  };
  semester: {
    id: string;
    name: string;
    isActive: boolean;
    session: { name: string };
  };
  _count: { enrollments: number };
}

interface Course {
  id: string;
  code: string;
  title: string;
}

interface Lecturer {
  id: string;
  staffId: string;
  user: { fullName: string | null };
}

interface Semester {
  id: string;
  name: string;
  isActive: boolean;
  session: { name: string };
}

interface Props {
  assignments: Assignment[];
  courses: Course[];
  lecturers: Lecturer[];
  semesters: Semester[];
}

export function AssignmentsClient({
  assignments: initialAssignments,
  courses,
  lecturers,
  semesters,
}: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [semesterFilter, setSemesterFilter] = useState<string>("all");

  // Remove confirmation
  const [removingAssignment, setRemovingAssignment] =
    useState<Assignment | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  // Find active semester for default selection
  const activeSemester = semesters.find((s) => s.isActive);

  // Filter assignments
  const filteredAssignments = initialAssignments.filter((a) => {
    const matchSearch =
      !search ||
      a.course.code.toLowerCase().includes(search.toLowerCase()) ||
      a.course.title.toLowerCase().includes(search.toLowerCase()) ||
      a.lecturer.user.fullName
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      a.lecturer.staffId.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && a.isActive) ||
      (statusFilter === "inactive" && !a.isActive);

    const matchSemester =
      semesterFilter === "all" || a.semesterId === semesterFilter;

    return matchSearch && matchStatus && matchSemester;
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData(e.currentTarget);
    const data = {
      courseId: formData.get("courseId") as string,
      lecturerId: formData.get("lecturerId") as string,
      semesterId: formData.get("semesterId") as string,
    };

    if (!data.courseId || !data.lecturerId || !data.semesterId) {
      setError("Please select a course, lecturer, and semester");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/course-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Failed to assign course");
        return;
      }
      setSuccess("Course assigned successfully");
      setShowForm(false);
      setTimeout(() => setSuccess(""), 4000);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    if (!removingAssignment) return;
    setRemoveLoading(true);

    try {
      const res = await fetch(
        `/api/course-assignments?id=${removingAssignment.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const result = await res.json();
        setError(result.error || "Failed to remove assignment");
        return;
      }
      setSuccess("Course assignment removed");
      setTimeout(() => setSuccess(""), 4000);
      setRemovingAssignment(null);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setRemoveLoading(false);
    }
  }

  const activeCount = initialAssignments.filter((a) => a.isActive).length;
  const inactiveCount = initialAssignments.filter((a) => !a.isActive).length;

  return (
    <>
      {/* Success Message */}
      {success && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && !showForm && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
          <button
            className="ml-2 underline"
            onClick={() => setError("")}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stats + Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm">
            {initialAssignments.length} Total
          </Badge>
          <Badge className="bg-green-100 text-green-800 text-sm">
            {activeCount} Active
          </Badge>
          {inactiveCount > 0 && (
            <Badge variant="destructive" className="text-sm">
              {inactiveCount} Inactive
            </Badge>
          )}
        </div>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            setError("");
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Assign Course
        </Button>
      </div>

      {/* Assign Course Form */}
      {showForm && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Assign Course to Lecturer</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="courseId">Course *</Label>
                <select
                  id="courseId"
                  name="courseId"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lecturerId">Lecturer *</Label>
                <select
                  id="lecturerId"
                  name="lecturerId"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a lecturer</option>
                  {lecturers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.user.fullName || "Unnamed"} ({l.staffId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="semesterId">Semester *</Label>
                <select
                  id="semesterId"
                  name="semesterId"
                  required
                  defaultValue={activeSemester?.id || ""}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a semester</option>
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.session.name} - {s.name}
                      {s.isActive ? " (Active)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Assign Course
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by course code, title, or lecturer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={semesterFilter}
          onChange={(e) => setSemesterFilter(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full sm:w-56"
        >
          <option value="all">All Semesters</option>
          {semesters.map((s) => (
            <option key={s.id} value={s.id}>
              {s.session.name} - {s.name}
              {s.isActive ? " (Active)" : ""}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | "active" | "inactive")
          }
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full sm:w-40"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Assignments Table */}
      <div className="rounded-md border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                Course Code
              </th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                Course Title
              </th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                Lecturer
              </th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                Semester
              </th>
              <th className="h-10 px-4 text-center font-medium text-muted-foreground">
                Students
              </th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                Status
              </th>
              <th className="h-10 px-4 text-right font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAssignments.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  {search || semesterFilter !== "all"
                    ? "No assignments match your search."
                    : "No course assignments found. Click 'Assign Course' to get started."}
                </td>
              </tr>
            ) : (
              filteredAssignments.map((a) => (
                <tr
                  key={a.id}
                  className={`border-b hover:bg-muted/50 ${!a.isActive ? "opacity-60" : ""}`}
                >
                  <td className="px-4 py-3 font-mono text-xs font-medium">
                    {a.course.code}
                  </td>
                  <td className="px-4 py-3">{a.course.title}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">
                        {a.lecturer.user.fullName || "Unnamed"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.lecturer.staffId}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p>{a.semester.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.semester.session.name}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="secondary">
                      {a._count.enrollments}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        a.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {a.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      {a.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          title="Remove Assignment"
                          onClick={() => setRemovingAssignment(a)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Remove Confirmation Modal */}
      {removingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Remove Assignment</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRemovingAssignment(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <AlertTriangle className="h-8 w-8 text-amber-600 shrink-0" />
                <div>
                  <p className="font-medium text-amber-800">
                    {removingAssignment.course.code} -{" "}
                    {removingAssignment.course.title}
                  </p>
                  <p className="text-sm text-amber-600">
                    Assigned to{" "}
                    <strong>
                      {removingAssignment.lecturer.user.fullName}
                    </strong>
                  </p>
                  {removingAssignment._count.enrollments > 0 && (
                    <p className="text-sm text-amber-700 mt-1">
                      This assignment has{" "}
                      {removingAssignment._count.enrollments} enrolled
                      student(s).
                    </p>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                This will deactivate the course assignment. The lecturer will
                no longer see this course in their dashboard.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  onClick={handleRemove}
                  disabled={removeLoading}
                >
                  {removeLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Remove Assignment
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setRemovingAssignment(null)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
