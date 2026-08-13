"use client";

import { useMemo, useState } from "react";
import type { ThresholdMetrics, ThresholdSweep } from "./threshold-types";
import { EcdfChart } from "./ecdf-chart";

type Group = "overall" | "conditional" | "non_conditional";

const GROUP_LABEL: Record<Group, string> = {
  overall: "All curated-disorder residues",
  conditional: "On a protein WITH a conditional-folding region elsewhere",
  non_conditional: "On a protein with NO conditional-folding region",
};

const REFERENCE_THRESHOLDS = [50, 70, 90];

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function metricsFor(sweep: ThresholdSweep, group: Group, threshold: number): ThresholdMetrics {
  const series =
    group === "overall"
      ? sweep.overall
      : group === "conditional"
        ? sweep.by_conditional_flag.conditional_disorder_regions
        : sweep.by_conditional_flag.non_conditional_disorder_regions;
  const index = Math.round((threshold - sweep.threshold_min) / sweep.threshold_step);
  return series[Math.min(Math.max(index, 0), series.length - 1)];
}

function speakStats(threshold: number, group: Group, metrics: ThresholdMetrics): string {
  return (
    `pLDDT threshold ${threshold}, ${GROUP_LABEL[group].toLowerCase()}: ` +
    `precision ${pct(metrics.precision)}, recall ${pct(metrics.recall)}, ` +
    `F1 ${metrics.f1.toFixed(3)}, MCC ${metrics.mcc.toFixed(3)}. ` +
    `${metrics.confusion.true_positive.toLocaleString()} true positives, ` +
    `${metrics.confusion.false_positive.toLocaleString()} false positives, ` +
    `${metrics.confusion.true_negative.toLocaleString()} true negatives, ` +
    `${metrics.confusion.false_negative.toLocaleString()} false negatives.`
  );
}

interface ThresholdExplorerProps {
  sweep: ThresholdSweep;
  insideDistribution: number[];
  outsideDistribution: number[];
}

/**
 * Interactive pLDDT-threshold explorer: drag the slider to see live precision/
 * recall/F1/MCC and confusion counts at any threshold from 0-100, computed from
 * the real joined residue data (scripts/generate_threshold_sweep.py), plus an
 * optional split by the same conditional-folding-flag breakdown the report
 * calls out as the project's headline discrepancy — aggregate performance looks
 * moderate, but it degrades sharply on conditional-folding-flagged disorder.
 * The preregistered threshold (70) is always one control away via the reset
 * button, and a static reference table below gives a keyboard/screen-reader-
 * independent fallback at three representative thresholds.
 */
export function ThresholdExplorer({
  sweep,
  insideDistribution,
  outsideDistribution,
}: ThresholdExplorerProps) {
  const [threshold, setThreshold] = useState(sweep.preregistered_threshold);
  const [group, setGroup] = useState<Group>("overall");

  const metrics = useMemo(() => metricsFor(sweep, group, threshold), [sweep, group, threshold]);
  const liveText = useMemo(() => speakStats(threshold, group, metrics), [threshold, group, metrics]);
  const isPreregistered = threshold === sweep.preregistered_threshold;

  const referenceRows = useMemo(
    () =>
      REFERENCE_THRESHOLDS.map((t) => ({
        threshold: t,
        overall: metricsFor(sweep, "overall", t),
        conditional: metricsFor(sweep, "conditional", t),
        nonConditional: metricsFor(sweep, "non_conditional", t),
      })),
    [sweep],
  );

  return (
    <div className="threshold-explorer">
      <h3>Explore the threshold yourself</h3>
      <p>
        The report above uses a single, preregistered threshold (pLDDT&lt;70 = &quot;not
        confident&quot;). Drag the slider to see how precision, recall, F1, and MCC — and the
        underlying true/false positive/negative counts — change at any other threshold from 0 to
        100, computed from the same real 228,662-residue dataset.
      </p>

      <div className="threshold-toggle" role="group" aria-label="Break down by conditional-folding flag">
        {(Object.keys(GROUP_LABEL) as Group[]).map((g) => (
          <button
            key={g}
            type="button"
            aria-pressed={group === g}
            onClick={() => setGroup(g)}
          >
            {g === "overall" ? "Aggregate" : g === "conditional" ? "Conditional-folding-flagged" : "No conditional flag"}
          </button>
        ))}
      </div>

      <div className="threshold-control">
        <label htmlFor="threshold-slider">
          pLDDT threshold ({GROUP_LABEL[group]})
        </label>
        <div className="threshold-control__row">
          <input
            id="threshold-slider"
            type="range"
            min={sweep.threshold_min}
            max={sweep.threshold_max}
            step={sweep.threshold_step}
            value={threshold}
            onChange={(event) => setThreshold(Number(event.target.value))}
            aria-valuetext={liveText}
          />
          <span className="threshold-control__value" aria-hidden="true">
            {threshold}
          </span>
          <button
            type="button"
            className="threshold-reset"
            onClick={() => setThreshold(sweep.preregistered_threshold)}
            aria-disabled={isPreregistered}
          >
            Reset to preregistered threshold ({sweep.preregistered_threshold})
          </button>
        </div>
      </div>

      <div className="threshold-live" role="status" aria-live="polite">
        <p className="uncertainty-note">{liveText}</p>
      </div>

      <div className="threshold-confusion" aria-hidden="true">
        <div>
          <span>Precision</span>
          <strong>{pct(metrics.precision)}</strong>
        </div>
        <div>
          <span>Recall</span>
          <strong>{pct(metrics.recall)}</strong>
        </div>
        <div>
          <span>F1</span>
          <strong>{metrics.f1.toFixed(3)}</strong>
        </div>
        <div>
          <span>MCC</span>
          <strong>{metrics.mcc.toFixed(3)}</strong>
        </div>
        <div>
          <span>True positive</span>
          <strong>{metrics.confusion.true_positive.toLocaleString()}</strong>
        </div>
        <div>
          <span>False positive</span>
          <strong>{metrics.confusion.false_positive.toLocaleString()}</strong>
        </div>
        <div>
          <span>True negative</span>
          <strong>{metrics.confusion.true_negative.toLocaleString()}</strong>
        </div>
        <div>
          <span>False negative</span>
          <strong>{metrics.confusion.false_negative.toLocaleString()}</strong>
        </div>
      </div>
      <p className="uncertainty-note threshold-note">
        {group === "overall"
          ? "Aggregate view — the headline numbers reported elsewhere on this page."
          : "This split uses the same protein-level conditional-folding proxy as “Where it fails” below: notice how much further precision and MCC drop on the conditional-folding-flagged group at every threshold, not just at 70."}
      </p>

      <EcdfChart
        title="pLDDT — inside vs. outside curated disorder, with your threshold marked"
        description="Same empirical cumulative distribution as above, with a vertical marker at the threshold currently selected on the slider."
        unit="pLDDT"
        inside={insideDistribution}
        outside={outsideDistribution}
        tableId="threshold-chart"
        markerValue={threshold}
        markerLabel={`threshold ${threshold}`}
      />

      <details className="data-alternative">
        <summary>
          Read the reference table (thresholds 50 / 70 / 90) — no interaction required
        </summary>
        <div className="table-scroll">
          <table>
            <caption>
              Classifier performance at three representative thresholds, aggregate and split by
              the conditional-folding-flag proxy. A non-interactive equivalent of the slider
              above.
            </caption>
            <thead>
              <tr>
                <th scope="col">Threshold</th>
                <th scope="col">Group</th>
                <th scope="col">Precision</th>
                <th scope="col">Recall</th>
                <th scope="col">F1</th>
                <th scope="col">MCC</th>
                <th scope="col">TP</th>
                <th scope="col">FP</th>
                <th scope="col">TN</th>
                <th scope="col">FN</th>
              </tr>
            </thead>
            <tbody>
              {referenceRows.flatMap((row) => [
                { label: "Aggregate", m: row.overall },
                { label: "Conditional-folding-flagged", m: row.conditional },
                { label: "No conditional flag", m: row.nonConditional },
              ].map((entry) => (
                <tr key={`${row.threshold}-${entry.label}`}>
                  <td>{row.threshold === sweep.preregistered_threshold ? `${row.threshold} (preregistered)` : row.threshold}</td>
                  <td>{entry.label}</td>
                  <td>{pct(entry.m.precision)}</td>
                  <td>{pct(entry.m.recall)}</td>
                  <td>{entry.m.f1.toFixed(3)}</td>
                  <td>{entry.m.mcc.toFixed(3)}</td>
                  <td>{entry.m.confusion.true_positive.toLocaleString()}</td>
                  <td>{entry.m.confusion.false_positive.toLocaleString()}</td>
                  <td>{entry.m.confusion.true_negative.toLocaleString()}</td>
                  <td>{entry.m.confusion.false_negative.toLocaleString()}</td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
