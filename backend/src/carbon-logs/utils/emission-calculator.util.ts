/**
 * Pure calculation utility for carbon emissions based on Thailand Greenhouse Gas Management Organization (TGO) standards.
 */
export function calculateEmission(
  usageAmount: number,
  factorValue: number,
): number {
  if (
    usageAmount === undefined ||
    usageAmount === null ||
    isNaN(usageAmount) ||
    factorValue === undefined ||
    factorValue === null ||
    isNaN(factorValue) ||
    usageAmount < 0 ||
    factorValue < 0
  ) {
    return 0;
  }
  return Number((usageAmount * factorValue).toFixed(4));
}
