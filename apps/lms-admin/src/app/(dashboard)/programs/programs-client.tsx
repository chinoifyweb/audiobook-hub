"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { Edit, Loader2, X } from "lucide-react";

interface Program {
  id: string;
  name: string;
  code: string;
  degreeType: string;
  durationSemesters: number;
  totalCredits: number;
  tuitionPerSemester: number;
  isActive: boolean;
  department: { name: string };
  _count: { students: number; courses: number };
}

interface Props {
  programs: Program[];
}

export function ProgramsClient({ programs }: Props) {
  const router = useRouter();
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingProgram) return;
    setEditLoading(true);
    setEditError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      id: editingProgram.id,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      durationSemesters: formData.get("durationSemesters") as string,
      totalCredits: formData.get("totalCredits") as string,
      tuitionPerSemester: Math.round(parseFloat(formData.get("tuitionPerSemester") as string) * 100).toString(),
      isActive: formData.get("isActive") === "true",
    };

    try {
      const res = await fetch("/api/programs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const result = await res.json();
        setEditError(result.error || "Failed to update program");
        return;
      }
      setEditingProgram(null);
      setSuccess("Program updated successfully");
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

      <div className="rounded-md border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Name</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Code</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Degree</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Department</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Duration</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Tuition/Sem</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Students</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Active</th>
              <th className="h-10 px-4 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {programs.length === 0 ? (
              <tr>
                <td colSpan={9} className="h-24 text-center text-muted-foreground">
                  No programs found. Create one to get started.
                </td>
              </tr>
            ) : (
              programs.map((program) => (
                <tr key={program.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{program.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{program.code}</td>
                  <td className="px-4 py-3 capitalize">{program.degreeType.replace("_", " ")}</td>
                  <td className="px-4 py-3">{program.department.name}</td>
                  <td className="px-4 py-3">{program.durationSemesters} semesters</td>
                  <td className="px-4 py-3">
                    {"\u20A6"}{(program.tuitionPerSemester / 100).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{program._count.students}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${program.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {program.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Edit Program"
                        onClick={() => setEditingProgram(program)}
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
      {editingProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Edit Program: {editingProgram.code}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setEditingProgram(null); setEditError(""); }}>
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
                  <Label htmlFor="edit-name">Program Name *</Label>
                  <Input id="edit-name" name="name" defaultValue={editingProgram.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <textarea
                    id="edit-description"
                    name="description"
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-durationSemesters">Duration (semesters)</Label>
                    <Input id="edit-durationSemesters" name="durationSemesters" type="number" min="1" defaultValue={editingProgram.durationSemesters} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-totalCredits">Total Credits</Label>
                    <Input id="edit-totalCredits" name="totalCredits" type="number" min="1" defaultValue={editingProgram.totalCredits} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-tuitionPerSemester">Tuition/Semester ({"\u20A6"})</Label>
                    <Input id="edit-tuitionPerSemester" name="tuitionPerSemester" type="number" min="0" step="0.01" defaultValue={(editingProgram.tuitionPerSemester / 100).toFixed(2)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-isActive">Status</Label>
                    <select id="edit-isActive" name="isActive" defaultValue={editingProgram.isActive ? "true" : "false"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={editLoading}>
                    {editLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setEditingProgram(null); setEditError(""); }}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
