import type { Metadata } from "next";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { ArrowRight, CreditCard, HelpCircle, Percent, Wallet, Award, Users, Heart, HandHeart, Clock, Church } from "lucide-react";

const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL || "https://portal.bba.org.ng";

export const metadata: Metadata = {
  title: "Tuition & Fees",
  description:
    "View tuition information, scholarship opportunities, payment methods, and financial aid options at Berean Bible Academy.",
};

const tuitionTable = [
  { programme: "B.A. Programmes (4 options)", perSemester: "TBD", total: "TBD", duration: "8 Semesters" },
  { programme: "PGD in Theology", perSemester: "TBD", total: "TBD", duration: "2 Semesters" },
  { programme: "M.A. Programmes (6 options)", perSemester: "TBD", total: "TBD", duration: "3-4 Semesters" },
  { programme: "Master of Divinity (M.Div.)", perSemester: "TBD", total: "TBD", duration: "6 Semesters" },
];

const scholarships = [
  {
    title: "Merit Scholarship",
    icon: Award,
    discount: "25-50% off",
    description:
      "For students with outstanding academic performance. Requires a CGPA of 4.50 or above on the 5-point scale. Higher CGPA qualifies for greater scholarship coverage.",
  },
  {
    title: "Ministry Scholarship",
    icon: Church,
    discount: "30-50% off",
    description:
      "For individuals with 5 or more years of active ministry service. Recognises the sacrifice and commitment of full-time pastors, missionaries, and church workers.",
  },
  {
    title: "Women in Ministry Scholarship",
    icon: Heart,
    discount: "25-40% off",
    description:
      "Dedicated to supporting women called to ministry and theological education. Available to female applicants across all programmes.",
  },
  {
    title: "Need-Based Financial Aid",
    icon: HandHeart,
    discount: "Case by case",
    description:
      "For students who demonstrate genuine financial need. Applications are reviewed individually each semester. Supporting documentation is required.",
  },
  {
    title: "Early Bird Discount",
    icon: Clock,
    discount: "10-15% off",
    description:
      "Available to students who make full tuition payment before the early payment deadline. Encourages timely enrolment and financial planning.",
  },
  {
    title: "Group Enrolment Discount",
    icon: Users,
    discount: "15-20% off",
    description:
      "When 5 or more students from the same church or organisation enrol together, each member receives a group discount on tuition fees.",
  },
];

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
    q: "Can scholarships be combined?",
    a: "Generally, only one scholarship can be applied per student per semester. However, the admissions team may consider exceptional circumstances. Contact the finance office for guidance.",
  },
];

export default function TuitionPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/95 via-primary to-blue-800 py-16 text-primary-foreground">
        <div className="container text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            Tuition & Fees
          </h1>
          <p className="mx-auto max-w-2xl text-blue-100">
            Affordable, accessible theological education. View our tuition
            information, scholarship opportunities, and payment options.
          </p>
        </div>
      </section>

      {/* Tuition Table */}
      <section className="py-16">
        <div className="container">
          <h2 className="mb-6 text-2xl font-bold">Tuition by Programme</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Programme
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    Per Semester
                  </th>
                  <th className="hidden px-4 py-3 text-center font-medium text-muted-foreground sm:table-cell">
                    Duration
                  </th>
                  <th className="hidden px-4 py-3 text-center font-medium text-muted-foreground md:table-cell">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tuitionTable.map((row) => (
                  <tr key={row.programme} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{row.programme}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="secondary" className="text-xs">
                        {row.perSemester}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-3 text-center sm:table-cell">
                      {row.duration}
                    </td>
                    <td className="hidden px-4 py-3 text-center md:table-cell">
                      <Badge variant="secondary" className="text-xs">
                        {row.total}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Tuition amounts will be published before the start of the 2026/2027
            session. A non-refundable application fee applies to all programmes.
            Contact the admissions office for the latest fee schedule.
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
                  Transfer directly to the Academy&apos;s bank account or use
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
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-3 text-2xl font-bold">
              Scholarships & Financial Aid
            </h2>
            <p className="mb-8 text-muted-foreground">
              BBA is committed to making theological education accessible. We
              offer a range of scholarships and financial aid options to support
              qualified students.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {scholarships.map((scholarship) => (
                <Card key={scholarship.title}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <scholarship.icon className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">
                          {scholarship.title}
                        </CardTitle>
                      </div>
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                        {scholarship.discount}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {scholarship.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
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
            Contact us for personalised guidance.
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
