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
  Clock,
  XCircle,
  Upload,
  AlertCircle,
  Award,
  Heart,
  Users,
  Sparkles,
  Zap,
  Church,
} from "lucide-react";
import { uploadDocument } from "@/lib/supabase";

interface ScholarshipType {
  key: string;
  name: string;
  description: string;
  discount: string;
  icon: React.ReactNode;
  requiresMinistry: boolean;
  requiresChurch: boolean;
}

const SCHOLARSHIP_TYPES: ScholarshipType[] = [
  {
    key: "merit",
    name: "Merit Scholarship",
    description: "For students with outstanding academic performance (CGPA 4.50+)",
    discount: "25-50% off tuition",
    icon: <Award className="h-5 w-5 text-yellow-500" />,
    requiresMinistry: false,
    requiresChurch: false,
  },
  {
    key: "ministry",
    name: "Ministry Scholarship",
    description: "For students with 5+ years of active ministry service",
    discount: "30-50% off tuition",
    icon: <Church className="h-5 w-5 text-purple-500" />,
    requiresMinistry: true,
    requiresChurch: true,
  },
  {
    key: "women_in_ministry",
    name: "Women in Ministry",
    description: "For female students actively engaged in ministry work",
    discount: "25-40% off tuition",
    icon: <Heart className="h-5 w-5 text-pink-500" />,
    requiresMinistry: true,
    requiresChurch: true,
  },
  {
    key: "need_based",
    name: "Need-Based Aid",
    description: "Financial assistance based on demonstrated financial need",
    discount: "Case by case assessment",
    icon: <Sparkles className="h-5 w-5 text-blue-500" />,
    requiresMinistry: false,
    requiresChurch: false,
  },
  {
    key: "early_bird",
    name: "Early Bird Discount",
    description: "For students who make early full payment before the deadline",
    discount: "10-15% off tuition",
    icon: <Zap className="h-5 w-5 text-orange-500" />,
    requiresMinistry: false,
    requiresChurch: false,
  },
  {
    key: "group",
    name: "Group Discount",
    description: "For groups of 5+ students from the same church or organization",
    discount: "15-20% off tuition",
    icon: <Users className="h-5 w-5 text-green-500" />,
    requiresMinistry: false,
    requiresChurch: true,
  },
];

interface Application {
  id: string;
  scholarship_type: string;
  statement: string | null;
  church_name: string | null;
  pastor_name: string | null;
  ministry_years: number | null;
  documents: string[] | null;
  status: string;
  approved_percentage: number | null;
  admin_notes: string | null;
  created_at: string;
}

function statusBadge(status: string) {
  switch (status) {
    case "approved":
      return (
        <Badge className="bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Under Review
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function ScholarshipsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("");
  const [statement, setStatement] = useState("");
  const [churchName, setChurchName] = useState("");
  const [pastorName, setPastorName] = useState("");
  const [ministryYears, setMinistryYears] = useState("");
  const [documents, setDocuments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    try {
      const res = await fetch("/api/scholarships/status");
      const data = await res.json();
      setApplications(data.applications || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedType) {
      setMessage({ type: "error", text: "Please select a scholarship type" });
      return;
    }
    if (!statement.trim()) {
      setMessage({ type: "error", text: "Please provide a personal statement" });
      return;
    }

    const scholarshipDef = SCHOLARSHIP_TYPES.find((s) => s.key === selectedType);
    if (scholarshipDef?.requiresChurch && !churchName.trim()) {
      setMessage({ type: "error", text: "Please provide your church name" });
      return;
    }
    if (scholarshipDef?.requiresMinistry && !ministryYears) {
      setMessage({ type: "error", text: "Please provide years of ministry experience" });
      return;
    }

    setSubmitting(true);
    try {
      // Upload documents if any
      let uploadedDocs: string[] = [];
      if (documents.length > 0) {
        setUploading(true);
        for (const file of documents) {
          const result = await uploadDocument(file, "scholarship-documents");
          if (result) {
            uploadedDocs.push(result.url);
          }
        }
        setUploading(false);
      }

      const res = await fetch("/api/scholarships/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scholarshipType: selectedType,
          statement: statement.trim(),
          churchName: churchName.trim() || null,
          pastorName: pastorName.trim() || null,
          ministryYears: ministryYears ? parseInt(ministryYears) : null,
          documents: uploadedDocs.length > 0 ? uploadedDocs : null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Scholarship application submitted successfully!" });
        setShowForm(false);
        resetForm();
        fetchApplications();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to submit application" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to submit application" });
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  }

  function resetForm() {
    setSelectedType("");
    setStatement("");
    setChurchName("");
    setPastorName("");
    setMinistryYears("");
    setDocuments([]);
  }

  const selectedScholarship = SCHOLARSHIP_TYPES.find((s) => s.key === selectedType);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scholarships & Financial Aid</h1>
          <p className="text-muted-foreground">Apply for scholarships and track your applications</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <GraduationCap className="mr-2 h-4 w-4" />
            Apply for Scholarship
          </Button>
        )}
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-md px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {message.text}
          <button className="ml-auto text-xs underline" onClick={() => setMessage(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Available Scholarships */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="h-5 w-5" />
            Available Scholarships
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {SCHOLARSHIP_TYPES.map((scholarship) => (
              <div
                key={scholarship.key}
                className="rounded-lg border p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{scholarship.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{scholarship.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{scholarship.description}</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {scholarship.discount}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Application Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="h-5 w-5" />
              Scholarship Application Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Scholarship Type Selection */}
              <div className="space-y-2">
                <Label>Select Scholarship Type *</Label>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {SCHOLARSHIP_TYPES.map((scholarship) => (
                    <div
                      key={scholarship.key}
                      onClick={() => setSelectedType(scholarship.key)}
                      className={`cursor-pointer rounded-lg border-2 p-3 transition-all ${
                        selectedType === scholarship.key
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {scholarship.icon}
                        <span className="text-sm font-medium">{scholarship.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{scholarship.discount}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personal Statement */}
              <div className="space-y-2">
                <Label htmlFor="statement">Personal Statement / Reason for Applying *</Label>
                <textarea
                  id="statement"
                  rows={5}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Explain why you are applying for this scholarship, your background, and how it will help you..."
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                />
              </div>

              {/* Church Info (conditional) */}
              {selectedScholarship && (selectedScholarship.requiresChurch || selectedScholarship.key === "group") && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="churchName">Church / Organization Name *</Label>
                    <Input
                      id="churchName"
                      placeholder="e.g. Living Faith Church"
                      value={churchName}
                      onChange={(e) => setChurchName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pastorName">Pastor&apos;s / Leader&apos;s Name</Label>
                    <Input
                      id="pastorName"
                      placeholder="e.g. Pastor John"
                      value={pastorName}
                      onChange={(e) => setPastorName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Ministry Years (conditional) */}
              {selectedScholarship && selectedScholarship.requiresMinistry && (
                <div className="space-y-2">
                  <Label htmlFor="ministryYears">Years of Ministry Experience *</Label>
                  <Input
                    id="ministryYears"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 7"
                    value={ministryYears}
                    onChange={(e) => setMinistryYears(e.target.value)}
                  />
                </div>
              )}

              {/* Supporting Documents */}
              <div className="space-y-2">
                <Label htmlFor="documents">Supporting Documents (Optional)</Label>
                <p className="text-xs text-muted-foreground">
                  Upload recommendation letters, ministry proof, academic transcripts, etc.
                </p>
                <Input
                  id="documents"
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => setDocuments(Array.from(e.target.files || []))}
                />
                {documents.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {documents.length} file(s) selected
                  </p>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {uploading ? "Uploading documents..." : "Submit Application"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* My Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            My Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="py-6 text-center">
              <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                No scholarship applications yet. Apply above to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const scholarshipDef = SCHOLARSHIP_TYPES.find((s) => s.key === app.scholarship_type);
                return (
                  <div key={app.id} className="rounded-lg border p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {scholarshipDef?.icon || <Award className="h-5 w-5" />}
                        </div>
                        <div>
                          <h3 className="font-medium">
                            {scholarshipDef?.name || app.scholarship_type}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Applied: {new Date(app.created_at).toLocaleDateString()}
                          </p>
                          {app.statement && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {app.statement}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {statusBadge(app.status)}
                        {app.status === "approved" && app.approved_percentage && (
                          <span className="text-sm font-bold text-green-600">
                            {app.approved_percentage}% discount
                          </span>
                        )}
                      </div>
                    </div>
                    {app.admin_notes && (
                      <div className="mt-3 rounded-md bg-muted/50 p-3">
                        <p className="text-xs font-medium text-muted-foreground">Admin Response:</p>
                        <p className="text-sm mt-1">{app.admin_notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
