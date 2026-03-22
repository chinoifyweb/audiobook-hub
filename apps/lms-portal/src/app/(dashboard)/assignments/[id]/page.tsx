"use client";

import { useState, useEffect, useMemo } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import {
  FileText,
  Loader2,
  Upload,
  CheckCircle,
  Clock,
  AlertTriangle,
  Info,
  Pencil,
  Trash2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Mail,
  Calendar,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { PaymentGateClient } from "@/components/payment-gate-client";
import { format, differenceInSeconds } from "date-fns";

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

type SubmissionPhase = "requirements" | "upload" | "draft" | "submitted";

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionText, setSubmissionText] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [error, setError] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [phase, setPhase] = useState<SubmissionPhase>("requirements");
  const [siblings, setSiblings] = useState<{ id: string; title: string }[]>(
    []
  );

  useEffect(() => {
    fetch(`/api/assignments/${params.id}/submit`)
      .then((r) => r.json())
      .then((data) => {
        setAssignment(data.assignment);
        if (data.siblingAssignments) {
          setSiblings(data.siblingAssignments);
        }
        if (data.assignment?.submission) {
          setPhase("submitted");
        }
      })
      .catch(() => setError("Failed to load assignment"))
      .finally(() => setLoading(false));
  }, [params.id]);

  function handleSaveDraft() {
    if (!submissionText.trim() && !fileUrl.trim()) {
      setError("Please provide an answer or attach a file before saving.");
      return;
    }
    setError("");
    setPhase("draft");
  }

  function handleRemoveDraft() {
    setPhase("upload");
    setSubmissionText("");
    setFileUrl("");
  }

  function handleEditDraft() {
    setPhase("upload");
  }

  async function handleFinalSubmit() {
    setShowConfirmDialog(false);
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
      setPhase("submitted");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  const isPastDue = assignment
    ? new Date(assignment.dueDate) < new Date()
    : false;
  const canSubmit = assignment
    ? !assignment.submission && (!isPastDue || assignment.allowLateSubmission)
    : false;

  // Time remaining calculation
  const timeInfo = useMemo(() => {
    if (!assignment) return null;
    const now = new Date();
    const due = new Date(assignment.dueDate);
    const diff = differenceInSeconds(due, now);

    if (assignment.submission) {
      const submittedAt = new Date(assignment.submission.submittedAt);
      const earlyDiff = differenceInSeconds(due, submittedAt);
      if (earlyDiff > 0) {
        const days = Math.floor(earlyDiff / 86400);
        const hours = Math.floor((earlyDiff % 86400) / 3600);
        const mins = Math.floor((earlyDiff % 3600) / 60);
        const secs = earlyDiff % 60;
        let text = "Assignment was submitted ";
        if (days > 0) text += `${days} days ${hours} hours `;
        else if (hours > 0) text += `${hours} hours ${mins} mins `;
        else text += `${mins} mins ${secs} secs `;
        text += "early";
        return { text, isEarly: true, isLate: false };
      } else {
        return {
          text: "Assignment was submitted late",
          isEarly: false,
          isLate: true,
        };
      }
    }

    if (diff <= 0) {
      return { text: "Assignment is overdue", isEarly: false, isLate: true };
    }

    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    const secs = diff % 60;
    let text = "";
    if (days > 0) text += `${days} days ${hours} hours `;
    else if (hours > 0) text += `${hours} hours ${mins} mins `;
    else text += `${mins} mins ${secs} secs `;
    text += "remaining";
    return { text, isEarly: false, isLate: false };
  }, [assignment]);

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

  const submissionStatus = assignment.submission
    ? "Submitted for grading"
    : phase === "draft"
      ? "Draft (not submitted)"
      : "No attempt";

  const gradingStatus = assignment.submission
    ? assignment.submission.score !== null
      ? `Graded - ${assignment.submission.score}/${assignment.maxScore}`
      : "Not graded"
    : "Not graded";

  return (
    <PaymentGateClient message="Complete your tuition payment to view and submit assignments.">
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
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
                  Due:{" "}
                  {format(
                    new Date(assignment.dueDate),
                    "EEEE, d MMMM yyyy, h:mm a"
                  )}
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

        {/* Submission Requirements */}
        {(phase === "requirements" || phase === "upload") &&
          !assignment.submission && (
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="py-5">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold">
                    Submission Requirements
                  </h3>
                </div>

                <div className="space-y-3 text-sm text-gray-600">
                  <p>
                    Ensure your submission includes the following details at the
                    top:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Full Name</li>
                    <li>Date</li>
                    <li>Registration Number</li>
                  </ul>

                  <Separator />

                  <p>For any questions regarding submission, contact:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>
                      <span className="inline-flex items-center gap-1">
                        Your Course Lecturer
                        <Mail className="h-3 w-3 text-muted-foreground" />
                      </span>
                    </li>
                    <li>
                      <span className="inline-flex items-center gap-1">
                        Schedule an office hour with a lecturer
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                      </span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

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

        {/* Submission Status Table - shown when in draft or submitted state */}
        {(phase === "draft" || phase === "submitted") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                {phase === "submitted" ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <FileText className="h-5 w-5 text-orange-500" />
                )}
                Submission Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {/* Submission status row */}
                <div className="flex">
                  <div className="w-48 shrink-0 px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 border-r">
                    Submission status
                  </div>
                  <div
                    className={`flex-1 px-4 py-3 text-sm ${
                      phase === "submitted"
                        ? "bg-green-50 text-green-700"
                        : "bg-orange-50 text-orange-700"
                    }`}
                  >
                    {submissionStatus}
                  </div>
                </div>

                {/* Grading status row */}
                <div className="flex">
                  <div className="w-48 shrink-0 px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 border-r">
                    Grading status
                  </div>
                  <div className="flex-1 px-4 py-3 text-sm">{gradingStatus}</div>
                </div>

                {/* Time remaining row */}
                {timeInfo && (
                  <div className="flex">
                    <div className="w-48 shrink-0 px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 border-r">
                      Time remaining
                    </div>
                    <div
                      className={`flex-1 px-4 py-3 text-sm ${
                        timeInfo.isEarly
                          ? "bg-green-50 text-green-700"
                          : timeInfo.isLate
                            ? "bg-red-50 text-red-700"
                            : ""
                      }`}
                    >
                      {timeInfo.text}
                    </div>
                  </div>
                )}

                {/* Last modified row */}
                <div className="flex">
                  <div className="w-48 shrink-0 px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 border-r">
                    Last modified
                  </div>
                  <div className="flex-1 px-4 py-3 text-sm">
                    {assignment.submission
                      ? format(
                          new Date(assignment.submission.submittedAt),
                          "EEEE, d MMMM yyyy, h:mm a"
                        )
                      : format(new Date(), "EEEE, d MMMM yyyy, h:mm a")}
                  </div>
                </div>

                {/* File submissions row */}
                <div className="flex">
                  <div className="w-48 shrink-0 px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 border-r">
                    File submissions
                  </div>
                  <div className="flex-1 px-4 py-3 text-sm">
                    {(assignment.submission?.fileUrl || fileUrl) ? (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <a
                          href={assignment.submission?.fileUrl || fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          Submitted file
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        No file attached
                      </span>
                    )}
                  </div>
                </div>

                {/* Online text row */}
                {(assignment.submission?.submissionText || submissionText) && (
                  <div className="flex">
                    <div className="w-48 shrink-0 px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 border-r">
                      Online text
                    </div>
                    <div className="flex-1 px-4 py-3 text-sm">
                      <div className="bg-muted/50 rounded-lg p-3 whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {assignment.submission?.submissionText || submissionText}
                      </div>
                    </div>
                  </div>
                )}

                {/* Submission comments row */}
                <div className="flex">
                  <div className="w-48 shrink-0 px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 border-r">
                    Submission comments
                  </div>
                  <div className="flex-1 px-4 py-3 text-sm">
                    <button
                      onClick={() => setShowComments(!showComments)}
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Comments (0)
                      {showComments ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                    {showComments && (
                      <div className="mt-2 text-muted-foreground text-xs">
                        No comments yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Feedback row - only when graded */}
                {assignment.submission?.score !== null &&
                  assignment.submission?.score !== undefined && (
                    <>
                      <div className="flex">
                        <div className="w-48 shrink-0 px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 border-r">
                          Grade
                        </div>
                        <div className="flex-1 px-4 py-3">
                          <span className="text-lg font-bold">
                            {assignment.submission.score}/{assignment.maxScore}
                          </span>
                        </div>
                      </div>
                      {assignment.submission.feedback && (
                        <div className="flex">
                          <div className="w-48 shrink-0 px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 border-r">
                            Feedback
                          </div>
                          <div className="flex-1 px-4 py-3 text-sm">
                            <div className="bg-blue-50 rounded-lg p-3">
                              {assignment.submission.feedback}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons - Draft state */}
        {phase === "draft" && !assignment.submission && (
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={submitting}
            >
              {submitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Upload className="mr-2 h-4 w-4" />
              Submit assignment
            </Button>
            <Button variant="outline" onClick={handleEditDraft}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit submission
            </Button>
            <Button variant="outline" onClick={handleRemoveDraft}>
              <Trash2 className="mr-2 h-4 w-4" />
              Remove submission
            </Button>
          </div>
        )}

        {/* Upload Form */}
        {(phase === "requirements" || phase === "upload") &&
          canSubmit &&
          !assignment.submission && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Submit Your Work</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveDraft();
                  }}
                  className="space-y-4"
                >
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
                    <Label htmlFor="fileUrl">
                      File URL{" "}
                      {assignment.fileRequired ? "(required)" : "(optional)"}
                    </Label>
                    <Input
                      id="fileUrl"
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      placeholder="Paste link to your file (Google Drive, etc.)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload your file to Google Drive, OneDrive, or similar
                      service and paste the sharing link here.
                    </p>
                  </div>

                  <Button type="submit">
                    <Upload className="mr-2 h-4 w-4" />
                    Save as draft
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

        {/* Past due and no submission */}
        {!canSubmit && !assignment.submission && phase !== "draft" && (
          <Card>
            <CardContent className="py-8 text-center">
              <AlertTriangle className="mx-auto h-10 w-10 text-destructive/50" />
              <p className="mt-3 text-muted-foreground">
                This assignment is past due and late submissions are not allowed.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Submission Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Submit your assignment?</DialogTitle>
              <DialogDescription>
                Once submitted, you will not be able to make changes unless your
                lecturer allows resubmission. Please ensure your file is correct
                before proceeding.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3">
              {fileUrl && (
                <div className="flex items-center gap-2 rounded-lg border p-3 bg-muted/50">
                  <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      Attached file
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {fileUrl}
                    </p>
                  </div>
                </div>
              )}

              {submissionText && (
                <div className="flex items-center gap-2 rounded-lg border p-3 bg-muted/50">
                  <FileText className="h-5 w-5 text-green-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Online text submission</p>
                    <p className="text-xs text-muted-foreground">
                      {submissionText.length} characters
                    </p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleFinalSubmit} disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Yes, Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Error display for submitted state */}
        {error && phase !== "requirements" && phase !== "upload" && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Activity Navigation */}
        {siblings.length > 1 && (
          <ActivityNavigation
            currentId={assignment.id}
            items={siblings}
            basePath="/assignments"
          />
        )}
      </div>
    </PaymentGateClient>
  );
}

/** Navigation between sibling activities (assignments/quizzes) */
function ActivityNavigation({
  currentId,
  items,
  basePath,
}: {
  currentId: string;
  items: { id: string; title: string }[];
  basePath: string;
}) {
  const router = useRouter();
  const currentIndex = items.findIndex((item) => item.id === currentId);
  const prevItem = currentIndex > 0 ? items[currentIndex - 1] : null;
  const nextItem =
    currentIndex < items.length - 1 ? items[currentIndex + 1] : null;

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Previous */}
          <div className="flex-1">
            {prevItem ? (
              <button
                onClick={() => router.push(`${basePath}/${prevItem.id}`)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors group"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                <div className="text-left min-w-0">
                  <span className="text-xs text-gray-400 block">
                    Previous Activity
                  </span>
                  <span className="truncate block font-medium">
                    {prevItem.title}
                  </span>
                </div>
              </button>
            ) : (
              <div />
            )}
          </div>

          {/* Jump to dropdown */}
          <div className="shrink-0">
            <Select
              value={currentId}
              onValueChange={(value) => router.push(`${basePath}/${value}`)}
            >
              <SelectTrigger className="w-[160px] h-9 text-xs">
                <SelectValue placeholder="Jump to..." />
              </SelectTrigger>
              <SelectContent>
                {items.map((item, i) => (
                  <SelectItem key={item.id} value={item.id}>
                    <span className="truncate">
                      {i + 1}. {item.title}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Next */}
          <div className="flex-1 flex justify-end">
            {nextItem ? (
              <button
                onClick={() => router.push(`${basePath}/${nextItem.id}`)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors group"
              >
                <div className="text-right min-w-0">
                  <span className="text-xs text-gray-400 block">
                    Next Activity
                  </span>
                  <span className="truncate block font-medium">
                    {nextItem.title}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : (
              <div />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
