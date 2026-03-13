// ─── Shared Layout Helpers ────────────────────────────────────────────────────

const BRAND_COLOR = '#7C3AED';
const BRAND_LIGHT = '#EDE9FE';
const TEXT_COLOR = '#1F2937';
const TEXT_MUTED = '#6B7280';

function layout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AudioBook Hub</title>
</head>
<body style="margin:0;padding:0;background-color:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3F4F6;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND_COLOR};padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#FFFFFF;font-size:24px;font-weight:700;letter-spacing:-0.5px;">AudioBook Hub</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background-color:#F9FAFB;border-top:1px solid #E5E7EB;">
              <p style="margin:0 0 8px 0;font-size:13px;color:${TEXT_MUTED};text-align:center;">
                AudioBook Hub &mdash; Your gateway to great stories
              </p>
              <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;">
                You received this email because you have an account with AudioBook Hub.<br/>
                If you did not expect this email, please ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function heading(text: string): string {
  return `<h2 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:${TEXT_COLOR};">${text}</h2>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:${TEXT_COLOR};">${text}</p>`;
}

function button(text: string, href: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="background-color:${BRAND_COLOR};border-radius:8px;">
        <a href="${href}" target="_blank" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`;
}

function infoBox(text: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
    <tr>
      <td style="background-color:${BRAND_LIGHT};border-left:4px solid ${BRAND_COLOR};border-radius:4px;padding:16px;">
        <p style="margin:0;font-size:14px;line-height:1.5;color:${TEXT_COLOR};">${text}</p>
      </td>
    </tr>
  </table>`;
}

function divider(): string {
  return `<hr style="margin:24px 0;border:none;border-top:1px solid #E5E7EB;" />`;
}

// ─── Customer Emails ─────────────────────────────────────────────────────────

export function welcomeEmail(name: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://audiobookhub.com';
  return layout(`
    ${heading(`Welcome to AudioBook Hub, ${name}!`)}
    ${paragraph('We\'re thrilled to have you join our community of book lovers. AudioBook Hub gives you access to thousands of audiobooks and ebooks from talented authors around the world.')}
    ${paragraph('Here\'s what you can do right away:')}
    <ul style="margin:0 0 16px 0;padding-left:24px;font-size:15px;line-height:1.8;color:${TEXT_COLOR};">
      <li>Browse our catalog of audiobooks and ebooks</li>
      <li>Purchase individual titles or subscribe for unlimited access</li>
      <li>Listen on any device with our built-in audio player</li>
      <li>Track your reading and listening progress</li>
    </ul>
    ${button('Start Browsing', `${appUrl}/books`)}
    ${paragraph('Happy listening!')}
  `);
}

export function purchaseConfirmationEmail(
  name: string,
  bookTitle: string,
  amount: string,
  date: string
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://audiobookhub.com';
  return layout(`
    ${heading('Purchase Confirmed')}
    ${paragraph(`Hi ${name}, your purchase has been completed successfully!`)}
    ${infoBox(`
      <strong>Book:</strong> ${bookTitle}<br/>
      <strong>Amount:</strong> ${amount}<br/>
      <strong>Date:</strong> ${date}<br/>
      <strong>Status:</strong> Successful
    `)}
    ${paragraph('The book has been added to your library and is ready to enjoy.')}
    ${button('Go to My Library', `${appUrl}/dashboard`)}
    ${divider()}
    ${paragraph(`<span style="font-size:13px;color:${TEXT_MUTED};">If you have any issues with your purchase, please contact our support team.</span>`)}
  `);
}

export function subscriptionActivatedEmail(
  name: string,
  planName: string,
  nextBillingDate: string
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://audiobookhub.com';
  return layout(`
    ${heading('Subscription Activated')}
    ${paragraph(`Hi ${name}, your subscription is now active!`)}
    ${infoBox(`
      <strong>Plan:</strong> ${planName}<br/>
      <strong>Next Billing Date:</strong> ${nextBillingDate}<br/>
      <strong>Status:</strong> Active
    `)}
    ${paragraph('You now have access to our full catalog of audiobooks and ebooks. Start exploring and enjoy unlimited listening and reading.')}
    ${button('Browse the Catalog', `${appUrl}/books`)}
  `);
}

export function subscriptionCancelledEmail(
  name: string,
  planName: string,
  endDate: string
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://audiobookhub.com';
  return layout(`
    ${heading('Subscription Cancelled')}
    ${paragraph(`Hi ${name}, your subscription has been cancelled as requested.`)}
    ${infoBox(`
      <strong>Plan:</strong> ${planName}<br/>
      <strong>Access Until:</strong> ${endDate}<br/>
      <strong>Status:</strong> Cancelled
    `)}
    ${paragraph('You will continue to have access to subscription content until the end of your current billing period. After that, you can still access any books you have purchased individually.')}
    ${paragraph('Changed your mind? You can resubscribe at any time.')}
    ${button('Resubscribe', `${appUrl}/pricing`)}
  `);
}

export function passwordResetEmail(name: string, resetLink: string): string {
  return layout(`
    ${heading('Reset Your Password')}
    ${paragraph(`Hi ${name}, we received a request to reset your password.`)}
    ${paragraph('Click the button below to set a new password. This link will expire in 1 hour.')}
    ${button('Reset Password', resetLink)}
    ${divider()}
    ${paragraph(`<span style="font-size:13px;color:${TEXT_MUTED};">If you did not request a password reset, you can safely ignore this email. Your password will not be changed.</span>`)}
  `);
}

// ─── Author Emails ───────────────────────────────────────────────────────────

export function authorApplicationReceivedEmail(name: string): string {
  return layout(`
    ${heading('Application Received')}
    ${paragraph(`Hi ${name}, thank you for applying to become an author on AudioBook Hub!`)}
    ${paragraph('We have received your application and our team will review it shortly. You will receive an email notification once your application has been processed.')}
    ${infoBox('The review process typically takes 1-3 business days. We will verify your information and get back to you as soon as possible.')}
    ${paragraph('In the meantime, you can prepare your first audiobook or ebook for upload.')}
  `);
}

export function authorApprovedEmail(name: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://audiobookhub.com';
  return layout(`
    ${heading('Congratulations! You\'re Approved')}
    ${paragraph(`Hi ${name}, great news! Your author application has been approved.`)}
    ${paragraph('You can now:')}
    <ul style="margin:0 0 16px 0;padding-left:24px;font-size:15px;line-height:1.8;color:${TEXT_COLOR};">
      <li>Upload and publish audiobooks and ebooks</li>
      <li>Set your own pricing for each title</li>
      <li>Track your sales and earnings in real time</li>
      <li>Receive automatic payouts for your sales</li>
    </ul>
    ${button('Go to Author Dashboard', `${appUrl}/author`)}
    ${paragraph('Welcome aboard, and happy publishing!')}
  `);
}

export function authorRejectedEmail(name: string, reason: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://audiobookhub.com';
  return layout(`
    ${heading('Application Update')}
    ${paragraph(`Hi ${name}, thank you for your interest in publishing on AudioBook Hub.`)}
    ${paragraph('After reviewing your application, we are unable to approve it at this time.')}
    ${infoBox(`<strong>Reason:</strong> ${reason}`)}
    ${paragraph('You are welcome to update your information and reapply. If you have questions, please reach out to our support team.')}
    ${button('Contact Support', `${appUrl}/contact`)}
  `);
}

export function bookApprovedEmail(authorName: string, bookTitle: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://audiobookhub.com';
  return layout(`
    ${heading('Book Published!')}
    ${paragraph(`Hi ${authorName}, your book has been approved and is now live on AudioBook Hub!`)}
    ${infoBox(`<strong>Title:</strong> ${bookTitle}<br/><strong>Status:</strong> Published`)}
    ${paragraph('Your book is now visible in our catalog and available for purchase by customers. You can track sales and earnings from your author dashboard.')}
    ${button('View Your Books', `${appUrl}/author/books`)}
  `);
}

export function bookRejectedEmail(
  authorName: string,
  bookTitle: string,
  reason: string
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://audiobookhub.com';
  return layout(`
    ${heading('Book Submission Update')}
    ${paragraph(`Hi ${authorName}, we have reviewed your book submission and unfortunately it was not approved at this time.`)}
    ${infoBox(`
      <strong>Title:</strong> ${bookTitle}<br/>
      <strong>Status:</strong> Rejected<br/>
      <strong>Reason:</strong> ${reason}
    `)}
    ${paragraph('You can update your book and resubmit it for review from your author dashboard.')}
    ${button('Edit Your Book', `${appUrl}/author/books`)}
  `);
}

export function newSaleEmail(
  authorName: string,
  bookTitle: string,
  earnings: string
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://audiobookhub.com';
  return layout(`
    ${heading('New Sale!')}
    ${paragraph(`Hi ${authorName}, congratulations! You just made a sale.`)}
    ${infoBox(`
      <strong>Book:</strong> ${bookTitle}<br/>
      <strong>Your Earnings:</strong> ${earnings}
    `)}
    ${paragraph('Your earnings have been added to your balance. You can view your full earnings breakdown from your dashboard.')}
    ${button('View Earnings', `${appUrl}/author/earnings`)}
  `);
}

// ─── Admin Emails ────────────────────────────────────────────────────────────

export function newAuthorApplicationEmail(authorName: string, email: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://audiobookhub.com';
  return layout(`
    ${heading('New Author Application')}
    ${paragraph('A new author has applied to publish on AudioBook Hub.')}
    ${infoBox(`
      <strong>Name:</strong> ${authorName}<br/>
      <strong>Email:</strong> ${email}
    `)}
    ${paragraph('Please review their application and approve or reject it from the admin panel.')}
    ${button('Review Application', `${appUrl}/admin/authors`)}
  `);
}

export function newBookSubmissionEmail(bookTitle: string, authorName: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://audiobookhub.com';
  return layout(`
    ${heading('New Book Submission')}
    ${paragraph('A new book has been submitted for review.')}
    ${infoBox(`
      <strong>Title:</strong> ${bookTitle}<br/>
      <strong>Author:</strong> ${authorName}
    `)}
    ${paragraph('Please review the submission and approve or reject it from the admin panel.')}
    ${button('Review Book', `${appUrl}/admin/books`)}
  `);
}
