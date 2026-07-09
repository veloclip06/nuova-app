/** Shared content container for /app pages — matches the dashboard export
 * (max-width 1000px, ~36px padding). Keeps every view aligned. */
export function AppMain({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-[1000px] flex-1 px-5 py-8 sm:px-9 sm:py-10">
      {children}
    </main>
  );
}
