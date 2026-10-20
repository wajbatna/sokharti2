import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui";
import { LogoMark } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#F7F7F7] px-4 text-center">
      <LogoMark className="h-14 w-14" />
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-[#FF6B35] shadow-sm">
        <Compass className="h-8 w-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-[#111827]">404</h1>
      <p className="max-w-sm text-sm text-gray-500">الصفحة لي كتقلب عليها ما كايناش. يمكن تكون تبدلات ولا تحيدات.</p>
      <div className="flex gap-2">
        <Link href="/">
          <Button>العودة للرئيسية</Button>
        </Link>
        <Link href="/restaurants">
          <Button variant="outline">تصفح المطاعم</Button>
        </Link>
      </div>
    </div>
  );
}
