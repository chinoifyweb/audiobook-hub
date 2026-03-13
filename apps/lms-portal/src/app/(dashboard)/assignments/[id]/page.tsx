"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Separator,
} from "@repo/ui";
import { FileText, Loader2, Upload, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  dueDate: string;
  maxScore: number;
  allowLateSubmission: boolean;
  fileRequired: boolean;
  courseAssignment: {
    course: { code: string; title: string };
  };
  submission: {
    id: string;
    submissionText: string | null;
    fileUrl: string | null;
    submittedAt: string;
    isLate: boolean;
    score: number | null;
    feedback: string | null;
  } | null;
}

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionText, setSubmissionText] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/assignments/${params.id}/submit`)
      .then((r) => r.json())
      .then((data) => setAssignment(data.assignment))
      .catch(() => setError("Failed to load assignment"))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/assignments/${params.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionText, fileUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit");
        return;
      }

      // Reload assignment data
      const refreshRes = await fetch(`/api/assignments/${params.id}/submit`);
      const refreshData = await refreshRes.json();
      setAssignment(refreshData.assignment);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Assignment not found.</p>
        </CardContent>
      </Card>
    );
  }

  const isPastDue = new Date(assignment.dueDate) < new Date();
  const canSubmit =
    !assignment.submission &&
    (!isPastDue || assignment.allowLateSubmission);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="text-sm text-muted-foreground">
          {assignment.courseAssignment.course.code} -{" "}
          {assignment.courseAssignment.course.title}
        </p>
        <h1 className="text-2xl font-bold">{assignment.title}</h1>
      </div>

      {/* Assignment Info */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                Due: {format(new Date(assignment.dueDate), "MMM d, yyyy HH:mm")}
              </span>
              {isPastDue && (
                <Badge variant="destructive" className="text-xs">
                  Past Due
                </Badge>
              )}
            </div>
            <div>Max Score: {assignment.maxScore}</div>
            {assignment.allowLateSubmission && (
              <Badge variant="outline" className="text-xs">
                Late submissions allowed
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      {(assignment.description || assignment.instructions) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            {assignment.description && (
              <p className="text-sm mb-3">{assignment.description}</p>
            )}
            {assignment.instructions && (
              <div className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-4">
                {assignment.instructions}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submission */}
      {assignment.submission ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Your Submission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Submitted</div>
              <div>
                {format(
                  new Date(assignment.submission.submittedAt),
                  "MMM d, yyyy HH:mm"
                )}
                {assignment.submission.isLate && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    Late
                  </Badge>
                )}
              </div>
            </div>

            {assignment.submission.submissionText && (
              <div>
                <p className="text-sm font-medium mb-1">Your Answer</p>
                <div className="text-sm bg-muted/50 rounded-lg p-4 whitespace-pre-wrap">
                  {assignment.submission.submissionText}
                </div>
              </div>
            )}

            {assignment.submission.fileUrl && (
              <div>
                <p className="text-sm font-medium mb-1">Attached File</p>
                <a
                  href={assignment.submission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View file
                </a>
              </div>
            )}

            {assignment.submission.score !== null && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Grade</span>
                    <span className="text-lg font-bold">
                      {assignment.submission.score}/{assignment.maxScore}
                    </span>
                  </div>
                  {assignment.submission.feedback && (
                    <div>
                      <p className="text-sm font-medium mb-1">Feedback</p>
                      <div className="text-sm bg-blue-50 rounded-lg p-4">
                        {assignment.submission.feedback}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : canSubmit ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Submit Your Work</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="submissionText">Your Answer</Label>
                <textarea
                  id="submissionText"
                  className="flex min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Type your answer here..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fileUrl">File URL (optional)</Label>
                <Input
                  id="fileUrl"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="Paste link to your file (Google Drive, etc.)"
                />
              </div>

              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Upload className="mr-2 h-4 w-4" />
                Submit Assignment
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-destructive/50" />
            <p className="mt-3 text-muted-foreground">
              This assignment is past due and late submissions are not allowed.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
