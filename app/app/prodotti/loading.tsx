import { AppMain } from "@/components/app/app-main";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LoadingRegion,
  PageHeaderSkeleton,
  TableSkeleton,
} from "@/components/app/page-skeleton";

/** Prodotti loading state: header + action row + product table. */
export default function ProductsLoading() {
  return (
    <AppMain>
      <LoadingRegion>
        <PageHeaderSkeleton subtitle />
        <div className="mb-5 flex gap-2">
          <Skeleton className="h-9 w-36 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
        <TableSkeleton rows={6} />
      </LoadingRegion>
    </AppMain>
  );
}
