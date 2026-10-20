import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { LogoMark } from "@/components/brand/Logo";
import { ForgotPasswordForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "استعادة كلمة المرور", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card className="space-y-5">
        <div className="text-center">
          <LogoMark className="mx-auto" />
          <h1 className="mt-3 text-xl font-extrabold text-[#111827]">استعادة كلمة المرور</h1>
          <p className="text-sm text-gray-500">غادي نصيفطو ليك رمز تحقق باش تبدل كلمة المرور</p>
        </div>
        <ForgotPasswordForm />
      </Card>
    </div>
  );
}
