import { prisma } from "@repo/db";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { CertificatesClient } from "./certificates-client";

export const dynamic = "force-dynamic";

export default async function CertificatesPage() {
  // Get existing certificates
  const certificates = await prisma.lmsCertificate.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      student: {
        select: {
          studentId: true,
          user: { select: { fullName: true } },
        },
      },
      program: { select: { name: true, code: true, degreeType: true } },
    },
  });

  // Get graduated students who don't have certificates yet
  const eligibleStudents = await prisma.studentProfile.findMany({
    where: {
      status: "graduated",
      certificates: { none: {} },
    },
    include: {
      user: { select: { fullName: true } },
      program: { select: { id: true, name: true, code: true, degreeType: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Certificates</h1>
        <p className="text-muted-foreground">Generate and manage student certificates</p>
      </div>

      <CertificatesClient
        certificates={certificates}
        eligibleStudents={eligibleStudents}
      />
    </div>
  );
}
