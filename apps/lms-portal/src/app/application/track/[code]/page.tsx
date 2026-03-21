"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Separator } from "@repo/ui";
import { BookOpen, CheckCircle, Clock, GraduationCap, Loader2, LogIn, XCircle } from "lucide-react";

interface TrackedApplication {
  applicationNumber: string;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  program: { name: string; code: string };
  rejectionReason: string | null;
  admissionLetterUrl: string | null;
  student: { studentId: string; currentSemester: number } | null;
  createdAt: string;
}

export default function TrackApplicationPage() {
  const params = useParams();
  const code = params.code as string;
  const [app, setApp] = useState<TrackedApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/application?track=${code}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => setApp(data.application))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !app) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <XCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h2 className="text-xl font-bold mb-2">Application Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The tracking code &ldquo;{code}&rdquo; does not match any application.
            </p>
            <Button asChild>
              <Link href="/application">Submit an Application</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAccepted = app.status === "accepted";
  const isRejected = app.status === "rejected";
  const isPending = app.status === "submitted" || app.status === "under_review";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="mx-auto max-w-lg">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Application Status</h1>
          <p className="text-muted-foreground">Berean Bible Academy</p>
        </div>

        <Card>
          <CardHeader className="text-center pb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Application Number</p>
            <CardTitle className="text-lg">{app.applicationNumber}</CardTitle>
            <div className="flex justify-center mt-2">
              <Badge
                variant={isAccepted ? "default" : isRejected ? "destructive" : "secondary"}
                className="text-sm px-4 py-1"
              >
                {app.status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Applicant</div>
              <div className="font-medium">{app.firstName} {app.lastName}</div>
              <div className="text-muted-foreground">Program</div>
              <div className="font-medium">{app.program.name}</div>
              <div className="text-muted-foreground">Applied</div>
              <div className="font-medium">{new Date(app.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}</div>
            </div>

            <Separator />

            {/* Accepted — show full admission details */}
            {isAccepted && app.student && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-100 p-2">
                    <GraduationCap className="h-6 w-6 text-green-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-green-800 text-lg">Congratulations!</h3>
                    <p className="text-sm text-green-700">Your admission has been approved.</p>
                  </div>
                </div>

                <div className="rounded-md bg-white border p-4 space-y-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Your Student ID</p>
                    <p className="text-xl font-bold text-primary">{app.student.studentId}</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Program</div>
                    <div className="font-medium">{app.program.name} ({app.program.code})</div>
                    <div className="text-muted-foreground">Current Semester</div>
                    <div className="font-medium">Semester {app.student.currentSemester}</div>
                    <div className="text-muted-foreground">Login Email</div>
                    <div className="font-medium">{app.email}</div>
                  </div>
                </div>

                <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                  <h4 className="font-semibold text-sm text-blue-900 mb-2">What to do next:</h4>
                  <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                    <li>Log in to the Student Portal using your registered email</li>
                    <li>Complete your tuition payment</li>
                    <li>View your course schedule and start learning</li>
                    <li>Join the student WhatsApp group for updates</li>
                  </ol>
                </div>

                <Button className="w-full" asChild>
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    Log in to Student Portal
                  </Link>
                </Button>
              </div>
            )}

            {/* Rejected */}
            {isRejected && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <p className="font-medium text-red-800">Application Not Approved</p>
                </div>
                {app.rejectionReason && (
                  <p className="text-sm text-red-700">Reason: {app.rejectionReason}</p>
                )}
                <p className="text-sm text-red-600">
                  You may contact admissions@bba.org.ng for more information or submit a new application.
                </p>
              </div>
            )}

            {/* Pending */}
            {isPending && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <p className="font-medium text-amber-800">Under Review</p>
                </div>
                <p className="text-sm text-amber-700">
                  Your application is being reviewed by the admissions team. You will be
                  notified via email and WhatsApp once a decision is made. This typically
                  takes 3-5 business days.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Save this page link to check your status anytime.
        </p>
      </div>
    </div>
  );
}
