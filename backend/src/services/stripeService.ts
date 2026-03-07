import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;
export const stripe = secretKey ? new Stripe(secretKey) : null;

if (!stripe && process.env.NODE_ENV !== 'test') {
  console.warn('[stripe] STRIPE_SECRET_KEY is not set. Card payments will return 503; use Cash or Points.');
}

/** Convert major unit (e.g. 10.50 AED) to Stripe amount (minor unit, e.g. 1050) */
export function toStripeAmount(amountMajor: number, currency: string): number {
  const amount = Math.round(amountMajor * 100);
  return Math.max(0, amount);
}

/**
 * Create a Payment Intent for an event ticket. Caller must verify event and user.
 */
export async function createEventPaymentIntent(params: {
  eventId: string;
  userId: string;
  amountMajor: number;
  currency: string;
  pointsAmount?: number;
}): Promise<{ clientSecret: string; paymentIntentId: string } | null> {
  if (!stripe) return null;
  const amountToCharge = Math.max(0, params.amountMajor - (params.pointsAmount ?? 0));
  if (amountToCharge <= 0) return null;

  const currency = (params.currency || 'aed').toLowerCase();
  const amount = toStripeAmount(amountToCharge, currency);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        eventId: params.eventId,
        userId: params.userId,
        pointsUsed: String(params.pointsAmount ?? 0),
      },
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[stripe] createEventPaymentIntent failed:', message);
    throw new Error(`Stripe: ${message}`);
  }
}

/**
 * Retrieve and verify a Payment Intent: must be succeeded and metadata must match.
 */
export async function verifyEventPaymentIntent(
  paymentIntentId: string,
  eventId: string,
  userId: string
): Promise<{ amountPaidMajor: number; currency: string } | null> {
  if (!stripe) return null;
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (pi.status !== 'succeeded') return null;
  if (pi.metadata?.eventId !== eventId || pi.metadata?.userId !== userId) return null;
  const currency = (pi.currency || 'aed').toLowerCase();
  const amountPaidMajor = (pi.amount_received ?? pi.amount) / 100;
  return { amountPaidMajor, currency };
}
