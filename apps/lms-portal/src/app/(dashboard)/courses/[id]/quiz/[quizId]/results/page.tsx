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
  AlertTriangle,
} from "lucide-react";
import { QuizNav } from "@/components/lms/quiz-nav";

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
  const [selectedAttemptIndex, setSelectedAttemptIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

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

  const selectedResult = data.results[selectedAttemptIndex];
  if (!selectedResult) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <p className="text-gray-500">No attempt results found.</p>
      </div>
    );
  }

  // Compute duration
  const startedAt = new Date(selectedResult.startedAt);
  const submittedAt = selectedResult.submittedAt
    ? new Date(selectedResult.submittedAt)
    : null;
  let durationText = "";
  if (submittedAt) {
    const diffMs = submittedAt.getTime() - startedAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    durationText = `${diffMins} mins ${diffSecs} secs`;
  }

  const correctIndices = new Set<number>();
  const incorrectIndices = new Set<number>();
  const answeredIndices = new Set<number>();

  selectedResult.answers.forEach((a, i) => {
    if (a.isCorrect === true) correctIndices.add(i);
    if (a.isCorrect === false) incorrectIndices.add(i);
    if (a.selectedOption !== null || (a.answerText && a.answerText.trim())) {
      answeredIndices.add(i);
    }
  });

  const currentAnswer = selectedResult.answers[currentQuestionIndex];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
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

      {/* Attempt selector if multiple attempts */}
      {data.results.length > 1 && (
        <div className="flex items-center gap-2">
          {data.results.map((result, i) => (
            <button
              key={result.id}
              onClick={() => {
                setSelectedAttemptIndex(i);
                setCurrentQuestionIndex(0);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                i === selectedAttemptIndex
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Attempt {i + 1}
              {result.totalScore !== null && (
                <span className="ml-1.5 text-xs opacity-75">
                  ({result.totalScore}/{result.maxScore})
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Finish review button at top */}
      <div className="flex justify-end">
        <Link href={`/courses/${params.id}/quiz/${params.quizId}`}>
          <Button variant="outline" size="sm" className="border-gray-300">
            Finish review
          </Button>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 space-y-4">
          {/* Summary Table */}
          <Card className="border shadow-sm">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <tbody className="divide-y">
                  <tr>
                    <td className="px-5 py-3 text-gray-500 font-medium bg-gray-50 w-40">
                      Status
                    </td>
                    <td className="px-5 py-3 text-gray-900">
                      Finished
                    </td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 text-gray-500 font-medium bg-gray-50">
                      Started
                    </td>
                    <td className="px-5 py-3 text-gray-900">
                      {format(startedAt, "EEEE, d MMMM yyyy, h:mm:ss a")}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 text-gray-500 font-medium bg-gray-50">
                      Completed
                    </td>
                    <td className="px-5 py-3 text-gray-900">
                      {submittedAt
                        ? format(submittedAt, "EEEE, d MMMM yyyy, h:mm:ss a")
                        : "In progress"}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 text-gray-500 font-medium bg-gray-50">
                      Duration
                    </td>
                    <td className="px-5 py-3 text-gray-900">
                      {durationText || "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 text-gray-500 font-medium bg-gray-50">
                      Grade
                    </td>
                    <td className="px-5 py-3">
                      {selectedResult.totalScore !== null ? (
                        <span className="font-bold text-gray-900">
                          {selectedResult.totalScore} out of{" "}
                          {selectedResult.maxScore}
                          {selectedResult.percentage !== null && (
                            <span className="ml-1">
                              ({selectedResult.percentage}%)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-500">Pending</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Questions Review */}
          {selectedResult.answers.map((answer, qIndex) => {
            const isCorrect = answer.isCorrect === true;
            const isIncorrect = answer.isCorrect === false;
            const statusText = isCorrect
              ? "Correct"
              : isIncorrect
                ? "Incorrect"
                : "Not graded";
            const statusColor = isCorrect
              ? "text-green-600"
              : isIncorrect
                ? "text-red-600"
                : "text-gray-500";

            return (
              <Card
                key={answer.questionId}
                className="border shadow-sm overflow-hidden"
                id={`question-${qIndex}`}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Left section - metadata */}
                  <div className="md:w-56 shrink-0 bg-gray-50 border-b md:border-b-0 md:border-r p-4 space-y-2">
                    <h3 className="text-sm font-bold text-gray-900">
                      Question {qIndex + 1}
                    </h3>
                    <p className={`text-xs font-medium ${statusColor}`}>
                      {statusText}
                    </p>
                    <p className="text-xs text-gray-500">
                      {answer.pointsAwarded !== null
                        ? `${answer.pointsAwarded} / ${answer.maxPoints} marks`
                        : `Marked out of ${answer.maxPoints}`}
                    </p>
                  </div>

                  {/* Right section - question + answer review */}
                  <div className="flex-1 p-5">
                    <p className="text-sm leading-relaxed text-gray-900 mb-4">
                      {answer.questionText}
                    </p>

                    {/* MCQ answer review */}
                    {answer.questionType === "mcq" && answer.options && (
                      <div className="space-y-2">
                        {answer.options.map((opt, idx) => {
                          const isSelected = answer.selectedOption === idx;
                          const isCorrectOption = opt.isCorrect;

                          return (
                            <div
                              key={idx}
                              className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${
                                isCorrectOption && isSelected
                                  ? "border-green-300 bg-green-50"
                                  : isCorrectOption
                                    ? "border-green-200 bg-green-50/50"
                                    : isSelected
                                      ? "border-red-300 bg-red-50"
                                      : "border-gray-200"
                              }`}
                            >
                              {/* Result indicator */}
                              <div className="mt-0.5 shrink-0">
                                {isCorrectOption && isSelected ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : isCorrectOption ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : isSelected ? (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                ) : (
                                  <div className="h-4 w-4 rounded-full border border-gray-300" />
                                )}
                              </div>
                              <span
                                className={
                                  isCorrectOption
                                    ? "text-green-700 font-medium"
                                    : isSelected
                                      ? "text-red-700"
                                      : "text-gray-600"
                                }
                              >
                                <span className="font-medium">
                                  {String.fromCharCode(97 + idx)}.
                                </span>{" "}
                                {opt.text}
                              </span>
                              {isSelected && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] ml-auto shrink-0"
                                >
                                  Your answer
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* True/False answer review */}
                    {answer.questionType === "true_false" && (
                      <div className="space-y-2">
                        {["True", "False"].map((opt, idx) => {
                          const isSelected = answer.selectedOption === idx;
                          const correctVal =
                            answer.correctAnswer?.toLowerCase();
                          const isCorrectOption =
                            (idx === 0 && correctVal === "true") ||
                            (idx === 1 && correctVal === "false");

                          return (
                            <div
                              key={idx}
                              className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${
                                isCorrectOption && isSelected
                                  ? "border-green-300 bg-green-50"
                                  : isCorrectOption
                                    ? "border-green-200 bg-green-50/50"
                                    : isSelected
                                      ? "border-red-300 bg-red-50"
                                      : "border-gray-200"
                              }`}
                            >
                              <div className="mt-0.5 shrink-0">
                                {isCorrectOption && isSelected ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : isCorrectOption ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : isSelected ? (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                ) : (
                                  <div className="h-4 w-4 shrink-0" />
                                )}
                              </div>
                              <span
                                className={
                                  isCorrectOption
                                    ? "text-green-700 font-medium"
                                    : isSelected
                                      ? "text-red-700"
                                      : "text-gray-600"
                                }
                              >
                                <span className="font-medium">
                                  {String.fromCharCode(97 + idx)}.
                                </span>{" "}
                                {opt}
                              </span>
                              {isSelected && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] ml-auto shrink-0"
                                >
                                  Your answer
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Short answer / fill in blank review */}
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

                    {/* Essay review */}
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
                  </div>
                </div>
              </Card>
            );
          })}

          {/* Finish review button at bottom */}
          <div className="flex items-center gap-4 pt-2">
            <Link href={`/courses/${params.id}/quiz/${params.quizId}`}>
              <Button variant="outline" className="border-gray-300">
                Finish review
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Sidebar - Navigation */}
        <div className="lg:w-72 shrink-0">
          <div className="sticky top-20 space-y-4">
            <Card className="border shadow-sm">
              <CardContent className="py-4">
                <QuizNav
                  totalQuestions={selectedResult.answers.length}
                  currentIndex={currentQuestionIndex}
                  answeredIndices={answeredIndices}
                  flaggedIndices={new Set()}
                  onNavigate={(index) => {
                    setCurrentQuestionIndex(index);
                    // Scroll to question
                    const el = document.getElementById(`question-${index}`);
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                  }}
                  correctIndices={correctIndices}
                  incorrectIndices={incorrectIndices}
                  reviewMode
                />
              </CardContent>
            </Card>

            {/* Score card */}
            {selectedResult.totalScore !== null && (
              <Card className="border shadow-sm">
                <CardContent className="py-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Your Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedResult.totalScore}/{selectedResult.maxScore}
                  </p>
                  {selectedResult.percentage !== null && (
                    <p className={`text-sm font-semibold mt-1 ${
                      selectedResult.isPassed ? "text-green-600" : "text-red-600"
                    }`}>
                      {selectedResult.percentage}%
                      {selectedResult.isPassed !== null && (
                        <span className="ml-1">
                          - {selectedResult.isPassed ? "Passed" : "Failed"}
                        </span>
                      )}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <Link
              href={`/courses/${params.id}/quiz/${params.quizId}`}
              className="block"
            >
              <Button variant="outline" size="sm" className="w-full border-gray-300">
                Finish review
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
