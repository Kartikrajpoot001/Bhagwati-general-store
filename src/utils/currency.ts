/**
 * Currency formatter utility for Indian Rupee (INR - ₹).
 */

export function formatINR(amount: number, includeDecimals = true): string {
  if (isNaN(amount)) return '₹0.00';
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  })}`;
}
