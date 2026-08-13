export interface TestResult {
  statistic: number;
  p_value: number;
  significant: boolean;
  alpha: number;
}

export interface BootstrapMedianDiff {
  median_inside_disorder: number;
  median_outside_disorder: number;
  median_diff: number;
  ci_95_low: number;
  ci_95_high: number;
  resamples: number;
  seed: number;
}

export interface ProportionCi {
  point: number;
  ci_95_low: number;
  ci_95_high: number;
}

export interface ClassifierMetrics {
  n: number;
  threshold: number;
  confusion: {
    true_positive: number;
    false_positive: number;
    true_negative: number;
    false_negative: number;
  };
  precision: ProportionCi;
  recall: ProportionCi;
  f1: ProportionCi;
  mcc: ProportionCi;
}

export interface ProteinBreakdownRow {
  acc: string;
  disprot_id: string;
  n_residues: number;
  n_disorder_residues: number;
  false_negative_residues: number;
  false_negative_rate_of_disorder: number;
  false_positive_residues: number;
  is_conditional: boolean;
}

export interface EvidenceCodeBreakdown {
  ec_name: string;
  n_disorder_residues: number;
  classifier: ClassifierMetrics;
}

export interface Registry {
  schema_version: number;
  dataset: {
    total_proteins: number;
    total_residues: number;
    disorder_annotated_residues: number;
    non_disorder_residues: number;
    conditional_disorder_residues: number;
    non_conditional_disorder_residues: number;
  };
  settings: {
    alpha: number;
    bootstrap_resamples: number;
    bootstrap_seed: number;
    plddt_confident_threshold: number;
  };
  h1_distribution: {
    mann_whitney_u: TestResult;
    ks_robustness: TestResult;
    bootstrap_median_diff_outside_minus_inside: BootstrapMedianDiff;
  };
  h2_classifier: {
    overall: ClassifierMetrics;
    by_conditional_flag: {
      conditional_disorder_regions: ClassifierMetrics;
      non_conditional_disorder_regions: ClassifierMetrics;
    };
    by_evidence_code: Record<string, EvidenceCodeBreakdown>;
  };
  protein_breakdown: ProteinBreakdownRow[];
  distributions: {
    note: string;
    inside_disorder: number[];
    outside_disorder: number[];
  };
}
