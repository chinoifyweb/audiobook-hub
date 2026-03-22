"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { Plus, Loader2, Edit, X } from "lucide-react";
import { format } from "date-fns";

interface TuitionFeeData {
  id: string;
  amount: number;
  description: string | null;
  dueDate: string | Date;
  isActive: boolean;
  program: { name: string; code: string };
  semester: { name: string; session: { name: string } };
  _count: { payments: number };
}

interface Props {
  tuitionFees: TuitionFeeData[];
  programs: Array<{ id: string; name: string; code: string }>;
  semesters: Array<{ id: string; name: string; session: { name: string } }>;
}

export function FeesClient({ tuitionFees, programs, semesters }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit modal
  const [editingFee, setEditingFee] = useState<TuitionFeeData | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId: formData.get("programId"),
          semesterId: formData.get("semesterId"),
          amount: Math.round(parseFloat(formData.get("amount") as string) * 100),
          description: formData.get("description"),
          dueDate: formData.get("dueDate"),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create fee");
        return;
      }
      setShowForm(false);
      setSuccess("Fee created successfully");
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
    if (!editingFee) return;
    setEditLoading(true);
    setEditError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      id: editingFee.id,
      amount: Math.round(parseFloat(formData.get("amount") as string) * 100),
      description: formData.get("description") as string,
      dueDate: formData.get("dueDate") as string,
      isActive: formData.get("isActive") === "true",
    };

    try {
      const res = await fetch("/api/fees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const result = await res.json();
        setEditError(result.error || "Failed to update fee");
        return;
      }
      setEditingFee(null);
      setSuccess("Fee updated successfully");
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

      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Set Fee
        </Button>
      </div>

      {showForm && (
        <Card className="max-w-lg">
          <CardHeader><CardTitle>Create Tuition Fee</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
              <div className="space-y-2">
                <Label htmlFor="programId">Program</Label>
                <select id="programId" name="programId" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select</option>
                  {programs.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="semesterId">Semester</Label>
                <select id="semesterId" name="semesterId" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select</option>
                  {semesters.map((s) => <option key={s.id} value={s.id}>{s.session.name} - {s.name}</option>)}
                </select>
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ({"\u20A6"})</Label>
                  <Input id="amount" name="amount" type="number" min="0" step="0.01" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input id="dueDate" name="dueDate" type="date" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" placeholder="e.g. Tuition fee for first semester" />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Fee
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="rounded-md border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Program</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Semester</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Amount</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Due Date</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Payments</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Status</th>
              <th className="h-10 px-4 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tuitionFees.length === 0 ? (
              <tr><td colSpan={7} className="h-24 text-center text-muted-foreground">No fee structures found.</td></tr>
            ) : (
              tuitionFees.map((fee) => (
                <tr key={fee.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{fee.program.code}</td>
                  <td className="px-4 py-3 text-xs">{fee.semester.session.name} - {fee.semester.name}</td>
                  <td className="px-4 py-3">{"\u20A6"}{(fee.amount / 100).toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground">{format(new Date(fee.dueDate), "MMM d, yyyy")}</td>
                  <td className="px-4 py-3">{fee._count.payments}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${fee.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {fee.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Edit Fee"
                        onClick={() => setEditingFee(fee)}
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
      {editingFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Edit Fee: {editingFee.program.code}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setEditingFee(null); setEditError(""); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEdit} className="space-y-4">
                {editError && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{editError}</div>
                )}
                <div className="text-sm text-muted-foreground mb-2">
                  {editingFee.program.code} | {editingFee.semester.session.name} - {editingFee.semester.name}
                </div>
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-amount">Amount ({"\u20A6"})</Label>
                    <Input id="edit-amount" name="amount" type="number" min="0" step="0.01" defaultValue={(editingFee.amount / 100).toFixed(2)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-dueDate">Due Date</Label>
                    <Input id="edit-dueDate" name="dueDate" type="date" defaultValue={format(new Date(editingFee.dueDate), "yyyy-MM-dd")} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Input id="edit-description" name="description" defaultValue={editingFee.description || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-isActive">Status</Label>
                  <select id="edit-isActive" name="isActive" defaultValue={editingFee.isActive ? "true" : "false"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={editLoading}>
                    {editLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setEditingFee(null); setEditError(""); }}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
