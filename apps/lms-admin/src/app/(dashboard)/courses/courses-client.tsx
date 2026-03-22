"use client";

import { useState, useRef } from "react";
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
import { Plus, Loader2, Edit, X, Search, Download, Upload, FolderSync } from "lucide-react";

interface Course {
  id: string;
  code: string;
  title: string;
  description: string | null;
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

function exportToCSV(data: Record<string, unknown>[], filename: string, headers: string[], keys: string[]) {
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      keys
        .map((k) => {
          const val = row[k] ?? "";
          const str = String(val);
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text: string): string[][] {
  const lines = text.split("\n").filter((l) => l.trim());
  return lines.map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  });
}

export function CoursesClient({ courses, programs, departments }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [success, setSuccess] = useState("");

  // Edit modal
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Batch assign modal
  const [showBatchAssign, setShowBatchAssign] = useState(false);
  const [batchAssignLoading, setBatchAssignLoading] = useState(false);

  // CSV Import
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importData, setImportData] = useState<string[][]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: number; messages: string[] } | null>(null);

  const filteredCourses = courses.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.code.toLowerCase().includes(s) ||
      c.title.toLowerCase().includes(s) ||
      c.department?.name.toLowerCase().includes(s)
    );
  });

  const allSelected = filteredCourses.length > 0 && filteredCourses.every((c) => selectedIds.has(c.id));

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCourses.map((c) => c.id)));
    }
  }

  function handleExport() {
    const dataToExport = selectedIds.size > 0
      ? courses.filter((c) => selectedIds.has(c.id))
      : courses;

    const rows = dataToExport.map((c) => ({
      code: c.code,
      title: c.title,
      program: c.program?.code || "",
      credits: c.creditUnits,
      semester: c.semesterNumber,
      department: c.department?.name || "",
      type: c.isElective ? "Elective" : "Core",
    }));

    exportToCSV(
      rows,
      "courses",
      ["Code", "Title", "Program", "Credits", "Semester", "Department", "Type"],
      ["code", "title", "program", "credits", "semester", "department", "type"]
    );
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length < 2) {
        setError("CSV file must have a header row and at least one data row");
        return;
      }
      setImportData(rows);
      setShowImportPreview(true);
      setImportResult(null);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleImportConfirm() {
    setImportLoading(true);
    try {
      const headers = importData[0].map((h) => h.toLowerCase().replace(/\s/g, "_"));
      const rows = importData.slice(1).map((row) => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => {
          obj[h] = row[i] || "";
        });
        return obj;
      });

      const res = await fetch("/api/courses/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      const result = await res.json();
      if (res.ok) {
        setImportResult(result);
        if (result.success > 0) router.refresh();
      } else {
        setError(result.error || "Import failed");
      }
    } catch {
      setError("Import failed unexpectedly");
    } finally {
      setImportLoading(false);
    }
  }

  async function handleBatchAssign(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBatchAssignLoading(true);

    const formData = new FormData(e.currentTarget);
    const departmentId = formData.get("departmentId") as string;
    const programId = formData.get("programId") as string;

    const ids = Array.from(selectedIds);
    let successCount = 0;
    let errorCount = 0;

    for (const id of ids) {
      try {
        const data: Record<string, unknown> = { id };
        if (departmentId) data.departmentId = departmentId;
        if (programId) data.programId = programId;

        const res = await fetch("/api/courses", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) successCount++;
        else errorCount++;
      } catch {
        errorCount++;
      }
    }

    setShowBatchAssign(false);
    setSelectedIds(new Set());
    setSuccess(`Batch assign: ${successCount} updated, ${errorCount} failed`);
    setTimeout(() => setSuccess(""), 4000);
    router.refresh();
    setBatchAssignLoading(false);
  }

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
      setSuccess("Course created successfully");
      setTimeout(() => setSuccess(""), 4000);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingCourse) return;
    setEditLoading(true);
    setEditError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      id: editingCourse.id,
      code: formData.get("code") as string,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      departmentId: formData.get("departmentId") as string,
      programId: (formData.get("programId") as string) || null,
      creditUnits: formData.get("creditUnits") as string,
      semesterNumber: formData.get("semesterNumber") as string,
      isElective: formData.get("isElective") === "true",
    };

    try {
      const res = await fetch("/api/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const result = await res.json();
        setEditError(result.error || "Failed to update course");
        return;
      }
      setEditingCourse(null);
      setSuccess("Course updated successfully");
      setTimeout(() => setSuccess(""), 4000);
      router.refresh();
    } catch {
      setEditError("An unexpected error occurred");
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <>
      {success && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">{success}</div>
      )}
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
          <button className="ml-2 underline" onClick={() => setError("")}>Dismiss</button>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
          />
          {selectedIds.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground font-medium">{selectedIds.size} selected</span>
              <Button size="sm" onClick={() => setShowBatchAssign(true)}>
                <FolderSync className="mr-2 h-4 w-4" />
                Assign Selected
              </Button>
              <Button size="sm" variant="outline" onClick={() => {
                const data = courses.filter(c => selectedIds.has(c.id));
                const rows = data.map((c) => ({
                  code: c.code, title: c.title, program: c.program?.code || "",
                  credits: c.creditUnits, semester: c.semesterNumber,
                  department: c.department?.name || "", type: c.isElective ? "Elective" : "Core",
                }));
                exportToCSV(rows, "courses_selected", ["Code", "Title", "Program", "Credits", "Semester", "Department", "Type"], ["code", "title", "program", "credits", "semester", "department", "type"]);
              }}>
                <Download className="mr-2 h-4 w-4" />
                Export Selected
              </Button>
            </>
          )}
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Course
          </Button>
        </div>
      </div>

      {/* Import Preview */}
      {showImportPreview && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Import Preview</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => { setShowImportPreview(false); setImportData([]); setImportResult(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {importResult ? (
              <div className="space-y-2">
                <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
                  {importResult.success} course(s) imported, {importResult.errors} error(s).
                </div>
                {importResult.messages.length > 0 && (
                  <div className="max-h-40 overflow-y-auto text-sm space-y-1">
                    {importResult.messages.map((m, i) => (
                      <p key={i} className="text-muted-foreground">{m}</p>
                    ))}
                  </div>
                )}
                <Button variant="outline" onClick={() => { setShowImportPreview(false); setImportData([]); setImportResult(null); }}>
                  Close
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Expected columns: code, title, department, program, credits, semester, is_elective
                </p>
                <div className="rounded-md border overflow-x-auto max-h-60 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        {importData[0]?.map((h, i) => (
                          <th key={i} className="h-8 px-3 text-left font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importData.slice(1, 11).map((row, i) => (
                        <tr key={i} className="border-b">
                          {row.map((cell, j) => (
                            <td key={j} className="px-3 py-1.5">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {importData.length > 11 && (
                  <p className="text-xs text-muted-foreground">Showing first 10 of {importData.length - 1} rows</p>
                )}
                <div className="flex gap-3">
                  <Button onClick={handleImportConfirm} disabled={importLoading}>
                    {importLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm Import ({importData.length - 1} rows)
                  </Button>
                  <Button variant="outline" onClick={() => { setShowImportPreview(false); setImportData([]); }}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Batch Assign Modal */}
      {showBatchAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Assign {selectedIds.size} Courses</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowBatchAssign(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBatchAssign} className="space-y-4">
                <p className="text-sm text-muted-foreground">Assign selected courses to a department and/or program. Leave blank to keep current.</p>
                <div className="space-y-2">
                  <Label htmlFor="batch-departmentId">Department</Label>
                  <select id="batch-departmentId" name="departmentId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Keep current</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch-programId">Program</Label>
                  <select id="batch-programId" name="programId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Keep current</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={batchAssignLoading}>
                    {batchAssignLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Assign Courses
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowBatchAssign(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

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

      <div className="rounded-md border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-10 px-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Code</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Title</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Department</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Program</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Credits</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Semester #</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Type</th>
              <th className="h-10 px-4 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.length === 0 ? (
              <tr>
                <td colSpan={9} className="h-24 text-center text-muted-foreground">
                  No courses found.
                </td>
              </tr>
            ) : (
              filteredCourses.map((course) => (
                <tr key={course.id} className={`border-b hover:bg-muted/50 ${selectedIds.has(course.id) ? "bg-primary/5" : ""}`}>
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(course.id)}
                      onChange={() => toggleSelect(course.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{course.code}</td>
                  <td className="px-4 py-3 font-medium">{course.title}</td>
                  <td className="px-4 py-3">{course.department?.name || "---"}</td>
                  <td className="px-4 py-3">{course.program?.code || "---"}</td>
                  <td className="px-4 py-3">{course.creditUnits}</td>
                  <td className="px-4 py-3">{course.semesterNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${course.isElective ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                      {course.isElective ? "Elective" : "Core"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Edit Course"
                        onClick={() => setEditingCourse(course)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Edit Course</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setEditingCourse(null); setEditError(""); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEdit} className="space-y-4">
                {editError && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{editError}</div>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-code">Course Code</Label>
                    <Input id="edit-code" name="code" defaultValue={editingCourse.code} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input id="edit-title" name="title" defaultValue={editingCourse.title} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <textarea
                    id="edit-description"
                    name="description"
                    defaultValue={editingCourse.description || ""}
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-departmentId">Department</Label>
                    <select id="edit-departmentId" name="departmentId" required defaultValue={departments.find(d => d.name === editingCourse.department?.name)?.id || ""} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">Select</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-programId">Program</Label>
                    <select id="edit-programId" name="programId" defaultValue={programs.find(p => p.code === editingCourse.program?.code)?.id || ""} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">General</option>
                      {programs.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-creditUnits">Credit Units</Label>
                    <Input id="edit-creditUnits" name="creditUnits" type="number" min="1" max="10" defaultValue={editingCourse.creditUnits} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-semesterNumber">Semester #</Label>
                    <Input id="edit-semesterNumber" name="semesterNumber" type="number" min="1" max="20" defaultValue={editingCourse.semesterNumber} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-isElective">Elective?</Label>
                    <select id="edit-isElective" name="isElective" defaultValue={editingCourse.isElective ? "true" : "false"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={editLoading}>
                    {editLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setEditingCourse(null); setEditError(""); }}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
