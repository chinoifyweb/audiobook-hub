"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  Label,
} from "@repo/ui";
import {
  CreditCard,
  Loader2,
  Receipt,
  CheckCircle,
  Upload,
  AlertCircle,
  Banknote,
  Clock,
  FileText,
  GraduationCap,
  MessageCircle,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import { uploadDocument } from "@/lib/supabase";

interface TuitionFee {
  id: string;
  amount: number;
  description: string | null;
  dueDate: string;
  program: { name: string };
  semester: {
    name: string;
    session: { name: string };
  };
}

interface PaymentRecord {
  id: string;
  amount: number;
  status: string;
  paidAt: string | null;
  paystackReference: string | null;
  receiptUrl: string | null;
  paymentMethod: string | null;
  installmentNumber: number | null;
  paymentPlan: string | null;
  bankName: string | null;
  bankReference: string | null;
  receiptUploadUrl: string | null;
  createdAt: string;
}

interface FeeStatus {
  feeId: string;
  fee: TuitionFee;
  totalDue: number;
  totalPaid: number;
  balance: number;
  scholarshipDiscount: number;
  payments: PaymentRecord[];
}

interface ScholarshipInfo {
  hasApprovedScholarship: boolean;
  approvedPercentage: number;
  discountAmount: number;
}

type PaymentPlan = "full" | "two_installments" | "three_installments";

const PAYMENT_PLANS: { key: PaymentPlan; label: string; description: string; splits: number[] }[] = [
  { key: "full", label: "Full Payment", description: "Pay in full and get 5% discount", splits: [1.0] },
  { key: "two_installments", label: "2 Installments", description: "50% + 50%", splits: [0.5, 0.5] },
  { key: "three_installments", label: "3 Installments", description: "40% + 30% + 30%", splits: [0.4, 0.3, 0.3] },
];

function statusBadge(status: string) {
  switch (status) {
    case "successful":
      return <Badge className="bg-green-600">Paid</Badge>;
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatAmount(kobo: number) {
  return `\u20A6${(kobo / 100).toLocaleString()}`;
}

export default function PaymentsPage() {
  const [feeStatuses, setFeeStatuses] = useState<FeeStatus[]>([]);
  const [scholarship, setScholarship] = useState<ScholarshipInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan>("full");
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptForm, setReceiptForm] = useState({
    amount: "",
    bankName: "",
    reference: "",
    transferDate: "",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchFeeStatus();
  }, []);

  // Check for Paystack callback verification
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference");
    if (reference) {
      fetch(`/api/payments/verify?reference=${reference}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.status === "successful") {
            setMessage({ type: "success", text: "Payment verified successfully!" });
          } else {
            setMessage({ type: "error", text: "Payment verification failed." });
          }
          window.history.replaceState({}, "", "/payments");
          fetchFeeStatus();
        });
    }
  }, []);

  async function fetchFeeStatus() {
    try {
      const res = await fetch("/api/fees/status");
      const data = await res.json();
      if (data.fees) setFeeStatuses(data.fees);
      if (data.scholarship) setScholarship(data.scholarship);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handlePay(feeId: string, amount: number, installmentNumber: number, plan: PaymentPlan) {
    setPaying(feeId);
    try {
      const res = await fetch("/api/fees/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tuitionFeeId: feeId,
          amount,
          installmentNumber,
          paymentPlan: plan,
        }),
      });

      const data = await res.json();

      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else if (data.error) {
        setMessage({ type: "error", text: data.error });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to initialize payment" });
    } finally {
      setPaying(null);
    }
  }

  async function handleReceiptUpload(feeId: string) {
    if (!receiptFile) {
      setMessage({ type: "error", text: "Please select a receipt file" });
      return;
    }
    if (!receiptForm.amount || !receiptForm.bankName || !receiptForm.reference || !receiptForm.transferDate) {
      setMessage({ type: "error", text: "Please fill in all receipt fields" });
      return;
    }

    setUploadingReceipt(true);
    try {
      // Upload file to Supabase
      const uploaded = await uploadDocument(receiptFile, "payment-receipts");
      if (!uploaded) {
        setMessage({ type: "error", text: "Failed to upload receipt file" });
        return;
      }

      const res = await fetch("/api/fees/upload-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tuitionFeeId: feeId,
          amount: Math.round(parseFloat(receiptForm.amount) * 100),
          bankName: receiptForm.bankName,
          bankReference: receiptForm.reference,
          transferDate: receiptForm.transferDate,
          receiptUploadUrl: uploaded.url,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Receipt uploaded successfully! It will be reviewed by admin." });
        setShowReceiptUpload(false);
        setReceiptFile(null);
        setReceiptForm({ amount: "", bankName: "", reference: "", transferDate: "" });
        fetchFeeStatus();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to submit receipt" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to upload receipt" });
    } finally {
      setUploadingReceipt(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentFee = feeStatuses[0]; // Current semester fee

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payments & Fees</h1>
        <p className="text-muted-foreground">Manage your tuition payments and installments</p>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-md px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {message.text}
          <button
            className="ml-auto text-xs underline"
            onClick={() => setMessage(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* No Fees Set Up — Show Direct Payment Options */}
      {!currentFee && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-4 mb-6">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Pay Your Tuition</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose a payment method below to complete your tuition payment.
                </p>
              </div>
            </div>

            {/* Two Payment Method Tabs */}
            <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
              {/* Option 1: Pay Online via Paystack */}
              <Card className="border-2 border-green-200 bg-green-50/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    Pay Online (Paystack)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Pay securely with your debit card, bank transfer, or USSD via Paystack.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="payOnlineAmount">Amount to Pay ({"\u20A6"})</Label>
                    <Input
                      id="payOnlineAmount"
                      type="number"
                      min="1000"
                      placeholder="e.g. 75000"
                      value={receiptForm.amount}
                      onChange={(e) => setReceiptForm({ ...receiptForm, amount: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      {"BA: \u20A675,000 | PGD: \u20A6100,000 | MA: \u20A6125,000 | M.Div: \u20A6150,000"}
                    </p>
                  </div>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={paying === "online" || !receiptForm.amount}
                    onClick={async () => {
                      const amount = parseFloat(receiptForm.amount);
                      if (!amount || amount < 1000) {
                        setMessage({ type: "error", text: "Please enter a valid amount (minimum \u20A61,000)" });
                        return;
                      }
                      setPaying("online");
                      try {
                        const res = await fetch("/api/fees/pay-direct", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ amount: Math.round(amount * 100) }),
                        });
                        const data = await res.json();
                        if (data.authorizationUrl) {
                          window.location.href = data.authorizationUrl;
                        } else {
                          setMessage({ type: "error", text: data.error || "Failed to initialize payment" });
                        }
                      } catch {
                        setMessage({ type: "error", text: "Payment initialization failed" });
                      } finally {
                        setPaying(null);
                      }
                    }}
                  >
                    {paying === "online" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="mr-2 h-4 w-4" />
                    )}
                    Pay {receiptForm.amount ? `\u20A6${Number(receiptForm.amount).toLocaleString()}` : "Now"}
                  </Button>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                    <span>Secured by Paystack. Your card details are safe.</span>
                  </div>
                </CardContent>
              </Card>

              {/* Option 2: Bank Transfer */}
              <Card className="border-2 border-blue-200 bg-blue-50/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-blue-600" />
                    Bank Transfer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Transfer to the school account below, then upload your receipt.
                  </p>

                  {/* Bank Details */}
                  <div className="rounded-lg border bg-white p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Bank Name:</span>
                      <span className="font-semibold">Guaranty Trust Bank (GTBank)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Account Name:</span>
                      <span className="font-semibold">Berean Bible Academy</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Account Number:</span>
                      <span className="font-semibold font-mono text-lg">0123456789</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sort Code:</span>
                      <span className="font-semibold">058152052</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                    onClick={() => setShowReceiptUpload(!showReceiptUpload)}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {showReceiptUpload ? "Hide Upload Form" : "Upload Payment Receipt"}
                  </Button>

                  <a
                    href="https://wa.me/2349027677276?text=Hello%2C%20I%20just%20made%20a%20bank%20transfer%20for%20my%20tuition%20at%20Berean%20Bible%20Academy.%20Here%20is%20my%20receipt."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="outline" size="sm" className="w-full gap-1.5 border-green-300 text-green-700 hover:bg-green-50">
                      <MessageCircle className="h-3.5 w-3.5" />
                      Send Receipt via WhatsApp
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>

            {/* Receipt Upload Form */}
            {showReceiptUpload && (
              <div className="rounded-lg border bg-muted/30 p-5 space-y-4 max-w-3xl mx-auto mt-6">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Upload Bank Transfer Receipt
                </h4>
                <p className="text-sm text-muted-foreground">
                  Fill in your transfer details and upload a screenshot or PDF of your payment receipt.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="noFeeAmount">Amount Transferred ({"\u20A6"})</Label>
                    <Input
                      id="noFeeAmount"
                      type="number"
                      min="0"
                      placeholder="e.g. 75000"
                      value={receiptForm.amount}
                      onChange={(e) => setReceiptForm({ ...receiptForm, amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="noFeeBankName">Your Bank Name</Label>
                    <Input
                      id="noFeeBankName"
                      placeholder="e.g. GTBank, First Bank, Access"
                      value={receiptForm.bankName}
                      onChange={(e) => setReceiptForm({ ...receiptForm, bankName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="noFeeRef">Transaction Reference / Session ID</Label>
                    <Input
                      id="noFeeRef"
                      placeholder="From your bank receipt"
                      value={receiptForm.reference}
                      onChange={(e) => setReceiptForm({ ...receiptForm, reference: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="noFeeDate">Transfer Date</Label>
                    <Input
                      id="noFeeDate"
                      type="date"
                      value={receiptForm.transferDate}
                      onChange={(e) => setReceiptForm({ ...receiptForm, transferDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="noFeeFile">Receipt Screenshot / PDF</Label>
                  <Input
                    id="noFeeFile"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={async () => {
                      if (!receiptFile || !receiptForm.amount || !receiptForm.bankName) {
                        setMessage({ type: "error", text: "Please fill in amount, bank name, and upload receipt" });
                        return;
                      }
                      setUploadingReceipt(true);
                      try {
                        const uploaded = await uploadDocument(receiptFile, "payment-receipts");
                        if (!uploaded) {
                          setMessage({ type: "error", text: "Failed to upload file" });
                          return;
                        }
                        const res = await fetch("/api/fees/upload-receipt", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            amount: Math.round(parseFloat(receiptForm.amount) * 100),
                            bankName: receiptForm.bankName,
                            bankReference: receiptForm.reference,
                            transferDate: receiptForm.transferDate,
                            receiptUploadUrl: uploaded.url,
                          }),
                        });
                        if (res.ok) {
                          setMessage({ type: "success", text: "Receipt uploaded successfully! Admin will verify and credit your account." });
                          setShowReceiptUpload(false);
                          setReceiptFile(null);
                          setReceiptForm({ amount: "", bankName: "", reference: "", transferDate: "" });
                        } else {
                          const data = await res.json();
                          setMessage({ type: "error", text: data.error || "Failed to submit" });
                        }
                      } catch {
                        setMessage({ type: "error", text: "Upload failed" });
                      } finally {
                        setUploadingReceipt(false);
                      }
                    }}
                    disabled={uploadingReceipt}
                  >
                    {uploadingReceipt && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Receipt
                  </Button>
                  <Button variant="outline" onClick={() => setShowReceiptUpload(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current Semester Fee Summary */}
      {currentFee && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Tuition</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatAmount(currentFee.totalDue)}</div>
              <p className="text-xs text-muted-foreground">
                {currentFee.fee.semester.session.name} - {currentFee.fee.semester.name}
              </p>
            </CardContent>
          </Card>

          {scholarship && scholarship.hasApprovedScholarship && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">Scholarship</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">-{formatAmount(scholarship.discountAmount)}</div>
                <p className="text-xs text-muted-foreground">{scholarship.approvedPercentage}% discount applied</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatAmount(currentFee.totalPaid)}</div>
              <p className="text-xs text-muted-foreground">
                {currentFee.payments.filter((p) => p.status === "successful").length} payment(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${currentFee.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                {formatAmount(currentFee.balance)}
              </div>
              {currentFee.balance === 0 ? (
                <p className="text-xs text-green-600 font-medium">Fully Paid</p>
              ) : (
                <p className="text-xs text-muted-foreground">Due: {new Date(currentFee.fee.dueDate).toLocaleDateString()}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Progress Bar */}
      {currentFee && currentFee.totalDue > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Payment Progress</span>
              <span className="text-sm text-muted-foreground">
                {formatAmount(currentFee.totalPaid)} of {formatAmount(currentFee.totalDue)} paid
                {" - "}
                {Math.min(100, Math.round((currentFee.totalPaid / currentFee.totalDue) * 100))}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  currentFee.balance === 0 ? "bg-green-500" : "bg-primary"
                }`}
                style={{
                  width: `${Math.min(100, Math.round((currentFee.totalPaid / currentFee.totalDue) * 100))}%`,
                }}
              />
            </div>
            {currentFee.balance > 0 && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Full access to course materials, assessments, and downloads will be granted once payment is complete (100%)
              </p>
            )}
            {currentFee.balance === 0 && (
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Payment complete. Full access granted.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Plans & Make Payment */}
      {currentFee && currentFee.balance > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Banknote className="h-5 w-5" />
              Payment Plans
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Plan Selection */}
            <div className="grid gap-3 md:grid-cols-3">
              {PAYMENT_PLANS.map((plan) => {
                const adjustedBalance = currentFee.balance;
                const isFullPlan = plan.key === "full";
                const discount = isFullPlan ? Math.round(adjustedBalance * 0.05) : 0;
                const effectiveAmount = adjustedBalance - discount;

                return (
                  <div
                    key={plan.key}
                    onClick={() => setSelectedPlan(plan.key)}
                    className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                      selectedPlan === plan.key
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm">{plan.label}</h3>
                      {isFullPlan && (
                        <Badge className="bg-green-100 text-green-800 text-xs">5% OFF</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{plan.description}</p>
                    <div className="space-y-1">
                      {plan.splits.map((split, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span>{plan.splits.length === 1 ? "Total" : `Installment ${i + 1}`}</span>
                          <span className="font-medium">
                            {formatAmount(Math.round((isFullPlan ? effectiveAmount : adjustedBalance) * split))}
                          </span>
                        </div>
                      ))}
                      {isFullPlan && discount > 0 && (
                        <div className="flex justify-between text-xs text-green-600 pt-1 border-t">
                          <span>You save</span>
                          <span className="font-medium">{formatAmount(discount)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Installment Payment Buttons */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Make a Payment</h4>
              {(() => {
                const plan = PAYMENT_PLANS.find((p) => p.key === selectedPlan)!;
                const isFullPlan = selectedPlan === "full";
                const discount = isFullPlan ? Math.round(currentFee.balance * 0.05) : 0;
                const effectiveBalance = currentFee.balance - discount;
                const paidInstallments = currentFee.payments.filter(
                  (p) => p.status === "successful" && p.paymentPlan === selectedPlan
                ).length;

                return plan.splits.map((split, i) => {
                  const installmentAmount = Math.round(
                    (isFullPlan ? effectiveBalance : currentFee.balance) * split
                  );
                  const isPaid = i < paidInstallments;

                  return (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4"
                    >
                      <div>
                        <h3 className="font-medium">
                          {plan.splits.length === 1
                            ? `Full Payment${discount > 0 ? " (5% discount applied)" : ""}`
                            : `Installment ${i + 1} of ${plan.splits.length}`}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {Math.round(split * 100)}% of {isFullPlan ? "discounted" : ""} balance
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold">{formatAmount(installmentAmount)}</span>
                        {isPaid ? (
                          <Badge className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Paid
                          </Badge>
                        ) : (
                          <Button
                            onClick={() => handlePay(currentFee.feeId, installmentAmount, i + 1, selectedPlan)}
                            disabled={paying === currentFee.feeId || (i > 0 && i > paidInstallments)}
                            size="sm"
                          >
                            {paying === currentFee.feeId && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Pay Now
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Bank Transfer Option */}
            <div className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setShowReceiptUpload(!showReceiptUpload)}
                className="w-full sm:w-auto"
              >
                <Upload className="mr-2 h-4 w-4" />
                I&apos;ve made a bank transfer
              </Button>
            </div>

            {/* Receipt Upload Form */}
            {showReceiptUpload && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Upload Payment Receipt
                </h4>
                <p className="text-sm text-muted-foreground">
                  If you paid via bank transfer, upload your payment receipt for admin verification.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount Paid ({"\u20A6"})</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 75000"
                      value={receiptForm.amount}
                      onChange={(e) => setReceiptForm({ ...receiptForm, amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      placeholder="e.g. GTBank, First Bank"
                      value={receiptForm.bankName}
                      onChange={(e) => setReceiptForm({ ...receiptForm, bankName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference">Transaction Reference</Label>
                    <Input
                      id="reference"
                      placeholder="Bank reference number"
                      value={receiptForm.reference}
                      onChange={(e) => setReceiptForm({ ...receiptForm, reference: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transferDate">Transfer Date</Label>
                    <Input
                      id="transferDate"
                      type="date"
                      value={receiptForm.transferDate}
                      onChange={(e) => setReceiptForm({ ...receiptForm, transferDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receiptFile">Receipt Image/PDF</Label>
                  <Input
                    id="receiptFile"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => currentFee && handleReceiptUpload(currentFee.feeId)}
                    disabled={uploadingReceipt}
                  >
                    {uploadingReceipt && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Receipt
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReceiptUpload(false);
                      setReceiptFile(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Scholarship & Support Section */}
      {currentFee && currentFee.balance > 0 && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-blue-100 p-3 shrink-0">
                <GraduationCap className="h-6 w-6 text-blue-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">
                  Need Financial Assistance?
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  If you are eligible for a scholarship, waiver, or financial aid,
                  contact the admin office for assistance. Approved scholarships
                  will automatically be applied to your balance.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="https://wa.me/2349027677276?text=Hello%2C%20I%20would%20like%20to%20inquire%20about%20scholarship%20or%20fee%20waiver%20options%20at%20Berean%20Bible%20Academy."
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-100">
                      <MessageCircle className="h-3.5 w-3.5" />
                      WhatsApp Support
                    </Button>
                  </a>
                  <a href="mailto:info@bba.org.ng">
                    <Button variant="outline" size="sm" className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-100">
                      <HelpCircle className="h-3.5 w-3.5" />
                      Email Admin
                    </Button>
                  </a>
                </div>
              </div>
            </div>
            {scholarship && scholarship.hasApprovedScholarship && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="font-medium">
                    Scholarship Applied: {scholarship.approvedPercentage}% discount
                    ({formatAmount(scholarship.discountAmount)} off)
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feeStatuses.every((f) => f.payments.length === 0) ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No payment history yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 font-medium">Method</th>
                    <th className="pb-2 font-medium text-right">Amount</th>
                    <th className="pb-2 font-medium text-center">Status</th>
                    <th className="pb-2 font-medium">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {feeStatuses.flatMap((fee) =>
                    fee.payments.map((payment) => (
                      <tr key={payment.id} className="border-b last:border-0">
                        <td className="py-3">
                          {payment.paidAt
                            ? new Date(payment.paidAt).toLocaleDateString()
                            : new Date(payment.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          {fee.fee.description || "Tuition Fee"}
                          {payment.installmentNumber && (
                            <span className="text-xs text-muted-foreground ml-1">
                              (Installment {payment.installmentNumber})
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <span className="flex items-center gap-1 text-xs">
                            {payment.paymentMethod === "bank_transfer" ? (
                              <>
                                <Banknote className="h-3 w-3" />
                                Bank Transfer
                              </>
                            ) : (
                              <>
                                <CreditCard className="h-3 w-3" />
                                Paystack
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3 text-right font-medium">
                          {formatAmount(payment.amount)}
                        </td>
                        <td className="py-3 text-center">
                          {payment.paymentMethod === "bank_transfer" && payment.status === "pending" ? (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Awaiting Review
                            </Badge>
                          ) : (
                            statusBadge(payment.status)
                          )}
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">
                          {payment.paystackReference || payment.bankReference || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
