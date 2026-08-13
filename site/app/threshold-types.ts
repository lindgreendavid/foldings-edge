/** Types for the precomputed pLDDT-threshold sweep (see scripts/generate_threshold_sweep.py). */

export interface ThresholdMetrics {
  threshold: number;
  confusion: {
    true_positive: number;
    false_positive: number;
    true_negative: number;
    false_negative: number;
  };
  precision: number;
  recall: number;
  f1: number;
  mcc: number;
}

export interface ThresholdSweep {
  schema_version: number;
  threshold_min: number;
  threshold_max: number;
  threshold_step: number;
  preregistered_threshold: number;
  overall: ThresholdMetrics[];
  by_conditional_flag: {
    conditional_disorder_regions: ThresholdMetrics[];
    non_conditional_disorder_regions: ThresholdMetrics[];
  };
}
