import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion } from "@/components/app/page-skeleton";

/** Onboarding loading state: mirrors the wizard frame (progress bar + step). */
export default function OnboardingLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <LoadingRegion>
        <header className="mx-auto w-full max-w-[640px] px-4 pt-8 sm:px-8">
          <Skeleton className="h-3 w-24" />
          <div className="mt-3 flex items-center gap-3">
            <Skeleton className="h-1.5 flex-1 rounded-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[640px] flex-1 px-4 py-10 sm:px-8">
          <Skeleton className="h-7 w-64 max-w-full" />
          <Skeleton className="mt-3 h-4 w-80 max-w-full" />
          <div className="mt-8 flex flex-col gap-4">
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
        </main>
      </LoadingRegion>
    </div>
  );
}
