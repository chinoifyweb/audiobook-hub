"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import {
  Search,
  Edit,
  KeyRound,
  UserX,
  UserCheck,
  X,
  Loader2,
  Copy,
  Check,
  Download,
  Upload,
  ArrowUpCircle,
  Users,
} from "lucide-react";

interface Student {
  id: string;
  studentId: string;
  currentSemester: number;
  status: string;
  user: { fullName: string | null; email: string; phone: string | null };
  program: { id: string; name: string; code: string };
}

interface Program {
  id: string;
  name: string;
  code: string;
}

interface Props {
  students: Student[];
  programs: Program[];
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  suspended: "bg-red-100 text-red-800",
  graduated: "bg-blue-100 text-blue-800",
  withdrawn: "bg-gray-100 text-gray-800",
  deferred: "bg-yellow-100 text-yellow-800",
};

function generatePassword(length = 10): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
  let pw = "";
  for (let i = 0; i < length; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)];
  }
  return pw;
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

export function StudentsClient({ students: initialStudents, programs }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit modal
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Action modal (suspend/activate/reset password)
  const [actionStudent, setActionStudent] = useState<Student | null>(null);
  const [actionType, setActionType] = useState<"suspend" | "activate" | "reset-password" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [resetPassword, setResetPassword] = useState(generatePassword());
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [credentialsInfo, setCredentialsInfo] = useState<{
    name: string; email: string; password: string; studentId: string;
  } | null>(null);

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Batch actions
  const [showBatchStatus, setShowBatchStatus] = useState(false);
  const [batchStatusLoading, setBatchStatusLoading] = useState(false);
  const [showBatchSemester, setShowBatchSemester] = useState(false);
  const [batchSemesterLoading, setBatchSemesterLoading] = useState(false);

  // CSV Import
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importData, setImportData] = useState<string[][]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: number; messages: string[] } | null>(null);

  function copyPassword(pw: string) {
    navigator.clipboard.writeText(pw);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 3000);
  }

  const filteredStudents = initialStudents.filter((s) => {
    const matchSearch =
      !search ||
      s.user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.user.email.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      statusFilter === "all" || s.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const allSelected = filteredStudents.length > 0 && filteredStudents.every((s) => selectedIds.has(s.id));

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
      setSelectedIds(new Set(filteredStudents.map((s) => s.id)));
    }
  }

  // Export
  function handleExport() {
    const dataToExport = selectedIds.size > 0
      ? initialStudents.filter((s) => selectedIds.has(s.id))
      : initialStudents;

    const rows = dataToExport.map((s) => ({
      name: s.user.fullName || "",
      email: s.user.email,
      phone: s.user.phone || "",
      studentId: s.studentId,
      program: s.program.code,
      semester: s.currentSemester,
      status: s.status,
    }));

    exportToCSV(
      rows,
      "students",
      ["Name", "Email", "Phone", "Student ID", "Program", "Semester", "Status"],
      ["name", "email", "phone", "studentId", "program", "semester", "status"]
    );
  }

  // CSV Import
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

      const res = await fetch("/api/students/import", {
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

  // Batch status change
  async function handleBatchStatus(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBatchStatusLoading(true);

    const formData = new FormData(e.currentTarget);
    const newStatus = formData.get("status") as string;
    const ids = Array.from(selectedIds);
    let successCount = 0;
    let errorCount = 0;

    for (const id of ids) {
      try {
        const res = await fetch(`/api/students/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) successCount++;
        else errorCount++;
      } catch {
        errorCount++;
      }
    }

    setShowBatchStatus(false);
    setSelectedIds(new Set());
    setSuccess(`Status updated: ${successCount} students changed to "${newStatus}", ${errorCount} failed`);
    setTimeout(() => setSuccess(""), 4000);
    router.refresh();
    setBatchStatusLoading(false);
  }

  // Batch semester advance
  async function handleBatchSemester(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBatchSemesterLoading(true);

    const formData = new FormData(e.currentTarget);
    const mode = formData.get("mode") as string;
    const targetSemester = formData.get("targetSemester") as string;

    const ids = Array.from(selectedIds);
    const selectedStudents = initialStudents.filter((s) => ids.includes(s.id));
    let successCount = 0;
    let errorCount = 0;

    for (const student of selectedStudents) {
      try {
        const newSemester = mode === "advance"
          ? student.currentSemester + 1
          : parseInt(targetSemester, 10);

        const res = await fetch(`/api/students/${student.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentSemester: String(newSemester) }),
        });
        if (res.ok) successCount++;
        else errorCount++;
      } catch {
        errorCount++;
      }
    }

    setShowBatchSemester(false);
    setSelectedIds(new Set());
    setSuccess(`Semester updated: ${successCount} students, ${errorCount} failed`);
    setTimeout(() => setSuccess(""), 4000);
    router.refresh();
    setBatchSemesterLoading(false);
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingStudent) return;
    setEditLoading(true);
    setEditError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      fullName: formData.get("fullName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      programId: formData.get("programId") as string,
      currentSemester: formData.get("currentSemester") as string,
      status: formData.get("status") as string,
    };

    try {
      const res = await fetch(`/api/students/${editingStudent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const result = await res.json();
        setEditError(result.error || "Failed to update");
        return;
      }
      setEditingStudent(null);
      setSuccess("Student updated successfully");
      setTimeout(() => setSuccess(""), 4000);
      router.refresh();
    } catch {
      setEditError("An unexpected error occurred");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleAction() {
    if (!actionStudent || !actionType) return;
    setActionLoading(true);

    try {
      if (actionType === "reset-password") {
        const res = await fetch(`/api/students/${actionStudent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reset-password", newPassword: resetPassword }),
        });
        if (!res.ok) {
          const result = await res.json();
          setError(result.error || "Action failed");
          return;
        }
        setCredentialsInfo({
          name: actionStudent.user.fullName || "",
          email: actionStudent.user.email,
          password: resetPassword,
          studentId: actionStudent.studentId,
        });
        setSuccess(`Password reset for ${actionStudent.user.fullName}`);
      } else {
        const newStatus = actionType === "suspend" ? "suspended" : "active";
        const res = await fetch(`/api/students/${actionStudent.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) {
          const result = await res.json();
          setError(result.error || "Action failed");
          return;
        }
        setSuccess(
          actionType === "suspend"
            ? `${actionStudent.user.fullName} has been suspended`
            : `${actionStudent.user.fullName} has been activated`
        );
      }

      setTimeout(() => setSuccess(""), 4000);
      setActionStudent(null);
      setActionType(null);
      setResetPassword(generatePassword());
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setActionLoading(false);
    }
  }

  const activeCount = initialStudents.filter((s) => s.status === "active").length;
  const suspendedCount = initialStudents.filter((s) => s.status === "suspended").length;

  return (
    <>
      {/* Success Message */}
      {success && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
          <button className="ml-2 underline" onClick={() => setError("")}>Dismiss</button>
        </div>
      )}

      {/* Credentials Card */}
      {credentialsInfo && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-blue-800 text-lg">Student Login Credentials</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setCredentialsInfo(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-blue-700">
              Share these credentials with <strong>{credentialsInfo.name}</strong>.
            </p>
            <div className="rounded-lg bg-white border p-4 space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Student ID:</span>
                <span className="font-bold">{credentialsInfo.studentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span>{credentialsInfo.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Password:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{credentialsInfo.password}</span>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyPassword(credentialsInfo.password)}>
                    {copiedPassword ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                const text = `Student Login Credentials\n\nName: ${credentialsInfo.name}\nStudent ID: ${credentialsInfo.studentId}\nEmail: ${credentialsInfo.email}\nPassword: ${credentialsInfo.password}\n\nPlease change your password after first login.`;
                navigator.clipboard.writeText(text);
                setCopiedPassword(true);
                setTimeout(() => setCopiedPassword(false), 3000);
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              {copiedPassword ? "Copied!" : "Copy All Credentials"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Bar */}
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="text-sm">{initialStudents.length} Total</Badge>
        <Badge className="bg-green-100 text-green-800 text-sm">{activeCount} Active</Badge>
        {suspendedCount > 0 && (
          <Badge variant="destructive" className="text-sm">{suspendedCount} Suspended</Badge>
        )}
      </div>

      {/* Action Bar */}
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
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground font-medium">{selectedIds.size} selected</span>
            <Button size="sm" variant="outline" onClick={() => setShowBatchStatus(true)}>
              <Users className="mr-2 h-4 w-4" />
              Change Status
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowBatchSemester(true)}>
              <ArrowUpCircle className="mr-2 h-4 w-4" />
              Update Semester
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              const data = initialStudents.filter(s => selectedIds.has(s.id));
              const rows = data.map((s) => ({
                name: s.user.fullName || "", email: s.user.email, phone: s.user.phone || "",
                studentId: s.studentId, program: s.program.code, semester: s.currentSemester, status: s.status,
              }));
              exportToCSV(rows, "students_selected", ["Name", "Email", "Phone", "Student ID", "Program", "Semester", "Status"], ["name", "email", "phone", "studentId", "program", "semester", "status"]);
            }}>
              <Download className="mr-2 h-4 w-4" />
              Export Selected
            </Button>
          </div>
        )}
      </div>

      {/* Import Preview */}
      {showImportPreview && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Import Students Preview</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => { setShowImportPreview(false); setImportData([]); setImportResult(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {importResult ? (
              <div className="space-y-2">
                <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
                  {importResult.success} student(s) imported, {importResult.errors} error(s).
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
                  Expected columns: name (or full_name), email, program (code), phone (optional)
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

      {/* Batch Status Modal */}
      {showBatchStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Change Status ({selectedIds.size} students)</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowBatchStatus(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBatchStatus} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="batch-status">New Status</Label>
                  <select id="batch-status" name="status" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="graduated">Graduated</option>
                    <option value="withdrawn">Withdrawn</option>
                    <option value="deferred">Deferred</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={batchStatusLoading}>
                    {batchStatusLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Apply to {selectedIds.size} Students
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowBatchStatus(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Batch Semester Modal */}
      {showBatchSemester && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Update Semester ({selectedIds.size} students)</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowBatchSemester(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBatchSemester} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="batch-mode">Mode</Label>
                  <select id="batch-mode" name="mode" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="advance">Advance to next semester (+1)</option>
                    <option value="set">Set specific semester</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch-targetSemester">Target Semester (for &quot;Set specific&quot; mode)</Label>
                  <Input id="batch-targetSemester" name="targetSemester" type="number" min="1" max="20" defaultValue="1" />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={batchSemesterLoading}>
                    {batchSemesterLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update {selectedIds.size} Students
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowBatchSemester(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or student ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full sm:w-40"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="graduated">Graduated</option>
          <option value="withdrawn">Withdrawn</option>
          <option value="deferred">Deferred</option>
        </select>
      </div>

      {/* Table */}
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
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Student ID</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Name</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Email</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Program</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Semester</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Status</th>
              <th className="h-10 px-4 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={8} className="h-24 text-center text-muted-foreground">
                  {search ? "No students match your search." : "No students found."}
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.id} className={`border-b hover:bg-muted/50 ${student.status === "suspended" ? "opacity-60" : ""} ${selectedIds.has(student.id) ? "bg-primary/5" : ""}`}>
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(student.id)}
                      onChange={() => toggleSelect(student.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{student.studentId}</td>
                  <td className="px-4 py-3 font-medium">{student.user.fullName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{student.user.email}</td>
                  <td className="px-4 py-3">{student.program.code}</td>
                  <td className="px-4 py-3">{student.currentSemester}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[student.status] || ""}`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild size="sm" variant="outline" className="h-8">
                        <Link href={`/students/${student.id}`}>View</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Edit Student"
                        onClick={() => setEditingStudent(student)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Reset Password"
                        onClick={() => {
                          setActionStudent(student);
                          setActionType("reset-password");
                          setResetPassword(generatePassword());
                        }}
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      {student.status === "active" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          title="Suspend"
                          onClick={() => {
                            setActionStudent(student);
                            setActionType("suspend");
                          }}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      ) : student.status === "suspended" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                          title="Activate"
                          onClick={() => {
                            setActionStudent(student);
                            setActionType("activate");
                          }}
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Edit Student</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setEditingStudent(null); setEditError(""); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEdit} className="space-y-4">
                {editError && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{editError}</div>
                )}
                <div className="space-y-2">
                  <Label>Student ID</Label>
                  <Input value={editingStudent.studentId} disabled className="bg-muted font-mono" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-fullName">Full Name *</Label>
                    <Input id="edit-fullName" name="fullName" defaultValue={editingStudent.user.fullName || ""} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email *</Label>
                    <Input id="edit-email" name="email" type="email" defaultValue={editingStudent.user.email} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input id="edit-phone" name="phone" type="tel" defaultValue={editingStudent.user.phone || ""} placeholder="+234..." />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-programId">Program *</Label>
                    <select
                      id="edit-programId"
                      name="programId"
                      required
                      defaultValue={editingStudent.program.id}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {programs.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-currentSemester">Current Semester</Label>
                    <Input id="edit-currentSemester" name="currentSemester" type="number" min="1" max="20" defaultValue={editingStudent.currentSemester} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <select
                    id="edit-status"
                    name="status"
                    defaultValue={editingStudent.status}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="graduated">Graduated</option>
                    <option value="withdrawn">Withdrawn</option>
                    <option value="deferred">Deferred</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={editLoading}>
                    {editLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setEditingStudent(null); setEditError(""); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {actionStudent && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {actionType === "suspend" && "Suspend Student"}
                  {actionType === "activate" && "Activate Student"}
                  {actionType === "reset-password" && "Reset Password"}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setActionStudent(null); setActionType(null); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {actionType === "suspend" && (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                    <UserX className="h-8 w-8 text-red-600 shrink-0" />
                    <div>
                      <p className="font-medium text-red-800">{actionStudent.user.fullName}</p>
                      <p className="text-sm text-red-600">
                        This will prevent them from logging into the student portal.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="destructive" onClick={handleAction} disabled={actionLoading}>
                      {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Suspend Student
                    </Button>
                    <Button variant="outline" onClick={() => { setActionStudent(null); setActionType(null); }}>Cancel</Button>
                  </div>
                </>
              )}

              {actionType === "activate" && (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                    <UserCheck className="h-8 w-8 text-green-600 shrink-0" />
                    <div>
                      <p className="font-medium text-green-800">{actionStudent.user.fullName}</p>
                      <p className="text-sm text-green-600">
                        This will restore their access to the student portal.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button className="bg-green-600 hover:bg-green-700" onClick={handleAction} disabled={actionLoading}>
                      {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Activate Student
                    </Button>
                    <Button variant="outline" onClick={() => { setActionStudent(null); setActionType(null); }}>Cancel</Button>
                  </div>
                </>
              )}

              {actionType === "reset-password" && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Reset password for <strong>{actionStudent.user.fullName}</strong> ({actionStudent.user.email})
                  </p>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <div className="flex items-center gap-2">
                      <Input value={resetPassword} readOnly className="font-mono bg-muted" />
                      <Button variant="outline" size="sm" onClick={() => copyPassword(resetPassword)}>
                        {copiedPassword ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setResetPassword(generatePassword())}>
                        <KeyRound className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleAction} disabled={actionLoading}>
                      {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Reset Password
                    </Button>
                    <Button variant="outline" onClick={() => { setActionStudent(null); setActionType(null); }}>Cancel</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
