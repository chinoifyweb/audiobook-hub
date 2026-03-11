import { Metadata } from "next";
import Link from "next/link";
import {
  Headphones,
  BookOpen,
  Users,
  Globe,
  Heart,
  Lightbulb,
  Target,
  Sparkles,
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
  title: "About Us",
  description:
    "Learn about AudioBook Hub — our mission to make audiobooks and ebooks accessible to everyone, and to empower authors with fair publishing tools.",
  openGraph: {
    title: "About Us - AudioBook Hub",
    description:
      "Our mission is to make audiobooks accessible and empower independent authors.",
  },
};

const stats = [
  { label: "Books Available", value: "10,000+", icon: BookOpen },
  { label: "Active Listeners", value: "50,000+", icon: Headphones },
  { label: "Published Authors", value: "500+", icon: Users },
  { label: "Countries Reached", value: "30+", icon: Globe },
];

const values = [
  {
    icon: Heart,
    title: "Author-First",
    description:
      "We believe creators deserve the largest share of their earnings. Our 70/30 split reflects our commitment to the people who make great content.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description:
      "We continuously improve our platform with better tools, smarter recommendations, and a listening experience that delights our users.",
  },
  {
    icon: Target,
    title: "Accessibility",
    description:
      "Books should be available to everyone. We work to make our platform affordable, fast, and usable across all devices and connection speeds.",
  },
  {
    icon: Sparkles,
    title: "Quality",
    description:
      "Every book on our platform goes through a review process. We maintain high standards so readers and listeners always have a great experience.",
  },
];

const team = [
  {
    name: "Chinedu Adeyemi",
    role: "Founder & CEO",
    description:
      "A lifelong reader and tech entrepreneur passionate about making books accessible across Africa and beyond.",
  },
  {
    name: "Amara Obi",
    role: "Head of Content",
    description:
      "Former publishing editor with over a decade of experience curating and discovering great stories.",
  },
  {
    name: "Tunde Bakare",
    role: "CTO",
    description:
      "Full-stack engineer focused on building scalable platforms that serve millions of users reliably.",
  },
  {
    name: "Ngozi Eze",
    role: "Head of Author Relations",
    description:
      "Works directly with authors to ensure their publishing experience is smooth, profitable, and enjoyable.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            About <span className="text-primary">AudioBook Hub</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We are building the future of book discovery, one listen at a time.
            Our platform connects passionate authors with eager readers and
            listeners around the world.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 container">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Our Story</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              AudioBook Hub was born from a simple observation: millions of
              people love stories but struggle to find time to sit down and
              read. At the same time, talented authors were looking for better
              ways to reach their audience without giving away most of their
              earnings to traditional publishers.
            </p>
            <p>
              We set out to build a platform that solves both problems. For
              listeners and readers, we created an intuitive marketplace with
              thousands of titles across every genre, accessible on any device.
              For authors, we built powerful publishing tools with the best
              royalty rates in the industry.
            </p>
            <p>
              Since our launch, we have grown into a vibrant community of
              authors and listeners who share a love for great books. Every
              day, new stories are published, new listeners discover their
              next favorite title, and authors earn a fair income from their
              creative work.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 container">
        <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          <div>
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              To make audiobooks and ebooks accessible to everyone while
              empowering independent authors with fair, transparent tools to
              publish, sell, and grow their careers. We aim to remove barriers
              between great stories and the people who want to enjoy them.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
            <p className="text-muted-foreground leading-relaxed">
              To become the leading audiobook and ebook marketplace, known for
              treating authors fairly, delighting listeners with an exceptional
              experience, and making the world of books more inclusive and
              accessible than ever before.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {values.map((value) => (
              <Card key={value.title} className="border-0 shadow-none bg-card">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-2">
                    <value.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 container">
        <h2 className="text-3xl font-bold text-center mb-4">Meet the Team</h2>
        <p className="text-center text-muted-foreground mb-12">
          The people behind AudioBook Hub
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {team.map((member) => (
            <Card key={member.name}>
              <CardContent className="pt-6 text-center">
                <div className="h-20 w-20 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
                <h3 className="font-semibold">{member.name}</h3>
                <p className="text-sm text-primary mb-3">{member.role}</p>
                <Separator className="mb-3" />
                <p className="text-xs text-muted-foreground">
                  {member.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-muted/50">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Whether you are a listener looking for your next great book or an
            author ready to share your story, AudioBook Hub is the place for
            you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/books">Browse Books</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/authors">Become an Author</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
