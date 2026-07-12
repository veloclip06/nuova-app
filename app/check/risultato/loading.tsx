import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion } from "@/components/app/page-skeleton";

/** Checker result loading state: dark header band + result card grid. */
export default function CheckResultLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <LoadingRegion>
        <header className="bg-ink pb-24">
          <div className="mx-auto w-full max-w-[1080px] px-4 pt-5 sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Skeleton className="h-3 w-28 bg-paper/20" />
              <Skeleton className="h-3 w-40 bg-paper/20" />
            </div>
            <div className="mt-12 max-w-[720px]">
              <Skeleton className="h-3 w-32 bg-paper/20" />
              <Skeleton className="mt-3 h-8 w-72 max-w-full bg-paper/20" />
              <Skeleton className="mt-4 h-5 w-96 max-w-full bg-paper/20" />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1080px] flex-1 px-4 sm:px-8">
          <div className="-mt-16 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col gap-3.5 rounded-lg border border-line bg-surface p-6"
              >
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-6" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-14 w-28 rounded-md" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-16 w-full rounded-md" />
              </div>
            ))}
          </div>
        </main>
      </LoadingRegion>
    </div>
  );
}
