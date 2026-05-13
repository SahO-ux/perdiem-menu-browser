import type { AppMoney } from '@/types/app';

// Square stores all monetary values in the smallest currency unit (cents for USD).
export const formatPrice = (money: AppMoney | undefined): string => {
  if (!money) return 'Price varies';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: money.currency,
  }).format(money.amount / 100);
};
