import { Metadata } from "next";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read the AudioBook Hub Privacy Policy. Learn how we collect, use, protect, and share your personal information.",
  openGraph: {
    title: "Privacy Policy - AudioBook Hub",
    description: "How AudioBook Hub collects, uses, and protects your data.",
  },
};

const lastUpdated = "March 1, 2026";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 container">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold mb-3">1. Introduction</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AudioBook Hub (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting
                your privacy. This Privacy Policy explains how we collect, use,
                disclose, and safeguard your information when you use our
                platform, including our website and mobile applications
                (collectively, the &quot;Platform&quot;). Please read this policy
                carefully. By using the Platform, you consent to the data
                practices described in this policy.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-bold mb-3">
                2. Information We Collect
              </h2>

              <h3 className="text-base font-semibold mt-4 mb-2">
                2.1 Information You Provide
              </h3>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                <li>
                  <strong>Account Information:</strong> Name, email address,
                  phone number, and password when you create an account
                </li>
                <li>
                  <strong>Profile Information:</strong> Avatar, bio, and other
                  optional profile details
                </li>
                <li>
                  <strong>Payment Information:</strong> Payment details processed
                  securely through Paystack (we do not store full card numbers)
                </li>
                <li>
                  <strong>Author Information:</strong> Bank account details, pen
                  name, biography, and publication details for authors
                </li>
                <li>
                  <strong>Communications:</strong> Messages sent through our
                  contact forms and customer support channels
                </li>
              </ul>

              <h3 className="text-base font-semibold mt-4 mb-2">
                2.2 Information Collected Automatically
              </h3>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                <li>
                  <strong>Usage Data:</strong> Pages viewed, features used,
                  listening and reading progress, search queries
                </li>
                <li>
                  <strong>Device Information:</strong> Device type, operating
                  system, browser type, and screen resolution
                </li>
                <li>
                  <strong>Log Data:</strong> IP address, access times, and
                  referring URLs
                </li>
                <li>
                  <strong>Cookies:</strong> We use cookies and similar
                  technologies to maintain your session and improve user
                  experience
                </li>
              </ul>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-bold mb-3">
                3. How We Use Your Information
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                We use the information we collect for the following purposes:
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                <li>Provide, maintain, and improve the Platform and its features</li>
                <li>Process transactions and send related information (receipts, confirmations)</li>
                <li>Manage subscriptions and user accounts</li>
                <li>Process author payouts and commission payments</li>
                <li>Send transactional emails (account verification, password resets, purchase confirmations)</li>
                <li>Send promotional communications (with your consent, and you can opt out at any time)</li>
                <li>Personalize your experience with book recommendations</li>
                <li>Monitor and analyze usage patterns to improve the Platform</li>
                <li>Detect, investigate, and prevent fraudulent or unauthorized activities</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-bold mb-3">
                4. Information Sharing and Disclosure
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                We do not sell your personal information. We may share your
                information in the following circumstances:
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                <li>
                  <strong>Service Providers:</strong> With third-party service
                  providers who assist in operating the Platform (payment
                  processing via Paystack, email delivery, hosting, analytics)
                </li>
                <li>
                  <strong>Authors:</strong> Aggregated and anonymized sales data
                  is shared with authors for their published works
                </li>
                <li>
                  <strong>Legal Requirements:</strong> When required by law,
                  court order, or governmental authority
                </li>
                <li>
                  <strong>Protection:</strong> To protect the rights, property,
                  or safety of AudioBook Hub, our users, or others
                </li>
                <li>
                  <strong>Business Transfers:</strong> In connection with a
                  merger, acquisition, or sale of all or a portion of our assets
                </li>
              </ul>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-bold mb-3">5. Data Security</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational security
                measures to protect your personal information, including
                encryption of data in transit (SSL/TLS), secure password
                hashing, access controls, and regular security assessments.
                However, no method of transmission over the Internet or
                electronic storage is 100% secure. While we strive to use
                commercially acceptable means to protect your information, we
                cannot guarantee absolute security.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-bold mb-3">6. Data Retention</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We retain your personal information for as long as your account
                is active or as needed to provide you services, comply with
                legal obligations, resolve disputes, and enforce our agreements.
                If you delete your account, we will delete or anonymize your
                personal information within 30 days, except where retention is
                required by law (such as financial transaction records).
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-bold mb-3">7. Your Rights</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Depending on your location, you may have the following rights
                regarding your personal information:
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                <li>
                  <strong>Access:</strong> Request a copy of the personal
                  information we hold about you
                </li>
                <li>
                  <strong>Correction:</strong> Request correction of inaccurate
                  or incomplete information
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your personal
                  information, subject to legal retention requirements
                </li>
                <li>
                  <strong>Portability:</strong> Request your data in a
                  structured, commonly used, and machine-readable format
                </li>
                <li>
                  <strong>Opt-Out:</strong> Unsubscribe from promotional
                  communications at any time
                </li>
                <li>
                  <strong>Restriction:</strong> Request restriction of
                  processing in certain circumstances
                </li>
              </ul>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                To exercise any of these rights, please contact us at
                privacy@audiobookhub.com.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-bold mb-3">8. Cookies</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                We use cookies and similar tracking technologies to enhance your
                experience on the Platform. Types of cookies we use include:
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                <li>
                  <strong>Essential Cookies:</strong> Required for the Platform
                  to function properly (authentication, session management)
                </li>
                <li>
                  <strong>Functional Cookies:</strong> Remember your preferences
                  and settings (playback speed, reading mode)
                </li>
                <li>
                  <strong>Analytics Cookies:</strong> Help us understand how the
                  Platform is used to improve the experience
                </li>
              </ul>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                You can manage cookie preferences through your browser settings.
                Disabling cookies may affect the functionality of the Platform.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-bold mb-3">
                9. Third-Party Services
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The Platform integrates with third-party services including
                Paystack (payment processing), Supabase (data storage and
                authentication), and email service providers. Each of these
                services has its own privacy policy governing the use of your
                information. We encourage you to review the privacy policies of
                these third-party services.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-bold mb-3">
                10. Children&apos;s Privacy
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The Platform is not intended for individuals under the age of
                18. We do not knowingly collect personal information from
                children under 18. If we become aware that we have collected
                personal information from a child under 18, we will take steps
                to delete such information promptly.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-bold mb-3">
                11. Changes to This Policy
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will
                notify you of any material changes by posting the new Privacy
                Policy on this page and updating the &quot;Last updated&quot; date. We
                encourage you to review this Privacy Policy periodically for
                any changes.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-bold mb-3">12. Contact Us</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy or our data
                practices, please contact us at:
              </p>
              <div className="mt-3 text-sm text-muted-foreground">
                <p>AudioBook Hub</p>
                <p>Email: privacy@audiobookhub.com</p>
                <p>Address: 14 Victoria Island, Lagos, Nigeria</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
