import { prisma } from "@repo/db";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "@repo/ui";
import { Database, Plus } from "lucide-react";
import Link from "next/link";
import { requireLecturer, getActiveSemester } from "@/lib/auth";

export default async function QuestionBanksPage() {
  const lecturer = await requireLecturer();
  const activeSemester = await getActiveSemester();

  if (!activeSemester) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Question Banks</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No active semester found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const questionBanks = await prisma.questionBank.findMany({
    where: {
      courseAssignment: {
        lecturerId: lecturer.id,
        semesterId: activeSemester.id,
      },
    },
    include: {
      courseAssignment: {
        include: { course: true },
      },
      questions: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Question Banks</h1>
          <p className="text-muted-foreground">
            Manage your question banks across all courses
          </p>
        </div>
      </div>

      {questionBanks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Database className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              No question banks created yet. Create one from a course page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {questionBanks.map((bank) => (
            <Link key={bank.id} href={`/question-banks/${bank.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Badge variant="secondary">
                      {bank.courseAssignment.course.code}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {bank.questions.length} Questions
                    </Badge>
                  </div>
                  <CardTitle className="text-lg leading-tight mt-2">
                    {bank.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {bank.courseAssignment.course.title}
                  </p>
                  {bank.questions.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {["mcq", "true_false", "short_answer", "essay"].map((type) => {
                        const count = bank.questions.filter(
                          (q) => q.questionType === type
                        ).length;
                        if (count === 0) return null;
                        return (
                          <Badge key={type} variant="outline" className="text-xs capitalize">
                            {type.replace("_", "/")} ({count})
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
