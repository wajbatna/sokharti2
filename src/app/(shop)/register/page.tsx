import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui";
import { LogoMark } from "@/components/brand/Logo";
import { RegisterForm } from "@/components/auth/AuthForms";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "إنشاء حساب", robots: { index: false } };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card className="space-y-5">
        <div className="text-center">
          <LogoMark className="mx-auto" />
          <h1 className="mt-3 text-xl font-extrabold text-[#111827]">إنشاء حساب جديد</h1>
          <p className="text-sm text-gray-500">دقيقة وحدة وتكون معانا</p>
        </div>
        <RegisterForm />
      </Card>
    </div>
  );
}
