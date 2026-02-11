/**
 * Points calculation for event attendance.
 * Must match backend formula: 5 base + 10% of price for paid events.
 */
const POINTS_BASE = 5;
const POINTS_PRICE_PERCENT = 0.1;

export function calculatePointsForAttendance(eventPrice: number | null | undefined): number {
  if (eventPrice == null || eventPrice <= 0) {
    return POINTS_BASE;
  }
  return POINTS_BASE + Math.floor(eventPrice * POINTS_PRICE_PERCENT);
}

/** Effective price for points/display: average of tiers when present, else single price */
export function getEffectivePriceForPoints(
  price: number | null | undefined,
  pricingTiers: Array<{ name: string; price: number }> | null | undefined
): number | null {
  if (pricingTiers && pricingTiers.length > 0) {
    const sum = pricingTiers.reduce((acc, t) => acc + t.price, 0);
    const avg = sum / pricingTiers.length;
    return avg > 0 ? avg : null;
  }
  if (price != null && price > 0) return price;
  return null;
}
