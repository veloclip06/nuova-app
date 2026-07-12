import { AppMain } from "@/components/app/app-main";
import {
  LoadingRegion,
  PageHeaderSkeleton,
  SectionSkeleton,
} from "@/components/app/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

/** Report loading state: header + selection card + volumes card + CTA. */
export default function ReportLoading() {
  return (
    <AppMain>
      <LoadingRegion>
        <PageHeaderSkeleton subtitle />
        <div className="flex flex-col gap-6">
          {/* Country + period selection card */}
          <div className="flex flex-wrap items-end gap-4 rounded-lg border border-line bg-surface p-5">
            <div className="flex min-w-[180px] flex-col gap-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="flex min-w-[160px] flex-col gap-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
          {/* Volumes card */}
          <SectionSkeleton lines={4} />
          {/* Primary CTA */}
          <Skeleton className="h-10 w-36 rounded-md" />
        </div>
      </LoadingRegion>
    </AppMain>
  );
}
