const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

async function paystackFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${PAYSTACK_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Paystack API error");
  }
  return data;
}

// ─── Transactions ───────────────────────────────────────────────────────────

export async function initializeTransaction(params: {
  email: string;
  amount: number; // in kobo
  reference?: string;
  callbackUrl?: string;
  subaccount?: string;
  plan?: string;
  metadata?: Record<string, unknown>;
}) {
  return paystackFetch("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      reference: params.reference,
      callback_url: params.callbackUrl,
      subaccount: params.subaccount,
      plan: params.plan,
      metadata: params.metadata,
    }),
  });
}

export async function verifyTransaction(reference: string) {
  return paystackFetch(`/transaction/verify/${reference}`);
}

// ─── Subaccounts (Author Commission) ────────────────────────────────────────

export async function createSubaccount(params: {
  businessName: string;
  bankCode: string;
  accountNumber: string;
  percentageCharge: number;
}) {
  return paystackFetch("/subaccount", {
    method: "POST",
    body: JSON.stringify({
      business_name: params.businessName,
      settlement_bank: params.bankCode,
      account_number: params.accountNumber,
      percentage_charge: params.percentageCharge,
    }),
  });
}

// ─── Subscription Plans ─────────────────────────────────────────────────────

export async function createPlan(params: {
  name: string;
  amount: number;
  interval: "monthly" | "quarterly" | "annually";
}) {
  return paystackFetch("/plan", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// ─── Webhook Verification ───────────────────────────────────────────────────

export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require("crypto");
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(body)
    .digest("hex");
  return hash === signature;
}
