import { Metadata } from "next";
import Link from "next/link";
import {
  Upload,
  DollarSign,
  Globe,
  BarChart3,
  Wallet,
  Settings,
  CheckCircle,
  ArrowRight,
  Star,
  Users,
  BookOpen,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Publish With Us",
  description:
    "Publish your audiobooks and ebooks on AudioBook Hub. Keep 70% royalties, reach a global audience, and grow your author career with our powerful tools.",
  openGraph: {
    title: "Publish With Us - AudioBook Hub",
    description:
      "Keep 70% royalties on every sale. Publish your audiobooks and ebooks today.",
  },
};

const benefits = [
  {
    icon: DollarSign,
    title: "70% Royalties",
    description:
      "Keep the majority of every sale. Our competitive 70/30 split ensures you earn what you deserve for your creative work.",
  },
  {
    icon: Globe,
    title: "Global Reach",
    description:
      "Your books are available to readers and listeners everywhere. Tap into a growing audience of audiobook and ebook enthusiasts.",
  },
  {
    icon: Upload,
    title: "Easy Uploads",
    description:
      "Our intuitive upload tools make publishing a breeze. Upload chapters, set pricing, and go live in minutes, not days.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description:
      "Track sales, revenue, and listener engagement in real time. Know exactly how your books are performing at any moment.",
  },
  {
    icon: Wallet,
    title: "Automatic Payouts",
    description:
      "Get paid automatically through Paystack. No invoicing, no chasing payments. Your earnings are deposited directly to your bank.",
  },
  {
    icon: Settings,
    title: "Full Control",
    description:
      "Set your own prices, update content anytime, and manage your entire catalog from a single powerful dashboard.",
  },
];

const steps = [
  {
    number: "01",
    title: "Apply",
    description:
      "Create an author account and submit your application. Tell us about yourself and your work. Our team reviews applications within 48 hours.",
  },
  {
    number: "02",
    title: "Upload",
    description:
      "Once approved, upload your audiobooks and ebooks using our simple multi-step process. Add cover art, set pricing, and organize chapters.",
  },
  {
    number: "03",
    title: "Earn",
    description:
      "After a quick quality review, your books go live. Start earning from every sale and subscription listen. Track everything from your dashboard.",
  },
];

const testimonials = [
  {
    name: "Adaeze Okafor",
    role: "Fiction Author",
    quote:
      "Publishing on AudioBook Hub transformed my writing career. The 70% royalty rate and automatic payouts mean I can focus on creating great stories.",
    rating: 5,
  },
  {
    name: "Emeka Nwosu",
    role: "Non-Fiction Author",
    quote:
      "The analytics dashboard is incredible. I can see exactly which chapters resonate with listeners and adjust my approach for future books.",
    rating: 5,
  },
  {
    name: "Fatima Bello",
    role: "Self-Help Author",
    quote:
      "I was hesitant about audiobooks, but the upload process was so simple. Within a week, my first audiobook was live and earning. Highly recommend!",
    rating: 5,
  },
];

const supportedFormats = [
  { category: "Audio", formats: ["MP3", "AAC", "M4A", "M4B"] },
  { category: "Ebook", formats: ["EPUB", "PDF"] },
  { category: "Cover Art", formats: ["JPG", "PNG", "WebP"] },
];

export default function AuthorsPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="container text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Publish Your Books{" "}
            <span className="text-primary">With Us</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Reach thousands of listeners and readers. Keep 70% of every sale.
            Join a growing community of independent authors and publishers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup?role=author">
                Apply to Become an Author
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#how-it-works">Learn How It Works</Link>
            </Button>
          </div>
          <div className="flex items-center justify-center gap-8 mt-10 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              500+ Authors
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              10,000+ Books
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              4.9 Author Rating
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 container">
        <h2 className="text-3xl font-bold text-center mb-4">
          Why Publish on AudioBook Hub?
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          We built the platform authors have always wanted. Fair royalties,
          powerful tools, and a growing audience.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {benefits.map((benefit) => (
            <Card key={benefit.title} className="border-0 shadow-none bg-muted/50">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-2">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Commission Breakdown */}
      <section className="py-16 bg-muted/50">
        <div className="container max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-4">
            Transparent Commission
          </h2>
          <p className="text-center text-muted-foreground mb-10">
            You keep the largest share. Always.
          </p>
          <Card className="overflow-hidden">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <p className="text-sm text-muted-foreground mb-2">
                  Example: You price your book at
                </p>
                <p className="text-5xl font-bold text-foreground">&#8358;2,000</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="rounded-lg bg-primary/10 p-6 text-center">
                  <p className="text-sm font-medium text-primary mb-1">
                    You Earn
                  </p>
                  <p className="text-3xl font-bold text-primary">&#8358;1,400</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    70% royalty
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-6 text-center">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Platform Fee
                  </p>
                  <p className="text-3xl font-bold text-muted-foreground">
                    &#8358;600
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    30% covers hosting, payments, support
                  </p>
                </div>
              </div>
              <Separator className="my-6" />
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Paystack processes payments and splits earnings automatically.
                  Your share is deposited directly to your bank account. No
                  manual invoicing required.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 container">
        <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
        <p className="text-center text-muted-foreground mb-12">
          Three simple steps to start earning from your books
        </p>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="text-5xl font-bold text-primary/20 mb-4">
                {step.number}
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Supported Formats */}
      <section className="py-16 bg-muted/50">
        <div className="container max-w-3xl">
          <h2 className="text-2xl font-bold text-center mb-10">
            Supported File Formats
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {supportedFormats.map((group) => (
              <Card key={group.category}>
                <CardHeader>
                  <CardTitle className="text-base">{group.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {group.formats.map((format) => (
                      <span
                        key={format}
                        className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      >
                        {format}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 container">
        <h2 className="text-3xl font-bold text-center mb-4">
          What Authors Are Saying
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          Hear from authors who are already publishing with us
        </p>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="relative">
              <CardContent className="pt-6">
                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <Separator className="mb-3" />
                <p className="font-medium text-sm">{testimonial.name}</p>
                <p className="text-xs text-muted-foreground">
                  {testimonial.role}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Share Your Story?
          </h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Join hundreds of authors who are earning from their audiobooks and
            ebooks on AudioBook Hub. Apply today and start publishing.
          </p>
          <Button
            size="lg"
            variant="secondary"
            asChild
          >
            <Link href="/signup?role=author">
              Apply to Become an Author
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
