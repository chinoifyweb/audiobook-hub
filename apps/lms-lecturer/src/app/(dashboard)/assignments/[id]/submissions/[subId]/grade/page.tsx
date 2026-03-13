"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Badge,
} from "@repo/ui";
import { Loader2, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Props {
  params: { id: string; subId: string };
}

interface SubmissionData {
  id: string;
  submissionText: string | null;
  fileUrl: string | null;
  submittedAt: string;
  isLate: boolean;
  score: number | null;
  feedback: string | null;
  assignment: {
    id: string;
    title: string;
    maxScore: number;
    instructions: string | null;
    courseAssignment: {
      course: { code: string; title: string };
    };
  };
  student: {
    studentId: string;
    user: { fullName: string };
  };
}

export default function GradeSubmissionPage({ params }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    async function fetchSubmission() {
      try {
        const res = await fetch(`/api/assignments?submissionId=${params.subId}`);
        if (!res.ok) throw new Error("Failed to load submission");
        const data = await res.json();
        setSubmission(data);
        if (data.score !== null) setScore(data.score);
        if (data.feedback) setFeedback(data.feedback);
      } catch {
        setError("Failed to load submission details");
      } finally {
        setFetching(false);
      }
    }
    fetchSubmission();
  }, [params.subId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/assignments/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: params.subId,
          score,
          feedback,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save grade");
      }

      router.push(`/assignments/${params.id}/submissions`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Submission not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/assignments/${params.id}/submissions`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Grade Submission</h1>
          <p className="text-muted-foreground">
            {submission.assignment.courseAssignment.course.code} &middot;{" "}
            {submission.assignment.title}
          </p>
        </div>
      </div>

      {/* Student Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Student Submission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{submission.student.user.fullName}</p>
              <p className="text-sm text-muted-foreground">{submission.student.studentId}</p>
            </div>
            <div className="flex items-center gap-2">
              {submission.isLate && (
                <Badge variant="destructive">Late Submission</Badge>
              )}
            </div>
          </div>

          {submission.submissionText && (
            <div>
              <p className="text-sm font-medium mb-1">Submission Text</p>
              <div className="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">
                {submission.submissionText}
              </div>
            </div>
          )}

          {submission.fileUrl && (
            <div>
              <p className="text-sm font-medium mb-1">Attached File</p>
              <a
                href={submission.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
              >
                View File <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grade Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Grade</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="score">
                Score (0 - {submission.assignment.maxScore})
              </Label>
              <Input
                id="score"
                type="number"
                value={score}
                onChange={(e) => setScore(parseInt(e.target.value) || 0)}
                min={0}
                max={submission.assignment.maxScore}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <textarea
                id="feedback"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide feedback to the student..."
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Grade
              </Button>
              <Link href={`/assignments/${params.id}/submissions`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
