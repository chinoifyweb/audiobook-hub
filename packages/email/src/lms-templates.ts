// LMS Email Templates for Berean Bible Academy
// Each method returns { subject, html } for use with sendEmail

const BBA_NAVY = "#1e3a5f";
const BBA_LIGHT_BG = "#f4f6f9";
const TEXT_COLOR = "#333333";
const MUTED_TEXT = "#666666";

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${BBA_LIGHT_BG};font-family:Arial,Helvetica,sans-serif;color:${TEXT_COLOR};line-height:1.6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BBA_LIGHT_BG};">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:${BBA_NAVY};padding:24px 32px;text-align:center;">
              <h1 style="margin:0;font-size:22px;color:#ffffff;font-weight:700;letter-spacing:0.5px;">Berean Bible Academy</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background-color:${BBA_LIGHT_BG};text-align:center;border-top:1px solid #e0e4ea;">
              <p style="margin:0;font-size:12px;color:${MUTED_TEXT};">
                &copy; ${new Date().getFullYear()} Berean Bible Academy. All rights reserved.
              </p>
              <p style="margin:4px 0 0;font-size:12px;color:${MUTED_TEXT};">
                This is an automated message. Please do not reply directly to this email.
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
  return `<h2 style="margin:0 0 16px;font-size:20px;color:${BBA_NAVY};font-weight:700;">${text}</h2>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:${TEXT_COLOR};">${text}</p>`;
}

function infoBox(content: string): string {
  return `<div style="background-color:${BBA_LIGHT_BG};border-left:4px solid ${BBA_NAVY};padding:16px 20px;border-radius:4px;margin:16px 0;">${content}</div>`;
}

function greeting(name: string): string {
  return paragraph(`Dear ${name},`);
}

function signOff(): string {
  return `${paragraph("If you have any questions, please contact the administration office.")}
<p style="margin:0;font-size:15px;color:${TEXT_COLOR};">Warm regards,<br><strong style="color:${BBA_NAVY};">Berean Bible Academy</strong></p>`;
}

export const lmsTemplates = {
  applicationReceived(
    studentName: string,
    programName: string
  ): { subject: string; html: string } {
    return {
      subject: `Application Received — ${programName}`,
      html: layout(
        "Application Received",
        `${heading("Application Received")}
        ${greeting(studentName)}
        ${paragraph(`Thank you for submitting your application to the <strong>${programName}</strong> program at Berean Bible Academy.`)}
        ${paragraph("Your application is now under review. Our admissions team will carefully evaluate your submission and get back to you as soon as possible.")}
        ${infoBox(`<p style="margin:0;font-size:14px;color:${TEXT_COLOR};"><strong>Program:</strong> ${programName}</p>
        <p style="margin:4px 0 0;font-size:14px;color:${TEXT_COLOR};"><strong>Status:</strong> Under Review</p>`)}
        ${paragraph("Please allow a few business days for the review process. You will receive an email notification once a decision has been made.")}
        ${signOff()}`
      ),
    };
  },

  applicationAccepted(
    studentName: string,
    programName: string,
    studentId: string
  ): { subject: string; html: string } {
    return {
      subject: `Congratulations! You've Been Accepted — ${programName}`,
      html: layout(
        "Application Accepted",
        `${heading("Congratulations!")}
        ${greeting(studentName)}
        ${paragraph(`We are pleased to inform you that your application to the <strong>${programName}</strong> program has been <strong style="color:#16a34a;">accepted</strong>.`)}
        ${infoBox(`<p style="margin:0;font-size:14px;color:${TEXT_COLOR};"><strong>Program:</strong> ${programName}</p>
        <p style="margin:4px 0 0;font-size:14px;color:${TEXT_COLOR};"><strong>Student ID:</strong> ${studentId}</p>`)}
        ${paragraph("Your student account has been created. You can now log in to the student portal to complete your enrollment, register for courses, and make tuition payments.")}
        ${paragraph("We look forward to having you as part of the Berean Bible Academy community!")}
        ${signOff()}`
      ),
    };
  },

  applicationRejected(
    studentName: string,
    programName: string,
    reason?: string
  ): { subject: string; html: string } {
    const reasonBlock = reason
      ? infoBox(`<p style="margin:0;font-size:14px;color:${TEXT_COLOR};"><strong>Reason:</strong> ${reason}</p>`)
      : "";
    return {
      subject: `Application Update — ${programName}`,
      html: layout(
        "Application Update",
        `${heading("Application Update")}
        ${greeting(studentName)}
        ${paragraph(`Thank you for your interest in the <strong>${programName}</strong> program at Berean Bible Academy.`)}
        ${paragraph("After careful review, we regret to inform you that we are unable to offer you admission at this time.")}
        ${reasonBlock}
        ${paragraph("We encourage you to consider reapplying in a future admissions cycle. If you have questions about this decision or would like guidance for a future application, please do not hesitate to reach out.")}
        ${signOff()}`
      ),
    };
  },

  courseEnrollmentConfirmed(
    studentName: string,
    courses: Array<{ code: string; title: string }>
  ): { subject: string; html: string } {
    const courseRows = courses
      .map(
        (c) =>
          `<tr><td style="padding:8px 12px;border-bottom:1px solid #e0e4ea;font-size:14px;font-weight:600;color:${BBA_NAVY};">${c.code}</td><td style="padding:8px 12px;border-bottom:1px solid #e0e4ea;font-size:14px;color:${TEXT_COLOR};">${c.title}</td></tr>`
      )
      .join("");
    return {
      subject: "Course Enrollment Confirmed",
      html: layout(
        "Enrollment Confirmed",
        `${heading("Enrollment Confirmed")}
        ${greeting(studentName)}
        ${paragraph("You have been successfully enrolled in the following courses:")}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #e0e4ea;border-radius:4px;overflow:hidden;">
          <tr style="background-color:${BBA_NAVY};">
            <th style="padding:10px 12px;text-align:left;font-size:13px;color:#ffffff;font-weight:600;">Code</th>
            <th style="padding:10px 12px;text-align:left;font-size:13px;color:#ffffff;font-weight:600;">Course Title</th>
          </tr>
          ${courseRows}
        </table>
        ${paragraph("Please check the student portal for your class schedule, course materials, and lecturer information.")}
        ${signOff()}`
      ),
    };
  },

  assignmentDueReminder(
    studentName: string,
    assignmentTitle: string,
    courseName: string,
    dueDate: string
  ): { subject: string; html: string } {
    return {
      subject: `Assignment Due Soon — ${assignmentTitle}`,
      html: layout(
        "Assignment Reminder",
        `${heading("Assignment Due Reminder")}
        ${greeting(studentName)}
        ${paragraph("This is a friendly reminder that you have an upcoming assignment deadline.")}
        ${infoBox(`<p style="margin:0;font-size:14px;color:${TEXT_COLOR};"><strong>Assignment:</strong> ${assignmentTitle}</p>
        <p style="margin:4px 0 0;font-size:14px;color:${TEXT_COLOR};"><strong>Course:</strong> ${courseName}</p>
        <p style="margin:4px 0 0;font-size:14px;color:${TEXT_COLOR};"><strong>Due Date:</strong> ${dueDate}</p>`)}
        ${paragraph("Please ensure your work is submitted before the deadline. Late submissions may not be accepted or could incur penalties.")}
        ${signOff()}`
      ),
    };
  },

  testExamScheduled(
    studentName: string,
    examTitle: string,
    courseName: string,
    date: string,
    duration: string
  ): { subject: string; html: string } {
    return {
      subject: `Exam Scheduled — ${examTitle}`,
      html: layout(
        "Exam Notification",
        `${heading("Exam Scheduled")}
        ${greeting(studentName)}
        ${paragraph("An exam has been scheduled for one of your courses. Please see the details below.")}
        ${infoBox(`<p style="margin:0;font-size:14px;color:${TEXT_COLOR};"><strong>Exam:</strong> ${examTitle}</p>
        <p style="margin:4px 0 0;font-size:14px;color:${TEXT_COLOR};"><strong>Course:</strong> ${courseName}</p>
        <p style="margin:4px 0 0;font-size:14px;color:${TEXT_COLOR};"><strong>Date:</strong> ${date}</p>
        <p style="margin:4px 0 0;font-size:14px;color:${TEXT_COLOR};"><strong>Duration:</strong> ${duration}</p>`)}
        ${paragraph("Make sure to prepare adequately and arrive on time. Check the student portal for any additional instructions from your lecturer.")}
        ${signOff()}`
      ),
    };
  },

  gradeReleased(
    studentName: string,
    courseName: string,
    letterGrade: string
  ): { subject: string; html: string } {
    return {
      subject: `Grade Released — ${courseName}`,
      html: layout(
        "Grade Released",
        `${heading("Grade Released")}
        ${greeting(studentName)}
        ${paragraph(`Your grade for <strong>${courseName}</strong> has been released.`)}
        ${infoBox(`<p style="margin:0;font-size:14px;color:${TEXT_COLOR};"><strong>Course:</strong> ${courseName}</p>
        <p style="margin:4px 0 0;font-size:14px;color:${TEXT_COLOR};"><strong>Grade:</strong> <span style="font-size:18px;font-weight:700;color:${BBA_NAVY};">${letterGrade}</span></p>`)}
        ${paragraph("You can view the full breakdown and any lecturer comments on your student portal.")}
        ${signOff()}`
      ),
    };
  },

  tuitionPaymentConfirmed(
    studentName: string,
    amount: string,
    reference: string,
    semester: string
  ): { subject: string; html: string } {
    return {
      subject: `Payment Confirmed — ${semester}`,
      html: layout(
        "Payment Confirmed",
        `${heading("Payment Confirmed")}
        ${greeting(studentName)}
        ${paragraph("Your tuition payment has been successfully received. Here is your payment summary:")}
        ${infoBox(`<p style="margin:0;font-size:14px;color:${TEXT_COLOR};"><strong>Amount:</strong> ${amount}</p>
        <p style="margin:4px 0 0;font-size:14px;color:${TEXT_COLOR};"><strong>Reference:</strong> ${reference}</p>
        <p style="margin:4px 0 0;font-size:14px;color:${TEXT_COLOR};"><strong>Semester:</strong> ${semester}</p>`)}
        ${paragraph("Please keep this email as a record of your payment. You can also view and download receipts from your student portal.")}
        ${signOff()}`
      ),
    };
  },

  certificateIssued(
    studentName: string,
    programName: string,
    certificateNumber: string
  ): { subject: string; html: string } {
    return {
      subject: `Certificate Issued — ${programName}`,
      html: layout(
        "Certificate Issued",
        `${heading("Your Certificate Is Ready!")}
        ${greeting(studentName)}
        ${paragraph(`Congratulations on completing the <strong>${programName}</strong> program! Your certificate has been issued.`)}
        ${infoBox(`<p style="margin:0;font-size:14px;color:${TEXT_COLOR};"><strong>Program:</strong> ${programName}</p>
        <p style="margin:4px 0 0;font-size:14px;color:${TEXT_COLOR};"><strong>Certificate No:</strong> ${certificateNumber}</p>`)}
        ${paragraph("You can download your certificate from the student portal. If you require a physical copy, please contact the administration office.")}
        ${paragraph("We celebrate this achievement with you and pray that your studies will bear fruit in your ministry and service.")}
        ${signOff()}`
      ),
    };
  },

  // Admin-facing templates

  newApplicationNotification(
    applicantName: string,
    programName: string
  ): { subject: string; html: string } {
    return {
      subject: `New Application — ${applicantName}`,
      html: layout(
        "New Application",
        `${heading("New Student Application")}
        ${paragraph("A new student application has been submitted and requires your review.")}
        ${infoBox(`<p style="margin:0;font-size:14px;color:${TEXT_COLOR};"><strong>Applicant:</strong> ${applicantName}</p>
        <p style="margin:4px 0 0;font-size:14px;color:${TEXT_COLOR};"><strong>Program:</strong> ${programName}</p>`)}
        ${paragraph("Please log in to the admin portal to review this application and take the appropriate action.")}
        <p style="margin:0;font-size:15px;color:${TEXT_COLOR};">— BBA Admin System</p>`
      ),
    };
  },

  newBookSubmissionNotification(
    bookTitle: string,
    authorName: string
  ): { subject: string; html: string } {
    return {
      subject: `New Book Submission — ${bookTitle}`,
      html: layout(
        "New Book Submission",
        `${heading("New Book Submission")}
        ${paragraph("A new book has been submitted for review.")}
        ${infoBox(`<p style="margin:0;font-size:14px;color:${TEXT_COLOR};"><strong>Title:</strong> ${bookTitle}</p>
        <p style="margin:4px 0 0;font-size:14px;color:${TEXT_COLOR};"><strong>Author:</strong> ${authorName}</p>`)}
        ${paragraph("Please log in to the admin panel to review this submission and approve or reject it.")}
        <p style="margin:0;font-size:15px;color:${TEXT_COLOR};">— BBA Admin System</p>`
      ),
    };
  },
};
