import type { Metadata } from "next";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import {
  ArrowRight,
  CheckCircle,
  FileText,
  Upload,
  UserCheck,
  CalendarDays,
  ClipboardList,
  CreditCard,
  BookOpen,
  GraduationCap,
  Monitor,
  MapPin,
  Briefcase,
} from "lucide-react";

const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL || "https://portal.bba.org.ng";

export const metadata: Metadata = {
  title: "Admissions",
  description:
    "Learn about admission requirements for our 7 programmes (BA, PGD, MA, and M.Div.), application process, hybrid delivery model, and important dates at Berean Bible Academy.",
};

const baRequirements = [
  "Five (5) O'Level credit passes (WAEC/NECO/GCE) including English Language, in a maximum of two sittings.",
  "Direct Entry (200 Level): NCE, ND, or Diploma in Theology.",
  "Mature Entry (25+): 3 years ministry experience plus entrance assessment.",
  "Pastoral recommendation and statement of purpose.",
];

const pgdRequirements = [
  "Bachelor's degree from any discipline.",
  "Minimum of Second Class Lower (2.2) or CGPA of 2.50.",
  "Two references required.",
];

const maRequirements = [
  "B.A. in Theology or a related field.",
  "Non-theology graduates must complete the PGD first.",
  "Minimum of Second Class Lower (2.2).",
  "Two references and a writing sample required.",
];

const mdivRequirements = [
  "Bachelor's degree from any discipline.",
  "Minimum of Second Class Lower (2.2).",
  "Evidence of calling to ministry.",
  "Three references required.",
];

const documents = [
  { name: "Completed Application Form", icon: ClipboardList },
  { name: "Passport Photographs (2 copies)", icon: UserCheck },
  { name: "Educational Certificates & Transcripts", icon: FileText },
  { name: "Pastoral Recommendation Letter", icon: FileText },
  { name: "Statement of Purpose", icon: BookOpen },
  { name: "Valid Means of Identification", icon: UserCheck },
];

const steps = [
  {
    step: 1,
    title: "Create an Account",
    description:
      "Visit the student portal and create your account. You will use this account throughout your studies.",
    icon: UserCheck,
  },
  {
    step: 2,
    title: "Complete the Application",
    description:
      "Fill out the online application form with your personal information, educational background, and programme choice.",
    icon: ClipboardList,
  },
  {
    step: 3,
    title: "Upload Documents",
    description:
      "Upload all required documents including your certificates, passport photographs, and recommendation letter.",
    icon: Upload,
  },
  {
    step: 4,
    title: "Pay Application Fee & Await Decision",
    description:
      "Pay the non-refundable application fee. Your application will be reviewed and you will receive a decision via email.",
    icon: CreditCard,
  },
];

const hybridModel = [
  {
    title: "Online Learning (70%)",
    icon: Monitor,
    items: [
      "Asynchronous video lectures via LMS -- available 24/7",
      "Weekly discussion forums, peer interaction, and collaborative assignments",
      "Digital textbooks and Digital Theological Library (DTL)",
      "Online quizzes, assignments, and essay submissions",
      "Virtual mentoring and office hours via Zoom/Google Meet",
    ],
  },
  {
    title: "On-Campus Intensives (20%)",
    icon: MapPin,
    items: [
      "1-2 week residential intensive per semester (January & July)",
      "Preaching labs, counselling practicums, prayer retreats, ministry simulations",
      "Impartation services, chapel, and spiritual formation encounters",
      "Oral exams, thesis defences, and portfolio presentations",
    ],
  },
  {
    title: "Supervised Practicum (10%)",
    icon: Briefcase,
    items: [
      "Students complete hours in local church, ministry, marketplace, or approved site",
      "Supervised by Academy-approved field mentor and faculty advisor",
      "Reflective journaling, competency evaluations, and portfolio",
    ],
  },
];

const importantDates = [
  { event: "Application Opens", date: "January 15, 2026" },
  { event: "Early Admission Deadline", date: "March 31, 2026" },
  { event: "Regular Admission Deadline", date: "June 30, 2026" },
  { event: "Late Application Deadline", date: "August 15, 2026" },
  { event: "Orientation Week", date: "September 1-5, 2026" },
  { event: "Classes Begin", date: "September 8, 2026" },
];

function RequirementsCard({
  title,
  icon: Icon,
  requirements,
}: {
  title: string;
  icon: React.ElementType;
  requirements: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {requirements.map((req, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm text-muted-foreground">{req}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function AdmissionsPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/95 via-primary to-blue-800 py-16 text-primary-foreground">
        <div className="container text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            Admissions
          </h1>
          <p className="mx-auto max-w-2xl text-blue-100">
            Begin your journey in biblical education. Learn about our admission
            requirements by programme level, our hybrid delivery model, and the
            application process.
          </p>
          <div className="mt-6">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-blue-50"
              asChild
            >
              <Link href={`${PORTAL_URL}/application`}>
                Apply Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Admission Requirements by Programme Level */}
      <section className="py-16">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-center text-2xl font-bold">
              Admission Requirements by Programme
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <RequirementsCard
                title="Bachelor of Arts (B.A.)"
                icon={BookOpen}
                requirements={baRequirements}
              />
              <RequirementsCard
                title="PGD in Theology"
                icon={FileText}
                requirements={pgdRequirements}
              />
              <RequirementsCard
                title="Master of Arts (M.A.)"
                icon={GraduationCap}
                requirements={maRequirements}
              />
              <RequirementsCard
                title="Master of Divinity (M.Div.)"
                icon={GraduationCap}
                requirements={mdivRequirements}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Hybrid Delivery Model */}
      <section className="bg-slate-50 py-16">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-3 text-center text-2xl font-bold">
              Hybrid Delivery Model
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-center text-muted-foreground">
              Our programmes are delivered through a blend of online learning,
              on-campus intensives, and supervised practicum to ensure a
              comprehensive educational experience.
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {hybridModel.map((component) => (
                <Card key={component.title}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <component.icon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-sm">{component.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {component.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/60" />
                          <span className="text-xs text-muted-foreground">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Required Documents */}
      <section className="py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-2xl font-bold">Required Documents</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {documents.map((doc) => (
                <Card key={doc.name}>
                  <CardContent className="flex items-center gap-3 py-4">
                    <doc.icon className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm font-medium">{doc.name}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Application Process */}
      <section className="bg-slate-50 py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-center text-2xl font-bold">
              Application Process
            </h2>
            <div className="space-y-6">
              {steps.map((step) => (
                <div key={step.step} className="flex gap-4">
                  <div className="flex shrink-0 flex-col items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {step.step}
                    </div>
                    {step.step < steps.length && (
                      <div className="mt-2 h-full w-0.5 bg-primary/20" />
                    )}
                  </div>
                  <div className="pb-6">
                    <h3 className="mb-1 font-semibold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Important Dates */}
      <section className="py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-2xl font-bold">
              <CalendarDays className="mb-1 mr-2 inline h-6 w-6 text-primary" />
              Important Dates
            </h2>
            <div className="overflow-hidden rounded-lg border bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Event
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {importantDates.map((item) => (
                    <tr key={item.event}>
                      <td className="px-4 py-3">{item.event}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {item.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Dates are subject to change. Please check the student portal for
              the most up-to-date information.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-50 py-16">
        <div className="container text-center">
          <h2 className="mb-4 text-2xl font-bold">
            Ready to Start Your Application?
          </h2>
          <p className="mx-auto mb-6 max-w-xl text-muted-foreground">
            The application process is quick and straightforward. Create your
            account on the student portal and begin today.
          </p>
          <Button size="lg" asChild>
            <Link href={`${PORTAL_URL}/application`}>
              Begin Application
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
