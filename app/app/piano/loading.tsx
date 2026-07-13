import { AppMain } from "@/components/app/app-main";
import { LoadingRegion, PageHeaderSkeleton } from "@/components/app/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

/** Plan page loading state: header + current-plan banner + the two plan cards. */
export default function PianoLoading() {
  return (
    <AppMain>
      <LoadingRegion>
        <PageHeaderSkeleton subtitle />
        <div className="flex flex-col gap-6">
          {/* Current-plan banner */}
          <div className="flex items-center gap-3 rounded-lg border border-line bg-surface px-5 py-4">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-3 w-64 max-w-full" />
          </div>
          {/* Two plan cards */}
          <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-6"
              >
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-8 w-24" />
                <div className="mt-3 border-t border-line pt-4">
                  <Skeleton className="h-2.5 w-20" />
                </div>
                <div className="flex flex-col gap-2.5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-4/6" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <Skeleton className="mt-3 h-9 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </LoadingRegion>
    </AppMain>
  );
}
