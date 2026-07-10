import { AppMain } from "@/components/app/app-main";
import {
  LoadingRegion,
  PageHeaderSkeleton,
  SectionSkeleton,
} from "@/components/app/page-skeleton";

/** Report loading state: header + form card. */
export default function ReportLoading() {
  return (
    <AppMain>
      <LoadingRegion>
        <PageHeaderSkeleton subtitle />
        <SectionSkeleton lines={5} />
      </LoadingRegion>
    </AppMain>
  );
}
