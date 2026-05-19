export interface ScopeEmissionSummary {
  scope: number;
  label: string;
  totalEmission: number;
  logCount: number;
}

export interface OrgCarbonSummary {
  orgId: number;
  orgName: string;
  scopes: ScopeEmissionSummary[];
  totalEmission: number;
  isMock?: boolean;
}

export interface AssessorDashboardStats {
  pending: number;
  inReview: number;
  revisionRequested: number;
  completed: number;
  nearDeadline: number;
  avgScorePercent: number;
}

export interface AssessorAssignmentItem {
  id: number;
  orgId: number;
  orgName: string;
  assessmentYear: number;
  status: string;
  totalScore: number;
  submittedAt: string | null;
  carbonSummary: OrgCarbonSummary;
}

export interface AssessorDashboardResponse {
  stats: AssessorDashboardStats;
  assignments: AssessorAssignmentItem[];
}
