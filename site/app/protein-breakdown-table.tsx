import type { ProteinBreakdownRow } from "./registry-types";

interface ProteinBreakdownTableProps {
  rows: ProteinBreakdownRow[];
  limit?: number;
}

/** Full accessible table of the per-protein classifier failure breakdown. */
export function ProteinBreakdownTable({ rows, limit = 40 }: ProteinBreakdownTableProps) {
  const shown = rows.slice(0, limit);
  return (
    <details className="data-alternative">
      <summary>
        Read the complete per-protein breakdown ({rows.length} proteins, sorted by
        false-negative rate — top {shown.length} shown)
      </summary>
      <div className="table-scroll">
        <table>
          <caption>
            Per-protein classifier failure breakdown: how often curated-disorder residues receive
            a confident pLDDT (false negative) vs. how often non-disorder residues receive a low
            pLDDT (false positive), by UniProt accession.
          </caption>
          <thead>
            <tr>
              <th scope="col">UniProt</th>
              <th scope="col">DisProt ID</th>
              <th scope="col">Residues</th>
              <th scope="col">Disorder residues</th>
              <th scope="col">False-negative rate</th>
              <th scope="col">False positives</th>
              <th scope="col">Conditional?</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => (
              <tr key={row.acc}>
                <td>
                  <a href={`https://www.uniprot.org/uniprotkb/${row.acc}`}>{row.acc}</a>
                </td>
                <td>
                  <a href={`https://disprot.org/${row.disprot_id}`}>{row.disprot_id}</a>
                </td>
                <td>{row.n_residues.toLocaleString()}</td>
                <td>{row.n_disorder_residues.toLocaleString()}</td>
                <td>{(row.false_negative_rate_of_disorder * 100).toFixed(1)}%</td>
                <td>{row.false_positive_residues.toLocaleString()}</td>
                <td>{row.is_conditional ? "yes" : "no"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
