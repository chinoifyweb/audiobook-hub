"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, Badge, Separator } from "@repo/ui";
import {
  Plus, Loader2, Edit, ShieldOff, ShieldCheck, KeyRound,
  Copy, Check, Eye, EyeOff, X, Search, UserX, UserCheck
} from "lucide-react";

interface Lecturer {
  id: string;
  staffId: string;
  title: string | null;
  specialization: string | null;
  isActive: boolean;
  user: { fullName: string | null; email: string };
  department: { name: string; code: string };
}

interface Props {
  lecturers: Lecturer[];
  departments: Array<{ id: string; name: string; code: string }>;
}

function generatePassword(length = 10): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
  let pw = "";
  for (let i = 0; i < length; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)];
  }
  return pw;
}

export function LecturersClient({ lecturers: initialLecturers, departments }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");

  // Auto-generated password
  const [generatedPassword, setGeneratedPassword] = useState(generatePassword());
  const [showPassword, setShowPassword] = useState(true);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [createdLecturerInfo, setCreatedLecturerInfo] = useState<{
    name: string; email: string; password: string; staffId: string;
  } | null>(null);

  // Edit modal
  const [editingLecturer, setEditingLecturer] = useState<Lecturer | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Action modal (suspend/activate/reset password)
  const [actionLecturer, setActionLecturer] = useState<Lecturer | null>(null);
  const [actionType, setActionType] = useState<"suspend" | "activate" | "reset-password" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [resetPassword, setResetPassword] = useState(generatePassword());

  function copyPassword(pw: string) {
    navigator.clipboard.writeText(pw);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 3000);
  }

  function regeneratePassword() {
    const pw = generatePassword();
    setGeneratedPassword(pw);
    setCopiedPassword(false);
  }

  // Filter lecturers
  const filteredLecturers = initialLecturers.filter((lec) => {
    const matchSearch =
      !search ||
      lec.user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      lec.user.email.toLowerCase().includes(search.toLowerCase()) ||
      lec.staffId.toLowerCase().includes(search.toLowerCase()) ||
      lec.department.name.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && lec.isActive) ||
      (statusFilter === "suspended" && !lec.isActive);

    return matchSearch && matchStatus;
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData(e.currentTarget);
    const data = {
      fullName: formData.get("fullName") as string,
      email: formData.get("email") as string,
      password: generatedPassword,
      departmentId: formData.get("departmentId") as string,
      title: formData.get("title") as string,
      specialization: formData.get("specialization") as string,
    };

    try {
      const res = await fetch("/api/lecturers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Failed to create lecturer");
        return;
      }
      setCreatedLecturerInfo({
        name: data.fullName,
        email: data.email,
        password: generatedPassword,
        staffId: result.staffId,
      });
      setShowForm(false);
      setGeneratedPassword(generatePassword());
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingLecturer) return;
    setEditLoading(true);
    setEditError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      fullName: formData.get("fullName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      departmentId: formData.get("departmentId") as string,
      title: formData.get("title") as string,
      specialization: formData.get("specialization") as string,
    };

    try {
      const res = await fetch(`/api/lecturers/${editingLecturer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const result = await res.json();
        setEditError(result.error || "Failed to update");
        return;
      }
      setEditingLecturer(null);
      setSuccess("Lecturer updated successfully");
      setTimeout(() => setSuccess(""), 4000);
      router.refresh();
    } catch {
      setEditError("An unexpected error occurred");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleAction() {
    if (!actionLecturer || !actionType) return;
    setActionLoading(true);

    const body: any = { action: actionType };
    if (actionType === "reset-password") {
      body.newPassword = resetPassword;
    }

    try {
      const res = await fetch(`/api/lecturers/${actionLecturer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const result = await res.json();
        setError(result.error || "Action failed");
        return;
      }

      if (actionType === "reset-password") {
        setCreatedLecturerInfo({
          name: actionLecturer.user.fullName || "",
          email: actionLecturer.user.email,
          password: resetPassword,
          staffId: actionLecturer.staffId,
        });
      }

      setSuccess(
        actionType === "suspend"
          ? `${actionLecturer.user.fullName} has been suspended`
          : actionType === "activate"
            ? `${actionLecturer.user.fullName} has been activated`
            : `Password reset for ${actionLecturer.user.fullName}`
      );
      setTimeout(() => setSuccess(""), 4000);
      setActionLecturer(null);
      setActionType(null);
      setResetPassword(generatePassword());
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setActionLoading(false);
    }
  }

  const activeCount = initialLecturers.filter((l) => l.isActive).length;
  const suspendedCount = initialLecturers.filter((l) => !l.isActive).length;

  return (
    <>
      {/* Success/Info Messages */}
      {success && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          {success}
        </div>
      )}

      {/* Credentials Card (shown after create or password reset) */}
      {createdLecturerInfo && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-blue-800 text-lg">Lecturer Login Credentials</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setCreatedLecturerInfo(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-blue-700">
              Share these credentials with <strong>{createdLecturerInfo.name}</strong>. They can change their password from the lecturer dashboard settings.
            </p>
            <div className="rounded-lg bg-white border p-4 space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Staff ID:</span>
                <span className="font-bold">{createdLecturerInfo.staffId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span>{createdLecturerInfo.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Password:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{createdLecturerInfo.password}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => copyPassword(createdLecturerInfo.password)}
                  >
                    {copiedPassword ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Portal:</span>
                <span>lts.bba.org.ng</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                const text = `Lecturer Login Credentials\n\nName: ${createdLecturerInfo.name}\nStaff ID: ${createdLecturerInfo.staffId}\nEmail: ${createdLecturerInfo.email}\nPassword: ${createdLecturerInfo.password}\nPortal: https://lts.bba.org.ng\n\nPlease change your password after first login.`;
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

      {/* Stats + Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm">{initialLecturers.length} Total</Badge>
          <Badge className="bg-green-100 text-green-800 text-sm">{activeCount} Active</Badge>
          {suspendedCount > 0 && (
            <Badge variant="destructive" className="text-sm">{suspendedCount} Suspended</Badge>
          )}
        </div>
        <Button onClick={() => { setShowForm(!showForm); setCreatedLecturerInfo(null); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Lecturer
        </Button>
      </div>

      {/* Add Lecturer Form */}
      {showForm && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>New Lecturer</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input id="fullName" name="fullName" placeholder="e.g. Dr. John Doe" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" name="email" type="email" placeholder="john@bba.org.ng" required />
                </div>
              </div>

              {/* Auto-generated Password */}
              <div className="space-y-2">
                <Label>Auto-Generated Password</Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={generatedPassword}
                      readOnly
                      type={showPassword ? "text" : "password"}
                      className="pr-10 font-mono bg-muted"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => copyPassword(generatedPassword)}>
                    {copiedPassword ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={regeneratePassword}>
                    <KeyRound className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This password will be shown once after creation. The lecturer can change it from their dashboard.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="departmentId">Department *</Label>
                  <select id="departmentId" name="departmentId" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <select id="title" name="title" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select</option>
                    <option value="Mr.">Mr.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Dr.">Dr.</option>
                    <option value="Prof.">Prof.</option>
                    <option value="Rev.">Rev.</option>
                    <option value="Pastor">Pastor</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input id="specialization" name="specialization" placeholder="e.g. New Testament Studies" />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Lecturer
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, staff ID, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full sm:w-40"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Lecturers Table */}
      <div className="rounded-md border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Name</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Staff ID</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Department</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Title</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Specialization</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Status</th>
              <th className="h-10 px-4 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLecturers.length === 0 ? (
              <tr>
                <td colSpan={7} className="h-24 text-center text-muted-foreground">
                  {search ? "No lecturers match your search." : "No lecturers found."}
                </td>
              </tr>
            ) : (
              filteredLecturers.map((lec) => (
                <tr key={lec.id} className={`border-b hover:bg-muted/50 ${!lec.isActive ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{lec.user.fullName}</p>
                      <p className="text-xs text-muted-foreground">{lec.user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{lec.staffId}</td>
                  <td className="px-4 py-3">{lec.department.name}</td>
                  <td className="px-4 py-3">{lec.title || "—"}</td>
                  <td className="px-4 py-3">{lec.specialization || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${lec.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {lec.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Edit"
                        onClick={() => setEditingLecturer(lec)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Reset Password"
                        onClick={() => {
                          setActionLecturer(lec);
                          setActionType("reset-password");
                          setResetPassword(generatePassword());
                        }}
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      {lec.isActive ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          title="Suspend"
                          onClick={() => {
                            setActionLecturer(lec);
                            setActionType("suspend");
                          }}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                          title="Activate"
                          onClick={() => {
                            setActionLecturer(lec);
                            setActionType("activate");
                          }}
                        >
                          <UserCheck className="h-4 w-4" />
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

      {/* Edit Modal */}
      {editingLecturer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Edit Lecturer</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setEditingLecturer(null); setEditError(""); }}>
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
                  <Label>Staff ID</Label>
                  <Input value={editingLecturer.staffId} disabled className="bg-muted font-mono" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-fullName">Full Name *</Label>
                    <Input id="edit-fullName" name="fullName" defaultValue={editingLecturer.user.fullName || ""} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email *</Label>
                    <Input id="edit-email" name="email" type="email" defaultValue={editingLecturer.user.email} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input id="edit-phone" name="phone" type="tel" placeholder="+234..." />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-departmentId">Department *</Label>
                    <select id="edit-departmentId" name="departmentId" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      {departments.map((d) => (
                        <option key={d.id} value={d.id} selected={d.code === editingLecturer.department.code}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Title</Label>
                    <select id="edit-title" name="title" defaultValue={editingLecturer.title || ""} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">Select</option>
                      <option value="Mr.">Mr.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Dr.">Dr.</option>
                      <option value="Prof.">Prof.</option>
                      <option value="Rev.">Rev.</option>
                      <option value="Pastor">Pastor</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-specialization">Specialization</Label>
                  <Input id="edit-specialization" name="specialization" defaultValue={editingLecturer.specialization || ""} />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={editLoading}>
                    {editLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setEditingLecturer(null); setEditError(""); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {actionLecturer && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {actionType === "suspend" && "Suspend Lecturer"}
                  {actionType === "activate" && "Activate Lecturer"}
                  {actionType === "reset-password" && "Reset Password"}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setActionLecturer(null); setActionType(null); }}>
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
                      <p className="font-medium text-red-800">{actionLecturer.user.fullName}</p>
                      <p className="text-sm text-red-600">
                        This will prevent them from logging into the lecturer portal and accessing any courses.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="destructive" onClick={handleAction} disabled={actionLoading}>
                      {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Suspend Lecturer
                    </Button>
                    <Button variant="outline" onClick={() => { setActionLecturer(null); setActionType(null); }}>Cancel</Button>
                  </div>
                </>
              )}

              {actionType === "activate" && (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                    <UserCheck className="h-8 w-8 text-green-600 shrink-0" />
                    <div>
                      <p className="font-medium text-green-800">{actionLecturer.user.fullName}</p>
                      <p className="text-sm text-green-600">
                        This will restore their access to the lecturer portal and all assigned courses.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button className="bg-green-600 hover:bg-green-700" onClick={handleAction} disabled={actionLoading}>
                      {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Activate Lecturer
                    </Button>
                    <Button variant="outline" onClick={() => { setActionLecturer(null); setActionType(null); }}>Cancel</Button>
                  </div>
                </>
              )}

              {actionType === "reset-password" && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Reset password for <strong>{actionLecturer.user.fullName}</strong> ({actionLecturer.user.email})
                  </p>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={resetPassword}
                        readOnly
                        className="font-mono bg-muted"
                      />
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
                    <Button variant="outline" onClick={() => { setActionLecturer(null); setActionType(null); }}>Cancel</Button>
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
