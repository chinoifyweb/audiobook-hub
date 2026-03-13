import type { Metadata } from "next";
import Link from "next/link";
import { Button, Card, CardContent } from "@repo/ui";
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
} from "lucide-react";

const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL || "https://portal.bba.org.ng";

export const metadata: Metadata = {
  title: "Admissions",
  description:
    "Learn about admission requirements, application process, and important dates for Berean Bible Academy.",
};

const requirements = [
  "Born-again Christian with a personal testimony of faith",
  "Minimum of Senior Secondary Certificate (SSCE/WAEC) or equivalent for Certificate and Diploma programs",
  "Bachelor's degree from a recognized institution for Master's programs",
  "Recommendation letter from a pastor or church leader",
  "Proficiency in English language (written and spoken)",
  "Access to a computer and reliable internet connection",
  "Commitment to complete the program within the stipulated duration",
];

const documents = [
  { name: "Completed Application Form", icon: ClipboardList },
  { name: "Passport Photographs (2 copies)", icon: UserCheck },
  { name: "Educational Certificates & Transcripts", icon: FileText },
  { name: "Pastoral Recommendation Letter", icon: FileText },
  { name: "Personal Testimony (500 words)", icon: BookOpen },
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
      "Fill out the online application form with your personal information, educational background, and program choice.",
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

const importantDates = [
  { event: "Application Opens", date: "January 15, 2026" },
  { event: "Early Admission Deadline", date: "March 31, 2026" },
  { event: "Regular Admission Deadline", date: "June 30, 2026" },
  { event: "Late Application Deadline", date: "August 15, 2026" },
  { event: "Orientation Week", date: "September 1-5, 2026" },
  { event: "Classes Begin", date: "September 8, 2026" },
];

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
            requirements, application process, and important dates.
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

      {/* Requirements */}
      <section className="py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-2xl font-bold">
              Admission Requirements
            </h2>
            <ul className="space-y-3">
              {requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Required Documents */}
      <section className="bg-slate-50 py-16">
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
      <section className="py-16">
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
      <section className="bg-slate-50 py-16">
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
      <section className="py-16">
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
