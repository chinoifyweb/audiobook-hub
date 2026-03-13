import type { Metadata } from "next";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { ArrowRight, CreditCard, HelpCircle, Percent, Wallet } from "lucide-react";
import { getDb } from "@/lib/db";
import { formatNaira, degreeTypeLabel } from "@/lib/format";

const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL || "https://portal.bba.org.ng";

export const metadata: Metadata = {
  title: "Tuition & Fees",
  description:
    "View tuition fees, payment methods, scholarship information, and financial aid options at Berean Bible Academy.",
};

interface TuitionData {
  name: string;
  code: string;
  degreeType: string;
  tuitionPerSemester: number;
  durationSemesters: number;
}

const placeholderTuition: TuitionData[] = [
  { name: "Certificate in Christian Ministry", code: "CCM", degreeType: "certificate", tuitionPerSemester: 2500000, durationSemesters: 2 },
  { name: "Certificate in Christian Education", code: "CCE", degreeType: "certificate", tuitionPerSemester: 2500000, durationSemesters: 2 },
  { name: "Diploma in Theology", code: "DIT", degreeType: "diploma", tuitionPerSemester: 3500000, durationSemesters: 4 },
  { name: "Diploma in Pastoral Studies", code: "DPS", degreeType: "diploma", tuitionPerSemester: 3500000, durationSemesters: 4 },
  { name: "Bachelor of Biblical Studies", code: "BBS", degreeType: "bachelors", tuitionPerSemester: 5000000, durationSemesters: 8 },
  { name: "Bachelor of Christian Leadership", code: "BCL", degreeType: "bachelors", tuitionPerSemester: 5000000, durationSemesters: 8 },
  { name: "Master of Divinity", code: "MDIV", degreeType: "masters", tuitionPerSemester: 7500000, durationSemesters: 6 },
  { name: "Master of Arts in Biblical Counseling", code: "MABC", degreeType: "masters", tuitionPerSemester: 7500000, durationSemesters: 4 },
];

async function getTuitionData(): Promise<TuitionData[]> {
  try {
    const db = await getDb();
    if (!db) return placeholderTuition;

    const programs = await db.program.findMany({
      where: { isActive: true },
      select: {
        name: true,
        code: true,
        degreeType: true,
        tuitionPerSemester: true,
        durationSemesters: true,
      },
      orderBy: [{ degreeType: "asc" }, { name: "asc" }],
    });

    if (programs.length === 0) return placeholderTuition;
    return programs as unknown as TuitionData[];
  } catch {
    return placeholderTuition;
  }
}

const faqs = [
  {
    q: "Can I pay tuition in installments?",
    a: "Yes, we offer installment plans for tuition payments. You can split your semester tuition into two or three payments. Contact the finance office for details.",
  },
  {
    q: "Are there late payment fees?",
    a: "A late payment surcharge of 5% may apply if tuition is not paid by the due date. We encourage students to pay on time or contact us to arrange a payment plan.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept payments via Paystack (debit/credit card, bank transfer, USSD), direct bank transfer, and mobile money. All payments are processed securely.",
  },
  {
    q: "Is there a refund policy?",
    a: "Tuition refunds are available within the first two weeks of the semester (80% refund). After two weeks, refunds are prorated based on the remaining semester duration.",
  },
  {
    q: "Do scholarships cover the full tuition?",
    a: "Scholarship coverage varies. Full and partial scholarships are available depending on the scholarship type and the applicant's qualifications.",
  },
];

export default async function TuitionPage() {
  const programs = await getTuitionData();

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/95 via-primary to-blue-800 py-16 text-primary-foreground">
        <div className="container text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            Tuition & Fees
          </h1>
          <p className="mx-auto max-w-2xl text-blue-100">
            Affordable, quality biblical education. View our tuition rates,
            payment options, and financial aid information.
          </p>
        </div>
      </section>

      {/* Fee Table */}
      <section className="py-16">
        <div className="container">
          <h2 className="mb-6 text-2xl font-bold">Tuition by Program</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Program
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Degree
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Per Semester
                  </th>
                  <th className="hidden px-4 py-3 text-center font-medium text-muted-foreground sm:table-cell">
                    Duration
                  </th>
                  <th className="hidden px-4 py-3 text-right font-medium text-muted-foreground md:table-cell">
                    Total Tuition
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {programs.map((p) => (
                  <tr key={p.code} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/programs/${p.code}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {degreeTypeLabel(p.degreeType)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      &#8358;{formatNaira(p.tuitionPerSemester)}
                    </td>
                    <td className="hidden px-4 py-3 text-center sm:table-cell">
                      {p.durationSemesters} Sem
                    </td>
                    <td className="hidden px-4 py-3 text-right font-semibold md:table-cell">
                      &#8358;
                      {formatNaira(
                        p.tuitionPerSemester * p.durationSemesters
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            All fees are displayed in Nigerian Naira (&#8358;). A
            non-refundable application fee of &#8358;5,000 applies to all
            programs.
          </p>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="bg-slate-50 py-16">
        <div className="container">
          <h2 className="mb-6 text-2xl font-bold">Payment Methods</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <CreditCard className="mb-3 h-8 w-8 text-primary" />
                <h3 className="mb-2 font-semibold">Card Payment</h3>
                <p className="text-sm text-muted-foreground">
                  Pay securely via Paystack using your debit or credit card
                  (Visa, Mastercard, Verve). Payments are processed instantly.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Wallet className="mb-3 h-8 w-8 text-primary" />
                <h3 className="mb-2 font-semibold">Bank Transfer</h3>
                <p className="text-sm text-muted-foreground">
                  Transfer directly to the academy&apos;s bank account or use
                  Paystack&apos;s bank transfer option for instant confirmation.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Percent className="mb-3 h-8 w-8 text-primary" />
                <h3 className="mb-2 font-semibold">Installment Plans</h3>
                <p className="text-sm text-muted-foreground">
                  Split your tuition into manageable installments. Contact the
                  finance office to set up a payment plan.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Scholarships */}
      <section className="py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-2xl font-bold">
              Scholarships & Financial Aid
            </h2>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Merit-Based Scholarships
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Available to students who demonstrate exceptional academic
                    performance. Covers up to 50% of tuition fees. Students must
                    maintain a minimum GPA of 3.5 to retain the scholarship.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Ministry Workers Discount
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Full-time pastors, missionaries, and church workers may
                    qualify for a 20-30% tuition discount. A letter of
                    verification from the church or mission organization is
                    required.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Need-Based Financial Aid
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Limited financial aid is available for students who
                    demonstrate genuine financial need. Applications are reviewed
                    on a case-by-case basis each semester.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-2xl font-bold">
              <HelpCircle className="mb-1 mr-2 inline h-6 w-6 text-primary" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <Card key={i}>
                  <CardContent className="py-4">
                    <h3 className="mb-2 font-semibold">{faq.q}</h3>
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container text-center">
          <h2 className="mb-4 text-2xl font-bold">
            Questions About Tuition?
          </h2>
          <p className="mx-auto mb-6 max-w-xl text-muted-foreground">
            Our admissions team is ready to help you understand your options.
            Contact us for personalized guidance.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/contact">
                Contact Us
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`${PORTAL_URL}/application`}>Apply Now</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
