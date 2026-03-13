import { prisma } from "@repo/db";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { CheckCircle, XCircle, GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function VerifyCertificatePage({
  params,
}: {
  params: { code: string };
}) {
  const certificate = await prisma.lmsCertificate.findUnique({
    where: { verificationCode: params.code },
    include: {
      student: {
        include: {
          user: { select: { fullName: true } },
          program: {
            include: {
              department: { include: { faculty: true } },
            },
          },
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">Certificate Verification</CardTitle>
          <p className="text-sm text-muted-foreground">
            Berean Bible Academy
          </p>
        </CardHeader>
        <CardContent>
          {certificate ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="h-6 w-6" />
                <span className="font-semibold text-lg">Valid Certificate</span>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Student Name</p>
                  <p className="font-medium">{certificate.student.user.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Program</p>
                  <p className="font-medium">{certificate.student.program.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Degree</p>
                  <p className="font-medium capitalize">
                    {certificate.student.program.degreeType.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Certificate Number</p>
                  <p className="font-medium">{certificate.certificateNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date Issued</p>
                  <p className="font-medium">
                    {new Date(certificate.issueDate).toLocaleDateString("en-NG", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Verification Code</p>
                  <p className="font-mono text-sm">{certificate.verificationCode}</p>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                This certificate has been verified as authentic by Berean Bible Academy.
              </p>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center gap-2 text-red-600">
                <XCircle className="h-6 w-6" />
                <span className="font-semibold text-lg">Certificate Not Found</span>
              </div>
              <p className="text-muted-foreground">
                The verification code <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-sm">{params.code}</code> does not match any certificate in our records.
              </p>
              <p className="text-sm text-muted-foreground">
                If you believe this is an error, please contact the registrar&apos;s office.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
