import { AppMain } from "@/components/app/app-main";
import {
  LoadingRegion,
  PageHeaderSkeleton,
  SectionSkeleton,
} from "@/components/app/page-skeleton";

/** Impostazioni loading state: header + company/account/plan cards. */
export default function SettingsLoading() {
  return (
    <AppMain>
      <LoadingRegion>
        <PageHeaderSkeleton subtitle />
        <div className="flex flex-col gap-6">
          <SectionSkeleton lines={4} />
          <SectionSkeleton lines={2} />
          <SectionSkeleton lines={2} />
        </div>
      </LoadingRegion>
    </AppMain>
  );
}
