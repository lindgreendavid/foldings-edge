interface TestResult {
  statistic: number;
  p_value: number;
  significant: boolean;
  alpha: number;
}

interface BootstrapMedianDiff {
  median_inside_disorder: number;
  median_outside_disorder: number;
  median_diff: number;
  ci_95_low: number;
  ci_95_high: number;
  resamples: number;
}

interface DistributionResultProps {
  mannWhitney: TestResult;
  ks: TestResult;
  bootstrap: BootstrapMedianDiff;
}

function fmt(value: number, digits = 3): string {
  if (Math.abs(value) < 0.001 && value !== 0) {
    return value.toExponential(2);
  }
  return value.toFixed(digits);
}

function fmtP(value: number): string {
  if (value === 0) return "< 1×10⁻³⁰⁰";
  if (value < 0.0001) return value.toExponential(2);
  return value.toFixed(4);
}

export function DistributionResult({ mannWhitney, ks, bootstrap }: DistributionResultProps) {
  return (
    <div>
      <p>
        <strong>H1 — pLDDT inside vs. outside curated disorder</strong>
        <span
          className={`result-tag ${mannWhitney.significant ? "result-tag--significant" : "result-tag--not-significant"}`}
        >
          {mannWhitney.significant ? "Significant (Mann–Whitney U)" : "Not significant"}
        </span>
      </p>
      <div className="stat-footer">
        <div>
          <span>Mann–Whitney U / p-value</span>
          <strong>
            U={mannWhitney.statistic.toLocaleString()}, p={fmtP(mannWhitney.p_value)}
          </strong>
        </div>
        <div>
          <span>KS robustness check</span>
          <strong>
            D={fmt(ks.statistic)}, p={fmtP(ks.p_value)}{" "}
            {ks.significant ? "(significant)" : "(not significant)"}
          </strong>
        </div>
        <div>
          <span>Median pLDDT, inside / outside disorder</span>
          <strong>
            {fmt(bootstrap.median_inside_disorder, 1)} / {fmt(bootstrap.median_outside_disorder, 1)}
          </strong>
        </div>
        <div>
          <span>Bootstrap 95% CI of the difference</span>
          <strong>
            [{fmt(bootstrap.ci_95_low, 2)}, {fmt(bootstrap.ci_95_high, 2)}] (
            {bootstrap.resamples.toLocaleString()} resamples)
          </strong>
        </div>
      </div>
    </div>
  );
}

interface ProportionCi {
  point: number;
  ci_95_low: number;
  ci_95_high: number;
}

interface ClassifierResultProps {
  label: string;
  n: number;
  precision: ProportionCi;
  recall: ProportionCi;
  f1: ProportionCi;
  mcc: ProportionCi;
}

function pct(pc: ProportionCi): string {
  return `${(pc.point * 100).toFixed(1)}% [${(pc.ci_95_low * 100).toFixed(1)}, ${(pc.ci_95_high * 100).toFixed(1)}]`;
}

export function ClassifierResult({ label, n, precision, recall, f1, mcc }: ClassifierResultProps) {
  return (
    <div className="classifier-card">
      <p>
        <strong>{label}</strong> <span className="uncertainty-note">n={n.toLocaleString()} residues</span>
      </p>
      <div className="stat-footer">
        <div>
          <span>Precision (95% CI)</span>
          <strong>{pct(precision)}</strong>
        </div>
        <div>
          <span>Recall (95% CI)</span>
          <strong>{pct(recall)}</strong>
        </div>
        <div>
          <span>F1 (95% CI)</span>
          <strong>{pct(f1)}</strong>
        </div>
        <div>
          <span>MCC (95% CI)</span>
          <strong>
            {mcc.point.toFixed(3)} [{mcc.ci_95_low.toFixed(3)}, {mcc.ci_95_high.toFixed(3)}]
          </strong>
        </div>
      </div>
    </div>
  );
}
