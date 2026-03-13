"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { Loader2, Plus } from "lucide-react";

export function SettingsClient() {
  const router = useRouter();
  const [showFacultyForm, setShowFacultyForm] = useState(false);
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleCreateFaculty(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "faculty",
          name: formData.get("name"),
          code: formData.get("code"),
          description: formData.get("description"),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create faculty");
        return;
      }
      setSuccess("Faculty created successfully");
      setShowFacultyForm(false);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDepartment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "department",
          facultyId: formData.get("facultyId"),
          name: formData.get("name"),
          code: formData.get("code"),
          description: formData.get("description"),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create department");
        return;
      }
      setSuccess("Department created successfully");
      setShowDeptForm(false);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {success && <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">{success}</div>}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => { setShowFacultyForm(!showFacultyForm); setShowDeptForm(false); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Faculty
        </Button>
        <Button variant="outline" onClick={() => { setShowDeptForm(!showDeptForm); setShowFacultyForm(false); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </div>

      {showFacultyForm && (
        <Card className="max-w-lg">
          <CardHeader><CardTitle>Create Faculty</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreateFaculty} className="space-y-4">
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Faculty Name</Label>
                  <Input id="name" name="name" placeholder="e.g. Faculty of Theology" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Code</Label>
                  <Input id="code" name="code" placeholder="e.g. THEO" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowFacultyForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showDeptForm && (
        <Card className="max-w-lg">
          <CardHeader><CardTitle>Create Department</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="facultyId">Faculty ID</Label>
                <Input id="facultyId" name="facultyId" placeholder="Faculty CUID" required />
                <p className="text-xs text-muted-foreground">Get from the database or API</p>
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Department Name</Label>
                  <Input id="name" name="name" placeholder="e.g. Biblical Studies" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Code</Label>
                  <Input id="code" name="code" placeholder="e.g. BIB" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowDeptForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
