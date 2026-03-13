"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@repo/ui";
import { Award, Loader2, Search } from "lucide-react";
import { format } from "date-fns";

interface CertificateData {
  id: string;
  certificateNumber: string;
  verificationCode: string;
  issueDate: string | Date;
  isValid: boolean;
  student: { studentId: string; user: { fullName: string | null } };
  program: { name: string; code: string; degreeType: string };
}

interface EligibleStudent {
  id: string;
  studentId: string;
  user: { fullName: string | null };
  program: { id: string; name: string; code: string; degreeType: string };
}

interface Props {
  certificates: CertificateData[];
  eligibleStudents: EligibleStudent[];
}

export function CertificatesClient({ certificates, eligibleStudents }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyResult, setVerifyResult] = useState<{ found: boolean; data?: CertificateData } | null>(null);

  async function handleGenerate(studentId: string, programId: string) {
    setLoading(studentId);
    setError("");
    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, programId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to generate certificate");
        return;
      }
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(null);
    }
  }

  async function handleVerify() {
    if (!verifyCode.trim()) return;
    try {
      const res = await fetch(`/api/certificates?code=${encodeURIComponent(verifyCode.trim())}`);
      const data = await res.json();
      if (data.found) {
        setVerifyResult({ found: true, data: data.certificate });
      } else {
        setVerifyResult({ found: false });
      }
    } catch {
      setVerifyResult({ found: false });
    }
  }

  return (
    <>
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Verify Certificate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 max-w-md">
            <Input
              placeholder="Enter verification code..."
              value={verifyCode}
              onChange={(e) => {
                setVerifyCode(e.target.value);
                setVerifyResult(null);
              }}
            />
            <Button onClick={handleVerify}>
              <Search className="mr-2 h-4 w-4" />
              Verify
            </Button>
          </div>
          {verifyResult && (
            <div className="mt-3">
              {verifyResult.found && verifyResult.data ? (
                <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm">
                  <p className="font-medium text-green-800">Certificate Verified</p>
                  <p>Student: {verifyResult.data.student.user.fullName}</p>
                  <p>Program: {verifyResult.data.program.name}</p>
                  <p>Certificate #: {verifyResult.data.certificateNumber}</p>
                  <p>Issued: {format(new Date(verifyResult.data.issueDate), "MMMM d, yyyy")}</p>
                </div>
              ) : (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  No valid certificate found with this verification code.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Eligible Students */}
      {eligibleStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Eligible for Certificate ({eligibleStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Student</th>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Program</th>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {eligibleStudents.map((student) => (
                    <tr key={student.id} className="border-b">
                      <td className="px-4 py-3">
                        <p className="font-medium">{student.user.fullName}</p>
                        <p className="text-xs text-muted-foreground">{student.studentId}</p>
                      </td>
                      <td className="px-4 py-3">
                        {student.program.name} ({student.program.code})
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          onClick={() => handleGenerate(student.id, student.program.id)}
                          disabled={loading === student.id}
                        >
                          {loading === student.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Award className="mr-2 h-4 w-4" />
                          )}
                          Generate
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Issued Certificates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Issued Certificates ({certificates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Certificate #</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Student</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Program</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Issued</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Verification</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {certificates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="h-24 text-center text-muted-foreground">
                      No certificates issued yet.
                    </td>
                  </tr>
                ) : (
                  certificates.map((cert) => (
                    <tr key={cert.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono text-xs">{cert.certificateNumber}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{cert.student.user.fullName}</p>
                        <p className="text-xs text-muted-foreground">{cert.student.studentId}</p>
                      </td>
                      <td className="px-4 py-3 capitalize">{cert.program.degreeType} - {cert.program.code}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {format(new Date(cert.issueDate), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{cert.verificationCode}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cert.isValid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {cert.isValid ? "Valid" : "Revoked"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
