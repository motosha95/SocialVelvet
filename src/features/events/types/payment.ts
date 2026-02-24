export type PaymentMethod = 'points' | 'cash' | 'credit_card';

export interface PaymentDetails {
  method: PaymentMethod;
  pointsAmount?: number; // Amount to pay with points (for partial payment)
  totalAmount: number; // Total amount to pay
}

export interface JoinEventPaymentRequest {
  paymentMethod: PaymentMethod;
  pointsAmount?: number; // Amount to pay with points (for partial payment)
}
