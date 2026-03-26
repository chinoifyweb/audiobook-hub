import { Separator } from "@repo/ui";
import { Metadata } from "next";


export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read the AudioBook Hub Terms of Service. These terms govern your use of our platform, including purchases, subscriptions, and content publishing.",
  openGraph: {
    title: "Terms of Service - AudioBook Hub",
    description: "Terms governing the use of the AudioBook Hub platform.",
  },
};

const lastUpdated = "March 1, 2026";

export default function TermsPage() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 container">
        <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold mb-3">1. Acceptance of Terms</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                By accessing or using AudioBook Hub (the &quot;Platform&quot;), you agree
                to be bound by these Terms of Service (&quot;Terms&quot;). If you do not
                agree to these Terms, you may not use the Platform. These Terms
                apply to all visitors, users, and others who access or use the
                Platform, including customers, authors, and administrators.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-bold mb-3">2. Account Registration</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                To use certain features of the Platform, you must register for an
                account. When you register, you agree to:
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your password and accept all risks of unauthorized access</li>
                <li>Notify us immediately if you discover any unauthorized use of your account</li>
                <li>Be responsible for all activities that occur under your account</li>
              </ul>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                You must be at least 18 years old to create an account. We
                reserve the right to suspend or terminate accounts that violate
                these Terms.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-bold mb-3">3. Subscriptions and Purchases</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                The Platform offers both subscription plans and individual book
                purchases:
              </p>
              <h3 className="text-base font-semibold mt-4 mb-2">3.1 Subscriptions</h3>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                <li>Subscription plans provide access to the Platform catalog based on the selected tier</li>
                <li>Subscriptions are billed on a recurring basis (monthly, quarterly, or annually)</li>
                <li>You may cancel your subscription at any time; access continues until the end of the current billing period</li>
                <li>We reserve the right to change subscription pricing with 30 days advance notice</li>
              </ul>
              <h3 className="text-base font-semibold mt-4 mb-2">3.2 Individual Purchases</h3>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                <li>Individual book purchases grant permanent access to the purchased content</li>
                <li>All prices are displayed in Nigerian Naira (NGN) and include applicable taxes</li>
                <li>Payments are processed securely through Paystack</li>
                <li>Refunds are available within 7 days of purchase if the content has not been substantially consumed</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-bold mb-3">4. Content and Intellectual Property</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                All content available on the Platform, including audiobooks,
                ebooks, cover images, descriptions, and other materials, is
                protected by copyright and other intellectual property laws.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                <li>You may not copy, distribute, modify, or create derivative works from any content</li>
                <li>Purchased or subscription content is licensed for personal, non-commercial use only</li>
                <li>You may not share your account credentials to provide access to others</li>
                <li>Circumventing digital rights management or access controls is prohibited</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-bold mb-3">5. Author Terms</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Authors who publish content on the Platform agree to the
                following additional terms:
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                <li>You must own or have the necessary rights and licenses to publish the content</li>
                <li>Content must not infringe on the intellectual property rights of others</li>
                <li>All content is subject to review and approval by our team before publication</li>
                <li>The Platform retains a commission on each sale as defined by the current commission structure (default 30%)</li>
                <li>Author payouts are processed through Paystack according to the settlement schedule</li>
                <li>You are responsible for the accuracy of your bank account and payment details</li>
                <li>We reserve the right to remove content that violates these Terms or our content guidelines</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-bold mb-3">6. Prohibited Conduct</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                You agree not to:
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                <li>Use the Platform for any unlawful purpose</li>
                <li>Upload, publish, or transmit content that is illegal, harmful, threatening, abusive, or otherwise objectionable</li>
                <li>Attempt to gain unauthorized access to the Platform or its systems</li>
                <li>Interfere with or disrupt the Platform or servers</li>
                <li>Use automated systems (bots, scrapers) to access the Platform without permission</li>
                <li>Impersonate any person or entity or misrepresent your affiliation</li>
                <li>Upload malicious code or attempt to compromise Platform security</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-bold mb-3">7. Limitation of Liability</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                To the maximum extent permitted by law, AudioBook Hub and its
                affiliates, officers, employees, agents, and partners shall not
                be liable for any indirect, incidental, special, consequential,
                or punitive damages, including without limitation, loss of
                profits, data, use, goodwill, or other intangible losses,
                resulting from your access to or use of or inability to access
                or use the Platform. Our total liability for any claims under
                these Terms shall not exceed the amount you have paid to us in
                the twelve (12) months prior to the claim.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-bold mb-3">8. Disclaimer of Warranties</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The Platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis
                without warranties of any kind, either express or implied,
                including but not limited to implied warranties of
                merchantability, fitness for a particular purpose, and
                non-infringement. We do not warrant that the Platform will be
                uninterrupted, timely, secure, or error-free.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-bold mb-3">9. Termination</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We may terminate or suspend your account and access to the
                Platform immediately, without prior notice or liability, for any
                reason, including if you breach these Terms. Upon termination,
                your right to use the Platform will cease immediately. All
                provisions of these Terms which by their nature should survive
                termination shall survive, including ownership provisions,
                warranty disclaimers, and limitations of liability.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-bold mb-3">10. Changes to Terms</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We reserve the right to modify or replace these Terms at any
                time. If a revision is material, we will provide at least 30
                days notice prior to any new terms taking effect. What
                constitutes a material change will be determined at our sole
                discretion. Your continued use of the Platform after the
                effective date of any changes constitutes acceptance of the new
                Terms.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-bold mb-3">11. Governing Law</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance
                with the laws of the Federal Republic of Nigeria, without
                regard to its conflict of law provisions. Any disputes arising
                under these Terms shall be subject to the exclusive
                jurisdiction of the courts in Lagos, Nigeria.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-bold mb-3">12. Contact Us</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If you have any questions about these Terms, please contact us
                at:
              </p>
              <div className="mt-3 text-sm text-muted-foreground">
                <p>AudioBook Hub</p>
                <p>Email: legal@audiobookhub.com</p>
                <p>Address: 14 Victoria Island, Lagos, Nigeria</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
