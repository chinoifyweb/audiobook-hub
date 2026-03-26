import { prisma } from "@repo/db";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "@repo/ui";
import { FileText, ExternalLink, Plus } from "lucide-react";
import Link from "next/link";
import { requireLecturer, getActiveSemester } from "@/lib/auth";

export default async function MaterialsPage() {
  const lecturer = await requireLecturer();
  const activeSemester = await getActiveSemester();

  if (!activeSemester) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Materials</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No active semester found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const courseAssignments = await prisma.courseAssignment.findMany({
    where: {
      lecturerId: lecturer.id,
      semesterId: activeSemester.id,
      isActive: true,
    },
    include: {
      course: true,
      materials: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { course: { code: "asc" } },
  });

  const allMaterials = courseAssignments.flatMap((ca) =>
    ca.materials.map((m) => ({
      ...m,
      courseCode: ca.course.code,
      courseTitle: ca.course.title,
      courseAssignmentId: ca.id,
    }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Materials</h1>
        <p className="text-muted-foreground">All course materials across your courses</p>
      </div>

      {allMaterials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              No materials uploaded yet. Add materials from a course page.
            </p>
            <Link href="/courses" className="mt-2 inline-block">
              <Button variant="outline" size="sm">
                Go to Courses
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {courseAssignments
            .filter((ca) => ca.materials.length > 0)
            .map((ca) => (
              <Card key={ca.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{ca.course.code}</Badge>
                    <CardTitle className="text-base">{ca.course.title}</CardTitle>
                  </div>
                  <Link href={`/materials/${ca.id}/new`}>
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <Plus className="h-3.5 w-3.5" /> Add
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {ca.materials.map((material) => (
                      <div
                        key={material.id}
                        className="flex items-center justify-between rounded-md border px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{material.title}</span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {material.type.replace("_", " ")}
                          </Badge>
                          {!material.isPublished && (
                            <Badge variant="secondary" className="text-xs">Draft</Badge>
                          )}
                        </div>
                        <a
                          href={material.contentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="ghost">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
