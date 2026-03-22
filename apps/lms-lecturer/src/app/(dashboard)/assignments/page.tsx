"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui";
import { ClipboardCheck, Calendar, Pencil, Loader2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  dueDate: string;
  maxScore: number;
  fileRequired: boolean;
  allowLateSubmission: boolean;
  isPublished: boolean;
  courseAssignment: {
    course: { code: string };
  };
  submissions: { score: number | null }[];
}

function EditAssignmentDialog({
  assignment,
  onUpdated,
}: {
  assignment: Assignment;
  onUpdated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: assignment.title,
    description: assignment.description || "",
    instructions: assignment.instructions || "",
    dueDate: format(new Date(assignment.dueDate), "yyyy-MM-dd'T'HH:mm"),
    maxScore: assignment.maxScore,
    fileRequired: assignment.fileRequired,
    allowLateSubmission: assignment.allowLateSubmission,
    isPublished: assignment.isPublished,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/assignments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: assignment.id, ...form }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }

      setOpen(false);
      onUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setOpen(true)} title="Edit assignment">
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Assignment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="editTitle">Title</Label>
            <Input
              id="editTitle"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editDesc">Assignment Brief</Label>
            <textarea
              id="editDesc"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editInstr">Assignment Instructions</Label>
            <textarea
              id="editInstr"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editDueDate">Due Date</Label>
              <Input
                id="editDueDate"
                type="datetime-local"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editMaxScore">Max Score</Label>
              <Input
                id="editMaxScore"
                type="number"
                value={form.maxScore}
                onChange={(e) => setForm({ ...form, maxScore: parseInt(e.target.value) || 0 })}
                min={1}
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                id="editFileReq"
                type="checkbox"
                checked={form.fileRequired}
                onChange={(e) => setForm({ ...form, fileRequired: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="editFileReq" className="font-normal">Require file upload</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="editAllowLate"
                type="checkbox"
                checked={form.allowLateSubmission}
                onChange={(e) => setForm({ ...form, allowLateSubmission: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="editAllowLate" className="font-normal">Allow late submissions</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="editPublished"
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="editPublished" className="font-normal">Published</Label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAssignments = useCallback(async () => {
    try {
      // Fetch all assignments - we use a dedicated endpoint
      const res = await fetch("/api/assignments/list");
      if (res.ok) {
        const data = await res.json();
        setAssignments(data);
      } else {
        setError("Failed to load assignments");
      }
    } catch {
      setError("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Assignments</h1>
        <p className="text-muted-foreground">All assignments across your courses</p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              No assignments yet. Create one from a course page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => {
            const graded = assignment.submissions.filter((s) => s.score !== null).length;
            const total = assignment.submissions.length;
            const isPastDue = new Date(assignment.dueDate) < new Date();

            return (
              <Card key={assignment.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {assignment.courseAssignment.course.code}
                      </Badge>
                      <p className="font-medium">{assignment.title}</p>
                      {!assignment.isPublished && (
                        <Badge variant="secondary" className="text-xs">Draft</Badge>
                      )}
                      {isPastDue && (
                        <Badge variant="destructive" className="text-xs">Past Due</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due {format(new Date(assignment.dueDate), "MMM d, yyyy")}
                      </span>
                      <span>Max: {assignment.maxScore} pts</span>
                      <span>{graded}/{total} graded</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <EditAssignmentDialog
                      assignment={assignment}
                      onUpdated={fetchAssignments}
                    />
                    <Link href={`/assignments/${assignment.id}/submissions`}>
                      <Button size="sm" variant="outline">
                        Submissions
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
