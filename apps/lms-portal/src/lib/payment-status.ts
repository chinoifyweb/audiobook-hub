import { prisma } from "@repo/db";

export interface PaymentStatus {
  hasPaid: boolean;
  hasScholarship: boolean;
  amountDue: number;
  amountPaid: number;
  balance: number;
  programName: string;
  programCode: string;
  semesterName: string;
  sessionName: string;
}

/**
 * Check a student's tuition payment status for a given semester.
 * A student is considered "paid" if they have a successful tuition payment
 * covering the full amount, OR if they have a scholarship/waiver payment.
 */
export async function checkPaymentStatus(
  studentId: string,
  semesterId: string
): Promise<PaymentStatus> {
  // Get student profile with program info
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      program: { select: { name: true, code: true, tuitionPerSemester: true } },
    },
  });

  if (!student) {
    return {
      hasPaid: false,
      hasScholarship: false,
      amountDue: 0,
      amountPaid: 0,
      balance: 0,
      programName: "",
      programCode: "",
      semesterName: "",
      sessionName: "",
    };
  }

  // Get the semester info
  const semester = await prisma.semester.findUnique({
    where: { id: semesterId },
    include: { session: true },
  });

  // Get tuition fee for this student's program and semester
  const tuitionFee = await prisma.tuitionFee.findFirst({
    where: {
      programId: student.programId,
      semesterId: semesterId,
      isActive: true,
    },
  });

  const amountDue = tuitionFee?.amount ?? student.program.tuitionPerSemester ?? 0;

  // Get all successful payments for this student for this fee
  const payments = tuitionFee
    ? await prisma.tuitionPayment.findMany({
        where: {
          studentId: studentId,
          tuitionFeeId: tuitionFee.id,
          status: "successful",
        },
      })
    : [];

  const amountPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  // Check for scholarship/waiver - look for a payment with "scholarship" or "waiver" in the reference
  const hasScholarship = payments.some(
    (p) =>
      p.paystackReference?.toLowerCase().includes("scholarship") ||
      p.paystackReference?.toLowerCase().includes("waiver") ||
      p.paystackReference?.toLowerCase().includes("grant")
  );

  const balance = Math.max(0, amountDue - amountPaid);
  const hasPaid = balance === 0 && amountDue > 0;

  return {
    hasPaid: hasPaid || hasScholarship,
    hasScholarship,
    amountDue,
    amountPaid,
    balance,
    programName: student.program.name,
    programCode: student.program.code,
    semesterName: semester?.name ?? "",
    sessionName: semester?.session?.name ?? "",
  };
}

/**
 * Quick check: has the student paid for the current active semester?
 * Returns the full PaymentStatus object.
 */
export async function checkCurrentSemesterPayment(
  studentId: string
): Promise<PaymentStatus> {
  const activeSemester = await prisma.semester.findFirst({
    where: { isActive: true },
  });

  if (!activeSemester) {
    // No active semester - don't block
    return {
      hasPaid: true,
      hasScholarship: false,
      amountDue: 0,
      amountPaid: 0,
      balance: 0,
      programName: "",
      programCode: "",
      semesterName: "",
      sessionName: "",
    };
  }

  return checkPaymentStatus(studentId, activeSemester.id);
}
