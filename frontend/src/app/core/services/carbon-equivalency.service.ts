import { Injectable } from '@angular/core';

export interface CarbonEquivalency {
  trees: number;
  flights: number;
}

@Injectable({ providedIn: 'root' })
export class CarbonEquivalencyService {
  toEquivalency(tCo2e: number): CarbonEquivalency {
    const kg = Math.max(0, tCo2e) * 1000;

    const kgPerTreePerYear = 21;
    const kgPerFlight = 250;

    return {
      trees: Math.round(kg / kgPerTreePerYear),
      flights: Math.round(kg / kgPerFlight),
    };
  }
}
