/**
 * Gamification constants.
 * Points are awarded when a user's ticket is scanned (they actually attend).
 * Formula: 5 points minimum (free events) + 10% of event price (paid events).
 * VIP/VIP Plus: points are doubled.
 */
export const POINTS_BASE = 5;
export const POINTS_PRICE_PERCENT = 0.1;

export type VipTier = null | 'vip' | 'vip_plus';

export function calculatePointsForAttendance(eventPrice: number | null | undefined): number {
  if (eventPrice == null || eventPrice <= 0) {
    return POINTS_BASE;
  }
  return POINTS_BASE + Math.floor(eventPrice * POINTS_PRICE_PERCENT);
}

/** Final points to award: base calculation, doubled if user has VIP or VIP Plus */
export function applyVipPointsMultiplier(basePoints: number, vipTier: VipTier): number {
  if (vipTier === 'vip' || vipTier === 'vip_plus') {
    return basePoints * 2;
  }
  return basePoints;
}

/** Effective price for points: use average of tiers when present, else single price */
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
