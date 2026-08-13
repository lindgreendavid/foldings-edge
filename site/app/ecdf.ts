/** Empirical CDF helper for the accessible distribution-comparison chart. */

export interface EcdfPoint {
  x: number;
  y: number;
}

/** Compute step-function ECDF points (x, cumulative fraction) for a numeric sample. */
export function ecdf(values: number[]): EcdfPoint[] {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const points: EcdfPoint[] = [];
  sorted.forEach((value, index) => {
    points.push({ x: value, y: index / n });
    points.push({ x: value, y: (index + 1) / n });
  });
  return points;
}

/** Build an SVG path `d` attribute for a set of ECDF points, scaled into a plot box. */
export function ecdfPath(
  points: EcdfPoint[],
  domain: [number, number],
  width: number,
  height: number,
  padding: number,
): string {
  const [xMin, xMax] = domain;
  const scaleX = (x: number) => padding + ((x - xMin) / (xMax - xMin)) * (width - 2 * padding);
  const scaleY = (y: number) => height - padding - y * (height - 2 * padding);
  if (points.length === 0) return "";
  const commands = points.map((point, index) => {
    const command = index === 0 ? "M" : "L";
    return `${command}${scaleX(point.x).toFixed(2)},${scaleY(point.y).toFixed(2)}`;
  });
  return commands.join(" ");
}

export function domainOf(...samples: number[][]): [number, number] {
  const all = samples.flat();
  return [Math.min(...all), Math.max(...all)];
}
