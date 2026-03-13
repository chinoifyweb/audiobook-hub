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
} from "@repo/ui";
import { Plus, Loader2 } from "lucide-react";

interface Course {
  id: string;
  code: string;
  title: string;
  creditUnits: number;
  semesterNumber: number;
  isElective: boolean;
  department: { name: string; code: string } | null;
  program: { name: string; code: string } | null;
}

interface Props {
  courses: Course[];
  programs: Array<{ id: string; name: string; code: string }>;
  departments: Array<{ id: string; name: string; code: string }>;
}

export function CoursesClient({ courses, programs, departments }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      code: formData.get("code") as string,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      departmentId: formData.get("departmentId") as string,
      programId: (formData.get("programId") as string) || null,
      creditUnits: parseInt(formData.get("creditUnits") as string, 10),
      semesterNumber: parseInt(formData.get("semesterNumber") as string, 10),
      isElective: formData.get("isElective") === "true",
    };

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const result = await res.json();
        setError(result.error || "Failed to create course");
        return;
      }
      setShowForm(false);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Course
        </Button>
      </div>

      {showForm && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>New Course</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">Course Code</Label>
                  <Input id="code" name="code" placeholder="e.g. BIB101" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" placeholder="e.g. Introduction to the Bible" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="departmentId">Department</Label>
                  <select id="departmentId" name="departmentId" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="programId">Program (optional)</Label>
                  <select id="programId" name="programId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">General / No specific program</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="creditUnits">Credit Units</Label>
                  <Input id="creditUnits" name="creditUnits" type="number" min="1" max="10" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semesterNumber">Semester #</Label>
                  <Input id="semesterNumber" name="semesterNumber" type="number" min="1" max="20" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isElective">Elective?</Label>
                  <select id="isElective" name="isElective" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Course
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="rounded-md border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Code</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Title</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Department</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Program</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Credits</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Semester #</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Type</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 ? (
              <tr>
                <td colSpan={7} className="h-24 text-center text-muted-foreground">
                  No courses found.
                </td>
              </tr>
            ) : (
              courses.map((course) => (
                <tr key={course.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3 font-mono text-xs">{course.code}</td>
                  <td className="px-4 py-3 font-medium">{course.title}</td>
                  <td className="px-4 py-3">{course.department?.name || "—"}</td>
                  <td className="px-4 py-3">{course.program?.code || "—"}</td>
                  <td className="px-4 py-3">{course.creditUnits}</td>
                  <td className="px-4 py-3">{course.semesterNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${course.isElective ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                      {course.isElective ? "Elective" : "Core"}
                    </span>
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
