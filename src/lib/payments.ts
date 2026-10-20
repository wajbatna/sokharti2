import "server-only";

/**
 * Payment abstraction.
 * `cash` settles on delivery; `card` / `online` route through a gateway
 * adapter so a real PSP (CMI, Stripe, PayPal…) can be added without touching
 * checkout code. Keys are read from the server environment only.
 */
export type PaymentMethod = "cash" | "card" | "online";

export type ChargeInput = {
  orderCode: string;
  amount: number; // centimes
  method: PaymentMethod;
  customer: { name: string; phone: string };
};

export type ChargeResult = {
  status: "pending" | "paid" | "failed";
  provider: string;
  reference: string;
  redirectUrl?: string;
};

export interface PaymentGateway {
  readonly id: string;
  charge(input: ChargeInput): Promise<ChargeResult>;
}

const cashGateway: PaymentGateway = {
  id: "cash_on_delivery",
  async charge({ orderCode }) {
    return { status: "pending", provider: "cash_on_delivery", reference: `COD-${orderCode}` };
  },
};

/** Sandbox gateway — swap with a live PSP client when credentials exist. */
const onlineGateway: PaymentGateway = {
  id: process.env.PAYMENT_PROVIDER ?? "sandbox_gateway",
  async charge({ orderCode, amount }) {
    const configured = Boolean(process.env.PAYMENT_API_KEY);
    return {
      status: configured ? "paid" : "pending",
      provider: process.env.PAYMENT_PROVIDER ?? "sandbox_gateway",
      reference: `PSP-${orderCode}-${amount}`,
    };
  },
};

export function gatewayFor(method: PaymentMethod): PaymentGateway {
  return method === "cash" ? cashGateway : onlineGateway;
}

export const PAYMENT_METHODS: { id: PaymentMethod; label: string; hint: string; enabled: boolean }[] = [
  { id: "cash", label: "الدفع عند الاستلام", hint: "أدى نقداً للسائق فاش يوصل", enabled: true },
  {
    id: "card",
    label: "بطاقة بنكية",
    hint: "معاملة آمنة عبر بوابة الأداء",
    enabled: true,
  },
  { id: "online", label: "محفظة إلكترونية", hint: "أدِّ أونلاين بسرعة", enabled: true },
];
