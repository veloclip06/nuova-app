import { AppMain } from "@/components/app/app-main";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CardGridSkeleton,
  LoadingRegion,
  PageHeaderSkeleton,
  TableSkeleton,
} from "@/components/app/page-skeleton";

/** Dashboard loading state: header + progress banner + card grid + deadlines. */
export default function DashboardLoading() {
  return (
    <AppMain>
      <LoadingRegion>
        <PageHeaderSkeleton subtitle />
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-surface px-5 py-4">
          <div className="min-w-[240px] flex-1">
            <Skeleton className="h-3 w-48" />
            <div className="mt-3 flex max-w-[320px] gap-[3px]">
              <Skeleton className="h-1.5 flex-1 rounded-full" />
              <Skeleton className="h-1.5 flex-1 rounded-full" />
              <Skeleton className="h-1.5 flex-1 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-3 w-44" />
        </div>
        <CardGridSkeleton />
        <div className="mt-9">
          <Skeleton className="mb-3 h-3 w-40" />
          <TableSkeleton rows={4} />
        </div>
      </LoadingRegion>
    </AppMain>
  );
}
