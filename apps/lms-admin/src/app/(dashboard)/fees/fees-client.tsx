"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { Plus, Loader2, Edit, X, Download, Upload, CheckSquare } from "lucide-react";
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

export function FeesClient({ tuitionFees, programs, semesters }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit modal
  const [editingFee, setEditingFee] = useState<TuitionFeeData | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Batch edit modal
  const [showBatchEdit, setShowBatchEdit] = useState(false);
  const [batchEditLoading, setBatchEditLoading] = useState(false);

  // CSV Import
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importData, setImportData] = useState<string[][]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: number; messages: string[] } | null>(null);

  // Bulk update
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [bulkUpdateLoading, setBulkUpdateLoading] = useState(false);

  const allSelected = tuitionFees.length > 0 && selectedIds.size === tuitionFees.length;

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
      setSelectedIds(new Set(tuitionFees.map((f) => f.id)));
    }
  }

  // Export CSV
  function handleExport() {
    const dataToExport = selectedIds.size > 0
      ? tuitionFees.filter((f) => selectedIds.has(f.id))
      : tuitionFees;

    const rows = dataToExport.map((f) => ({
      program: f.program.name,
      code: f.program.code,
      semester: `${f.semester.session.name} - ${f.semester.name}`,
      amount: (f.amount / 100).toFixed(2),
      dueDate: format(new Date(f.dueDate), "yyyy-MM-dd"),
      status: f.isActive ? "Active" : "Inactive",
    }));

    exportToCSV(
      rows,
      "fees",
      ["Program", "Code", "Semester", "Amount (N)", "Due Date", "Status"],
      ["program", "code", "semester", "amount", "dueDate", "status"]
    );
  }

  // CSV Import handler
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

      const res = await fetch("/api/fees/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      const result = await res.json();
      if (res.ok) {
        setImportResult(result);
        if (result.success > 0) {
          router.refresh();
        }
      } else {
        setError(result.error || "Import failed");
      }
    } catch {
      setError("Import failed unexpectedly");
    } finally {
      setImportLoading(false);
    }
  }

  // Batch edit handler
  async function handleBatchEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBatchEditLoading(true);

    const formData = new FormData(e.currentTarget);
    const amount = formData.get("amount") as string;
    const dueDate = formData.get("dueDate") as string;
    const isActive = formData.get("isActive") as string;

    const ids = Array.from(selectedIds);
    let successCount = 0;
    let errorCount = 0;

    for (const id of ids) {
      try {
        const data: Record<string, unknown> = { id };
        if (amount) data.amount = Math.round(parseFloat(amount) * 100);
        if (dueDate) data.dueDate = dueDate;
        if (isActive) data.isActive = isActive === "true";

        const res = await fetch("/api/fees", {
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

    setShowBatchEdit(false);
    setSelectedIds(new Set());
    setSuccess(`Batch edit complete: ${successCount} updated, ${errorCount} failed`);
    setTimeout(() => setSuccess(""), 4000);
    router.refresh();
    setBatchEditLoading(false);
  }

  // Bulk update by percentage/fixed
  async function handleBulkUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBulkUpdateLoading(true);

    const formData = new FormData(e.currentTarget);
    const mode = formData.get("mode") as string;
    const value = parseFloat(formData.get("value") as string);
    const targetDegree = formData.get("targetDegree") as string;

    const feesToUpdate = tuitionFees.filter((f) => {
      if (targetDegree === "all") return true;
      return f.program.code.startsWith(targetDegree);
    });

    let successCount = 0;
    let errorCount = 0;

    for (const fee of feesToUpdate) {
      try {
        let newAmount: number;
        if (mode === "percentage") {
          newAmount = Math.round(fee.amount * (1 + value / 100));
        } else {
          newAmount = Math.round(value * 100);
        }

        const res = await fetch("/api/fees", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: fee.id, amount: newAmount }),
        });
        if (res.ok) successCount++;
        else errorCount++;
      } catch {
        errorCount++;
      }
    }

    setShowBulkUpdate(false);
    setSuccess(`Bulk update: ${successCount} updated, ${errorCount} failed`);
    setTimeout(() => setSuccess(""), 4000);
    router.refresh();
    setBulkUpdateLoading(false);
  }

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
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
          <button className="ml-2 underline" onClick={() => setError("")}>Dismiss</button>
        </div>
      )}

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
        <Button variant="outline" size="sm" onClick={() => setShowBulkUpdate(true)}>
          <CheckSquare className="mr-2 h-4 w-4" />
          Bulk Update Amount
        </Button>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground font-medium">{selectedIds.size} selected</span>
            <Button size="sm" onClick={() => setShowBatchEdit(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Selected
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              const data = tuitionFees.filter(f => selectedIds.has(f.id));
              const rows = data.map((f) => ({
                program: f.program.name,
                code: f.program.code,
                semester: `${f.semester.session.name} - ${f.semester.name}`,
                amount: (f.amount / 100).toFixed(2),
                dueDate: format(new Date(f.dueDate), "yyyy-MM-dd"),
                status: f.isActive ? "Active" : "Inactive",
              }));
              exportToCSV(rows, "fees_selected", ["Program", "Code", "Semester", "Amount (N)", "Due Date", "Status"], ["program", "code", "semester", "amount", "dueDate", "status"]);
            }}>
              <Download className="mr-2 h-4 w-4" />
              Export Selected
            </Button>
          </div>
        )}
        <div className="ml-auto">
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Set Fee
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
                  {importResult.success} fee(s) imported successfully, {importResult.errors} error(s).
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
                  Expected columns: program_code, semester (session - semester), amount, due_date, description
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

      {/* Bulk Update Modal */}
      {showBulkUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Bulk Update Amounts</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowBulkUpdate(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBulkUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="targetDegree">Target Programs</Label>
                  <select id="targetDegree" name="targetDegree" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="all">All Programs</option>
                    <option value="BA">BA Programs</option>
                    <option value="MA">MA Programs</option>
                    <option value="PGD">PGD Programs</option>
                    <option value="MDIV">MDiv Programs</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mode">Update Mode</Label>
                  <select id="mode" name="mode" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="percentage">By Percentage (%)</option>
                    <option value="fixed">Set Fixed Amount</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Value</Label>
                  <Input id="value" name="value" type="number" step="0.01" required placeholder="e.g. 10 for 10% increase, or fixed amount" />
                  <p className="text-xs text-muted-foreground">For percentage: positive = increase, negative = decrease</p>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={bulkUpdateLoading}>
                    {bulkUpdateLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Apply Update
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowBulkUpdate(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Batch Edit Modal */}
      {showBatchEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Edit {selectedIds.size} Selected Fees</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowBatchEdit(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBatchEdit} className="space-y-4">
                <p className="text-sm text-muted-foreground">Leave fields blank to keep current values.</p>
                <div className="space-y-2">
                  <Label htmlFor="batch-amount">New Amount ({"\u20A6"})</Label>
                  <Input id="batch-amount" name="amount" type="number" min="0" step="0.01" placeholder="Leave blank to keep current" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch-dueDate">New Due Date</Label>
                  <Input id="batch-dueDate" name="dueDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch-isActive">Status</Label>
                  <select id="batch-isActive" name="isActive" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Keep current</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={batchEditLoading}>
                    {batchEditLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update {selectedIds.size} Fees
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowBatchEdit(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

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
              <th className="h-10 px-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-gray-300"
                />
              </th>
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
              <tr><td colSpan={8} className="h-24 text-center text-muted-foreground">No fee structures found.</td></tr>
            ) : (
              tuitionFees.map((fee) => (
                <tr key={fee.id} className={`border-b hover:bg-muted/50 ${selectedIds.has(fee.id) ? "bg-primary/5" : ""}`}>
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(fee.id)}
                      onChange={() => toggleSelect(fee.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
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
