interface DistributionTableProps {
  caption: string;
  unit: string;
  inside: number[];
  outside: number[];
}

/** A scrollable, fully accessible data table listing every downsampled chart value. */
export function DistributionTable({ caption, unit, inside, outside }: DistributionTableProps) {
  const rows = Math.max(inside.length, outside.length);
  const insideSorted = [...inside].sort((a, b) => a - b);
  const outsideSorted = [...outside].sort((a, b) => a - b);
  return (
    <details className="data-alternative">
      <summary>Read the complete data table for {caption} (values sorted ascending, {unit})</summary>
      <div className="table-scroll">
        <table>
          <caption>{caption}</caption>
          <thead>
            <tr>
              <th scope="col">Row</th>
              <th scope="col">Outside curated disorder ({outside.length.toLocaleString()})</th>
              <th scope="col">Inside curated disorder ({inside.length.toLocaleString()})</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{outsideSorted[index]?.toFixed(2) ?? "—"}</td>
                <td>{insideSorted[index]?.toFixed(2) ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
