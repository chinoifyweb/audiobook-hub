import { Button, Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { Metadata } from "next";
import Link from "next/link";
import { HelpCircle } from "lucide-react";



export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Find answers to frequently asked questions about AudioBook Hub — subscriptions, purchases, author publishing, account management, and technical support.",
  openGraph: {
    title: "FAQ - AudioBook Hub",
    description:
      "Answers to common questions about AudioBook Hub subscriptions, purchases, and publishing.",
  },
};

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  title: string;
  description: string;
  items: FaqItem[];
}

const categories: FaqCategory[] = [
  {
    title: "General",
    description: "Basic questions about AudioBook Hub",
    items: [
      {
        question: "What is AudioBook Hub?",
        answer:
          "AudioBook Hub is a marketplace platform where you can discover, purchase, and listen to audiobooks and read ebooks. We also provide tools for authors to publish and sell their books directly to readers and listeners.",
      },
      {
        question: "Do I need an account to browse books?",
        answer:
          "No, you can browse the catalog and view book details without an account. However, you need to create a free account to purchase books, subscribe to a plan, or access free titles.",
      },
      {
        question: "Is AudioBook Hub available on mobile?",
        answer:
          "Yes! AudioBook Hub is available as a mobile-responsive website and as dedicated apps for both Android and iOS. You can listen to audiobooks and read ebooks on any device.",
      },
      {
        question: "What genres are available?",
        answer:
          "We offer a wide range of genres including Fiction, Non-Fiction, Science Fiction, Romance, Mystery, Self-Help, Business, Biography, and many more. Our catalog is growing every day as new authors join the platform.",
      },
      {
        question: "How do I contact customer support?",
        answer:
          "You can reach our support team through the Contact page, by emailing support@audiobookhub.com, or by calling +234 801 234 5678 during business hours (Mon-Fri, 9AM-6PM WAT).",
      },
    ],
  },
  {
    title: "Subscriptions",
    description: "Plans, billing, and subscription management",
    items: [
      {
        question: "What subscription plans do you offer?",
        answer:
          "We offer multiple subscription tiers to suit different needs, from Basic plans with a set number of audiobooks per month to Premium and VIP plans with more or unlimited access. Visit our Pricing page for current plan details and pricing.",
      },
      {
        question: "Can I change my plan?",
        answer:
          "Yes, you can upgrade or downgrade your subscription plan at any time from your dashboard. Upgrades take effect immediately, while downgrades are applied at the start of your next billing cycle.",
      },
      {
        question: "How do I cancel my subscription?",
        answer:
          "You can cancel your subscription from the Subscription section in your dashboard. Your access continues until the end of your current billing period. There are no cancellation fees.",
      },
      {
        question: "What payment methods are accepted?",
        answer:
          "We accept all major payment methods through Paystack, including debit cards (Visa, Mastercard, Verve), bank transfers, USSD, and mobile money. All transactions are processed securely.",
      },
      {
        question: "Will I lose access to books if I cancel?",
        answer:
          "Books you purchased individually are yours permanently. Books you accessed through your subscription will no longer be available after your subscription ends. You can re-subscribe at any time to regain access.",
      },
      {
        question: "Do you offer annual plans?",
        answer:
          "Yes, we offer annual billing options for most plans at a discounted rate compared to monthly billing. You can save up to 20% by choosing an annual plan.",
      },
    ],
  },
  {
    title: "Authors",
    description: "Publishing, royalties, and author tools",
    items: [
      {
        question: "How do I become an author on AudioBook Hub?",
        answer:
          "To become an author, sign up for an account and select the author role. Complete the author application with your details, including a bio and bank information for payouts. Our team reviews applications within 48 hours.",
      },
      {
        question: "What is the royalty rate?",
        answer:
          "Authors receive 70% of every sale by default. The platform retains a 30% commission to cover hosting, payment processing, and platform maintenance. This split is applied automatically through Paystack split payments.",
      },
      {
        question: "How are payouts processed?",
        answer:
          "Payouts are processed automatically through Paystack. When a customer purchases your book, the payment is split at the point of sale: your 70% share is sent directly to your linked bank account according to Paystack settlement schedule (typically T+1).",
      },
      {
        question: "What file formats are supported?",
        answer:
          "For audiobooks, we support MP3, AAC, M4A, and M4B formats. For ebooks, we accept EPUB and PDF. Cover images should be in JPG, PNG, or WebP format. Maximum upload size is 500MB per file.",
      },
      {
        question: "Do books need to be approved before publishing?",
        answer:
          "Yes, all submitted books go through a quality review process. Our team checks for content quality, proper formatting, and compliance with our content guidelines. This typically takes 1-3 business days.",
      },
      {
        question: "Can I set my own prices?",
        answer:
          "Yes, you have full control over your book pricing. The only restriction is that prices must meet the platform minimum (currently NGN 500). You can also offer books for free.",
      },
      {
        question: "Can I update my books after publishing?",
        answer:
          "Yes, you can update your book details, cover image, and even replace files at any time. Significant changes may trigger a re-review. Customers who already purchased the book will have access to the updated content.",
      },
    ],
  },
  {
    title: "Technical",
    description: "App features, audio player, and troubleshooting",
    items: [
      {
        question: "Can I download audiobooks for offline listening?",
        answer:
          "Yes, our mobile apps support offline downloads. Navigate to a book in your library and tap the download button. Downloaded content is stored on your device and available without an internet connection.",
      },
      {
        question: "Does the audio player remember my position?",
        answer:
          "Yes, your listening progress is automatically saved and synced across all your devices. You can start listening on your phone and continue on the web, or vice versa.",
      },
      {
        question: "What playback speeds are available?",
        answer:
          "The audio player supports playback speeds of 0.5x, 0.75x, 1x, 1.25x, 1.5x, and 2x. Your preferred speed is remembered for future sessions.",
      },
      {
        question: "Is there a sleep timer?",
        answer:
          "Yes, the audio player includes a sleep timer. You can set it to stop playback after a specified duration (15, 30, 45, or 60 minutes) or at the end of the current chapter.",
      },
      {
        question: "I am having trouble with playback. What should I do?",
        answer:
          "First, check your internet connection. If streaming, try switching between Wi-Fi and mobile data. If the issue persists, try clearing your browser cache or reinstalling the mobile app. You can also contact our support team for assistance.",
      },
      {
        question: "Can I use the ebook reader in dark mode?",
        answer:
          "Yes, the ebook reader supports three reading modes: Light, Dark, and Sepia. You can also adjust font size to your preference. These settings are saved and applied across all your ebooks.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="container text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <HelpCircle className="h-4 w-4" />
            Help Center
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about using AudioBook Hub. Cannot
            find what you are looking for? Contact our support team.
          </p>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-16 container">
        <div className="max-w-3xl mx-auto space-y-12">
          {categories.map((category) => (
            <div key={category.title}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">{category.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.items.map((item, i) => (
                      <details
                        key={i}
                        className="group rounded-lg border p-4 [&_summary::-webkit-details-marker]:hidden"
                      >
                        <summary className="flex cursor-pointer items-center justify-between font-medium text-sm">
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
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* Still Need Help */}
      <section className="py-16 bg-muted/50">
        <div className="container text-center">
          <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Our support team is here to help. Reach out and we will get back to
            you within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/contact">Contact Support</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="mailto:support@audiobookhub.com">
                Email Us Directly
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
