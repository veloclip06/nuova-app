import { t } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shared building blocks for route-level loading.tsx files. Each mirrors the
 * real layout of the view it stands in for (real borders/surfaces, pulsing
 * inner lines only), so navigation paints a stable frame instantly
 * (DESIGN_SYSTEM.md §10).
 */

/** Announces the loading state once for the whole skeleton view. */
export function LoadingRegion({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" aria-label={t("common.loading")}>
      {children}
    </div>
  );
}

/** Mirrors PageHeader (eyebrow + title, optional subtitle). */
export function PageHeaderSkeleton({ subtitle = false }: { subtitle?: boolean }) {
  return (
    <div className="mb-8">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-64 max-w-full" />
      {subtitle && <Skeleton className="mt-3 h-4 w-80 max-w-full" />}
    </div>
  );
}

/** Mirrors the country card grid (dashboard / paesi). */
export function CardGridSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(270px,1fr))] gap-5">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3.5 rounded-lg border border-line bg-surface p-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="ml-auto h-3 w-16" />
          </div>
          <Skeleton className="h-14 w-28 rounded-md" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-9 w-32 rounded-md" />
          <div className="mt-auto border-t border-line pt-3">
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Bordered surface with pulsing text rows (tables, lists, forms). */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-6">
      <div className="flex flex-col gap-4">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className={i === rows - 1 ? "h-4 w-2/3" : "h-4 w-full"} />
        ))}
      </div>
    </div>
  );
}

/** Mirrors the detail-page Section (eyebrow + content lines). */
export function SectionSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-6">
      <Skeleton className="mb-4 h-3 w-32" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={i === lines - 1 ? "h-4 w-2/3" : "h-4 w-full"} />
        ))}
      </div>
    </div>
  );
}
