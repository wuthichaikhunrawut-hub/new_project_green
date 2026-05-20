import { SetMetadata } from '@nestjs/common';

export const FEATURE_CODE_KEY = 'feature_code';
export const FeatureCode = (code: string) => SetMetadata(FEATURE_CODE_KEY, code);
