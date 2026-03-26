import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Separator } from "@repo/ui";
import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, Zap, HelpCircle } from "lucide-react";



import { prisma } from "@repo/db";
import { formatPrice } from "@/lib/utils";
import { SubscribeButton } from "@/components/public/subscribe-button";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Choose the perfect subscription plan for your listening needs. Flexible monthly and annual plans with unlimited access to audiobooks and ebooks.",
  openGraph: {
    title: "Pricing - AudioBook Hub",
    description:
      "Flexible subscription plans for audiobooks and ebooks. Start listening today.",
  },
};

const faqItems = [
  {
    question: "Can I cancel my subscription at any time?",
    answer:
      "Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period. No cancellation fees apply.",
  },
  {
    question: "What happens when I reach my monthly audiobook limit?",
    answer:
      "Once you reach your monthly audiobook limit, you can still access your existing library and all ebooks. You can also purchase individual audiobooks at full price or upgrade to a higher plan for more monthly listens.",
  },
  {
    question: "Can I switch between plans?",
    answer:
      "Absolutely. You can upgrade or downgrade your plan at any time. When upgrading, you get immediate access to the new plan features. When downgrading, the change takes effect at the start of your next billing cycle.",
  },
  {
    question: "Do I keep my books if I cancel?",
    answer:
      "Any audiobooks or ebooks you purchased individually are yours forever and remain in your library. Books accessed through a subscription are available only while your subscription is active.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major payment methods through Paystack, including debit cards, bank transfers, USSD, and mobile money. All transactions are processed securely.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "We offer free books that anyone with an account can access without a subscription. Browse our free catalog to try the platform before committing to a plan.",
  },
  {
    question: "How does annual billing work?",
    answer:
      "Annual plans are billed once per year at a discounted rate compared to monthly billing. You save up to 20% by choosing an annual plan. The full amount is charged at the start of each billing year.",
  },
  {
    question: "Can I get a refund?",
    answer:
      "We offer refunds within 7 days of your initial subscription purchase if you are not satisfied. For individual book purchases, refunds are considered on a case-by-case basis. Contact our support team for assistance.",
  },
];

export default async function PricingPage() {
  let plans: Awaited<ReturnType<typeof prisma.subscriptionPlan.findMany>> = [];
  try {
    plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
  }

  const monthlyPlans = plans.filter((p) => p.interval === "monthly");
  const annualPlans = plans.filter((p) => p.interval === "annually");

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="container text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <Zap className="h-4 w-4" />
            Simple, Transparent Pricing
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Unlock thousands of audiobooks and ebooks with our flexible
            subscription plans. No hidden fees, cancel anytime.
          </p>
        </div>
      </section>

      {/* Monthly Plans */}
      <section className="py-16 container">
        <h2 className="text-2xl font-bold text-center mb-10">Monthly Plans</h2>
        {monthlyPlans.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {monthlyPlans.map((plan) => {
              const rawFeatures = plan.features;
              const features: string[] = Array.isArray(rawFeatures)
                ? rawFeatures
                : typeof rawFeatures === "string"
                ? JSON.parse(rawFeatures)
                : [];
              const isPopular =
                plan.name.toLowerCase().includes("premium") ||
                (monthlyPlans.length === 3 &&
                  monthlyPlans.indexOf(plan) === 1);

              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col ${
                    isPopular ? "border-primary shadow-lg scale-105" : ""
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                      Most Popular
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription className="mt-2">
                      {plan.description}
                    </CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-foreground">
                        {formatPrice(plan.price)}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    {plan.maxBooksPerMonth && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {plan.maxBooksPerMonth} audiobooks per month
                      </p>
                    )}
                    {!plan.maxBooksPerMonth && (
                      <p className="text-sm text-primary font-medium mt-1">
                        Unlimited audiobooks
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1">
                    <Separator className="mb-6" />
                    <ul className="space-y-3">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <SubscribeButton
                      planId={plan.id}
                      variant={isPopular ? "default" : "outline"}
                    />
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <p>Subscription plans are being set up. Check back soon!</p>
          </div>
        )}
      </section>

      {/* Annual Plans */}
      {annualPlans.length > 0 && (
        <section className="py-16 bg-muted/50">
          <div className="container">
            <h2 className="text-2xl font-bold text-center mb-2">
              Annual Plans
            </h2>
            <p className="text-center text-muted-foreground mb-10">
              Save up to 20% with annual billing
            </p>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {annualPlans.map((plan) => {
                const rawFeatures = plan.features;
              const features: string[] = Array.isArray(rawFeatures)
                ? rawFeatures
                : typeof rawFeatures === "string"
                ? JSON.parse(rawFeatures)
                : [];
                return (
                  <Card key={plan.id} className="flex flex-col">
                    <CardHeader className="text-center">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription className="mt-2">
                        {plan.description}
                      </CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold text-foreground">
                          {formatPrice(plan.price)}
                        </span>
                        <span className="text-muted-foreground">/year</span>
                      </div>
                      <p className="text-sm text-primary font-medium mt-1">
                        {formatPrice(Math.round(plan.price / 12))}/month
                        effective
                      </p>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <Separator className="mb-6" />
                      <ul className="space-y-3">
                        {features.map((feature, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm"
                          >
                            <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <SubscribeButton
                        planId={plan.id}
                        variant="outline"
                      />
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* One-Time Purchases */}
      <section className="py-16 container">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">
            Prefer to Buy Individual Books?
          </h2>
          <p className="text-muted-foreground mb-6">
            No subscription required. Purchase any audiobook or ebook
            individually and own it forever. Prices vary by title.
          </p>
          <Button size="lg" variant="outline" asChild>
            <Link href="/books">Browse the Catalog</Link>
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-muted/50">
        <div className="container max-w-3xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
          </div>
          <p className="text-center text-muted-foreground mb-10">
            Everything you need to know about our plans and billing
          </p>
          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <details
                key={i}
                className="group rounded-lg border bg-card p-4 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between font-medium">
                  {item.question}
                  <span className="ml-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 container text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Listening?</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Join thousands of readers and listeners who have already discovered
          their next favorite book on AudioBook Hub.
        </p>
        <Button size="lg" asChild>
          <Link href="/signup">Get Started Free</Link>
        </Button>
      </section>
    </div>
  );
}
