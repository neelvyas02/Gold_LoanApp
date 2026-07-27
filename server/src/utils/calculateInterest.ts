export function calculateInterest(amount: number, rate: number, months: number = 12): number {
  if (amount <= 0 || rate < 0 || months <= 0) return 0;
  return Math.round((amount * rate * months) / 1200);
}
