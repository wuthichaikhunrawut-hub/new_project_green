import { Injectable } from '@angular/core';

export interface GenericChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderRadius?: number;
  }>;
}

export type GhgAspectKey =
  | 'electricity'
  | 'fuel'
  | 'water'
  | 'paper'
  | 'landfillWaste'
  | 'wastewater'
  | 'refrigerant'
  | 'fireExtinguisher';

export interface GhgAspectUsageInput {
  electricityKwh?: number;
  fuelLiters?: number;
  waterM3?: number;
  paperKg?: number;
  landfillWasteKg?: number;
  wastewaterM3?: number;
  refrigerantKg?: number;
  fireExtinguisherKgCo2?: number;
}

export interface GhgAspectEmissionOutput {
  key: GhgAspectKey;
  label: string;
  emissionKgCo2e: number;
}

export interface GhgEmissionFactors {
  electricityKgCo2ePerKwh: number;
  fuelKgCo2ePerLiter: number;
  waterKgCo2ePerM3: number;
  paperKgCo2ePerKg: number;
  landfillWasteKgCo2ePerKg: number;
  wastewaterKgCo2ePerM3: number;
  refrigerantKgCo2ePerKg: number;
  fireExtinguisherKgCo2ePerKgCo2: number;
}

export interface GhgEightAspectsResult {
  aspects: GhgAspectEmissionOutput[];
  totalKgCo2e: number;
}

@Injectable({ providedIn: 'root' })
export class GhgAnalyticsService {
  getDefaultFactors(): GhgEmissionFactors {
    return {
      electricityKgCo2ePerKwh: 0.5,
      fuelKgCo2ePerLiter: 2.68,
      waterKgCo2ePerM3: 0.3,
      paperKgCo2ePerKg: 1.2,
      landfillWasteKgCo2ePerKg: 1.9,
      wastewaterKgCo2ePerM3: 0.7,
      refrigerantKgCo2ePerKg: 1430,
      fireExtinguisherKgCo2ePerKgCo2: 1,
    };
  }

  computeEightAspects(
    input: GhgAspectUsageInput,
    factors: GhgEmissionFactors = this.getDefaultFactors(),
  ): GhgEightAspectsResult {
    const aspects: GhgAspectEmissionOutput[] = [
      {
        key: 'electricity',
        label: 'ไฟฟ้า',
        emissionKgCo2e: (input.electricityKwh ?? 0) * factors.electricityKgCo2ePerKwh,
      },
      {
        key: 'fuel',
        label: 'น้ำมันเชื้อเพลิง',
        emissionKgCo2e: (input.fuelLiters ?? 0) * factors.fuelKgCo2ePerLiter,
      },
      {
        key: 'water',
        label: 'น้ำประปา',
        emissionKgCo2e: (input.waterM3 ?? 0) * factors.waterKgCo2ePerM3,
      },
      {
        key: 'paper',
        label: 'กระดาษ',
        emissionKgCo2e: (input.paperKg ?? 0) * factors.paperKgCo2ePerKg,
      },
      {
        key: 'landfillWaste',
        label: 'ขยะฝังกลบ',
        emissionKgCo2e: (input.landfillWasteKg ?? 0) * factors.landfillWasteKgCo2ePerKg,
      },
      {
        key: 'wastewater',
        label: 'น้ำเสีย',
        emissionKgCo2e: (input.wastewaterM3 ?? 0) * factors.wastewaterKgCo2ePerM3,
      },
      {
        key: 'refrigerant',
        label: 'สารทำความเย็น',
        emissionKgCo2e: (input.refrigerantKg ?? 0) * factors.refrigerantKgCo2ePerKg,
      },
      {
        key: 'fireExtinguisher',
        label: 'ถังดับเพลิง (CO2)',
        emissionKgCo2e: (input.fireExtinguisherKgCo2 ?? 0) * factors.fireExtinguisherKgCo2ePerKgCo2,
      },
    ];

    const totalKgCo2e = aspects.reduce((sum, a) => sum + a.emissionKgCo2e, 0);

    return {
      aspects,
      totalKgCo2e,
    };
  }

  toRadarChartData(result: GhgEightAspectsResult): GenericChartData {
    const labels = result.aspects.map((a) => a.label);
    const data = result.aspects.map((a) => this.round2(a.emissionKgCo2e));

    return {
      labels,
      datasets: [
        {
          data,
          label: 'kgCO2e',
          backgroundColor: 'rgba(16, 185, 129, 0.18)',
        },
      ],
    };
  }

  radarChartOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: { color: 'rgba(15, 23, 42, 0.08)' },
          grid: { color: 'rgba(15, 23, 42, 0.08)' },
          pointLabels: {
            color: '#64748b',
            font: { family: "'IBM Plex Sans Thai', system-ui, sans-serif", size: 10 },
          },
          ticks: { display: false },
          suggestedMin: 0,
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: any) => `${ctx.formattedValue} kgCO2e`,
          },
        },
      },
    };
  }

  toStackedBarChartData(result: GhgEightAspectsResult): GenericChartData {
    const labels = ['GHG'];
    const colors = [
      '#10b981',
      '#f59e0b',
      '#3b82f6',
      '#8b5cf6',
      '#ef4444',
      '#0ea5e9',
      '#f97316',
      '#22c55e',
    ];

    return {
      labels,
      datasets: result.aspects.map((a, idx) => ({
        label: a.label,
        data: [this.round2(a.emissionKgCo2e)],
        backgroundColor: colors[idx % colors.length],
        borderRadius: 10,
      })),
    };
  }

  stackedBarChartOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (ctx: any) => `${ctx.dataset.label}: ${ctx.formattedValue} kgCO2e`,
          },
        },
      },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, ticks: { callback: (v: any) => `${v}` } },
      },
    };
  }

  private round2(n: number): number {
    return Math.round(n * 100) / 100;
  }
}
