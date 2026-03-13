import type { Metadata } from "next";
import { Card, CardContent, Badge } from "@repo/ui";
import { GraduationCap, Users } from "lucide-react";
import { getDb } from "@/lib/db";

export const metadata: Metadata = {
  title: "Faculty",
  description:
    "Meet the dedicated faculty members at Berean Bible Academy who are committed to your academic and spiritual growth.",
};

interface FacultyMember {
  id: string;
  title: string | null;
  specialization: string | null;
  user: {
    fullName: string | null;
    avatarUrl: string | null;
  };
  department: {
    name: string;
    faculty: {
      name: string;
    };
  };
}

const placeholderFaculty: FacultyMember[] = [
  {
    id: "1",
    title: "Dr.",
    specialization: "Old Testament Studies",
    user: { fullName: "Samuel Adewale", avatarUrl: null },
    department: { name: "Department of Biblical Studies", faculty: { name: "Faculty of Theology" } },
  },
  {
    id: "2",
    title: "Rev. Dr.",
    specialization: "Systematic Theology",
    user: { fullName: "Grace Okonkwo", avatarUrl: null },
    department: { name: "Department of Systematic Theology", faculty: { name: "Faculty of Theology" } },
  },
  {
    id: "3",
    title: "Prof.",
    specialization: "New Testament Greek",
    user: { fullName: "Michael Eze", avatarUrl: null },
    department: { name: "Department of Biblical Studies", faculty: { name: "Faculty of Theology" } },
  },
  {
    id: "4",
    title: "Rev.",
    specialization: "Pastoral Care & Counseling",
    user: { fullName: "Deborah Nnamdi", avatarUrl: null },
    department: { name: "Department of Pastoral Studies", faculty: { name: "Faculty of Theology" } },
  },
  {
    id: "5",
    title: "Dr.",
    specialization: "Church History",
    user: { fullName: "Peter Afolabi", avatarUrl: null },
    department: { name: "Department of Historical Theology", faculty: { name: "Faculty of Theology" } },
  },
  {
    id: "6",
    title: "Dr.",
    specialization: "Christian Education",
    user: { fullName: "Ruth Okafor", avatarUrl: null },
    department: { name: "Department of Christian Education", faculty: { name: "Faculty of Education" } },
  },
  {
    id: "7",
    title: "Rev. Dr.",
    specialization: "Missions & Evangelism",
    user: { fullName: "John Balogun", avatarUrl: null },
    department: { name: "Department of Ministry Studies", faculty: { name: "Faculty of Ministry" } },
  },
  {
    id: "8",
    title: "Dr.",
    specialization: "Christian Leadership",
    user: { fullName: "Esther Uche", avatarUrl: null },
    department: { name: "Department of Leadership Studies", faculty: { name: "Faculty of Ministry" } },
  },
];

async function getFaculty(): Promise<FacultyMember[]> {
  try {
    const db = await getDb();
    if (!db) return placeholderFaculty;

    const lecturers = await db.lecturerProfile.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: { fullName: true, avatarUrl: true },
        },
        department: {
          include: { faculty: true },
        },
      },
      orderBy: [
        { department: { faculty: { name: "asc" } } },
        { department: { name: "asc" } },
        { user: { fullName: "asc" } },
      ],
    });

    if (lecturers.length === 0) return placeholderFaculty;
    return lecturers as unknown as FacultyMember[];
  } catch {
    return placeholderFaculty;
  }
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function FacultyPage() {
  const faculty = await getFaculty();

  // Group by department
  const grouped = faculty.reduce<
    Record<string, { facultyName: string; members: FacultyMember[] }>
  >((acc, member) => {
    const key = member.department.name;
    if (!acc[key]) {
      acc[key] = {
        facultyName: member.department.faculty.name,
        members: [],
      };
    }
    acc[key].members.push(member);
    return acc;
  }, {});

  const sortedDepts = Object.entries(grouped).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/95 via-primary to-blue-800 py-16 text-primary-foreground">
        <div className="container text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            Our Faculty
          </h1>
          <p className="mx-auto max-w-2xl text-blue-100">
            Learn from experienced pastors, theologians, and scholars who are
            dedicated to your academic and spiritual growth.
          </p>
        </div>
      </section>

      {/* Faculty Grid */}
      <section className="py-16">
        <div className="container">
          {sortedDepts.map(([deptName, { facultyName, members }]) => (
            <div key={deptName} className="mb-12 last:mb-0">
              <div className="mb-4 flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-xl font-bold">{deptName}</h2>
                  <p className="text-sm text-muted-foreground">
                    {facultyName}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {members.map((member) => (
                  <Card
                    key={member.id}
                    className="transition-shadow hover:shadow-md"
                  >
                    <CardContent className="flex items-center gap-4 py-5">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                        {getInitials(member.user.fullName)}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold">
                          {member.title}{" "}
                          {member.user.fullName || "Faculty Member"}
                        </div>
                        {member.specialization && (
                          <Badge
                            variant="secondary"
                            className="mt-1 text-xs font-normal"
                          >
                            {member.specialization}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {sortedDepts.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <GraduationCap className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
              <p>Faculty information will be available soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* Join CTA */}
      <section className="bg-slate-50 py-16">
        <div className="container text-center">
          <h2 className="mb-4 text-2xl font-bold">
            Interested in Joining Our Team?
          </h2>
          <p className="mx-auto mb-6 max-w-xl text-muted-foreground">
            We are always looking for qualified and passionate individuals to
            join our faculty. If you hold an advanced degree in theology or a
            related field, we would love to hear from you.
          </p>
          <a
            href="mailto:careers@bba.org.ng"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90"
          >
            Contact Us About Opportunities
          </a>
        </div>
      </section>
    </>
  );
}
