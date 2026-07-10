import { t } from "@/lib/i18n";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ReportHistoryEntry {
  id: string;
  countryName: string;
  period: string;
  createdAt: string;
}

/**
 * Minimal report history (storico) — completo-only feature (ARCHITECTURE §8).
 * Read-only list of the saved reports; regenerating from the form above with
 * the same country+period reproduces any report exactly (deterministic engine).
 */
export function ReportHistory({ entries }: { entries: ReportHistoryEntry[] }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-semibold text-ink">
        {t("app.report.history.title")}
      </h2>
      {entries.length === 0 ? (
        <p className="mt-3 rounded-lg border border-line bg-surface p-6 text-sm text-muted-foreground">
          {t("app.report.history.empty")}
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-lg border border-line bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("app.report.history.colDate")}</TableHead>
                <TableHead>{t("app.report.history.colCountry")}</TableHead>
                <TableHead>{t("app.report.history.colPeriod")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-xs">
                    {new Date(entry.createdAt).toLocaleDateString("it-IT")}
                  </TableCell>
                  <TableCell className="text-xs">{entry.countryName}</TableCell>
                  <TableCell className="font-mono text-xs">{entry.period}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
