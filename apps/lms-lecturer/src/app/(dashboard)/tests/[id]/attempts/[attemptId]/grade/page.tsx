"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Input,
  Label,
} from "@repo/ui";
import { Loader2, ArrowLeft, Check, X } from "lucide-react";
import Link from "next/link";

interface Props {
  params: { id: string; attemptId: string };
}

interface AnswerData {
  id: string;
  questionId: string;
  selectedOption: { text: string; isCorrect: boolean } | null;
  answerText: string | null;
  isCorrect: boolean | null;
  pointsAwarded: number | null;
  feedback: string | null;
  question: {
    id: string;
    questionText: string;
    questionType: string;
    options: { text: string; isCorrect: boolean }[] | null;
    correctAnswer: string | null;
    points: number;
  };
}

interface AttemptData {
  id: string;
  status: string;
  totalScore: number | null;
  maxScore: number;
  student: {
    studentId: string;
    user: { fullName: string };
  };
  testExam: {
    title: string;
    type: string;
    courseAssignment: {
      course: { code: string };
    };
  };
  answers: AnswerData[];
}

export default function GradeAttemptPage({ params }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [grades, setGrades] = useState<
    Record<string, { points: number; feedback: string }>
  >({});

  const fetchAttempt = useCallback(async () => {
    try {
      const res = await fetch(`/api/tests?attemptId=${params.attemptId}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setAttempt(data);

      // Initialize grades from existing data
      const initial: Record<string, { points: number; feedback: string }> = {};
      data.answers.forEach((ans: AnswerData) => {
        if (
          ans.question.questionType === "short_answer" ||
          ans.question.questionType === "essay"
        ) {
          initial[ans.id] = {
            points: ans.pointsAwarded ?? 0,
            feedback: ans.feedback ?? "",
          };
        }
      });
      setGrades(initial);
    } catch {
      setError("Failed to load attempt details");
    } finally {
      setFetching(false);
    }
  }, [params.attemptId]);

  useEffect(() => {
    fetchAttempt();
  }, [fetchAttempt]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/tests/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: params.attemptId,
          grades,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save grades");
      }

      router.push(`/tests/${params.id}/attempts`);
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

  if (!attempt) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Attempt not found.</p>
      </div>
    );
  }

  const typeLabel: Record<string, string> = {
    mcq: "MCQ",
    true_false: "True/False",
    short_answer: "Short Answer",
    essay: "Essay",
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/tests/${params.id}/attempts`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Grade Attempt</h1>
          <p className="text-muted-foreground">
            {attempt.testExam.courseAssignment.course.code} &middot;{" "}
            {attempt.testExam.title} &middot; {attempt.student.user.fullName}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {attempt.answers.map((ans, index) => {
          const isAutoGraded =
            ans.question.questionType === "mcq" ||
            ans.question.questionType === "true_false";

          return (
            <Card key={ans.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Q{index + 1}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {typeLabel[ans.question.questionType]}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {ans.question.points} pts
                    </Badge>
                  </div>
                  {isAutoGraded && (
                    <div className="flex items-center gap-1">
                      {ans.isCorrect ? (
                        <Badge className="bg-green-100 text-green-700 text-xs gap-1">
                          <Check className="h-3 w-3" /> Correct
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 text-xs gap-1">
                          <X className="h-3 w-3" /> Incorrect
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{ans.question.questionText}</p>

                {/* Show MCQ / True-False answer */}
                {isAutoGraded && ans.selectedOption && (
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <p className="font-medium mb-1">Student&apos;s Answer:</p>
                    <p>
                      {typeof ans.selectedOption === "object" &&
                      "text" in ans.selectedOption
                        ? ans.selectedOption.text
                        : JSON.stringify(ans.selectedOption)}
                    </p>
                  </div>
                )}

                {/* Show essay/short answer */}
                {!isAutoGraded && (
                  <>
                    <div className="rounded-md bg-muted p-3 text-sm">
                      <p className="font-medium mb-1">Student&apos;s Answer:</p>
                      <p className="whitespace-pre-wrap">
                        {ans.answerText || "(No answer provided)"}
                      </p>
                    </div>

                    {ans.question.correctAnswer && (
                      <div className="rounded-md bg-green-50 p-3 text-sm">
                        <p className="font-medium mb-1 text-green-700">
                          Expected Answer:
                        </p>
                        <p>{ans.question.correctAnswer}</p>
                      </div>
                    )}

                    {/* Manual grading fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Points (0 - {ans.question.points})</Label>
                        <Input
                          type="number"
                          value={grades[ans.id]?.points ?? 0}
                          onChange={(e) =>
                            setGrades({
                              ...grades,
                              [ans.id]: {
                                ...grades[ans.id],
                                points:
                                  Math.min(
                                    parseInt(e.target.value) || 0,
                                    ans.question.points
                                  ),
                                feedback: grades[ans.id]?.feedback ?? "",
                              },
                            })
                          }
                          min={0}
                          max={ans.question.points}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Feedback</Label>
                        <Input
                          value={grades[ans.id]?.feedback ?? ""}
                          onChange={(e) =>
                            setGrades({
                              ...grades,
                              [ans.id]: {
                                ...grades[ans.id],
                                points: grades[ans.id]?.points ?? 0,
                                feedback: e.target.value,
                              },
                            })
                          }
                          placeholder="Optional feedback"
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Grades
          </Button>
          <Link href={`/tests/${params.id}/attempts`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
