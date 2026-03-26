"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Separator } from "@repo/ui";
import { BookOpen, CheckCircle, Clock, Copy, FileDown, GraduationCap, Loader2, LogIn, XCircle } from "lucide-react";

interface Application {
  id: string;
  applicationNumber: string;
  trackingCode: string | null;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  program: { name: string; code: string };
  student: { studentId: string; currentSemester: number } | null;
  admissionLetterUrl: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

function statusBadgeVariant(status: string) {
  switch (status) {
    case "accepted":
      return "default" as const;
    case "rejected":
      return "destructive" as const;
    case "under_review":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function ApplicationStatusPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/application")
      .then((r) => r.json())
      .then((data) => {
        setApplications(data.applications || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function copyTrackingLink(app: Application) {
    if (!app.trackingCode) return;
    const link = `${window.location.origin}/application/track/${app.trackingCode}`;
    navigator.clipboard.writeText(link);
    setCopiedId(app.id);
    setTimeout(() => setCopiedId(null), 3000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Application Status</h1>
          <p className="text-muted-foreground">Berean Bible Academy</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : applications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                You have not submitted any applications yet.
              </p>
              <Button onClick={() => router.push("/application")}>
                Start Application
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {applications.map((app) => (
              <Card key={app.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {app.applicationNumber}
                    </CardTitle>
                    <Badge variant={statusBadgeVariant(app.status)}>
                      {statusLabel(app.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Applicant</div>
                    <div className="font-medium">{app.firstName} {app.lastName}</div>
                    <div className="text-muted-foreground">Program</div>
                    <div className="font-medium">{app.program.name} ({app.program.code})</div>
                    <div className="text-muted-foreground">Applied</div>
                    <div className="font-medium">{new Date(app.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}</div>
                  </div>

                  {/* Tracking link */}
                  {app.trackingCode && (
                    <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                      <span className="text-xs text-muted-foreground">Tracking:</span>
                      <code className="flex-1 truncate text-xs">{`${typeof window !== "undefined" ? window.location.origin : ""}/application/track/${app.trackingCode}`}</code>
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => copyTrackingLink(app)}>
                        {copiedId === app.id ? <CheckCircle className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  )}

                  <Separator />

                  {/* ACCEPTED — full admission details */}
                  {app.status === "accepted" && app.student && (
                    <div className="rounded-lg bg-green-50 border border-green-200 p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-green-100 p-2">
                          <GraduationCap className="h-6 w-6 text-green-700" />
                        </div>
                        <div>
                          <h3 className="font-bold text-green-800 text-lg">Congratulations!</h3>
                          <p className="text-sm text-green-700">Your admission to Berean Bible Academy has been approved.</p>
                        </div>
                      </div>

                      <div className="rounded-md bg-white border p-4 space-y-3">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Your Student ID</p>
                          <p className="text-xl font-bold text-primary">{app.student.studentId}</p>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-muted-foreground">Program of Study</div>
                          <div className="font-medium">{app.program.name}</div>
                          <div className="text-muted-foreground">Program Code</div>
                          <div className="font-medium">{app.program.code}</div>
                          <div className="text-muted-foreground">Current Semester</div>
                          <div className="font-medium">Semester {app.student.currentSemester}</div>
                          <div className="text-muted-foreground">Login Email</div>
                          <div className="font-medium">{app.email}</div>
                        </div>
                      </div>

                      <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                        <h4 className="font-semibold text-sm text-blue-900 mb-2">How to proceed:</h4>
                        <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                          <li>Click &ldquo;Log in to Student Portal&rdquo; below</li>
                          <li>Use your registered email ({app.email}) and password to sign in</li>
                          <li>Complete your tuition payment from the dashboard</li>
                          <li>Access your courses, materials, and class schedule</li>
                          <li>Contact support@bba.org.ng if you need any help</li>
                        </ol>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {app.admissionLetterUrl && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={app.admissionLetterUrl} target="_blank" rel="noopener noreferrer">
                              <FileDown className="mr-2 h-4 w-4" />
                              Download Admission Letter
                            </a>
                          </Button>
                        )}
                        <Button size="sm" asChild>
                          <Link href="/login">
                            <LogIn className="mr-2 h-4 w-4" />
                            Log in to Student Portal
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* REJECTED */}
                  {app.status === "rejected" && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <p className="font-medium text-red-800">Application Not Approved</p>
                      </div>
                      {app.rejectionReason && (
                        <p className="text-sm text-red-700">Reason: {app.rejectionReason}</p>
                      )}
                      <p className="text-sm text-red-600">
                        Contact admissions@bba.org.ng for more information or submit a new application.
                      </p>
                    </div>
                  )}

                  {/* PENDING */}
                  {(app.status === "submitted" || app.status === "under_review") && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-amber-600" />
                        <p className="font-medium text-amber-800">Under Review</p>
                      </div>
                      <p className="text-sm text-amber-700">
                        Your application is being reviewed. You will be notified via email
                        and WhatsApp once a decision is made. This typically takes 3-5 business days.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-center gap-4">
          <Link href="/application">
            <Button variant="outline">New Application</Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost">Student Login</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
