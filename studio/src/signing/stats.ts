// Small measurement helpers for the diagnostics panel.

/** Nearest-rank percentile of an ascending list; p in 0..100. */
export function percentile(sorted: readonly number[], p: number) {
  if (!sorted.length) return 0;
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(sorted.length - 1, Math.max(0, rank - 1))];
}
