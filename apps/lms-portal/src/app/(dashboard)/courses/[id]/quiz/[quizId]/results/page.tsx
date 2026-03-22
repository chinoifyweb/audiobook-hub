"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, Badge, Button, Separator } from "@repo/ui";
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Trophy,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface QuizResult {
  id: string;
  status: string;
  totalScore: number | null;
  maxScore: number;
  isPassed: boolean | null;
  startedAt: string;
  submittedAt: string | null;
  percentage: number | null;
  answers: Array<{
    questionId: string;
    questionText: string;
    questionType: string;
    options: Array<{ text: string; isCorrect: boolean }> | null;
    correctAnswer: string | null;
    selectedOption: number | null;
    answerText: string | null;
    isCorrect: boolean | null;
    pointsAwarded: number | null;
    maxPoints: number;
  }>;
}

interface ResultsData {
  quiz: {
    id: string;
    title: string;
    type: string;
    totalMarks: number;
    passMark: number;
    showResults: boolean;
    course: { code: string; title: string };
  };
  results: QuizResult[];
  bestAttempt: {
    id: string;
    totalScore: number | null;
    maxScore: number;
    isPassed: boolean | null;
  };
}

export default function QuizResultsPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<ResultsData | null>(null);
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch(
          `/api/courses/${params.id}/quiz/${params.quizId}/results`
        );
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || "Failed to load results");
          return;
        }
        const results: ResultsData = await res.json();
        setData(results);
        if (results.results.length > 0) {
          setExpandedAttempt(results.results[0].id);
        }
      } catch {
        setError("Failed to load results");
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [params.id, params.quizId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500">Loading results...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <Card className="border-0 shadow-lg">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/courses/${params.id}/quiz/${params.quizId}`)
              }
            >
              Back to Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const bestScore = data.bestAttempt.totalScore;
  const maxScore = data.bestAttempt.maxScore;
  const percentage =
    bestScore !== null ? Math.round((bestScore / maxScore) * 100) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/courses" className="hover:text-blue-600">
          Courses
        </Link>
        <span>/</span>
        <Link href={`/courses/${params.id}`} className="hover:text-blue-600">
          {data.quiz.course.code}
        </Link>
        <span>/</span>
        <Link
          href={`/courses/${params.id}/quiz/${params.quizId}`}
          className="hover:text-blue-600"
        >
          {data.quiz.title}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Results</span>
      </div>

      {/* Score Summary */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div
          className={`p-8 text-center text-white ${
            data.bestAttempt.isPassed
              ? "bg-gradient-to-r from-green-600 to-emerald-600"
              : data.bestAttempt.isPassed === false
                ? "bg-gradient-to-r from-red-500 to-red-600"
                : "bg-gradient-to-r from-blue-600 to-blue-700"
          }`}
        >
          <div className="inline-flex rounded-full bg-white/20 p-4 mb-4">
            {data.bestAttempt.isPassed ? (
              <Trophy className="h-10 w-10" />
            ) : data.bestAttempt.isPassed === false ? (
              <XCircle className="h-10 w-10" />
            ) : (
              <AlertTriangle className="h-10 w-10" />
            )}
          </div>
          <h2 className="text-2xl font-bold mb-1">
            {data.bestAttempt.isPassed
              ? "Congratulations!"
              : data.bestAttempt.isPassed === false
                ? "Keep Trying!"
                : "Results Pending"}
          </h2>
          <p className="text-white/80 text-sm mb-4">
            {data.quiz.course.code} - {data.quiz.title}
          </p>

          {bestScore !== null && (
            <div className="flex items-center justify-center gap-8">
              <div>
                <p className="text-4xl font-bold">{bestScore}</p>
                <p className="text-sm text-white/70">out of {maxScore}</p>
              </div>
              <Separator orientation="vertical" className="h-12 bg-white/20" />
              <div>
                <p className="text-4xl font-bold">{percentage}%</p>
                <p className="text-sm text-white/70">Best Score</p>
              </div>
              <Separator orientation="vertical" className="h-12 bg-white/20" />
              <div>
                <p className="text-4xl font-bold">{data.quiz.passMark}</p>
                <p className="text-sm text-white/70">Pass Mark</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Attempt Details */}
      {data.results.map((result, index) => (
        <Card key={result.id} className="border-0 shadow-sm">
          <button
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            onClick={() =>
              setExpandedAttempt(
                expandedAttempt === result.id ? null : result.id
              )
            }
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                {index + 1}
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">
                  Attempt {index + 1}
                </p>
                <p className="text-xs text-gray-500">
                  {result.submittedAt
                    ? format(new Date(result.submittedAt), "MMM d, yyyy h:mm a")
                    : "In progress"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {result.totalScore !== null && (
                <span className="text-sm font-bold">
                  {result.totalScore}/{result.maxScore}
                  <span className="text-gray-400 font-normal ml-1">
                    ({result.percentage}%)
                  </span>
                </span>
              )}
              {result.isPassed !== null && (
                <Badge
                  variant={result.isPassed ? "default" : "destructive"}
                  className="text-xs"
                >
                  {result.isPassed ? "Passed" : "Failed"}
                </Badge>
              )}
              {expandedAttempt === result.id ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </button>

          {/* Expanded answers review */}
          {expandedAttempt === result.id && result.answers.length > 0 && (
            <div className="border-t">
              <div className="divide-y">
                {result.answers.map((answer, qIndex) => (
                  <div key={answer.questionId} className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          answer.isCorrect === true
                            ? "bg-green-100 text-green-700"
                            : answer.isCorrect === false
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {qIndex + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-2">
                          {answer.questionText}
                        </p>

                        {/* Show answer */}
                        {answer.questionType === "mcq" && answer.options && (
                          <div className="space-y-1.5">
                            {answer.options.map((opt, idx) => {
                              const isSelected =
                                answer.selectedOption === idx;
                              const isCorrectOption = opt.isCorrect;

                              return (
                                <div
                                  key={idx}
                                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                                    isCorrectOption
                                      ? "bg-green-50 border border-green-200"
                                      : isSelected
                                        ? "bg-red-50 border border-red-200"
                                        : "bg-gray-50"
                                  }`}
                                >
                                  {isCorrectOption ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                                  ) : isSelected ? (
                                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                                  ) : (
                                    <div className="h-4 w-4 rounded-full border border-gray-300 shrink-0" />
                                  )}
                                  <span
                                    className={
                                      isCorrectOption
                                        ? "text-green-700 font-medium"
                                        : isSelected
                                          ? "text-red-700"
                                          : "text-gray-600"
                                    }
                                  >
                                    {opt.text}
                                  </span>
                                  {isSelected && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] ml-auto"
                                    >
                                      Your answer
                                    </Badge>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {answer.questionType === "true_false" && (
                          <div className="space-y-1.5">
                            {["True", "False"].map((opt, idx) => {
                              const isSelected =
                                answer.selectedOption === idx;
                              const correctVal =
                                answer.correctAnswer?.toLowerCase();
                              const isCorrectOption =
                                (idx === 0 && correctVal === "true") ||
                                (idx === 1 && correctVal === "false");

                              return (
                                <div
                                  key={idx}
                                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                                    isCorrectOption
                                      ? "bg-green-50 border border-green-200"
                                      : isSelected
                                        ? "bg-red-50 border border-red-200"
                                        : "bg-gray-50"
                                  }`}
                                >
                                  {isCorrectOption ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                                  ) : isSelected ? (
                                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                                  ) : (
                                    <div className="h-4 w-4 shrink-0" />
                                  )}
                                  <span>{opt}</span>
                                  {isSelected && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] ml-auto"
                                    >
                                      Your answer
                                    </Badge>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {(answer.questionType === "short_answer" ||
                          answer.questionType === "fill_in_the_blank") && (
                          <div className="space-y-2">
                            <div
                              className={`rounded-lg px-3 py-2 text-sm ${
                                answer.isCorrect
                                  ? "bg-green-50 border border-green-200 text-green-700"
                                  : "bg-red-50 border border-red-200 text-red-700"
                              }`}
                            >
                              <span className="text-xs text-gray-500">
                                Your answer:
                              </span>{" "}
                              <span className="font-medium">
                                {answer.answerText || "(blank)"}
                              </span>
                            </div>
                            {answer.correctAnswer && !answer.isCorrect && (
                              <div className="rounded-lg px-3 py-2 text-sm bg-green-50 border border-green-200 text-green-700">
                                <span className="text-xs text-gray-500">
                                  Correct answer:
                                </span>{" "}
                                <span className="font-medium">
                                  {answer.correctAnswer}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {answer.questionType === "essay" && (
                          <div className="rounded-lg px-3 py-2 text-sm bg-gray-50 border">
                            <span className="text-xs text-gray-500 block mb-1">
                              Your answer:
                            </span>
                            <p className="text-gray-700 whitespace-pre-wrap">
                              {answer.answerText || "(no answer)"}
                            </p>
                          </div>
                        )}

                        {/* Points */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1.5">
                            {answer.isCorrect === true && (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                            {answer.isCorrect === false && (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-xs text-gray-500">
                              {answer.pointsAwarded !== null
                                ? `${answer.pointsAwarded}/${answer.maxPoints} marks`
                                : `${answer.maxPoints} marks (pending)`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {expandedAttempt === result.id && result.answers.length === 0 && (
            <div className="border-t px-6 py-8 text-center">
              <p className="text-sm text-gray-500">
                Detailed results are not available for this assessment.
              </p>
            </div>
          )}
        </Card>
      ))}

      {/* Back button */}
      <div className="flex items-center gap-4">
        <Link
          href={`/courses/${params.id}/quiz/${params.quizId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to quiz
        </Link>
        <Link
          href={`/courses/${params.id}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to course
        </Link>
      </div>
    </div>
  );
}
