import { AppMain } from "@/components/app/app-main";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion, PageHeaderSkeleton } from "@/components/app/page-skeleton";

/** Prodotti loading state: header + action row + product table (count strip + rows). */
export default function ProductsLoading() {
  return (
    <AppMain>
      <LoadingRegion>
        <PageHeaderSkeleton subtitle />
        <div className="mb-5 flex gap-2">
          <Skeleton className="h-9 w-36 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
        <div className="rounded-lg border border-line bg-surface">
          <div className="border-b border-line px-5 py-3">
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex flex-col gap-4 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className={i === 5 ? "h-4 w-2/3" : "h-4 w-full"} />
            ))}
          </div>
        </div>
      </LoadingRegion>
    </AppMain>
  );
}
