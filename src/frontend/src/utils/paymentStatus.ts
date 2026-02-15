/**
 * Utility for deriving payment status and consistent styling based on balance
 * 
 * Convention:
 * - Due (balance > 0): Red styling
 * - Overpaid (balance < 0): Green styling
 * - Settled (balance === 0): Neutral styling
 */

export type PaymentStatus = 'due' | 'overpaid' | 'settled';

export interface PaymentStatusResult {
  status: PaymentStatus;
  label: string;
  badgeVariant: 'destructive' | 'default' | 'secondary';
  amountClassName: string;
}

export function getPaymentStatus(balance: number): PaymentStatusResult {
  if (balance > 0) {
    return {
      status: 'due',
      label: 'Due',
      badgeVariant: 'destructive',
      amountClassName: 'text-destructive',
    };
  } else if (balance < 0) {
    return {
      status: 'overpaid',
      label: 'Overpaid',
      badgeVariant: 'default',
      amountClassName: 'text-green-600 dark:text-green-500',
    };
  } else {
    return {
      status: 'settled',
      label: 'Settled',
      badgeVariant: 'secondary',
      amountClassName: 'text-muted-foreground',
    };
  }
}

export function getChargeClassName(): string {
  return 'text-destructive';
}

export function getPaymentClassName(): string {
  return 'text-green-600 dark:text-green-500';
}
