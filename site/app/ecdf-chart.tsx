import { domainOf, ecdf, ecdfPath } from "./ecdf";

interface EcdfChartProps {
  title: string;
  description: string;
  unit: string;
  inside: number[];
  outside: number[];
  tableId: string;
  /** Optional vertical marker (e.g. the currently-selected classifier threshold). */
  markerValue?: number;
  markerLabel?: string;
}

const WIDTH = 640;
const HEIGHT = 300;
const PADDING = 40;

/**
 * ECDF comparison chart. The two groups are distinguished by stroke style
 * (solid vs. dashed) and text labels, not only by color, so the comparison
 * survives grayscale printing, color-vision deficiency, and forced-colors
 * mode.
 */
export function EcdfChart({
  title,
  description,
  unit,
  inside,
  outside,
  tableId,
  markerValue,
  markerLabel,
}: EcdfChartProps) {
  const domain = domainOf(inside, outside);
  const insidePath = ecdfPath(ecdf(inside), domain, WIDTH, HEIGHT, PADDING);
  const outsidePath = ecdfPath(ecdf(outside), domain, WIDTH, HEIGHT, PADDING);
  const gridY = [0, 0.25, 0.5, 0.75, 1];
  const toY = (fraction: number) => HEIGHT - PADDING - fraction * (HEIGHT - 2 * PADDING);
  const [xMin, xMax] = domain;
  const hasMarker = typeof markerValue === "number" && markerValue >= xMin && markerValue <= xMax;
  const markerX = hasMarker
    ? PADDING + ((markerValue! - xMin) / (xMax - xMin || 1)) * (WIDTH - 2 * PADDING)
    : null;

  return (
    <div className="chart-card">
      <h3>{title}</h3>
      <p>{description}</p>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-labelledby={`${tableId}-title`}
        aria-describedby={`${tableId}-desc`}
      >
        <title id={`${tableId}-title`}>{title}</title>
        <desc id={`${tableId}-desc`}>
          Empirical cumulative distribution comparing {inside.length} residues inside a curated
          disorder region (dashed line) against {outside.length} residues outside one (solid
          line), pLDDT in {unit}. Full values are in the accessible data table below this chart.
        </desc>
        {gridY.map((fraction) => (
          <line
            key={fraction}
            x1={PADDING}
            x2={WIDTH - PADDING}
            y1={toY(fraction)}
            y2={toY(fraction)}
            className="chart-grid"
          />
        ))}
        {gridY.map((fraction) => (
          <text key={fraction} x={4} y={toY(fraction) + 3}>
            {fraction.toFixed(2)}
          </text>
        ))}
        <text x={PADDING} y={HEIGHT - 8}>
          {xMin.toFixed(1)}
        </text>
        <text x={WIDTH - PADDING} y={HEIGHT - 8} textAnchor="end">
          {xMax.toFixed(1)} {unit}
        </text>
        <path d={outsidePath} className="ecdf-line ecdf-line--outside" />
        <path d={insidePath} className="ecdf-line ecdf-line--inside" />
        {markerX !== null && (
          <g className="ecdf-marker">
            <line x1={markerX} x2={markerX} y1={PADDING} y2={HEIGHT - PADDING} />
            <text x={markerX} y={PADDING - 10} textAnchor="middle">
              {markerLabel ?? `threshold ${markerValue}`}
            </text>
          </g>
        )}
      </svg>
      <div className="chart-legend">
        <span>
          <i className="legend-swatch--outside" aria-hidden="true" /> Outside curated disorder
          (solid line), n={outside.length.toLocaleString()}
        </span>
        <span>
          <i className="legend-swatch--inside" aria-hidden="true" /> Inside curated disorder
          (dashed line), n={inside.length.toLocaleString()}
        </span>
      </div>
      <p className="uncertainty-note" style={{ marginTop: "10px" }}>
        {`Downsampled to at most 3,000 values per group (seed 20260813) for this chart only —`}
        every statistic reported alongside it is computed on the full joined dataset.
      </p>
    </div>
  );
}
