import { AppMain } from "@/components/app/app-main";
import {
  CardGridSkeleton,
  LoadingRegion,
  PageHeaderSkeleton,
} from "@/components/app/page-skeleton";

/** Paesi loading state: header + country card grid. */
export default function PaesiLoading() {
  return (
    <AppMain>
      <LoadingRegion>
        <PageHeaderSkeleton subtitle />
        <CardGridSkeleton />
      </LoadingRegion>
    </AppMain>
  );
}
