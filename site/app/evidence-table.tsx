import type { EvidenceCodeBreakdown } from "./registry-types";

interface EvidenceTableProps {
  breakdown: Record<string, EvidenceCodeBreakdown>;
}

/** Full accessible table of classifier recall by DisProt evidence code. */
export function EvidenceTable({ breakdown }: EvidenceTableProps) {
  const rows = Object.entries(breakdown).sort(
    (a, b) => a[1].classifier.recall.point - b[1].classifier.recall.point,
  );
  return (
    <details className="data-alternative">
      <summary>Read the complete evidence-code breakdown ({rows.length} codes)</summary>
      <div className="table-scroll">
        <table>
          <caption>
            Classifier recall by DisProt evidence code (only codes covering at least 200 curated-
            disorder residues shown, per the preregistered minimum). Precision is not compared
            across rows because every row shares the same large non-disorder denominator — see
            the report.
          </caption>
          <thead>
            <tr>
              <th scope="col">Evidence code</th>
              <th scope="col">Meaning</th>
              <th scope="col">Disorder residues</th>
              <th scope="col">Recall</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([ecId, row]) => (
              <tr key={ecId}>
                <td>{ecId}</td>
                <td>{row.ec_name}</td>
                <td>{row.n_disorder_residues.toLocaleString()}</td>
                <td>{(row.classifier.recall.point * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
