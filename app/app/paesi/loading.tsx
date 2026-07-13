import { AppMain } from "@/components/app/app-main";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CardGridSkeleton,
  LoadingRegion,
  PageHeaderSkeleton,
} from "@/components/app/page-skeleton";

/** Paesi loading state: header + census strip + country card grid. */
export default function PaesiLoading() {
  return (
    <AppMain>
      <LoadingRegion>
        <PageHeaderSkeleton subtitle />
        <div className="mb-8 rounded-lg border border-line bg-surface px-5 py-3">
          <Skeleton className="h-3 w-60 max-w-full" />
        </div>
        <CardGridSkeleton />
      </LoadingRegion>
    </AppMain>
  );
}
