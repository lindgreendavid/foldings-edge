import registryJson from "./data/registry.json";
import type { Registry } from "./registry-types";
import { EcdfChart } from "./ecdf-chart";
import { DistributionResult, ClassifierResult } from "./comparison-result";
import { DistributionTable } from "./distribution-table";
import { ProteinBreakdownTable } from "./protein-breakdown-table";
import { EvidenceTable } from "./evidence-table";

const registry = registryJson as unknown as Registry;
const { dataset, h1_distribution, h2_classifier, protein_breakdown, distributions } = registry;

const confidentDespiteDisorder = h2_classifier.overall.confusion.false_negative;
const confidentDespiteDisorderPct = (
  (confidentDespiteDisorder / dataset.disorder_annotated_residues) *
  100
).toFixed(1);

export default function Home() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <header className="nav">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            ⌁
          </span>
          <span>Foldings Edge</span>
        </div>
        <nav className="nav__links" aria-label="Primary">
          <a href="#distribution">pLDDT vs. disorder</a>
          <a href="#classifier">Classifier</a>
          <a href="#breakdown">Where it fails</a>
          <a href="#decision">Findings</a>
          <a href="#method">Method</a>
          <a href="#sources">Data &amp; citations</a>
        </nav>
      </header>

      <main id="main">
        <section className="hero">
          <div className="eyebrow">
            <span>AlphaFold2 pLDDT vs. DisProt disorder</span>
            <span>v0.1.0 · preregistered · frozen registry</span>
          </div>
          <h1>
            Does confidence mean <em>order</em>?
          </h1>
          <p className="hero__lead">
            AlphaFold2 assigns a per-residue confidence score, pLDDT, to every structure it
            predicts. Alderson et al. (2023, PNAS) showed that low pLDDT is a useful, imperfect
            signal for intrinsic disorder — and that some experimentally disordered regions still
            receive confident pLDDT because they can conditionally fold. This project runs a
            fresh, preregistered, independent test of the same underlying idea against real
            DisProt-curated disorder annotations, joined to real AlphaFold DB predictions — and
            reports exactly where the relationship holds and where it does not.
          </p>
          <div className="hero__actions">
            <a className="button button--primary" href="#distribution">
              See the pLDDT comparison
            </a>
            <a
              className="button button--ghost"
              href="https://github.com/lindgreendavid/foldings-edge/blob/main/docs/research-report.md"
            >
              Read the full report
            </a>
          </div>
          <div className="hero__principles">
            <span>Preregistered protocol</span>
            <span>Real public data, two sources joined</span>
            <span>Frozen result registry</span>
            <span>Failure modes disclosed, not hidden</span>
          </div>
        </section>

        <section className="findings" aria-labelledby="findings-heading">
          <div className="section-heading">
            <div>
              <span className="section-index">01</span>
              <p>Sample</p>
            </div>
            <h2 id="findings-heading">
              {dataset.total_proteins} proteins, {dataset.total_residues.toLocaleString()}{" "}
              residues
            </h2>
          </div>
          <div className="stat-row">
            <article>
              <span>Proteins joined</span>
              <strong>{dataset.total_proteins}</strong>
              <small>human DisProt entries with a usable AlphaFold DB prediction</small>
            </article>
            <article>
              <span>Total residues</span>
              <strong>{dataset.total_residues.toLocaleString()}</strong>
              <small>every residue of every included protein</small>
            </article>
            <article>
              <span>Curated-disorder residues</span>
              <strong>{dataset.disorder_annotated_residues.toLocaleString()}</strong>
              <small>DisProt &quot;Structural state&quot; / &quot;disorder&quot; regions</small>
            </article>
            <article>
              <span>Not curated-disorder</span>
              <strong>{dataset.non_disorder_residues.toLocaleString()}</strong>
              <small>outside any DisProt disorder region</small>
            </article>
          </div>

          <div className="limitations-first">
            <h3>Read this before any &quot;predicts disorder well&quot; conclusion below</h3>
            <ul>
              <li>
                One database snapshot (DisProt, human, accessed 2026-08-13), one AlphaFold DB
                version per accession, 400-of-1,339 fixed-seed sample — not the full human
                disorder space, not any other organism.
              </li>
              <li>
                This is <strong>not</strong> a replication of Alderson et al. (2023)&apos;s exact
                classifier, database combination, or ROC numbers — it is an independent test of
                the same general relationship on fresh data, compared to that paper only
                qualitatively.
              </li>
              <li>
                A pLDDT&lt;70 &quot;not confident&quot; label is not the same as &quot;this
                residue is disordered,&quot; and a confident pLDDT is not the same as &quot;this
                residue is ordered&quot; — both directions of error are reported below with
                concrete examples, not just aggregate rates.
              </li>
              <li>
                This project does not evaluate AlphaFold3 and does not make any general claim
                about intrinsically disordered proteins beyond this dataset.
              </li>
            </ul>
            <p className="uncertainty-note">
              Full limitations: <a href="#sources">docs/research-report.md</a>.
            </p>
          </div>
        </section>

        <section className="compare" id="distribution" aria-labelledby="distribution-heading">
          <div className="section-heading">
            <div>
              <span className="section-index">02</span>
              <p>H1 — preregistered</p>
            </div>
            <h2 id="distribution-heading">pLDDT is markedly lower inside curated disorder</h2>
          </div>
          <EcdfChart
            title="pLDDT — inside vs. outside curated disorder regions"
            description="Per-residue AlphaFold2 pLDDT (0–100). If the two groups were drawn from the same distribution, these two lines would closely overlap."
            unit="pLDDT"
            inside={distributions.inside_disorder}
            outside={distributions.outside_disorder}
            tableId="plddt-chart"
          />
          <DistributionResult
            mannWhitney={h1_distribution.mann_whitney_u}
            ks={h1_distribution.ks_robustness}
            bootstrap={h1_distribution.bootstrap_median_diff_outside_minus_inside}
          />
          <DistributionTable
            caption="pLDDT, inside vs. outside curated disorder (chart subsample)"
            unit="pLDDT, 0–100"
            inside={distributions.inside_disorder}
            outside={distributions.outside_disorder}
          />
        </section>

        <section className="compare" id="classifier" aria-labelledby="classifier-heading">
          <div className="section-heading">
            <div>
              <span className="section-index">03</span>
              <p>H2 — preregistered</p>
            </div>
            <h2 id="classifier-heading">A pLDDT&lt;70 classifier: real signal, moderate strength</h2>
          </div>
          <p className="uncertainty-note" style={{ marginBottom: "22px" }}>
            Positive class: residue is inside a DisProt-curated disorder region. Predicted
            positive: pLDDT &lt; 70 (&quot;not confident&quot;, per Alderson et al.&apos;s own
            confident/very-confident boundary). Compared only qualitatively to that paper, not
            numerically replicated — see the sample panel above.
          </p>
          <ClassifierResult
            label="Overall classifier performance"
            n={h2_classifier.overall.n}
            precision={h2_classifier.overall.precision}
            recall={h2_classifier.overall.recall}
            f1={h2_classifier.overall.f1}
            mcc={h2_classifier.overall.mcc}
          />
          <p className="uncertainty-note" style={{ margin: "18px 0" }}>
            {confidentDespiteDisorderPct}% of curated-disorder residues ({confidentDespiteDisorder.toLocaleString()}{" "}
            of {dataset.disorder_annotated_residues.toLocaleString()}) nonetheless received a
            confident pLDDT (≥70) — directionally and roughly magnitude-consistent with Alderson
            et al.&apos;s own reported ~30% figure for DisProt, despite this project&apos;s
            different sample, ground-truth scope, and classifier.
          </p>
        </section>

        <section className="evidence" id="breakdown" aria-labelledby="breakdown-heading">
          <div className="section-heading">
            <div>
              <span className="section-index">04</span>
              <p>Exploratory breakdown</p>
            </div>
            <h2 id="breakdown-heading">Where the relationship breaks down</h2>
          </div>
          <div className="classifier-grid classifier-grid--pair">
            <ClassifierResult
              label="Disorder on a protein WITH a conditional-folding region elsewhere"
              n={h2_classifier.by_conditional_flag.conditional_disorder_regions.n}
              precision={h2_classifier.by_conditional_flag.conditional_disorder_regions.precision}
              recall={h2_classifier.by_conditional_flag.conditional_disorder_regions.recall}
              f1={h2_classifier.by_conditional_flag.conditional_disorder_regions.f1}
              mcc={h2_classifier.by_conditional_flag.conditional_disorder_regions.mcc}
            />
            <ClassifierResult
              label="Disorder on a protein with NO conditional-folding region"
              n={h2_classifier.by_conditional_flag.non_conditional_disorder_regions.n}
              precision={
                h2_classifier.by_conditional_flag.non_conditional_disorder_regions.precision
              }
              recall={h2_classifier.by_conditional_flag.non_conditional_disorder_regions.recall}
              f1={h2_classifier.by_conditional_flag.non_conditional_disorder_regions.f1}
              mcc={h2_classifier.by_conditional_flag.non_conditional_disorder_regions.mcc}
            />
          </div>
          <p className="uncertainty-note" style={{ margin: "8px 0 26px" }}>
            &quot;WITH a conditional-folding region elsewhere&quot; is a protein-level proxy (does
            this protein have any &quot;disorder to order&quot; annotation anywhere), not a
            region-level overlap with the classified residue itself — see the limitations in the
            full report.
          </p>
          <EvidenceTable breakdown={h2_classifier.by_evidence_code} />
          <div style={{ height: "18px" }} />
          <ProteinBreakdownTable rows={protein_breakdown} />
        </section>

        <section className="decision" id="decision" aria-labelledby="decision-heading">
          <div className="section-heading">
            <div>
              <span className="section-index">05</span>
              <p>Reading the result</p>
            </div>
            <h2 id="decision-heading">What this does and does not show</h2>
          </div>
          <div className="decision-reading">
            <article>
              <span>H1 — distribution</span>
              <h3>Confirmed, unambiguously</h3>
              <p>
                Median pLDDT is 43.7 points lower inside curated disorder (Mann–Whitney and KS
                both p ≈ 0). This direction is exactly what the underlying idea predicts.
              </p>
            </article>
            <article>
              <span>H2 — classifier</span>
              <h3>Real signal, moderate strength</h3>
              <p>
                MCC 0.367, recall 76.5%, precision 34.1%. Performance drops sharply on
                conditional-folding-flagged regions and on evidence types associated with
                partial/dynamic structure (HDX-MS weakest, 35.1% recall).
              </p>
            </article>
            <article>
              <span>What this is not</span>
              <h3>Not a replication, not a verdict on AlphaFold</h3>
              <p>
                Different sample, ground truth, and classifier from Alderson et al. (2023);
                compared to it only qualitatively. No claim about AlphaFold3 or IDPs generally.
              </p>
            </article>
          </div>
        </section>

        <section className="method" id="method" aria-labelledby="method-heading">
          <div className="section-heading section-heading--light">
            <div>
              <span className="section-index">06</span>
              <p>Scientific method</p>
            </div>
            <h2 id="method-heading">How this was built, before any result existed</h2>
          </div>
          <div className="method-grid">
            <article>
              <span>Data</span>
              <h3>Two real sources, joined</h3>
              <p>
                400 fixed-seed-sampled human DisProt entries joined to AlphaFold DB per-residue
                pLDDT by UniProt accession; 387 survive disclosed exclusions (7 no prediction, 6
                fragmented).
              </p>
            </article>
            <article>
              <span>Ground truth</span>
              <h3>Disclosed, narrow scope</h3>
              <p>
                Only DisProt &quot;Structural state&quot;/&quot;disorder&quot; regions count as
                positive; &quot;disorder to order&quot; regions are tracked separately, never
                folded into the primary label.
              </p>
            </article>
            <article>
              <span>Tests</span>
              <h3>Mann–Whitney + KS + bootstrap + MCC</h3>
              <p>
                Two-sided Mann–Whitney U as the primary H1 test, KS as a robustness check, and a
                10,000-resample percentile/multinomial bootstrap for every confidence interval —
                fixed seed, fully reproducible.
              </p>
            </article>
          </div>
          <div className="equation-card">
            <span>Matthews correlation coefficient</span>
            <code>MCC = (TP·TN − FP·FN) / √((TP+FP)(TP+FN)(TN+FP)(TN+FN))</code>
            <p>
              Reported alongside precision/recall/F1 because it stays interpretable even with a
              large true-negative pool, unlike F1 alone.
            </p>
          </div>
        </section>

        <section className="report" id="sources" aria-labelledby="sources-heading">
          <div className="section-heading">
            <div>
              <span className="section-index">07</span>
              <p>Data &amp; citations</p>
            </div>
            <h2 id="sources-heading">Provenance and further reading</h2>
          </div>
          <div className="source-list">
            <a href="https://doi.org/10.1073/pnas.2304302120">
              <span>Motivating citation</span>
              <strong>
                Alderson, Pritišanac, Kolarić, Moses &amp; Forman-Kay 2023, &quot;Systematic
                identification of conditionally folded intrinsically disordered regions by
                AlphaFold2,&quot; PNAS 120(44)
              </strong>
              <p>DOI 10.1073/pnas.2304302120 — compared only qualitatively, not replicated.</p>
              <b aria-hidden="true">→</b>
            </a>
            <a href="https://doi.org/10.1038/s41586-021-03819-2">
              <span>AlphaFold2 citation</span>
              <strong>Jumper et al. 2021, &quot;Highly accurate protein structure prediction with AlphaFold,&quot; Nature 596</strong>
              <p>DOI 10.1038/s41586-021-03819-2</p>
              <b aria-hidden="true">→</b>
            </a>
            <a href="https://disprot.org">
              <span>Ground truth</span>
              <strong>DisProt — intrinsically disordered protein database</strong>
              <p>CC BY 4.0 · human entries, release=current, accessed 2026-08-13</p>
              <b aria-hidden="true">→</b>
            </a>
            <a href="https://alphafold.ebi.ac.uk">
              <span>Structure predictions</span>
              <strong>AlphaFold Protein Structure Database (EBI)</strong>
              <p>CC BY 4.0 · per-residue pLDDT confidence, accessed 2026-08-13</p>
              <b aria-hidden="true">→</b>
            </a>
            <a href="https://github.com/lindgreendavid/foldings-edge/blob/main/data/provenance.json">
              <span>Provenance record</span>
              <strong>data/provenance.json</strong>
              <p>
                Full source, access date, license status, sample construction, and two disclosed
                API-behavior deviations discovered during the real fetch.
              </p>
              <b aria-hidden="true">→</b>
            </a>
            <a href="https://github.com/lindgreendavid/foldings-edge/blob/main/docs/research-protocol.md">
              <span>Preregistered protocol</span>
              <strong>docs/research-protocol.md</strong>
              <p>Hypotheses, exclusions, and exact statistical tests, fixed before any result.</p>
              <b aria-hidden="true">→</b>
            </a>
            <a href="https://github.com/lindgreendavid/foldings-edge/blob/main/docs/research-report.md">
              <span>Full report</span>
              <strong>docs/research-report.md</strong>
              <p>Every hypothesis&apos;s disposition, the breakdown analyses, and limitations.</p>
              <b aria-hidden="true">→</b>
            </a>
            <a href="https://github.com/lindgreendavid/foldings-edge">
              <span>Source code</span>
              <strong>github.com/lindgreendavid/foldings-edge</strong>
              <p>Python analysis package, tests, and this site&apos;s source.</p>
              <b aria-hidden="true">→</b>
            </a>
          </div>
        </section>
      </main>

      <footer>
        <div>
          <span className="brand__mark" aria-hidden="true">
            ⌁
          </span>
          <p>Foldings Edge v0.1.0 · MIT licensed · data used per DisProt and AlphaFold DB CC BY 4.0 terms</p>
        </div>
        <a href="https://github.com/lindgreendavid/foldings-edge/blob/main/ACCESSIBILITY.md">
          Accessibility statement
        </a>
      </footer>
    </>
  );
}
