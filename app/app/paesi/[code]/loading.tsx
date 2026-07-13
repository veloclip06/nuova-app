import { AppMain } from "@/components/app/app-main";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion, SectionSkeleton } from "@/components/app/page-skeleton";

/** Country detail loading state: back link + flag/title header + sections. */
export default function CountryDetailLoading() {
  return (
    <AppMain>
      <LoadingRegion>
        <Skeleton className="mb-6 h-3 w-36" />
        <div className="mb-8 flex items-center gap-3">
          <Skeleton className="h-7 w-10" />
          <div>
            <Skeleton className="h-3 w-40" />
            <Skeleton className="mt-2 h-7 w-52" />
          </div>
          <Skeleton className="ml-auto h-6 w-10" />
        </div>
        <div className="flex flex-col gap-5">
          <SectionSkeleton lines={2} />
          <SectionSkeleton lines={4} />
          <SectionSkeleton lines={3} />
        </div>
      </LoadingRegion>
    </AppMain>
  );
}
