import { calculateEmission } from './emission-calculator.util';

describe('EmissionCalculatorUtil', () => {
  it('should accurately calculate emission with 4 decimal places precision', () => {
    // 100 kWh * 0.4999 kgCO2e/kWh = 49.99 kgCO2e
    expect(calculateEmission(100, 0.4999)).toBe(49.99);
    // 12.345 Liters * 2.68 = 33.0846
    expect(calculateEmission(12.345, 2.68)).toBe(33.0846);
  });

  it('should return 0 when usage amount or factor value is missing or invalid', () => {
    expect(calculateEmission(0, 2.5)).toBe(0);
    expect(calculateEmission(100, 0)).toBe(0);
    expect(calculateEmission(-5, 2.5)).toBe(0);
    expect(calculateEmission(10, -2.5)).toBe(0);
    expect(calculateEmission(NaN, 2.5)).toBe(0);
    expect(calculateEmission(10, NaN)).toBe(0);
  });
});
