import Link from "next/link";
import { Globe, Mail, MessageCircle, Phone } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-100 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm leading-relaxed text-gray-500">
            سخرتي منصة توصيل مغربية: كلشي لي بغيتي... حتى لباب دارك. مطاعم، بقالة، صيدليات ومتاجر فمدينتك.
          </p>
        </div>

        <FooterCol
          title="اكتشف"
          links={[
            { href: "/restaurants", label: "المطاعم" },
            { href: "/stores", label: "المتاجر" },
            { href: "/offers", label: "العروض" },
            { href: "/search", label: "البحث" },
          ]}
        />
        <FooterCol
          title="حسابي"
          links={[
            { href: "/account", label: "الملف الشخصي" },
            { href: "/account/orders", label: "طلباتي" },
            { href: "/account/addresses", label: "عناويني" },
            { href: "/track", label: "تتبع الطلب" },
          ]}
        />

        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-[#111827]">تواصل معنا</h3>
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <Phone className="h-4 w-4 text-[#FF6B35]" /> 0808 000 000
          </p>
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <Mail className="h-4 w-4 text-[#FF6B35]" /> support@sakhrti.ma
          </p>
          <div className="flex gap-2 pt-1">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
              <MessageCircle className="h-4 w-4" />
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
              <Globe className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100 py-5 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} سخرتي SAKHRTI — جميع الحقوق محفوظة
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-extrabold text-[#111827]">{title}</h3>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-gray-500 transition hover:text-[#FF6B35]">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
