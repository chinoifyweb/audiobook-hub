import { sendEmail } from "./index";
import { lmsTemplates } from "./lms-templates";

const LMS_FROM = "Berean Bible Academy <noreply@bba.org.ng>";

type TemplateName = keyof typeof lmsTemplates;

// Map of template names to their parameter types
type TemplateParams = {
  applicationReceived: [studentName: string, programName: string];
  applicationAccepted: [studentName: string, programName: string, studentId: string];
  applicationRejected: [studentName: string, programName: string, reason?: string];
  courseEnrollmentConfirmed: [studentName: string, courses: Array<{ code: string; title: string }>];
  assignmentDueReminder: [studentName: string, assignmentTitle: string, courseName: string, dueDate: string];
  testExamScheduled: [studentName: string, examTitle: string, courseName: string, date: string, duration: string];
  gradeReleased: [studentName: string, courseName: string, letterGrade: string];
  tuitionPaymentConfirmed: [studentName: string, amount: string, reference: string, semester: string];
  certificateIssued: [studentName: string, programName: string, certificateNumber: string];
  newApplicationNotification: [applicantName: string, programName: string];
  newBookSubmissionNotification: [bookTitle: string, authorName: string];
};

export async function sendLmsEmail<T extends TemplateName>({
  to,
  template,
  data,
}: {
  to: string;
  template: T;
  data: TemplateParams[T];
}) {
  const templateFn = lmsTemplates[template] as (...args: TemplateParams[T]) => { subject: string; html: string };
  const { subject, html } = templateFn(...data);

  return sendEmail({
    to,
    subject,
    html,
    from: LMS_FROM,
  });
}
