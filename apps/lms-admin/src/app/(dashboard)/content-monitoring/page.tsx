import { prisma } from "@repo/db";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from "@repo/ui";
import { StatsCard } from "@/components/stats-card";
import {
  FileText,
  Video,
  AlertTriangle,
  BookOpen,
  UserCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ContentMonitoringPage() {
  // Get all course assignments with their materials count and lecturer info
  const courseAssignments = await prisma.courseAssignment.findMany({
    where: { isActive: true },
    include: {
      course: { select: { code: true, title: true } },
      lecturer: {
        include: {
          user: { select: { fullName: true } },
        },
      },
      semester: {
        include: { session: { select: { name: true } } },
      },
      materials: {
        select: {
          id: true,
          type: true,
          isPublished: true,
          createdAt: true,
        },
      },
      enrollments: {
        where: { status: "enrolled" },
        select: { id: true },
      },
    },
    orderBy: {
      course: { code: "asc" },
    },
  });

  // Compute stats
  const totalMaterials = courseAssignments.reduce(
    (sum, ca) => sum + ca.materials.length,
    0
  );
  const publishedMaterials = courseAssignments.reduce(
    (sum, ca) => sum + ca.materials.filter((m) => m.isPublished).length,
    0
  );
  const videoCount = courseAssignments.reduce(
    (sum, ca) =>
      sum + ca.materials.filter((m) => m.type === "youtube_video").length,
    0
  );
  const coursesWithNoContent = courseAssignments.filter(
    (ca) => ca.materials.length === 0
  );

  // Group by lecturer for overview
  const lecturerMap = new Map<
    string,
    {
      name: string;
      lecturerId: string;
      courses: {
        courseCode: string;
        courseTitle: string;
        materialCount: number;
        publishedCount: number;
        videoCount: number;
        studentCount: number;
      }[];
      totalMaterials: number;
    }
  >();

  for (const ca of courseAssignments) {
    const lecId = ca.lecturerId;
    if (!lecturerMap.has(lecId)) {
      lecturerMap.set(lecId, {
        name: ca.lecturer.user.fullName || "Unknown",
        lecturerId: lecId,
        courses: [],
        totalMaterials: 0,
      });
    }
    const entry = lecturerMap.get(lecId)!;
    const matCount = ca.materials.length;
    const pubCount = ca.materials.filter((m) => m.isPublished).length;
    const vidCount = ca.materials.filter((m) => m.type === "youtube_video").length;
    entry.courses.push({
      courseCode: ca.course.code,
      courseTitle: ca.course.title,
      materialCount: matCount,
      publishedCount: pubCount,
      videoCount: vidCount,
      studentCount: ca.enrollments.length,
    });
    entry.totalMaterials += matCount;
  }

  const lecturerStats = Array.from(lecturerMap.values()).sort(
    (a, b) => b.totalMaterials - a.totalMaterials
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Content Monitoring</h1>
        <p className="text-muted-foreground">
          Track course content uploads across all lecturers
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Materials"
          value={totalMaterials}
          description={`${publishedMaterials} published`}
          icon={FileText}
        />
        <StatsCard
          title="Video Lectures"
          value={videoCount}
          icon={Video}
        />
        <StatsCard
          title="Courses (Active)"
          value={courseAssignments.length}
          icon={BookOpen}
        />
        <StatsCard
          title="No Content"
          value={coursesWithNoContent.length}
          description="Courses with zero materials"
          icon={AlertTriangle}
        />
      </div>

      {/* Courses with No Content - Flagged */}
      {coursesWithNoContent.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Courses with No Content ({coursesWithNoContent.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="h-8 text-left font-medium text-muted-foreground">Course</th>
                    <th className="h-8 text-left font-medium text-muted-foreground">Lecturer</th>
                    <th className="h-8 text-center font-medium text-muted-foreground">Enrolled</th>
                    <th className="h-8 text-left font-medium text-muted-foreground">Semester</th>
                  </tr>
                </thead>
                <tbody>
                  {coursesWithNoContent.map((ca) => (
                    <tr key={ca.id} className="border-b last:border-0">
                      <td className="py-2">
                        <span className="font-mono text-xs">{ca.course.code}</span>{" "}
                        <span className="text-xs">{ca.course.title}</span>
                      </td>
                      <td className="py-2 text-xs">{ca.lecturer.user.fullName}</td>
                      <td className="py-2 text-center text-xs">{ca.enrollments.length}</td>
                      <td className="py-2 text-xs">
                        {ca.semester.session.name} - {ca.semester.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content by Lecturer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Content by Lecturer
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lecturerStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No active course assignments found.
            </p>
          ) : (
            <div className="space-y-6">
              {lecturerStats.map((lec) => (
                <div key={lec.lecturerId} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{lec.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {lec.courses.length} course{lec.courses.length !== 1 ? "s" : ""} |{" "}
                        {lec.totalMaterials} total materials
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        lec.totalMaterials === 0
                          ? "bg-red-50 text-red-700"
                          : lec.totalMaterials < lec.courses.length * 3
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-green-50 text-green-700"
                      }
                    >
                      {lec.totalMaterials} materials
                    </Badge>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b">
                          <th className="h-8 text-left font-medium text-muted-foreground">Course</th>
                          <th className="h-8 text-center font-medium text-muted-foreground">Materials</th>
                          <th className="h-8 text-center font-medium text-muted-foreground">Published</th>
                          <th className="h-8 text-center font-medium text-muted-foreground">Videos</th>
                          <th className="h-8 text-center font-medium text-muted-foreground">Students</th>
                          <th className="h-8 text-center font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lec.courses.map((c, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-1.5">
                              <span className="font-mono">{c.courseCode}</span>{" "}
                              <span className="text-muted-foreground">{c.courseTitle}</span>
                            </td>
                            <td className="py-1.5 text-center">{c.materialCount}</td>
                            <td className="py-1.5 text-center">{c.publishedCount}</td>
                            <td className="py-1.5 text-center">{c.videoCount}</td>
                            <td className="py-1.5 text-center">{c.studentCount}</td>
                            <td className="py-1.5 text-center">
                              {c.materialCount === 0 ? (
                                <Badge variant="destructive" className="text-xs">
                                  Empty
                                </Badge>
                              ) : c.publishedCount === 0 ? (
                                <Badge variant="secondary" className="text-xs">
                                  All Draft
                                </Badge>
                              ) : (
                                <Badge className="text-xs bg-green-100 text-green-700">
                                  Active
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
