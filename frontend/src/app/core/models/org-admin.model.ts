import { Assessment } from './assessment.model';
import { CarbonLog } from './carbon-log.model';

export interface RevisionCenterResponse {
  revisions: Assessment[];
  carbonLogs: CarbonLog[];
}
