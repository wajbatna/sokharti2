import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui";
import { LogoMark } from "@/components/brand/Logo";
import { DemoAccounts, LoginForm } from "@/components/auth/AuthForms";
import { getCurrentUser } from "@/lib/auth";
import { getSetting } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "تسجيل الدخول", robots: { index: false } };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");
  const demo = await getSetting<{ accounts: { role: string; email: string; label: string }[] }>("demo_accounts");

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 px-4 py-12">
      <Card className="space-y-5">
        <div className="text-center">
          <LogoMark className="mx-auto" />
          <h1 className="mt-3 text-xl font-extrabold text-[#111827]">مرحباً بك فسخرتي</h1>
          <p className="text-sm text-gray-500">سجل الدخول باش تكمل الطلب وتتبع طلباتك</p>
        </div>
        <LoginForm />
      </Card>
      <DemoAccounts accounts={demo?.accounts ?? []} />
    </div>
  );
}
