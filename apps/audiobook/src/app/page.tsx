import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui";
import Link from "next/link";
import {
  Headphones,
  BookOpen,
  Upload,
  CreditCard,
  Star,
  Users,
  TrendingUp,
  CheckCircle,
} from "lucide-react";



const genres = [
  { name: "Fiction", icon: "📚", color: "bg-blue-50 text-blue-700" },
  { name: "Non-Fiction", icon: "📖", color: "bg-green-50 text-green-700" },
  { name: "Science Fiction", icon: "🚀", color: "bg-purple-50 text-purple-700" },
  { name: "Romance", icon: "💕", color: "bg-pink-50 text-pink-700" },
  { name: "Mystery", icon: "🔍", color: "bg-amber-50 text-amber-700" },
  { name: "Self-Help", icon: "🌱", color: "bg-teal-50 text-teal-700" },
  { name: "Business", icon: "💼", color: "bg-slate-50 text-slate-700" },
  { name: "Biography", icon: "👤", color: "bg-orange-50 text-orange-700" },
];

const customerSteps = [
  {
    icon: BookOpen,
    title: "Browse & Discover",
    description: "Explore thousands of audiobooks and ebooks across all genres",
  },
  {
    icon: CreditCard,
    title: "Purchase or Subscribe",
    description: "Buy individual titles or get unlimited access with a subscription",
  },
  {
    icon: Headphones,
    title: "Listen Anywhere",
    description: "Enjoy on web or mobile with our advanced audio player",
  },
];

const authorSteps = [
  {
    icon: Upload,
    title: "Upload Your Work",
    description: "Submit your audiobook or ebook with our easy upload tools",
  },
  {
    icon: CheckCircle,
    title: "Get Approved",
    description: "Our team reviews your submission for quality assurance",
  },
  {
    icon: TrendingUp,
    title: "Earn Royalties",
    description: "Keep 70% of every sale with automatic Paystack payouts",
  },
];

const plans = [
  {
    name: "Basic",
    price: "1,500",
    interval: "month",
    features: [
      "5 audiobooks per month",
      "Unlimited ebooks",
      "Standard audio quality",
      "Web & mobile access",
    ],
  },
  {
    name: "Premium",
    price: "3,000",
    interval: "month",
    popular: true,
    features: [
      "15 audiobooks per month",
      "Unlimited ebooks",
      "HD audio quality",
      "Offline downloads",
      "Priority support",
    ],
  },
  {
    name: "VIP",
    price: "5,000",
    interval: "month",
    features: [
      "Unlimited audiobooks",
      "Unlimited ebooks",
      "HD audio quality",
      "Offline downloads",
      "Priority support",
      "Early access to new releases",
    ],
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="container flex flex-col items-center text-center gap-8">
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Star className="h-4 w-4" />
            Over 10,000+ Audiobooks & Ebooks
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl">
            Your Next Great Listen is{" "}
            <span className="text-primary">Waiting</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
            Discover premium audiobooks and ebooks from top authors.
            Listen anywhere, anytime. Start your journey today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" asChild>
              <Link href="/books">Browse Books</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/authors">Become an Author</Link>
            </Button>
          </div>
          <div className="flex items-center gap-8 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              50K+ Listeners
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              10K+ Titles
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              4.8 Average Rating
            </div>
          </div>
        </div>
      </section>

      {/* Genre Categories */}
      <section className="py-16 container">
        <h2 className="text-3xl font-bold text-center mb-10">
          Browse by Genre
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {genres.map((genre) => (
            <Link
              key={genre.name}
              href={`/books?genre=${genre.name.toLowerCase().replace(/\s+/g, "-")}`}
              className={`flex flex-col items-center gap-3 p-6 rounded-lg border transition-all hover:shadow-md hover:-translate-y-1 ${genre.color}`}
            >
              <span className="text-3xl">{genre.icon}</span>
              <span className="font-medium text-sm">{genre.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works - Customers */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-4">
            How It Works
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Start listening in three easy steps
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {customerSteps.map((step, i) => (
              <div
                key={step.title}
                className="flex flex-col items-center text-center gap-4"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-sm font-medium text-primary">
                  Step {i + 1}
                </div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription Plans */}
      <section className="py-16 container">
        <h2 className="text-3xl font-bold text-center mb-4">
          Choose Your Plan
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          Unlock unlimited listening with our flexible subscriptions
        </p>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${
                plan.popular ? "border-primary shadow-lg scale-105" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">
                    ₦{plan.price}
                  </span>
                  /{plan.interval}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <Link href="/pricing">Subscribe Now</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* For Authors */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-4">
            Publish With Us
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Keep 70% of every sale. We handle the rest.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {authorSteps.map((step, i) => (
              <div
                key={step.title}
                className="flex flex-col items-center text-center gap-4"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-sm font-medium text-primary">
                  Step {i + 1}
                </div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button size="lg" asChild>
              <Link href="/authors">Start Publishing Today</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 container">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Stay in the Loop</h2>
          <p className="text-muted-foreground mb-8">
            Get notified about new releases, author spotlights, and exclusive deals.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <Button type="submit" size="lg">
              Subscribe
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
