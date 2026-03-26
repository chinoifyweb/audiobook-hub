"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  Label,
} from "@repo/ui";
import {
  CreditCard,
  Loader2,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  Banknote,
  Clock,
  X,
  AlertCircle,
  Download,
  Pencil,
  Trash2,
} from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  status: string;
  paymentMethod: string | null;
  paystackReference: string | null;
  bankName: string | null;
  bankReference: string | null;
  receiptUploadUrl: string | null;
  transferDate: string | null;
  adminNotes: string | null;
  installmentNumber: number | null;
  paymentPlan: string | null;
  paidAt: string | null;
  createdAt: string;
  student: {
    studentId: string;
    user: { fullName: string | null; email: string };
    program: { name: string; code: string };
  };
  tuitionFee: {
    amount: number;
    description: string | null;
    semester: {
      name: string;
      session: { name: string };
    };
  };
}

interface PaymentStats {
  status: string;
  _sum: { amount: number | null };
  _count: number;
}

function formatAmount(kobo: number) {
  return `\u20A6${(kobo / 100).toLocaleString()}`;
}

function statusBadge(status: string, method?: string | null) {
  if (method === "bank_transfer" && status === "pending") {
    return (
      <Badge variant="secondary" className="text-xs">
        <Clock className="h-3 w-3 mr-1" />
        Awaiting Review
      </Badge>
    );
  }
  switch (status) {
    case "successful":
      return <Badge className="bg-green-600 text-xs">Paid</Badge>;
    case "pending":
      return <Badge variant="secondary" className="text-xs">Pending</Badge>;
    case "failed":
      return <Badge variant="destructive" className="text-xs">Failed/Rejected</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
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

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats[]>([]);
  const [receiptsPending, setReceiptsPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMethod, setFilterMethod] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Manual payment form
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState({
    studentId: "",
    amount: "",
    notes: "",
  });
  const [manualLoading, setManualLoading] = useState(false);
  const [allStudents, setAllStudents] = useState<Array<{ id: string; name: string; email: string; studentId: string }>>([]);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState({ amount: "", status: "", notes: "" });
  const [editLoading, setEditLoading] = useState(false);

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchApproveLoading, setBatchApproveLoading] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchStudents();
  }, [filterStatus, filterMethod]);

  async function fetchStudents() {
    try {
      const res = await fetch("/api/students?list=true");
      const data = await res.json();
      if (Array.isArray(data)) {
        setAllStudents(data.map((s: Record<string, unknown>) => ({
          id: (s as { id: string }).id,
          name: ((s as { user?: { fullName?: string } }).user?.fullName) || "Unknown",
          email: ((s as { user?: { email?: string } }).user?.email) || "",
          studentId: ((s as { studentId?: string }).studentId) || "",
        })));
      }
    } catch {
      // ignore
    }
  }

  async function fetchPayments() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterMethod !== "all") params.set("method", filterMethod);
      if (search) params.set("search", search);

      const res = await fetch(`/api/payments?${params.toString()}`);
      const data = await res.json();
      setPayments(data.payments || []);
      setStats(data.stats || []);
      setReceiptsPending(data.receiptsPending || 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(paymentId: string, action: "approve" | "reject") {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, adminNotes }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: `Payment ${action}d successfully` });
        setSelectedPayment(null);
        setAdminNotes("");
        fetchPayments();
      } else {
        setMessage({ type: "error", text: data.error || `Failed to ${action} payment` });
      }
    } catch {
      setMessage({ type: "error", text: `Failed to ${action} payment` });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleManualPayment(e: React.FormEvent) {
    e.preventDefault();
    setManualLoading(true);
    try {
      const res = await fetch("/api/payments/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...manualForm,
          amount: Math.round(parseFloat(manualForm.amount) * 100),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Manual payment recorded successfully" });
        setShowManualForm(false);
        setManualForm({ studentId: "", amount: "", notes: "" });
        fetchPayments();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to record payment" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to record payment" });
    } finally {
      setManualLoading(false);
    }
  }

  // Batch approve
  async function handleBatchApprove() {
    setBatchApproveLoading(true);
    let successCount = 0;
    let errorCount = 0;

    const ids = Array.from(selectedIds);
    for (const id of ids) {
      try {
        const res = await fetch(`/api/payments/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approve", adminNotes: "Batch approved by admin" }),
        });
        if (res.ok) successCount++;
        else errorCount++;
      } catch {
        errorCount++;
      }
    }

    setSelectedIds(new Set());
    setMessage({ type: "success", text: `Batch approve: ${successCount} approved, ${errorCount} failed` });
    fetchPayments();
    setBatchApproveLoading(false);
  }

  // Export CSV
  function handleExport() {
    const dataToExport = selectedIds.size > 0
      ? filteredPayments.filter((p) => selectedIds.has(p.id))
      : filteredPayments;

    const rows = dataToExport.map((p) => ({
      student: p.student.user.fullName || "N/A",
      studentId: p.student.studentId,
      email: p.student.user.email,
      program: p.student.program.code,
      semester: `${p.tuitionFee.semester.session.name} - ${p.tuitionFee.semester.name}`,
      amount: (p.amount / 100).toFixed(2),
      date: p.paidAt ? new Date(p.paidAt).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString(),
      reference: p.paystackReference || p.bankReference || "-",
      status: p.status,
      method: p.paymentMethod || "paystack",
    }));

    exportToCSV(
      rows,
      "payments",
      ["Student", "Student ID", "Email", "Program", "Semester", "Amount (N)", "Date", "Reference", "Status", "Method"],
      ["student", "studentId", "email", "program", "semester", "amount", "date", "reference", "status", "method"]
    );
  }

  // Selection helpers
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const totalCollected = stats.find((s) => s.status === "successful")?._sum.amount || 0;
  const totalPending = stats.find((s) => s.status === "pending")?._sum.amount || 0;
  const paidCount = stats.find((s) => s.status === "successful")?._count || 0;

  // Filter by search
  const filteredPayments = search
    ? payments.filter(
        (p) =>
          p.student.user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          p.student.user.email.toLowerCase().includes(search.toLowerCase()) ||
          p.student.studentId.toLowerCase().includes(search.toLowerCase()) ||
          p.paystackReference?.toLowerCase().includes(search.toLowerCase()) ||
          p.bankReference?.toLowerCase().includes(search.toLowerCase())
      )
    : payments;

  const allSelected = filteredPayments.length > 0 && filteredPayments.every((p) => selectedIds.has(p.id));

  // Pending bank transfers that can be batch approved
  const pendingBankTransfers = filteredPayments.filter(
    (p) => selectedIds.has(p.id) && p.paymentMethod === "bank_transfer" && p.status === "pending"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Management</h1>
          <p className="text-muted-foreground">View and manage student payments</p>
        </div>
        <Button onClick={() => setShowManualForm(!showManualForm)}>
          <Banknote className="mr-2 h-4 w-4" />
          Record Manual Payment
        </Button>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-md px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {message.text}
          <button className="ml-auto text-xs underline" onClick={() => setMessage(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(Number(totalCollected))}</div>
            <p className="text-xs text-muted-foreground">{paidCount} payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatAmount(Number(totalPending))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Receipts Awaiting Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{receiptsPending}</div>
            <p className="text-xs text-muted-foreground">Bank transfers to verify</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCollected && totalPending
                ? `${Math.round((Number(totalCollected) / (Number(totalCollected) + Number(totalPending))) * 100)}%`
                : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Payment Form */}
      {showManualForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Record Manual Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualPayment} className="space-y-4 max-w-lg">
              <div className="space-y-2">
                <Label htmlFor="studentId">Student</Label>
                <select
                  id="studentId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={manualForm.studentId}
                  onChange={(e) => setManualForm({ ...manualForm, studentId: e.target.value })}
                  required
                >
                  <option value="">Select a student...</option>
                  {allStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.studentId} ({s.email})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Tuition fee will be auto-detected based on the student&apos;s program.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manualAmount">Amount ({"\u20A6"})</Label>
                <Input
                  id="manualAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 75000"
                  value={manualForm.amount}
                  onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manualNotes">Notes</Label>
                <Input
                  id="manualNotes"
                  placeholder="Payment notes"
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={manualLoading}>
                  {manualLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Record Payment
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowManualForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground font-medium">{selectedIds.size} selected</span>
            {pendingBankTransfers.length > 0 && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={handleBatchApprove}
                disabled={batchApproveLoading}
              >
                {batchApproveLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve {pendingBankTransfers.length} Receipt(s)
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => {
              const data = filteredPayments.filter(p => selectedIds.has(p.id));
              const rows = data.map((p) => ({
                student: p.student.user.fullName || "N/A", studentId: p.student.studentId,
                email: p.student.user.email, program: p.student.program.code,
                semester: `${p.tuitionFee.semester.session.name} - ${p.tuitionFee.semester.name}`,
                amount: (p.amount / 100).toFixed(2),
                date: p.paidAt ? new Date(p.paidAt).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString(),
                reference: p.paystackReference || p.bankReference || "-",
                status: p.status, method: p.paymentMethod || "paystack",
              }));
              exportToCSV(rows, "payments_selected", ["Student", "Student ID", "Email", "Program", "Semester", "Amount (N)", "Date", "Reference", "Status", "Method"], ["student", "studentId", "email", "program", "semester", "amount", "date", "reference", "status", "method"]);
            }}>
              <Download className="mr-2 h-4 w-4" />
              Export Selected
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, ID, reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="successful">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed/Rejected</option>
        </select>
        <select
          value={filterMethod}
          onChange={(e) => setFilterMethod(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Methods</option>
          <option value="paystack">Paystack</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="rounded-md border bg-white">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-10 px-3 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => {
                        if (allSelected) {
                          setSelectedIds(new Set());
                        } else {
                          setSelectedIds(new Set(filteredPayments.map((p) => p.id)));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Student</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Program</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Semester</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Method</th>
                  <th className="h-10 px-4 text-right font-medium text-muted-foreground">Amount</th>
                  <th className="h-10 px-4 text-center font-medium text-muted-foreground">Status</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Date</th>
                  <th className="h-10 px-4 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="h-24 text-center text-muted-foreground">
                      No payments found.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className={`border-b hover:bg-muted/50 ${selectedIds.has(payment.id) ? "bg-primary/5" : ""}`}>
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(payment.id)}
                          onChange={() => toggleSelect(payment.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{payment.student.user.fullName || "N/A"}</div>
                          <div className="text-xs text-muted-foreground">{payment.student.studentId}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">{payment.student.program.code}</td>
                      <td className="px-4 py-3 text-xs">
                        {payment.tuitionFee.semester.session.name} - {payment.tuitionFee.semester.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs">
                          {payment.paymentMethod === "bank_transfer" ? (
                            <>
                              <Banknote className="h-3 w-3" /> Bank
                            </>
                          ) : payment.paymentMethod === "manual" ? (
                            <>
                              <CreditCard className="h-3 w-3" /> Manual
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-3 w-3" /> Paystack
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatAmount(payment.amount)}</td>
                      <td className="px-4 py-3 text-center">
                        {statusBadge(payment.status, payment.paymentMethod)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {payment.paidAt
                          ? new Date(payment.paidAt).toLocaleDateString()
                          : new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="View Details"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setAdminNotes("");
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {payment.paymentMethod === "bank_transfer" && payment.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                title="Approve"
                                onClick={() => handleAction(payment.id, "approve")}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                title="Reject"
                                onClick={() => handleAction(payment.id, "reject")}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Edit Payment"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setEditingPayment({
                                amount: String(payment.amount / 100),
                                status: payment.status,
                                notes: payment.adminNotes || "",
                              });
                              setShowEditModal(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            title="Delete Payment"
                            disabled={actionLoading}
                            onClick={async () => {
                              if (!confirm("Are you sure you want to delete this payment record? This cannot be undone.")) return;
                              setActionLoading(true);
                              try {
                                const res = await fetch(`/api/payments/${payment.id}`, { method: "DELETE" });
                                if (res.ok) {
                                  setMessage({ type: "success", text: "Payment deleted" });
                                  fetchPayments();
                                } else {
                                  const data = await res.json();
                                  setMessage({ type: "error", text: data.error || "Failed to delete" });
                                }
                              } catch { setMessage({ type: "error", text: "Delete failed" }); }
                              finally { setActionLoading(false); }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payment Details</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedPayment(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Student</p>
                  <p className="font-medium">{selectedPayment.student.user.fullName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Student ID</p>
                  <p className="font-medium">{selectedPayment.student.studentId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedPayment.student.user.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Program</p>
                  <p className="font-medium">{selectedPayment.student.program.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-bold text-lg">{formatAmount(selectedPayment.amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <div className="mt-1">{statusBadge(selectedPayment.status, selectedPayment.paymentMethod)}</div>
                </div>
                <div>
                  <p className="text-muted-foreground">Method</p>
                  <p className="font-medium capitalize">{selectedPayment.paymentMethod?.replace("_", " ") || "Paystack"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reference</p>
                  <p className="font-medium text-xs">{selectedPayment.paystackReference || selectedPayment.bankReference || "-"}</p>
                </div>
                {selectedPayment.installmentNumber && (
                  <div>
                    <p className="text-muted-foreground">Installment</p>
                    <p className="font-medium">#{selectedPayment.installmentNumber}</p>
                  </div>
                )}
                {selectedPayment.bankName && (
                  <div>
                    <p className="text-muted-foreground">Bank</p>
                    <p className="font-medium">{selectedPayment.bankName}</p>
                  </div>
                )}
              </div>

              {selectedPayment.receiptUploadUrl && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Uploaded Receipt</p>
                  <a
                    href={selectedPayment.receiptUploadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Download className="h-4 w-4" />
                    View Receipt
                  </a>
                </div>
              )}

              {selectedPayment.adminNotes && (
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Admin Notes</p>
                  <p className="text-sm mt-1">{selectedPayment.adminNotes}</p>
                </div>
              )}

              {/* Actions for pending bank transfers */}
              {selectedPayment.paymentMethod === "bank_transfer" && selectedPayment.status === "pending" && (
                <div className="space-y-3 border-t pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminNotes">Admin Notes</Label>
                    <Input
                      id="adminNotes"
                      placeholder="Add notes about this payment..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      disabled={actionLoading}
                      onClick={() => handleAction(selectedPayment.id, "approve")}
                    >
                      {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve Payment
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={actionLoading}
                      onClick={() => handleAction(selectedPayment.id, "reject")}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Payment Modal */}
      {showEditModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Edit Payment</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowEditModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Amount ({"\u20A6"})</Label>
                <Input
                  type="number"
                  min="0"
                  value={editingPayment.amount}
                  onChange={(e) => setEditingPayment({ ...editingPayment, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editingPayment.status}
                  onChange={(e) => setEditingPayment({ ...editingPayment, status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="successful">Successful</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Admin Notes</Label>
                <Input
                  value={editingPayment.notes}
                  onChange={(e) => setEditingPayment({ ...editingPayment, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
                <Button
                  disabled={editLoading}
                  onClick={async () => {
                    setEditLoading(true);
                    try {
                      const res = await fetch(`/api/payments/${selectedPayment.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "edit",
                          amount: Math.round(parseFloat(editingPayment.amount) * 100),
                          status: editingPayment.status,
                          notes: editingPayment.notes,
                        }),
                      });
                      if (res.ok) {
                        setMessage({ type: "success", text: "Payment updated" });
                        setShowEditModal(false);
                        setSelectedPayment(null);
                        fetchPayments();
                      } else {
                        const data = await res.json();
                        setMessage({ type: "error", text: data.error || "Update failed" });
                      }
                    } catch { setMessage({ type: "error", text: "Update failed" }); }
                    finally { setEditLoading(false); }
                  }}
                >
                  {editLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
