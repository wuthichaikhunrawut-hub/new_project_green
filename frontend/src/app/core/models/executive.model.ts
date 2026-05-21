export interface ExecutiveApprovedAssessment {
  id: number;
  assessmentYear: number | null;
  totalScore: number;
  certifiedLevel: string | null;
  approvedAt: string | null;
  certificateUrl?: string | null;
  certificateNo?: string | null;
  issuedAt?: string | null;
  expiredAt?: string | null;
}

export interface CarbonScopePoint {
  scope: number;
  year: number;
  totalEmission: number;
}

export interface CarbonUnitPoint {
  unitName: string;
  totalEmission: number;
}

export interface ExecutiveDashboardResponse {
  orgId: number;
  orgName: string;
  targetReductionPercent: number;
  approvedCount: number;
  avgApprovedScore: number;
  latestCertifiedLevel: string | null;
  netZeroProgressPercent: number;
  approvedAssessments: ExecutiveApprovedAssessment[];
  carbonByScope: CarbonScopePoint[];
  carbonByUnit: CarbonUnitPoint[];
}
