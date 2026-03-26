"use client";

import { useState, useEffect, useCallback } from "react";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  FileQuestion,
  Download,
  Pencil,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  options: QuestionOption[] | null;
  correctAnswer: string | null;
  points: number;
}

interface TestExamQuestion {
  id: string;
  sortOrder: number;
  question: Question;
}

interface Attempt {
  id: string;
  startedAt: string;
  submittedAt: string | null;
  totalScore: number | null;
  maxScore: number;
  status: string;
  isPassed: boolean | null;
  student: {
    studentId: string;
    user: { fullName: string; email: string };
  };
  answers: { question: Question }[];
}

interface TestExam {
  id: string;
  title: string;
  description: string | null;
  type: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  totalMarks: number;
  passMark: number;
  isPublished: boolean;
  shuffleQuestions: boolean;
  showResultsImmediately: boolean;
  courseAssignmentId: string;
  courseAssignment: {
    course: { code: string; title: string };
    enrollments: { id: string }[];
  };
  questions: TestExamQuestion[];
  attempts: Attempt[];
}

interface Props {
  params: { id: string; assessmentId: string };
}

/** Edit Assessment Dialog */
function EditAssessmentDialog({
  testExam,
  courseId,
  onUpdated,
}: {
  testExam: TestExam;
  courseId: string;
  onUpdated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: testExam.title,
    description: testExam.description || "",
    type: testExam.type,
    startTime: format(new Date(testExam.startTime), "yyyy-MM-dd'T'HH:mm"),
    endTime: format(new Date(testExam.endTime), "yyyy-MM-dd'T'HH:mm"),
    durationMinutes: testExam.durationMinutes,
    passMark: testExam.passMark,
    isPublished: testExam.isPublished,
    shuffleQuestions: testExam.shuffleQuestions,
    showResultsImmediately: testExam.showResultsImmediately,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `/api/courses/${courseId}/assessments/${testExam.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
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
      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
        <Pencil className="h-3.5 w-3.5" /> Edit Assessment
      </Button>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Assessment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(val) => setForm({ ...form, type: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">Test</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <textarea
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Open Date/Time</Label>
              <Input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Close Date/Time</Label>
              <Input type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Time Limit (min)</Label>
              <Input type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 0 })} min={1} required />
            </div>
            <div className="space-y-2">
              <Label>Pass Mark (%)</Label>
              <Input type="number" value={form.passMark} onChange={(e) => setForm({ ...form, passMark: parseInt(e.target.value) || 0 })} min={0} max={100} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="editShuffle" checked={form.shuffleQuestions} onChange={(e) => setForm({ ...form, shuffleQuestions: e.target.checked })} className="h-4 w-4 rounded" />
              <Label htmlFor="editShuffle" className="font-normal">Shuffle questions</Label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="editShowRes" checked={form.showResultsImmediately} onChange={(e) => setForm({ ...form, showResultsImmediately: e.target.checked })} className="h-4 w-4 rounded" />
              <Label htmlFor="editShowRes" className="font-normal">Show results immediately</Label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="editPub" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="h-4 w-4 rounded" />
              <Label htmlFor="editPub" className="font-normal">Published</Label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Edit Question Dialog */
function EditQuestionDialog({
  question,
  onUpdated,
}: {
  question: Question;
  onUpdated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    questionText: question.questionText,
    correctAnswer: question.correctAnswer || "",
    options: (question.options as QuestionOption[]) || [],
    points: question.points,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        id: question.id,
        questionText: form.questionText,
        points: form.points,
      };
      if (question.questionType === "mcq" || question.questionType === "true_false") {
        body.options = form.options;
        body.correctAnswer = form.options.find((o) => o.isCorrect)?.text || "";
      } else {
        body.correctAnswer = form.correctAnswer;
      }

      const res = await fetch("/api/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setOpen(true)} title="Edit question">
        <Pencil className="h-3 w-3" />
      </Button>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-2">
            <Label>Question Text</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.questionText}
              onChange={(e) => setForm({ ...form, questionText: e.target.value })}
              required
            />
          </div>

          {(question.questionType === "mcq" || question.questionType === "true_false") && (
            <div className="space-y-2">
              <Label className="text-xs">Options (select correct answer)</Label>
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="editCorrect"
                    checked={opt.isCorrect}
                    onChange={() => {
                      const opts = form.options.map((o, idx) => ({
                        ...o,
                        isCorrect: idx === i,
                      }));
                      setForm({ ...form, options: opts });
                    }}
                    className="h-4 w-4"
                  />
                  {question.questionType === "mcq" ? (
                    <Input
                      value={opt.text}
                      onChange={(e) => {
                        const opts = [...form.options];
                        opts[i] = { ...opts[i], text: e.target.value };
                        setForm({ ...form, options: opts });
                      }}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <span className="text-sm">{opt.text}</span>
                  )}
                  {opt.isCorrect && (
                    <Badge className="text-xs bg-green-100 text-green-700 shrink-0">Correct</Badge>
                  )}
                </div>
              ))}
            </div>
          )}

          {(question.questionType === "fill_in_the_blank" || question.questionType === "short_answer") && (
            <div className="space-y-2">
              <Label>Correct Answer</Label>
              <Input
                value={form.correctAnswer}
                onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Points</Label>
            <Input
              type="number"
              value={form.points}
              onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 1 })}
              min={1}
              className="w-24"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AssessmentDetailPage({ params }: Props) {
  const [testExam, setTestExam] = useState<TestExam | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${params.id}/assessments?assessmentId=${params.assessmentId}`);
      if (res.ok) {
        const data = await res.json();
        setTestExam(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [params.id, params.assessmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!testExam) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Assessment not found.</p>
      </div>
    );
  }

  const totalStudents = testExam.courseAssignment.enrollments.length;
  const attemptCount = testExam.attempts.length;
  const gradedAttempts = testExam.attempts.filter((a) => a.status === "graded");
  const passedCount = gradedAttempts.filter((a) => a.isPassed).length;
  const avgScore =
    gradedAttempts.length > 0
      ? (
          gradedAttempts.reduce((sum, a) => sum + (a.totalScore || 0), 0) /
          gradedAttempts.length
        ).toFixed(1)
      : "N/A";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/courses/${params.id}/assessments`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="capitalize">
                {testExam.type}
              </Badge>
              <Badge variant="secondary">
                {testExam.courseAssignment.course.code}
              </Badge>
              {!testExam.isPublished && <Badge variant="secondary">Draft</Badge>}
            </div>
            <h1 className="text-2xl font-bold">{testExam.title}</h1>
            <p className="text-muted-foreground text-sm">
              {testExam.durationMinutes} min | {testExam.totalMarks} marks
              (pass: {testExam.passMark}) |{" "}
              {format(new Date(testExam.startTime), "MMM d")} -{" "}
              {format(new Date(testExam.endTime), "MMM d, yyyy")}
            </p>
          </div>
        </div>
        <EditAssessmentDialog
          testExam={testExam}
          courseId={params.id}
          onUpdated={fetchData}
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Attempts</p>
            <p className="text-2xl font-bold">
              {attemptCount}/{totalStudents}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Graded</p>
            <p className="text-2xl font-bold">{gradedAttempts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Pass Rate</p>
            <p className="text-2xl font-bold">
              {gradedAttempts.length > 0
                ? `${Math.round((passedCount / gradedAttempts.length) * 100)}%`
                : "N/A"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Avg Score</p>
            <p className="text-2xl font-bold">
              {avgScore}
              {avgScore !== "N/A" && `/${testExam.totalMarks}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="attempts">
        <TabsList>
          <TabsTrigger value="attempts">
            Student Attempts ({attemptCount})
          </TabsTrigger>
          <TabsTrigger value="questions">
            Questions ({testExam.questions.length})
          </TabsTrigger>
        </TabsList>

        {/* Attempts Tab */}
        <TabsContent value="attempts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Student Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              {testExam.attempts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No student attempts yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium">Student</th>
                        <th className="pb-2 font-medium">Started</th>
                        <th className="pb-2 font-medium">Submitted</th>
                        <th className="pb-2 font-medium text-center">Score</th>
                        <th className="pb-2 font-medium text-center">Status</th>
                        <th className="pb-2 font-medium text-center">Pass</th>
                        <th className="pb-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testExam.attempts.map((attempt) => (
                        <tr key={attempt.id} className="border-b last:border-0">
                          <td className="py-2">
                            <div>
                              <p className="font-medium">
                                {attempt.student.user.fullName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {attempt.student.studentId}
                              </p>
                            </div>
                          </td>
                          <td className="py-2 text-xs">
                            {format(new Date(attempt.startedAt), "MMM d, h:mm a")}
                          </td>
                          <td className="py-2 text-xs">
                            {attempt.submittedAt
                              ? format(new Date(attempt.submittedAt), "MMM d, h:mm a")
                              : "-"}
                          </td>
                          <td className="py-2 text-center font-medium">
                            {attempt.totalScore !== null
                              ? `${attempt.totalScore}/${attempt.maxScore}`
                              : "-"}
                          </td>
                          <td className="py-2 text-center">
                            <Badge
                              variant="outline"
                              className={`text-xs capitalize ${
                                attempt.status === "graded"
                                  ? "bg-green-50 text-green-700"
                                  : attempt.status === "submitted"
                                  ? "bg-yellow-50 text-yellow-700"
                                  : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              {attempt.status.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="py-2 text-center">
                            {attempt.isPassed === true && (
                              <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                            )}
                            {attempt.isPassed === false && (
                              <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                            )}
                            {attempt.isPassed === null && (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-2">
                            <Link href={`/tests/${testExam.id}/attempts/${attempt.id}/grade`}>
                              <Button size="sm" variant="outline" className="text-xs">
                                {attempt.status === "graded" ? "Review" : "Grade"}
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>
                Questions Preview ({testExam.questions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testExam.questions.map((tq, idx) => {
                  const q = tq.question;
                  const opts = q.options as QuestionOption[] | null;
                  return (
                    <div key={tq.id} className="rounded-lg border p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          Q{idx + 1}
                        </Badge>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {q.questionType.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-auto mr-1">
                          {q.points} pts
                        </span>
                        <EditQuestionDialog question={q} onUpdated={fetchData} />
                      </div>
                      <p className="text-sm mb-2">{q.questionText}</p>

                      {opts && (
                        <div className="space-y-1">
                          {opts.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              className={`flex items-center gap-2 text-sm px-2 py-1 rounded ${
                                opt.isCorrect
                                  ? "bg-green-50 text-green-800"
                                  : ""
                              }`}
                            >
                              <span className="text-xs font-medium">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <span>{opt.text}</span>
                              {opt.isCorrect && (
                                <CheckCircle className="h-3 w-3 text-green-600 ml-auto" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.correctAnswer && (
                        <p className="text-sm mt-1">
                          <span className="text-muted-foreground">Answer: </span>
                          <span className="font-medium text-green-700">
                            {q.correctAnswer}
                          </span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
