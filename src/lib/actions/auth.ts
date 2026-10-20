"use server";

import { randomInt } from "crypto";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users, verificationCodes } from "@/db/schema";
import { createSession, destroySession, hashPassword, verifyPassword, type Role } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import type { Result } from "@/lib/utils";

const registerSchema = z.object({
  name: z.string().min(3, "المرجو إدخال الاسم الكامل"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  phone: z.string().min(9, "رقم الهاتف غير صحيح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});

export async function registerAction(_prev: Result | null, formData: FormData): Promise<Result> {
  await ensureSeeded();
  const parsed = registerSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? "").toLowerCase().trim(),
    phone: String(formData.get("phone") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const existing = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (existing.length) return { ok: false, error: "هذا البريد مسجل من قبل" };

  const [user] = await db
    .insert(users)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      passwordHash: await hashPassword(parsed.data.password),
      role: "customer",
      city: "برشيد",
    })
    .returning();

  await createSession(user.id, "customer");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function loginAction(_prev: Result | null, formData: FormData): Promise<Result> {
  await ensureSeeded();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { ok: false, error: "المرجو إدخال البريد وكلمة المرور" };

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !user.isActive) return { ok: false, error: "بيانات الدخول غير صحيحة" };
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { ok: false, error: "بيانات الدخول غير صحيحة" };

  await createSession(user.id, user.role as Role);
  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}

export async function logoutAction() {
  await destroySession();
  revalidatePath("/", "layout");
}

/** OTP-ready: generates a short code stored server-side (SMS provider pluggable). */
export async function requestOtpAction(_prev: Result | null, formData: FormData): Promise<Result> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  if (identifier.length < 6) return { ok: false, error: "أدخل بريداً أو رقم هاتف صحيح" };
  const code = String(randomInt(100000, 999999));
  await db.insert(verificationCodes).values({
    identifier,
    code,
    purpose: "password_reset",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  return { ok: true };
}

export async function resetPasswordAction(_prev: Result | null, formData: FormData): Promise<Result> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { ok: false, error: "كلمة المرور قصيرة جداً" };

  const rows = await db.select().from(verificationCodes).where(eq(verificationCodes.identifier, identifier));
  const match = rows.find((r) => r.code === code && !r.consumedAt && r.expiresAt > new Date());
  if (!match) return { ok: false, error: "الرمز غير صالح أو منتهي" };

  const [user] = await db.select().from(users).where(eq(users.email, identifier.toLowerCase())).limit(1);
  if (!user) return { ok: false, error: "لا يوجد حساب بهذا البريد" };

  await db.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, user.id));
  await db.update(verificationCodes).set({ consumedAt: new Date() }).where(eq(verificationCodes.id, match.id));
  return { ok: true };
}

/** Demo-environment helper: signs in with credentials generated at seed time
 *  and stored server-side (never hardcoded in the client bundle). */
export async function demoSignInAction(email: string): Promise<Result> {
  await ensureSeeded();
  const { getSetting } = await import("@/lib/queries");
  const demo = await getSetting<{ password: string; accounts: { email: string }[] }>("demo_accounts");
  if (!demo) return { ok: false, error: "الحسابات التجريبية غير متوفرة" };
  if (!demo.accounts.some((a) => a.email === email)) return { ok: false, error: "حساب غير معروف" };
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) return { ok: false, error: "الحساب غير موجود" };
  const valid = await verifyPassword(demo.password, user.passwordHash);
  if (!valid) return { ok: false, error: "تعذر الدخول التجريبي" };
  await createSession(user.id, user.role as Role);
  revalidatePath("/", "layout");
  return { ok: true };
}
