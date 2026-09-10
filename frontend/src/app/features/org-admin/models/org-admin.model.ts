import { Assessment } from '../../../core/models/assessment.model';
import { CarbonLog } from '../../../core/models/carbon-log.model';

export interface RevisionCenterResponse {
  revisions: Assessment[];
  carbonLogs: CarbonLog[];
}
