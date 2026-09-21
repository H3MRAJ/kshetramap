import type { BoothProps } from "./types";

/** Booth total votes polled (Form 20 grand total: valid + NOTA + rejected). */
export function boothTotalVotes(booth: BoothProps): number {
  return booth.grand_total ?? booth.total_valid + booth.nota + (booth.rejected || 0);
}

/**
 * This booth's share of AC-wide votes polled.
 * @param acGrandTotal EVM grand total for the constituency (meta.totals.evm.grand_total)
 */
export function boothPctOfAcPolled(
  booth: BoothProps,
  acGrandTotal: number
): number {
  const total = boothTotalVotes(booth);
  if (!acGrandTotal || acGrandTotal <= 0) return 0;
  return (100 * total) / acGrandTotal;
}
