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
        <PageHeaderSkeleton />
        <div className="mb-8 rounded-lg border border-line bg-surface px-5 py-4">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="mt-3 h-1.5 max-w-[320px] rounded-full" />
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
