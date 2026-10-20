import type { Metadata } from "next";
import { AccountView } from "@/components/account/AccountView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "حسابي", robots: { index: false } };

export default function AccountPage() {
  return <AccountView section="profile" />;
}
