import type { Metadata } from "next";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { ArrowRight, Clock, BookOpen, GraduationCap } from "lucide-react";
import { getDb } from "@/lib/db";
import { formatNaira, degreeTypeLabel, semesterDuration } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Programs",
  description:
    "Explore our 12 academic programmes: 4 Bachelor of Arts degrees, PGD in Theology, 6 Master of Arts specialisations, and the Master of Divinity.",
};

interface ProgramData {
  id: string;
  name: string;
  code: string;
  description: string | null;
  degreeType: string;
  durationSemesters: number;
  totalCredits: number;
  tuitionPerSemester: number;
  department: {
    name: string;
    faculty: {
      name: string;
    };
  };
}

const placeholderPrograms: ProgramData[] = [
  // Bachelor of Arts Programmes (120 Credits | 4 Years)
  {
    id: "1",
    name: "B.A. Pastoral Ministry",
    code: "BA-PM",
    description:
      "Blending the homiletics and pastoral care of classical seminary with pneumatological depth, faith principles, prayer-and-power DNA, plus social media ministry, content creation, and AI-era church leadership.",
    degreeType: "bachelors",
    durationSemesters: 8,
    totalCredits: 120,
    tuitionPerSemester: 0,
    department: {
      name: "Department of Pastoral Studies",
      faculty: { name: "Faculty of Theology" },
    },
  },
  {
    id: "2",
    name: "B.A. Missions & Intercultural Studies",
    code: "BA-MIS",
    description:
      "Cross-cultural ministry, missionary service, and global outreach. Blends missiology and cultural anthropology with digital evangelism, social media, Business as Mission, and AI translation tools. Emphasis on Africa's strategic role in global missions.",
    degreeType: "bachelors",
    durationSemesters: 8,
    totalCredits: 120,
    tuitionPerSemester: 0,
    department: {
      name: "Department of Missions",
      faculty: { name: "Faculty of Theology" },
    },
  },
  {
    id: "3",
    name: "B.A. Children & Youth Ministry",
    code: "BA-CYM",
    description:
      "Combines developmental psychology, creative programming, social media strategy, and digital discipleship with strong spiritual formation. Emphasis on engaging Gen-Z/Alpha through content creation, gamification, and online community.",
    degreeType: "bachelors",
    durationSemesters: 8,
    totalCredits: 120,
    tuitionPerSemester: 0,
    department: {
      name: "Department of Ministry Studies",
      faculty: { name: "Faculty of Theology" },
    },
  },
  {
    id: "4",
    name: "B.A. Christian Education",
    code: "BA-CE",
    description:
      "Teaching, curriculum development, e-learning design, and Christian school administration. Integrates pedagogy, educational technology, AI tools, and biblical worldview with strong emphasis on online course development and marketplace training.",
    degreeType: "bachelors",
    durationSemesters: 8,
    totalCredits: 120,
    tuitionPerSemester: 0,
    department: {
      name: "Department of Christian Education",
      faculty: { name: "Faculty of Education" },
    },
  },
  // Postgraduate Diploma
  {
    id: "5",
    name: "PGD in Theology",
    code: "PGD-THEO",
    description:
      "A one-year bridge programme for graduates of any discipline seeking to enter theological studies. Credits are transferable to M.A. programmes. Covers foundational theology, biblical studies, and ministry preparation.",
    degreeType: "pgd",
    durationSemesters: 2,
    totalCredits: 36,
    tuitionPerSemester: 0,
    department: {
      name: "Department of Systematic Theology",
      faculty: { name: "Faculty of Theology" },
    },
  },
  // Master of Arts Programmes
  {
    id: "6",
    name: "M.A. Systematic Theology",
    code: "MA-ST",
    description:
      "Advanced Christian doctrine through historical, biblical, pneumatological, and philosophical perspectives. Engages Patristic, Reformed, Pentecostal, and African traditions. Prepares for doctoral studies, seminary teaching, and theological writing.",
    degreeType: "masters",
    durationSemesters: 4,
    totalCredits: 48,
    tuitionPerSemester: 0,
    department: {
      name: "Department of Systematic Theology",
      faculty: { name: "Faculty of Theology" },
    },
  },
  {
    id: "7",
    name: "M.A. Pastoral Counselling",
    code: "MA-PC",
    description:
      "Integrates theology with psychology for soul care. Equips for pastoral care in churches, hospitals, workplaces, and online. Includes tele-counselling, workplace chaplaincy, and mental health ministry. 200-hour practicum.",
    degreeType: "masters",
    durationSemesters: 4,
    totalCredits: 48,
    tuitionPerSemester: 0,
    department: {
      name: "Department of Counselling",
      faculty: { name: "Faculty of Ministry" },
    },
  },
  {
    id: "8",
    name: "M.A. Church Administration",
    code: "MA-CA",
    description:
      "Managerial, financial, legal, digital, and organisational competencies for church governance. Blends theology with nonprofit management, digital operations, AI analytics, social media branding, and marketplace equipping. 150-hour field placement.",
    degreeType: "masters",
    durationSemesters: 4,
    totalCredits: 48,
    tuitionPerSemester: 0,
    department: {
      name: "Department of Church Administration",
      faculty: { name: "Faculty of Ministry" },
    },
  },
  {
    id: "9",
    name: "M.A. Christian Counselling",
    code: "MA-CC",
    description:
      "The most intensive counselling programme. Integrates biblical wisdom with contemporary counselling theory, psychopathology, and clinical skills. 300-hour supervised experience. Includes digital counselling, workplace stress, and mental health ministry.",
    degreeType: "masters",
    durationSemesters: 4,
    totalCredits: 54,
    tuitionPerSemester: 0,
    department: {
      name: "Department of Counselling",
      faculty: { name: "Faculty of Ministry" },
    },
  },
  {
    id: "10",
    name: "M.A. Ministry Leadership",
    code: "MA-ML",
    description:
      "For pastors, church staff, and marketplace professionals. Visionary leadership, social media influence, digital transformation, marketplace ministry, entrepreneurship, and AI-powered decision-making. 120-hour practicum.",
    degreeType: "masters",
    durationSemesters: 3,
    totalCredits: 42,
    tuitionPerSemester: 0,
    department: {
      name: "Department of Leadership Studies",
      faculty: { name: "Faculty of Ministry" },
    },
  },
  {
    id: "11",
    name: "M.A. Marriage & Family Ministry",
    code: "MA-MFM",
    description:
      "Addresses family crisis in church and society. Premarital preparation, marriage enrichment, family counselling, parenting in the digital age, and crisis intervention. Online family counselling, work-life balance, and social media's impact. 200-hour practicum.",
    degreeType: "masters",
    durationSemesters: 4,
    totalCredits: 48,
    tuitionPerSemester: 0,
    department: {
      name: "Department of Family Ministry",
      faculty: { name: "Faculty of Ministry" },
    },
  },
  // Master of Divinity
  {
    id: "12",
    name: "Master of Divinity (M.Div.)",
    code: "MDIV",
    description:
      "The gold-standard professional degree. 78 credits exceeding ATS minimum of 72. Covers biblical languages, systematic theology, pneumatology, homiletics, pastoral care, digital ministry, and marketplace theology.",
    degreeType: "masters",
    durationSemesters: 6,
    totalCredits: 78,
    tuitionPerSemester: 0,
    department: {
      name: "Department of Advanced Theological Studies",
      faculty: { name: "Faculty of Theology" },
    },
  },
];

async function getPrograms(): Promise<ProgramData[]> {
  try {
    const db = await getDb();
    if (!db) return placeholderPrograms;

    const programs = await db.program.findMany({
      where: { isActive: true },
      include: {
        department: {
          include: {
            faculty: true,
          },
        },
      },
      orderBy: [{ degreeType: "asc" }, { name: "asc" }],
    });

    if (programs.length === 0) return placeholderPrograms;
    return programs as unknown as ProgramData[];
  } catch {
    return placeholderPrograms;
  }
}

const degreeOrder: Record<string, number> = {
  certificate: 0,
  diploma: 1,
  bachelors: 2,
  pgd: 3,
  masters: 4,
  phd: 5,
};

const groupLabels: Record<string, string> = {
  bachelors: "Bachelor of Arts Programmes",
  pgd: "Postgraduate Diploma",
  masters: "Postgraduate Programmes",
};

export default async function ProgramsPage() {
  const programs = await getPrograms();

  // Group by degree type
  const grouped = programs.reduce<Record<string, ProgramData[]>>(
    (acc, program) => {
      const key = program.degreeType;
      if (!acc[key]) acc[key] = [];
      acc[key].push(program);
      return acc;
    },
    {}
  );

  // Merge pgd into masters group for display
  if (grouped["pgd"] && grouped["masters"]) {
    grouped["masters"] = [...grouped["pgd"], ...grouped["masters"]];
    delete grouped["pgd"];
  } else if (grouped["pgd"]) {
    grouped["masters"] = grouped["pgd"];
    delete grouped["pgd"];
  }

  const sortedGroups = Object.entries(grouped).sort(
    ([a], [b]) => (degreeOrder[a] ?? 99) - (degreeOrder[b] ?? 99)
  );

  return (
    <>
      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary/95 via-primary to-blue-800 py-16 text-primary-foreground">
        <div className="container text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            Academic Programmes
          </h1>
          <p className="mx-auto max-w-2xl text-blue-100">
            12 programmes across undergraduate and postgraduate levels,
            delivered through our hybrid model of 70% online, 20% on-campus
            intensives, and 10% supervised practicum.
          </p>
        </div>
      </section>

      {/* Programs */}
      <section className="py-16">
        <div className="container">
          {sortedGroups.map(([degreeType, groupPrograms]) => (
            <div key={degreeType} className="mb-12 last:mb-0">
              <div className="mb-6 flex items-center gap-3">
                <GraduationCap className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">
                  {groupLabels[degreeType] || `${degreeTypeLabel(degreeType)} Programs`}
                </h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {groupPrograms.map((program) => (
                  <Card
                    key={program.id}
                    className="flex flex-col transition-shadow hover:shadow-lg"
                  >
                    <CardHeader>
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {degreeTypeLabel(program.degreeType)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {program.code}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{program.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {program.department.name} &middot;{" "}
                        {program.department.faculty.name}
                      </p>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col">
                      <p className="mb-4 flex-1 text-sm text-muted-foreground">
                        {program.description}
                      </p>
                      <div className="mb-4 grid grid-cols-2 gap-2 text-center text-xs">
                        <div className="rounded-md bg-slate-50 p-2">
                          <Clock className="mx-auto mb-1 h-3.5 w-3.5 text-muted-foreground" />
                          <div className="font-medium">
                            {semesterDuration(program.durationSemesters)}
                          </div>
                        </div>
                        <div className="rounded-md bg-slate-50 p-2">
                          <BookOpen className="mx-auto mb-1 h-3.5 w-3.5 text-muted-foreground" />
                          <div className="font-medium">
                            {program.totalCredits} Credits
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <Link href={`/programs/${program.code}`}>
                          View Details
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
