import { redirect } from "next/navigation";
import { getCompanyContext } from "@/lib/app/company";
import { AppShell } from "@/components/app/app-shell";

/**
 * Authenticated app shell (/app/*). Middleware already enforced the session;
 * here we require a completed onboarding (1 user = 1 company, ARCHITECTURE.md
 * §3). Without a company the user is sent to /onboarding.
 */
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const context = await getCompanyContext();
  if (!context) redirect("/onboarding");

  return <AppShell companyName={context.company.name}>{children}</AppShell>;
}
