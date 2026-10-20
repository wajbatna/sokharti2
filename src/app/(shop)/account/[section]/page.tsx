import type { Metadata } from "next";
import { AccountView } from "@/components/account/AccountView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "حسابي", robots: { index: false } };

export default async function AccountSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <AccountView section={section} />;
}
