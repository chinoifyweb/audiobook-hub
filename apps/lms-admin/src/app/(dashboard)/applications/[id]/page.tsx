import { prisma } from "@repo/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { format } from "date-fns";
import { ApplicationActions } from "./application-actions";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  withdrawn: "bg-gray-100 text-gray-800",
};

interface Props {
  params: { id: string };
}

export default async function ApplicationDetailPage({ params }: Props) {
  const application = await prisma.lmsApplication.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { fullName: true, email: true, avatarUrl: true } },
      program: {
        select: { name: true, code: true, degreeType: true, department: { select: { name: true } } },
      },
      session: { select: { name: true } },
      reviewedBy: { select: { fullName: true } },
    },
  });

  if (!application) {
    notFound();
  }

  const previousEducation = application.previousEducation as Array<{
    institution?: string;
    qualification?: string;
    year?: string;
  }> | null;

  // Documents can be either {name, url} objects or plain URL strings
  const rawDocs = application.documents as Array<string | { name?: string; url?: string }> | null;
  const documents = rawDocs?.map((doc, idx) => {
    if (typeof doc === "string") {
      const fileName = doc.split("/").pop() || `Document ${idx + 1}`;
      return { name: fileName, url: doc };
    }
    return { name: doc.name || `Document ${idx + 1}`, url: doc.url || "" };
  }) || null;

  const canTakeAction =
    application.status === "submitted" || application.status === "under_review";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Application: {application.applicationNumber}
          </h1>
          <p className="text-muted-foreground">
            Submitted on {format(new Date(application.createdAt), "MMMM d, yyyy")}
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusColors[application.status] || ""}`}
        >
          {application.status.replace("_", " ")}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">First Name</p>
                <p className="font-medium">{application.firstName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Name</p>
                <p className="font-medium">{application.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{application.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{application.phone || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">WhatsApp</p>
                <p className="font-medium">
                  {(application as any).whatsappNumber ? (
                    <a href={`https://wa.me/${((application as any).whatsappNumber as string).replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                      {(application as any).whatsappNumber}
                    </a>
                  ) : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">
                  {application.dateOfBirth
                    ? format(new Date(application.dateOfBirth), "MMMM d, yyyy")
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium">{application.gender || "—"}</p>
              </div>
            </div>
            {application.address && (
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{application.address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Program Information */}
        <Card>
          <CardHeader>
            <CardTitle>Program Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Program</p>
              <p className="font-medium">{application.program.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Program Code</p>
              <p className="font-medium">{application.program.code}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Degree Type</p>
              <p className="font-medium capitalize">
                {application.program.degreeType.replace("_", " ")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Department</p>
              <p className="font-medium">{application.program.department.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Academic Session</p>
              <p className="font-medium">{application.session.name}</p>
            </div>
          </CardContent>
        </Card>

        {/* Previous Education */}
        <Card>
          <CardHeader>
            <CardTitle>Previous Education</CardTitle>
          </CardHeader>
          <CardContent>
            {previousEducation && previousEducation.length > 0 ? (
              <div className="space-y-3">
                {previousEducation.map((edu, idx) => (
                  <div key={idx} className="rounded-md border p-3">
                    <p className="font-medium">{edu.institution || "—"}</p>
                    <p className="text-sm text-muted-foreground">
                      {edu.qualification || "—"} {edu.year ? `(${edu.year})` : ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No education records provided.</p>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Documents</span>
              {documents && documents.length > 0 && (
                <Badge variant="secondary">{documents.length} file{documents.length > 1 ? "s" : ""}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documents && documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc, idx) => {
                  const ext = doc.name.split(".").pop()?.toLowerCase() || "";
                  const isImage = ["jpg", "jpeg", "png"].includes(ext);
                  const isPdf = ext === "pdf";
                  return (
                    <div key={idx} className="flex items-center justify-between rounded-md border p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold uppercase ${
                          isPdf ? "bg-red-100 text-red-700" : isImage ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                        }`}>
                          {ext.slice(0, 4)}
                        </div>
                        <p className="truncate text-sm font-medium">{doc.name}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {doc.url && (
                          <>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium hover:bg-muted"
                            >
                              View
                            </a>
                            <a
                              href={doc.url}
                              download={doc.name}
                              className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                            >
                              Download
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No documents uploaded by applicant.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Review Info (if already reviewed) */}
      {application.reviewedBy && (
        <Card>
          <CardHeader>
            <CardTitle>Review Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Reviewed By</p>
              <p className="font-medium">{application.reviewedBy.fullName}</p>
            </div>
            {application.reviewedAt && (
              <div>
                <p className="text-sm text-muted-foreground">Reviewed At</p>
                <p className="font-medium">
                  {format(new Date(application.reviewedAt), "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            )}
            {application.rejectionReason && (
              <div>
                <p className="text-sm text-muted-foreground">Rejection Reason</p>
                <p className="font-medium text-destructive">{application.rejectionReason}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {canTakeAction && (
        <ApplicationActions applicationId={application.id} />
      )}
    </div>
  );
}
