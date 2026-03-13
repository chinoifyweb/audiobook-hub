import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, Badge, Tabs, TabsContent, TabsList, TabsTrigger, Separator } from "@repo/ui";
import { BookOpen, User, FileText, Video, Download, ExternalLink, ClipboardCheck, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function CourseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { studentProfile } = await requireStudent();

  const courseAssignment = await prisma.courseAssignment.findUnique({
    where: { id: params.id },
    include: {
      course: true,
      lecturer: {
        include: { user: { select: { fullName: true } } },
      },
      semester: { include: { session: true } },
      materials: {
        where: { isPublished: true },
        orderBy: { sortOrder: "asc" },
      },
      assignments: {
        where: { isPublished: true },
        orderBy: { dueDate: "asc" },
        include: {
          submissions: {
            where: { studentId: studentProfile.id },
          },
        },
      },
      testExams: {
        where: { isPublished: true },
        orderBy: { startTime: "asc" },
        include: {
          attempts: {
            where: { studentId: studentProfile.id },
          },
        },
      },
    },
  });

  if (!courseAssignment) {
    notFound();
  }

  // Verify student is enrolled
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: {
      studentId_courseAssignmentId: {
        studentId: studentProfile.id,
        courseAssignmentId: courseAssignment.id,
      },
    },
  });

  if (!enrollment) {
    notFound();
  }

  const { course, lecturer, materials, assignments, testExams } = courseAssignment;

  function materialIcon(type: string) {
    switch (type) {
      case "youtube_video":
        return Video;
      case "pdf":
      case "ebook":
      case "document":
        return FileText;
      default:
        return ExternalLink;
    }
  }

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{course.code}</Badge>
                <Badge variant="outline">{course.creditUnits} Credit Units</Badge>
              </div>
              <h1 className="text-2xl font-bold">{course.title}</h1>
              {course.description && (
                <p className="mt-2 text-muted-foreground">{course.description}</p>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>
                  {lecturer.title ? `${lecturer.title} ` : ""}
                  {lecturer.user.fullName}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {courseAssignment.semester.session.name} -{" "}
                  {courseAssignment.semester.name}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="materials">
        <TabsList>
          <TabsTrigger value="materials">
            Materials ({materials.length})
          </TabsTrigger>
          <TabsTrigger value="assignments">
            Assignments ({assignments.length})
          </TabsTrigger>
          <TabsTrigger value="tests">
            Tests/Exams ({testExams.length})
          </TabsTrigger>
        </TabsList>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-3">
          {materials.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-muted-foreground">
                  No materials have been uploaded yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            materials.map((material) => {
              const Icon = materialIcon(material.type);
              const isYouTube = material.type === "youtube_video";

              return (
                <Card key={material.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-muted p-2">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{material.title}</h3>
                        {material.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {material.description}
                          </p>
                        )}

                        {isYouTube && material.contentUrl && (
                          <div className="mt-3 aspect-video max-w-2xl">
                            <iframe
                              className="w-full h-full rounded-lg"
                              src={material.contentUrl.replace(
                                "watch?v=",
                                "embed/"
                              )}
                              title={material.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        )}

                        {!isYouTube && material.contentUrl && (
                          <a
                            href={material.contentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-2 text-sm text-primary hover:underline"
                          >
                            <Download className="h-4 w-4" />
                            Download / View
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-3">
          {assignments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-muted-foreground">
                  No assignments posted yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            assignments.map((assignment) => {
              const submission = assignment.submissions[0];
              const isPastDue = new Date(assignment.dueDate) < new Date();
              const status = submission
                ? submission.score !== null
                  ? "graded"
                  : "submitted"
                : isPastDue
                  ? "overdue"
                  : "pending";

              return (
                <Link key={assignment.id} href={`/assignments/${assignment.id}`}>
                  <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{assignment.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Due: {format(new Date(assignment.dueDate), "MMM d, yyyy HH:mm")}
                            {" | "}Max Score: {assignment.maxScore}
                          </p>
                        </div>
                        <Badge
                          variant={
                            status === "graded"
                              ? "default"
                              : status === "submitted"
                                ? "secondary"
                                : status === "overdue"
                                  ? "destructive"
                                  : "outline"
                          }
                        >
                          {status === "graded"
                            ? `${submission!.score}/${assignment.maxScore}`
                            : status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </TabsContent>

        {/* Tests Tab */}
        <TabsContent value="tests" className="space-y-3">
          {testExams.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <ClipboardCheck className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-muted-foreground">
                  No tests or exams scheduled yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            testExams.map((test) => {
              const attempt = test.attempts[0];
              const now = new Date();
              const isUpcoming = new Date(test.startTime) > now;
              const isActive =
                new Date(test.startTime) <= now && new Date(test.endTime) >= now;

              return (
                <Link key={test.id} href={`/tests/${test.id}`}>
                  <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{test.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {test.type === "test" ? "Test" : "Exam"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(test.startTime), "MMM d, yyyy HH:mm")}
                            {" | "}Duration: {test.durationMinutes} min
                            {" | "}Total: {test.totalMarks} marks
                          </p>
                        </div>
                        {attempt ? (
                          <Badge
                            variant={
                              attempt.status === "graded" ? "default" : "secondary"
                            }
                          >
                            {attempt.status === "graded"
                              ? `${attempt.totalScore}/${attempt.maxScore}`
                              : attempt.status === "submitted"
                                ? "Submitted"
                                : "In Progress"}
                          </Badge>
                        ) : isActive ? (
                          <Badge className="bg-green-600">Available</Badge>
                        ) : isUpcoming ? (
                          <Badge variant="outline">Upcoming</Badge>
                        ) : (
                          <Badge variant="destructive">Missed</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
