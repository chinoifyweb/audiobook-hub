import { sendLmsEmail } from "./lms-email";

export async function notifyApplicationReceived(
  email: string,
  studentName: string,
  programName: string
) {
  return sendLmsEmail({
    to: email,
    template: "applicationReceived",
    data: [studentName, programName],
  });
}

export async function notifyApplicationAccepted(
  email: string,
  studentName: string,
  programName: string,
  studentId: string
) {
  return sendLmsEmail({
    to: email,
    template: "applicationAccepted",
    data: [studentName, programName, studentId],
  });
}

export async function notifyApplicationRejected(
  email: string,
  studentName: string,
  programName: string,
  reason?: string
) {
  return sendLmsEmail({
    to: email,
    template: "applicationRejected",
    data: [studentName, programName, reason],
  });
}

export async function notifyGradeReleased(
  email: string,
  studentName: string,
  courseName: string,
  letterGrade: string
) {
  return sendLmsEmail({
    to: email,
    template: "gradeReleased",
    data: [studentName, courseName, letterGrade],
  });
}

export async function notifyPaymentConfirmed(
  email: string,
  studentName: string,
  amount: string,
  reference: string,
  semester: string
) {
  return sendLmsEmail({
    to: email,
    template: "tuitionPaymentConfirmed",
    data: [studentName, amount, reference, semester],
  });
}

export async function notifyCertificateIssued(
  email: string,
  studentName: string,
  programName: string,
  certificateNumber: string
) {
  return sendLmsEmail({
    to: email,
    template: "certificateIssued",
    data: [studentName, programName, certificateNumber],
  });
}
