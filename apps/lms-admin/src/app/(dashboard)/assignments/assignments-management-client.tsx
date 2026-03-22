"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from "@repo/ui";
import {
  Plus,
  Loader2,
  Edit,
  Eye,
  Search,
  X,
  FileText,
  Users,
} from "lucide-react";
import { format } from "date-fns";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  dueDate: string | Date;
  maxScore: number;
  allowLateSubmission: boolean;
  fileRequired: boolean;
  isPublished: boolean;
  courseAssignment: {
    id: string;
    course: { code: string; title: string };
    lecturer: { user: { fullName: string | null } };
    semester: { name: string; session: { name: string } };
  };
  _count: { submissions: number };
}

interface CourseAssignment {
  id: string;
  course: { code: string; title: string };
  lecturer: { user: { fullName: string | null } };
  semester: { name: string; session: { name: string } };
}

interface Props {
  assignments: Assignment[];
  courseAssignments: CourseAssignment[];
}

export function AssignmentsManagementClient({
  assignments: initialAssignments,
  courseAssignments,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit modal
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // View submissions modal
  const [viewingSubmissions, setViewingSubmissions] = useState<{
    title: string;
    submissions: Array<{
      id: string;
      submissionText: string | null;
      fileUrl: string | null;
      submittedAt: string;
      isLate: boolean;
      score: number | null;
      feedback: string | null;
      student: {
        studentId: string;
        user: { fullName: string | null; email: string };
      };
    }>;
  } | null>(null);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  const filteredAssignments = initialAssignments.filter((a) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      a.title.toLowerCase().includes(s) ||
      a.courseAssignment.course.code.toLowerCase().includes(s) ||
      a.courseAssignment.course.title.toLowerCase().includes(s) ||
      a.courseAssignment.lecturer.user.fullName?.toLowerCase().includes(s)
    );
  });

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      courseAssignmentId: formData.get("courseAssignmentId") as string,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      instructions: formData.get("instructions") as string,
      dueDate: formData.get("dueDate") as string,
      maxScore: formData.get("maxScore") as string,
      allowLateSubmission: formData.get("allowLateSubmission") === "true",
      fileRequired: formData.get("fileRequired") !== "false",
      isPublished: formData.get("isPublished") === "true",
    };

    try {
      const res = await fetch("/api/lms-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const result = await res.json();
        setError(result.error || "Failed to create assignment");
        return;
      }
      setShowForm(false);
      setSuccess("Assignment created successfully");
      setTimeout(() => setSuccess(""), 4000);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingAssignment) return;
    setEditLoading(true);
    setEditError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      instructions: formData.get("instructions") as string,
      dueDate: formData.get("dueDate") as string,
      maxScore: formData.get("maxScore") as string,
      allowLateSubmission: formData.get("allowLateSubmission") === "true",
      fileRequired: formData.get("fileRequired") !== "false",
      isPublished: formData.get("isPublished") === "true",
    };

    try {
      const res = await fetch(`/api/lms-assignments/${editingAssignment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const result = await res.json();
        setEditError(result.error || "Failed to update assignment");
        return;
      }
      setEditingAssignment(null);
      setSuccess("Assignment updated successfully");
      setTimeout(() => setSuccess(""), 4000);
      router.refresh();
    } catch {
      setEditError("An unexpected error occurred");
    } finally {
      setEditLoading(false);
    }
  }

  async function viewSubmissions(assignmentId: string, title: string) {
    setSubmissionsLoading(true);
    try {
      const res = await fetch(`/api/lms-assignments/${assignmentId}`);
      if (res.ok) {
        const data = await res.json();
        setViewingSubmissions({ title, submissions: data.submissions });
      }
    } catch {
      setError("Failed to load submissions");
    } finally {
      setSubmissionsLoading(false);
    }
  }

  const publishedCount = initialAssignments.filter((a) => a.isPublished).length;
  const draftCount = initialAssignments.filter((a) => !a.isPublished).length;

  return (
    <>
      {success && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          {success}
        </div>
      )}
      {error && !showForm && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
          <button className="ml-2 underline" onClick={() => setError("")}>Dismiss</button>
        </div>
      )}

      {/* Stats + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm">{initialAssignments.length} Total</Badge>
          <Badge className="bg-green-100 text-green-800 text-sm">{publishedCount} Published</Badge>
          {draftCount > 0 && (
            <Badge variant="outline" className="text-sm">{draftCount} Draft</Badge>
          )}
        </div>
        <Button onClick={() => { setShowForm(!showForm); setError(""); }}>
          <Plus className="mr-2 h-4 w-4" />
          Create Assignment
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>New Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="courseAssignmentId">Course *</Label>
                <select
                  id="courseAssignmentId"
                  name="courseAssignmentId"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a course</option>
                  {courseAssignments.map((ca) => (
                    <option key={ca.id} value={ca.id}>
                      {ca.course.code} - {ca.course.title} ({ca.lecturer.user.fullName})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" name="title" required placeholder="e.g. Essay on Biblical Theology" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions</Label>
                <textarea
                  id="instructions"
                  name="instructions"
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input id="dueDate" name="dueDate" type="datetime-local" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxScore">Max Score *</Label>
                  <Input id="maxScore" name="maxScore" type="number" min="1" required defaultValue="100" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="allowLateSubmission">Allow Late?</Label>
                  <select id="allowLateSubmission" name="allowLateSubmission" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fileRequired">File Required?</Label>
                  <select id="fileRequired" name="fileRequired" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isPublished">Publish?</Label>
                  <select id="isPublished" name="isPublished" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="false">Draft</option>
                    <option value="true">Published</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Assignment
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setError(""); }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by title, course code, or lecturer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Title</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Course</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Lecturer</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Due Date</th>
              <th className="h-10 px-4 text-center font-medium text-muted-foreground">Max Score</th>
              <th className="h-10 px-4 text-center font-medium text-muted-foreground">Submissions</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Status</th>
              <th className="h-10 px-4 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssignments.length === 0 ? (
              <tr>
                <td colSpan={8} className="h-24 text-center text-muted-foreground">
                  {search ? "No assignments match your search." : "No assignments found."}
                </td>
              </tr>
            ) : (
              filteredAssignments.map((a) => {
                const isPastDue = new Date(a.dueDate) < new Date();
                return (
                  <tr key={a.id} className={`border-b hover:bg-muted/50 ${!a.isPublished ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-orange-500 shrink-0" />
                        <span className="font-medium">{a.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{a.courseAssignment.course.code}</td>
                    <td className="px-4 py-3 text-xs">{a.courseAssignment.lecturer.user.fullName}</td>
                    <td className="px-4 py-3 text-xs">
                      {format(new Date(a.dueDate), "MMM d, yyyy HH:mm")}
                      {isPastDue && a.isPublished && (
                        <Badge variant="destructive" className="ml-1 text-[10px]">Past</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">{a.maxScore}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="secondary">{a._count.submissions}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${a.isPublished ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {a.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Edit"
                          onClick={() => setEditingAssignment(a)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="View Submissions"
                          disabled={submissionsLoading}
                          onClick={() => viewSubmissions(a.id, a.title)}
                        >
                          {submissionsLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Edit Assignment</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setEditingAssignment(null); setEditError(""); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEdit} className="space-y-4">
                {editError && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{editError}</div>
                )}
                <div className="space-y-2">
                  <Label>Course</Label>
                  <Input value={`${editingAssignment.courseAssignment.course.code} - ${editingAssignment.courseAssignment.course.title}`} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title *</Label>
                  <Input id="edit-title" name="title" defaultValue={editingAssignment.title} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <textarea
                    id="edit-description"
                    name="description"
                    defaultValue={editingAssignment.description || ""}
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-instructions">Instructions</Label>
                  <textarea
                    id="edit-instructions"
                    name="instructions"
                    defaultValue={editingAssignment.instructions || ""}
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-dueDate">Due Date *</Label>
                    <Input
                      id="edit-dueDate"
                      name="dueDate"
                      type="datetime-local"
                      required
                      defaultValue={format(new Date(editingAssignment.dueDate), "yyyy-MM-dd'T'HH:mm")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-maxScore">Max Score *</Label>
                    <Input id="edit-maxScore" name="maxScore" type="number" min="1" required defaultValue={editingAssignment.maxScore} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-allowLateSubmission">Allow Late?</Label>
                    <select id="edit-allowLateSubmission" name="allowLateSubmission" defaultValue={editingAssignment.allowLateSubmission ? "true" : "false"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-fileRequired">File Required?</Label>
                    <select id="edit-fileRequired" name="fileRequired" defaultValue={editingAssignment.fileRequired ? "true" : "false"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-isPublished">Status</Label>
                    <select id="edit-isPublished" name="isPublished" defaultValue={editingAssignment.isPublished ? "true" : "false"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="false">Draft</option>
                      <option value="true">Published</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={editLoading}>
                    {editLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setEditingAssignment(null); setEditError(""); }}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Submissions Modal */}
      {viewingSubmissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Submissions: {viewingSubmissions.title}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setViewingSubmissions(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {viewingSubmissions.submissions.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No submissions yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {viewingSubmissions.submissions.map((sub) => (
                    <div key={sub.id} className="rounded-lg border p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{sub.student.user.fullName}</p>
                          <p className="text-xs text-muted-foreground">{sub.student.user.email} | {sub.student.studentId}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(sub.submittedAt), "MMM d, yyyy HH:mm")}
                          </p>
                          {sub.isLate && <Badge variant="destructive" className="text-[10px]">Late</Badge>}
                        </div>
                      </div>
                      {sub.submissionText && (
                        <div className="text-sm bg-muted/50 rounded p-3 max-h-24 overflow-y-auto whitespace-pre-wrap">
                          {sub.submissionText}
                        </div>
                      )}
                      {sub.fileUrl && (
                        <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                          View attached file
                        </a>
                      )}
                      <div className="flex items-center gap-4 pt-1">
                        <span className="text-sm font-medium">
                          Score: {sub.score !== null ? sub.score : "Not graded"}
                        </span>
                        {sub.feedback && (
                          <span className="text-xs text-muted-foreground">Feedback: {sub.feedback}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
