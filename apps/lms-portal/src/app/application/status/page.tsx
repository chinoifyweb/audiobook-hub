"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { BookOpen, Loader2, FileDown, ArrowRight } from "lucide-react";

interface Application {
  id: string;
  applicationNumber: string;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  program: { name: string; code: string };
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

  useEffect(() => {
    fetch("/api/application")
      .then((r) => r.json())
      .then((data) => {
        setApplications(data.applications || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
          <div className="space-y-4">
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
                    <div>{app.firstName} {app.lastName}</div>
                    <div className="text-muted-foreground">Program</div>
                    <div>{app.program.name} ({app.program.code})</div>
                    <div className="text-muted-foreground">Applied</div>
                    <div>{new Date(app.createdAt).toLocaleDateString()}</div>
                  </div>

                  {app.status === "accepted" && (
                    <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-3">
                      <p className="text-sm text-green-800 font-medium">
                        Congratulations! Your application has been accepted.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {app.admissionLetterUrl && (
                          <Button size="sm" variant="outline" asChild>
                            <a
                              href={app.admissionLetterUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FileDown className="mr-2 h-4 w-4" />
                              Download Admission Letter
                            </a>
                          </Button>
                        )}
                        <Button size="sm" onClick={() => router.push("/")}>
                          Go to Dashboard
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {app.status === "rejected" && app.rejectionReason && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                      <p className="text-sm text-red-800 font-medium mb-1">
                        Reason for rejection:
                      </p>
                      <p className="text-sm text-red-700">
                        {app.rejectionReason}
                      </p>
                    </div>
                  )}

                  {(app.status === "submitted" || app.status === "under_review") && (
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                      <p className="text-sm text-blue-800">
                        Your application is being reviewed. You will receive an email
                        notification when a decision is made.
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
            <Button variant="ghost">Back to Login</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
