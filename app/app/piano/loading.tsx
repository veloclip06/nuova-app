import { AppMain } from "@/components/app/app-main";
import {
  LoadingRegion,
  PageHeaderSkeleton,
  SectionSkeleton,
} from "@/components/app/page-skeleton";

/** Plan page loading state: header + the two plan cards. */
export default function PianoLoading() {
  return (
    <AppMain>
      <LoadingRegion>
        <PageHeaderSkeleton subtitle />
        <SectionSkeleton lines={5} />
      </LoadingRegion>
    </AppMain>
  );
}
