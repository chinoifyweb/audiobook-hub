import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Progress,
  Button,
} from "@repo/ui";
import { Award, Download, ShieldCheck, GraduationCap } from "lucide-react";
import { format } from "date-fns";

export default async function CertificatePage() {
  const { studentProfile } = await requireStudent();

  // Check for certificate
  const certificate = await prisma.lmsCertificate.findFirst({
    where: { studentId: studentProfile.id },
    include: {
      program: true,
    },
    orderBy: { issueDate: "desc" },
  });

  // Get progress toward graduation
  const totalCourses = await prisma.course.count({
    where: {
      programId: studentProfile.programId,
      isElective: false,
    },
  });

  const completedEnrollments = await prisma.courseEnrollment.count({
    where: {
      studentId: studentProfile.id,
      status: "completed",
    },
  });

  const progressPercent =
    totalCourses > 0
      ? Math.min(100, Math.round((completedEnrollments / totalCourses) * 100))
      : 0;

  if (certificate) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Certificate</h1>
          <p className="text-muted-foreground">
            Your academic certificate and credentials
          </p>
        </div>

        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white p-6 text-center">
            <Award className="mx-auto h-12 w-12 mb-3" />
            <h2 className="text-2xl font-bold">Certificate Issued</h2>
            <p className="text-sm opacity-90 mt-1">
              Berean Bible Academy
            </p>
          </div>
          <CardContent className="py-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-muted-foreground">Certificate Number</div>
              <div className="font-mono font-bold">
                {certificate.certificateNumber}
              </div>
              <div className="text-muted-foreground">Program</div>
              <div>{certificate.program.name}</div>
              <div className="text-muted-foreground">Issue Date</div>
              <div>
                {format(new Date(certificate.issueDate), "MMMM d, yyyy")}
              </div>
              <div className="text-muted-foreground">Verification Code</div>
              <div className="font-mono">{certificate.verificationCode}</div>
              <div className="text-muted-foreground">Status</div>
              <div>
                <Badge className="bg-green-600">
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  {certificate.isValid ? "Valid" : "Revoked"}
                </Badge>
              </div>
            </div>

            {certificate.certificateUrl && (
              <div className="mt-6 flex justify-center">
                <a
                  href={certificate.certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button>
                    <Download className="mr-2 h-4 w-4" />
                    Download Certificate
                  </Button>
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Certificate</h1>
        <p className="text-muted-foreground">
          Track your progress toward graduation
        </p>
      </div>

      <Card>
        <CardContent className="py-8">
          <div className="text-center mb-8">
            <GraduationCap className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-bold">Progress Toward Completion</h2>
            <p className="text-muted-foreground mt-1">
              {studentProfile.program.name}
            </p>
          </div>

          <div className="max-w-md mx-auto space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Course Completion</span>
                <span className="font-medium">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
              <p className="text-xs text-muted-foreground mt-1">
                {completedEnrollments} of {totalCourses} required courses
                completed
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-muted-foreground">Current Semester</p>
                <p className="text-2xl font-bold mt-1">
                  {studentProfile.currentSemester}
                </p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-muted-foreground">Total Semesters</p>
                <p className="text-2xl font-bold mt-1">
                  {studentProfile.program.durationSemesters}
                </p>
              </div>
            </div>

            {studentProfile.expectedGraduation && (
              <p className="text-center text-sm text-muted-foreground">
                Expected graduation:{" "}
                {format(
                  new Date(studentProfile.expectedGraduation),
                  "MMMM yyyy"
                )}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
