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
  GraduationCap,
  Loader2,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  Clock,
  X,
  AlertCircle,
  Award,
  FileText,
  ExternalLink,
} from "lucide-react";

interface ScholarshipApplication {
  id: string;
  student_id: string;
  scholarship_type: string;
  statement: string | null;
  church_name: string | null;
  pastor_name: string | null;
  ministry_years: number | null;
  documents: string[] | null;
  status: string;
  approved_percentage: number | null;
  admin_notes: string | null;
  reviewed_by: string | null;
  created_at: string;
  student_name: string | null;
  student_email: string;
  student_number: string;
  program_name: string;
  program_code: string;
}

interface Stats {
  status: string;
  count: number;
}

const SCHOLARSHIP_LABELS: Record<string, string> = {
  merit: "Merit Scholarship",
  ministry: "Ministry Scholarship",
  women_in_ministry: "Women in Ministry",
  need_based: "Need-Based Aid",
  early_bird: "Early Bird Discount",
  group: "Group Discount",
};

function statusBadge(status: string) {
  switch (status) {
    case "approved":
      return (
        <Badge className="bg-green-600 text-xs">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive" className="text-xs">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="secondary" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}

export default function AdminScholarshipsPage() {
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [stats, setStats] = useState<Stats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState<ScholarshipApplication | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [approvedPercentage, setApprovedPercentage] = useState("30");
  const [adminNotes, setAdminNotes] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchApplications();
  }, [filterStatus, filterType]);

  async function fetchApplications() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterType !== "all") params.set("type", filterType);

      const res = await fetch(`/api/scholarships?${params.toString()}`);
      const data = await res.json();
      setApplications(data.applications || []);
      setStats(data.stats || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(appId: string, action: "approve" | "reject") {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/scholarships/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          approvedPercentage: action === "approve" ? parseInt(approvedPercentage) : 0,
          adminNotes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: `Scholarship ${action}d successfully` });
        setSelectedApp(null);
        setAdminNotes("");
        fetchApplications();
      } else {
        setMessage({ type: "error", text: data.error || `Failed to ${action}` });
      }
    } catch {
      setMessage({ type: "error", text: `Failed to ${action} application` });
    } finally {
      setActionLoading(false);
    }
  }

  const pendingCount = stats.find((s) => s.status === "pending")?.count || 0;
  const approvedCount = stats.find((s) => s.status === "approved")?.count || 0;
  const rejectedCount = stats.find((s) => s.status === "rejected")?.count || 0;

  const filteredApps = search
    ? applications.filter(
        (a) =>
          a.student_name?.toLowerCase().includes(search.toLowerCase()) ||
          a.student_email.toLowerCase().includes(search.toLowerCase()) ||
          a.student_number.toLowerCase().includes(search.toLowerCase())
      )
    : applications;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Scholarship Management</h1>
        <p className="text-muted-foreground">Review and manage scholarship applications</p>
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
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, student ID..."
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
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Types</option>
          <option value="merit">Merit</option>
          <option value="ministry">Ministry</option>
          <option value="women_in_ministry">Women in Ministry</option>
          <option value="need_based">Need-Based</option>
          <option value="early_bird">Early Bird</option>
          <option value="group">Group</option>
        </select>
      </div>

      {/* Applications Table */}
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
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Student</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Program</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Scholarship Type</th>
                  <th className="h-10 px-4 text-center font-medium text-muted-foreground">Status</th>
                  <th className="h-10 px-4 text-center font-medium text-muted-foreground">Discount</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Applied</th>
                  <th className="h-10 px-4 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="h-24 text-center text-muted-foreground">
                      No scholarship applications found.
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((app) => (
                    <tr key={app.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{app.student_name || "N/A"}</div>
                          <div className="text-xs text-muted-foreground">{app.student_number}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">{app.program_code}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs">{SCHOLARSHIP_LABELS[app.scholarship_type] || app.scholarship_type}</span>
                      </td>
                      <td className="px-4 py-3 text-center">{statusBadge(app.status)}</td>
                      <td className="px-4 py-3 text-center">
                        {app.status === "approved" && app.approved_percentage ? (
                          <span className="font-bold text-green-600">{app.approved_percentage}%</span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="View Details"
                            onClick={() => {
                              setSelectedApp(app);
                              setAdminNotes("");
                              setApprovedPercentage("30");
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {app.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                title="Approve"
                                onClick={() => {
                                  setSelectedApp(app);
                                  setAdminNotes("");
                                  setApprovedPercentage("30");
                                }}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
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

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Scholarship Application
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedApp(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Student Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Student</p>
                  <p className="font-medium">{selectedApp.student_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Student ID</p>
                  <p className="font-medium">{selectedApp.student_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedApp.student_email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Program</p>
                  <p className="font-medium">{selectedApp.program_name}</p>
                </div>
              </div>

              {/* Scholarship Info */}
              <div className="border-t pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Scholarship Type</p>
                    <p className="font-medium">
                      {SCHOLARSHIP_LABELS[selectedApp.scholarship_type] || selectedApp.scholarship_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <div className="mt-1">{statusBadge(selectedApp.status)}</div>
                  </div>
                  {selectedApp.church_name && (
                    <div>
                      <p className="text-muted-foreground">Church/Organization</p>
                      <p className="font-medium">{selectedApp.church_name}</p>
                    </div>
                  )}
                  {selectedApp.pastor_name && (
                    <div>
                      <p className="text-muted-foreground">Pastor/Leader</p>
                      <p className="font-medium">{selectedApp.pastor_name}</p>
                    </div>
                  )}
                  {selectedApp.ministry_years != null && (
                    <div>
                      <p className="text-muted-foreground">Ministry Experience</p>
                      <p className="font-medium">{selectedApp.ministry_years} years</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Applied</p>
                    <p className="font-medium">{new Date(selectedApp.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Personal Statement */}
              {selectedApp.statement && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Personal Statement</p>
                  <div className="rounded-md bg-muted/30 p-4 text-sm whitespace-pre-wrap">
                    {selectedApp.statement}
                  </div>
                </div>
              )}

              {/* Documents */}
              {selectedApp.documents && Array.isArray(selectedApp.documents) && selectedApp.documents.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Supporting Documents</p>
                  <div className="space-y-2">
                    {selectedApp.documents.map((doc, i) => (
                      <a
                        key={i}
                        href={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        Document {i + 1}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Notes (if already reviewed) */}
              {selectedApp.admin_notes && (
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Admin Notes</p>
                  <p className="text-sm mt-1">{selectedApp.admin_notes}</p>
                </div>
              )}

              {/* Action Buttons for Pending */}
              {selectedApp.status === "pending" && (
                <div className="border-t pt-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="approvedPercentage">Discount Percentage (%)</Label>
                      <Input
                        id="approvedPercentage"
                        type="number"
                        min="1"
                        max="100"
                        value={approvedPercentage}
                        onChange={(e) => setApprovedPercentage(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        How much discount to grant (1-100%)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminNotesInput">Admin Notes</Label>
                      <Input
                        id="adminNotesInput"
                        placeholder="Notes about this decision..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      disabled={actionLoading}
                      onClick={() => handleAction(selectedApp.id, "approve")}
                    >
                      {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve ({approvedPercentage}% discount)
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={actionLoading}
                      onClick={() => handleAction(selectedApp.id, "reject")}
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
    </div>
  );
}
