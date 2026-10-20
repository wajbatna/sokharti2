"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { Alert, Button, Field, Input } from "@/components/ui";
import { demoSignInAction, loginAction, registerAction, requestOtpAction, resetPasswordAction } from "@/lib/actions/auth";
import type { Result } from "@/lib/utils";

const initial: Result | null = null;

export function LoginForm({ redirectTo = "/" }: { redirectTo?: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(loginAction, initial);

  useEffect(() => {
    if (state?.ok) {
      router.push(redirectTo);
      router.refresh();
    }
  }, [state, router, redirectTo]);

  return (
    <form action={action} className="space-y-4">
      <Field label="البريد الإلكتروني">
        <Input name="email" type="email" placeholder="you@example.com" dir="ltr" required />
      </Field>
      <Field label="كلمة المرور">
        <Input name="password" type="password" placeholder="••••••••" dir="ltr" required />
      </Field>
      {state && !state.ok ? <Alert>{state.error}</Alert> : null}
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        تسجيل الدخول
      </Button>
      <div className="flex items-center justify-between text-xs font-bold">
        <Link href="/forgot-password" className="text-gray-500 hover:text-[#FF6B35]">
          نسيت كلمة المرور؟
        </Link>
        <Link href="/register" className="text-[#FF6B35] hover:underline">
          إنشاء حساب جديد
        </Link>
      </div>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(registerAction, initial);

  useEffect(() => {
    if (state?.ok) {
      router.push("/");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={action} className="space-y-4">
      <Field label="الاسم الكامل">
        <Input name="name" placeholder="الاسم واللقب" required />
      </Field>
      <Field label="البريد الإلكتروني">
        <Input name="email" type="email" placeholder="you@example.com" dir="ltr" required />
      </Field>
      <Field label="رقم الهاتف">
        <Input name="phone" placeholder="06xxxxxxxx" dir="ltr" required />
      </Field>
      <Field label="كلمة المرور" hint="8 أحرف على الأقل">
        <Input name="password" type="password" placeholder="••••••••" dir="ltr" required />
      </Field>
      {state && !state.ok ? <Alert>{state.error}</Alert> : null}
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        إنشاء الحساب
      </Button>
      <p className="text-center text-xs font-bold text-gray-500">
        عندك حساب؟{" "}
        <Link href="/login" className="text-[#FF6B35] hover:underline">
          سجل الدخول
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [otpState, requestAction, requesting] = useActionState(requestOtpAction, initial);
  const [resetState, resetAction, resetting] = useActionState(resetPasswordAction, initial);
  const [identifier, setIdentifier] = useState("");

  useEffect(() => {
    if (otpState?.ok) setStep("reset");
  }, [otpState]);

  if (step === "request") {
    return (
      <form action={requestAction} className="space-y-4">
        <Field label="البريد الإلكتروني أو رقم الهاتف" hint="غادي نصيفطو ليك رمز التحقق (OTP)">
          <Input name="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} dir="ltr" required />
        </Field>
        {otpState && !otpState.ok ? <Alert>{otpState.error}</Alert> : null}
        <Button type="submit" size="lg" className="w-full" loading={requesting}>
          إرسال رمز التحقق
        </Button>
      </form>
    );
  }

  return (
    <form action={resetAction} className="space-y-4">
      <input type="hidden" name="identifier" value={identifier} />
      <Alert tone="info">تم إنشاء رمز التحقق. فبيئة الإنتاج كيتصيفط عبر SMS/Email عبر مزود الرسائل المربوط بالمنصة.</Alert>
      <Field label="رمز التحقق">
        <Input name="code" placeholder="6 أرقام" dir="ltr" required />
      </Field>
      <Field label="كلمة المرور الجديدة">
        <Input name="password" type="password" dir="ltr" required />
      </Field>
      {resetState && !resetState.ok ? <Alert>{resetState.error}</Alert> : null}
      {resetState?.ok ? <Alert tone="success">تم تغيير كلمة المرور، يمكنك الدخول دابا.</Alert> : null}
      <Button type="submit" size="lg" className="w-full" loading={resetting}>
        تغيير كلمة المرور
      </Button>
    </form>
  );
}

export function DemoAccounts({ accounts }: { accounts: { role: string; email: string; label: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  if (!accounts.length) return null;

  return (
    <div className="space-y-2 rounded-2xl bg-gray-50 p-4">
      <p className="text-xs font-extrabold text-gray-600">دخول تجريبي سريع (بيانات مولّدة على الخادم)</p>
      <div className="grid grid-cols-2 gap-2">
        {accounts.map((a) => (
          <button
            key={a.email}
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await demoSignInAction(a.email);
                if (!res.ok) setError(res.error);
                else {
                  router.push(a.role === "admin" ? "/admin" : a.role === "vendor" ? "/vendor" : a.role === "driver" ? "/driver" : "/");
                  router.refresh();
                }
              })
            }
            className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-gray-700 ring-1 ring-gray-200 transition hover:bg-[#FFF1EB] hover:text-[#E4551F] disabled:opacity-60"
          >
            {a.label}
          </button>
        ))}
      </div>
      {error ? <p className="text-xs font-bold text-rose-600">{error}</p> : null}
    </div>
  );
}
