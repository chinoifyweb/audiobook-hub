"use client";

import { useState } from "react";
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
  Eye,
  EyeOff,
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

export function StudentsClient({ students: initialStudents, programs }: Props) {
  const router = useRouter();
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
                <td colSpan={7} className="h-24 text-center text-muted-foreground">
                  {search ? "No students match your search." : "No students found."}
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.id} className={`border-b hover:bg-muted/50 ${student.status === "suspended" ? "opacity-60" : ""}`}>
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
