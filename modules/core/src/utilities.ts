export function roundToDecimalPlaces(
  value: number,
  decimalPlaces: number
): number {
  if (decimalPlaces <= 0) {
    return Math.round(value);
  }

  const multiplier = Math.pow(10, decimalPlaces);
  return Math.round(value * multiplier) / multiplier;
}

// export function roundTo(value: number, divisor: number): number {
//   const quotient = value / divisor;
//   const roundedQuotient = Math.round(quotient);
//   return roundedQuotient * divisor;
// }
