import { AppMain } from "@/components/app/app-main";
import {
  LoadingRegion,
  PageHeaderSkeleton,
  SectionSkeleton,
} from "@/components/app/page-skeleton";

/** Impostazioni loading state: header + two form cards. */
export default function SettingsLoading() {
  return (
    <AppMain>
      <LoadingRegion>
        <PageHeaderSkeleton />
        <div className="flex flex-col gap-5">
          <SectionSkeleton lines={4} />
          <SectionSkeleton lines={2} />
        </div>
      </LoadingRegion>
    </AppMain>
  );
}
