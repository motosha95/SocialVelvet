import React from 'react';
import { StyleSheet, View, TouchableOpacity, Switch } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { Button } from '../../../components/ui/Button';
import { useTheme } from '../../../theme/useTheme';
import type { PaymentMethod } from '../types/payment';
import { calculatePaymentPrice, getEventPrice } from '../utils/paymentUtils';
import type { Event } from '../types';

interface PaymentMethodSelectorProps {
  event: Event;
  availablePoints: number;
  onConfirm: (method: PaymentMethod, pointsAmount?: number) => void;
  onCancel: () => void;
}

const PAYMENT_PILLS: Array<{ method: 'credit_card' | 'cash'; label: string; icon: string }> = [
  { method: 'credit_card', label: 'Card', icon: '💳' },
  { method: 'cash', label: 'Cash', icon: '💵' },
];

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  event,
  availablePoints,
  onConfirm,
  onCancel,
}) => {
  const theme = useTheme();
  const [selectedMethod, setSelectedMethod] = React.useState<'credit_card' | 'cash'>('credit_card');
  const [usePoints, setUsePoints] = React.useState(false);

  const basePrice = getEventPrice(event.price, event.pricingTiers);
  const creditCardPrice = calculatePaymentPrice(basePrice, 'credit_card');
  const cashPrice = calculatePaymentPrice(basePrice, 'cash');
  const currency = event.currency || 'AED';

  // When "use points" is on with card: apply as much as balance allows (full or partial discount)
  const pointsApplied = usePoints && selectedMethod === 'credit_card'
    ? Math.min(availablePoints, creditCardPrice)
    : 0;
  const cardAmountAfterPoints = creditCardPrice - pointsApplied;

  const handleConfirm = (): void => {
    // When "use points" is on with card, send as points payment so backend deducts points (rest charged to card)
    if (selectedMethod === 'credit_card' && usePoints && pointsApplied > 0) {
      onConfirm('points', pointsApplied);
    } else {
      onConfirm(selectedMethod);
    }
  };

  const payLabel =
    selectedMethod === 'cash'
      ? `Pay ${cashPrice} ${currency} at event`
      : `Pay ${usePoints && pointsApplied > 0 ? cardAmountAfterPoints : creditCardPrice} ${currency}`;

  const styles = React.useMemo(() => {
    return StyleSheet.create({
      container: {
        backgroundColor: theme.colors.background,
        borderRadius: 20,
        padding: theme.spacing.lg,
        width: '100%',
        maxWidth: 400,
      },
      header: {
        marginBottom: theme.spacing.lg,
      },
      eventTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 4,
      },
      basePriceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
      },
      basePriceLabel: {
        fontSize: 13,
        color: theme.colors.mutedText,
      },
      basePriceValue: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text,
      },
      pillsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: theme.spacing.lg,
      },
      pill: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 2,
      },
      pillSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
      },
      pillUnselected: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      },
      pillText: {
        fontSize: 14,
        fontWeight: '600',
      },
      pillTextSelected: {
        color: theme.mode === 'dark' ? theme.colors.background : '#fff',
      },
      pillTextUnselected: {
        color: theme.colors.text,
      },
      summaryCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: theme.spacing.lg,
      },
      summaryTitle: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: theme.colors.mutedText,
        marginBottom: 8,
      },
      summaryAmount: {
        fontSize: 22,
        fontWeight: '700',
        color: theme.colors.primary,
        marginBottom: 4,
      },
      summaryNote: {
        fontSize: 12,
        color: theme.colors.mutedText,
        lineHeight: 16,
      },
      pointsSwitchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: theme.spacing.md,
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
      },
      pointsSwitchLabel: {
        flex: 1,
      },
      pointsSwitchTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 2,
      },
      pointsSwitchSub: {
        fontSize: 12,
        color: theme.colors.mutedText,
      },
      actions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
      },
      actionBtn: {
        flex: 1,
      },
    });
  }, [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText style={styles.eventTitle} numberOfLines={1}>
          {event.title}
        </AppText>
        <View style={styles.basePriceRow}>
          <AppText style={styles.basePriceLabel}>Base price</AppText>
          <AppText style={styles.basePriceValue}>
            {basePrice} {currency}
          </AppText>
        </View>
      </View>

      <View style={styles.pillsRow}>
        {PAYMENT_PILLS.map(({ method, label, icon }) => {
          const selected = selectedMethod === method;
          return (
            <TouchableOpacity
              key={method}
              style={[styles.pill, selected ? styles.pillSelected : styles.pillUnselected]}
              onPress={() => {
                setSelectedMethod(method);
                if (method === 'cash') setUsePoints(false);
              }}
              activeOpacity={0.8}
            >
              <AppText style={{ fontSize: 16 }}>{icon}</AppText>
              <AppText style={[styles.pillText, selected ? styles.pillTextSelected : styles.pillTextUnselected]}>
                {label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.summaryCard}>
        <AppText style={styles.summaryTitle}>
          {selectedMethod === 'credit_card' && usePoints && pointsApplied > 0
            ? 'Final price after discount'
            : "You'll pay"}
        </AppText>
        {selectedMethod === 'cash' ? (
          <>
            <AppText style={styles.summaryAmount}>
              {cashPrice} {currency}
            </AppText>
            <AppText style={styles.summaryNote}>
              Pay at the event. Price includes 10–15% cash markup.
            </AppText>
          </>
        ) : (
          <>
            {usePoints && pointsApplied > 0 ? (
              <>
                <AppText style={styles.summaryAmount}>
                  {cardAmountAfterPoints === 0
                    ? `0 ${currency}`
                    : `${cardAmountAfterPoints} ${currency}`}
                </AppText>
                <AppText style={styles.summaryNote}>
                  {cardAmountAfterPoints === 0
                    ? `${pointsApplied} pts applied. No card charge.`
                    : `${pointsApplied} pts applied. ${cardAmountAfterPoints} ${currency} charged to card.`}
                </AppText>
              </>
            ) : (
              <>
                <AppText style={styles.summaryAmount}>
                  {creditCardPrice} {currency}
                </AppText>
                <AppText style={styles.summaryNote}>
                  Secure card payment. You'll complete payment in the next step.
                </AppText>
              </>
            )}

            {availablePoints > 0 && (
              <View style={styles.pointsSwitchRow}>
                <View style={styles.pointsSwitchLabel}>
                  <AppText style={styles.pointsSwitchTitle}>Use points for discount</AppText>
                  <AppText style={styles.pointsSwitchSub}>
                    Balance: {availablePoints} pts · Rest charged to card
                  </AppText>
                </View>
                <Switch
                  value={usePoints}
                  onValueChange={setUsePoints}
                  trackColor={{
                    false: theme.colors.border,
                    true: theme.colors.primary + '99',
                  }}
                  thumbColor={usePoints ? theme.colors.primary : theme.colors.surface}
                />
              </View>
            )}
          </>
        )}
      </View>

      <View style={styles.actions}>
        <Button label="Back" onPress={onCancel} variant="secondary" style={styles.actionBtn} />
        <Button label={payLabel} onPress={handleConfirm} style={styles.actionBtn} />
      </View>
    </View>
  );
};
