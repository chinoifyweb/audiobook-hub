"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { Loader2, UserX, UserCheck, Edit, KeyRound, Copy, Check, X } from "lucide-react";

interface Props {
  studentId: string;
  status: string;
  student: {
    fullName: string | null;
    email: string;
    phone: string | null;
    programId: string;
    programName: string;
    currentSemester: number;
    studentIdNumber: string;
  };
  programs: Array<{ id: string; name: string; code: string }>;
}

function generatePassword(length = 10): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
  let pw = "";
  for (let i = 0; i < length; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)];
  }
  return pw;
}

export function StudentActions({ studentId, status, student, programs }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Reset password
  const [showResetPw, setShowResetPw] = useState(false);
  const [resetPwLoading, setResetPwLoading] = useState(false);
  const [resetPassword, setResetPassword] = useState(generatePassword());
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  function copyPassword(pw: string) {
    navigator.clipboard.writeText(pw);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 3000);
  }

  async function handleStatusChange(newStatus: "active" | "suspended") {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update student status");
        return;
      }
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const result = await res.json();
        setEditError(result.error || "Failed to update");
        return;
      }
      setShowEdit(false);
      setSuccess("Student updated successfully");
      setTimeout(() => setSuccess(""), 4000);
      router.refresh();
    } catch {
      setEditError("An unexpected error occurred");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleResetPassword() {
    setResetPwLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-password", newPassword: resetPassword }),
      });
      if (!res.ok) {
        const result = await res.json();
        setError(result.error || "Failed to reset password");
        return;
      }
      setShowResetPw(false);
      setShowCredentials(true);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setResetPwLoading(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">{success}</div>
          )}

          {/* Credentials Card */}
          {showCredentials && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-blue-800">New Credentials</p>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowCredentials(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="font-mono text-sm space-y-1">
                <p>Email: {student.email}</p>
                <div className="flex items-center gap-2">
                  <p>Password: {resetPassword}</p>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyPassword(resetPassword)}>
                    {copiedPassword ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Button variant="outline" onClick={() => setShowEdit(true)} className="w-full">
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>

          <Button variant="outline" onClick={() => { setShowResetPw(true); setResetPassword(generatePassword()); }} className="w-full">
            <KeyRound className="mr-2 h-4 w-4" />
            Reset Password
          </Button>

          {status === "active" ? (
            <Button
              variant="destructive"
              onClick={() => handleStatusChange("suspended")}
              disabled={loading}
              className="w-full"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserX className="mr-2 h-4 w-4" />}
              Suspend Student
            </Button>
          ) : status === "suspended" ? (
            <Button
              onClick={() => handleStatusChange("active")}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
              Reactivate Student
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              No status actions available for &quot;{status}&quot; status.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Edit Student</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setShowEdit(false); setEditError(""); }}>
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
                  <Input value={student.studentIdNumber} disabled className="bg-muted font-mono" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-fullName">Full Name *</Label>
                    <Input id="edit-fullName" name="fullName" defaultValue={student.fullName || ""} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email *</Label>
                    <Input id="edit-email" name="email" type="email" defaultValue={student.email} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input id="edit-phone" name="phone" type="tel" defaultValue={student.phone || ""} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-programId">Program</Label>
                    <select
                      id="edit-programId"
                      name="programId"
                      defaultValue={student.programId}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {programs.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-currentSemester">Semester</Label>
                    <Input id="edit-currentSemester" name="currentSemester" type="number" min="1" max="20" defaultValue={student.currentSemester} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <select
                    id="edit-status"
                    name="status"
                    defaultValue={status}
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
                  <Button type="button" variant="outline" onClick={() => { setShowEdit(false); setEditError(""); }}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Reset Password</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowResetPw(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Reset password for <strong>{student.fullName}</strong> ({student.email})
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
                <Button onClick={handleResetPassword} disabled={resetPwLoading}>
                  {resetPwLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reset Password
                </Button>
                <Button variant="outline" onClick={() => setShowResetPw(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
