import type { PaymentMethod } from '../types/payment';

/**
 * Cash markup percentage (10-15% markup)
 * Using 12.5% as the middle value
 */
const CASH_MARKUP_PERCENT = 0.125;

/** Round up to nearest multiple of 5 (e.g. 23 → 25, 26 → 30) */
function roundUpToMultipleOf5(value: number): number {
  if (value <= 0) return 0;
  return Math.ceil(value / 5) * 5;
}

/**
 * Calculate the final price based on payment method
 * Cash has a 10-15% markup (using 12.5% average), rounded to a value divisible by 5
 */
export function calculatePaymentPrice(
  basePrice: number,
  paymentMethod: PaymentMethod
): number {
  if (paymentMethod === 'cash') {
    const withMarkup = basePrice * (1 + CASH_MARKUP_PERCENT);
    return roundUpToMultipleOf5(withMarkup);
  }
  // Points and credit card use base price
  return basePrice;
}

/**
 * Calculate how much to pay with points and how much remains
 */
export function calculatePointsPayment(
  totalPrice: number,
  pointsToUse: number,
  availablePoints: number
): { pointsAmount: number; remainingAmount: number } {
  const actualPointsToUse = Math.min(pointsToUse, availablePoints, totalPrice);
  const remaining = Math.max(0, totalPrice - actualPointsToUse);
  return {
    pointsAmount: actualPointsToUse,
    remainingAmount: remaining,
  };
}

/**
 * Get effective price for an event (handles pricing tiers)
 */
export function getEventPrice(
  price: number | null | undefined,
  pricingTiers: Array<{ name: string; price: number }> | null | undefined
): number {
  if (pricingTiers && pricingTiers.length > 0) {
    // Use the first tier price (or average if multiple tiers)
    // For simplicity, using first tier - can be enhanced to let user select tier
    return pricingTiers[0].price;
  }
  if (price != null && price > 0) {
    return price;
  }
  return 0;
}
