# Research protocol

Frozen before generating or interpreting any v0.1.0 result.

## Status

This protocol is fixed before running `scripts/generate_registry.py` or looking at the
resulting registry. It describes the data sources, the exact sample construction, the exclusion
criteria, the join procedure, the statistical tests, and the analysis plan. Any deviation from
this document discovered after results exist will be recorded as an amendment in
[`research-report.md`](research-report.md), not silently applied.

## Research question

Does AlphaFold2's per-residue pLDDT confidence score predict experimentally-curated intrinsic
disorder, as recorded in DisProt, for human proteins? And where does that relationship break
down — by disorder category, by evidence quality, or by individual protein?

## Relationship to Alderson et al. 2023 (PNAS) — what this project is and is not

T. Reid Alderson, Iva Pritišanac, Đesika Kolarić, Alan M. Moses, Julie D. Forman-Kay,
"Systematic identification of conditionally folded intrinsically disordered regions by
AlphaFold2," *Proceedings of the National Academy of Sciences*, 120(44):e2304302120, 2023.
DOI: [10.1073/pnas.2304302120](https://doi.org/10.1073/pnas.2304302120).

That paper defines "conditionally folded" IDRs as regions disordered in isolation that acquire a
stable fold in the presence of a binding partner or a post-translational modification. It builds
a positive set from five conditionally-folded-IDR databases (DIBS, MFIB, DisProt, MoRF, FuzDB;
~61,000 residues) and a true-negative set from CheZOD (~8,200 NMR-validated disordered residues
not known to conditionally fold), then runs an ROC analysis (combined AUC 0.76, per-database AUC
0.63–0.93, up to 88% precision at a 10% false-positive rate). It also reports that genome-wide,
14.3% of ~3.5 million predicted-disordered human residues have confident pLDDT (≥70), and that
"nearly 30% of the experimentally validated DisProt IDRs have confident pLDDT scores" (932 human
DisProt IDRs, >300,000 residues, as of the paper's 2023 DisProt snapshot).

**This project is not a literal replication of that paper.** It does not use the same five
conditionally-folded-IDR databases, the same CheZOD negative set, or the same ROC/precision
targets. It tests the same general underlying relationship — pLDDT vs. curated disorder — using
a freshly-drawn DisProt sample (queried 2026-08-13, larger than the paper's 2023 snapshot because
DisProt has grown) and a simple, preregistered direct classifier: does pLDDT < 70 predict "this
residue falls inside a DisProt-curated disorder region," using *all* DisProt "Structural state" /
"disorder" annotations as ground truth, not only the subset that also appears in the five
conditionally-folded-IDR databases the paper used. Because the sample, ground-truth scope, and
classifier are all different from the paper's, this project's precision/recall/F1/AUC numbers are
expected to differ from the paper's 88%/10%/0.76 figures, and are compared to them only
qualitatively (does the same directional relationship hold; is there a similar sizable minority
of confidently-folded disordered residues), never presented as a reproduction of the paper's
specific numbers.

## What this project is not

This is a validation/reanalysis exercise on one public, curated disorder database (DisProt,
human entries only) against one structure-prediction resource (AlphaFold DB), at one database
snapshot. It does not evaluate AlphaFold3, does not make any general claim about intrinsically
disordered proteins beyond this dataset, and does not attempt to resolve open questions in the
IDP structural-biology literature about what "conditional folding" means functionally.

## Scope boundaries (declared before results)

1. **Single organism, single database snapshot.** Human (`taxon 9606`) DisProt entries only,
   `release=current` as served by the DisProt API on 2026-08-13. No other organism, no older
   DisProt release, no MobiDB.
2. **Single AlphaFold DB version**, whatever `latestVersion` each queried UniProt accession
   returns from the AlphaFold DB REST API on the access date. No structural modeling beyond
   reading the precomputed pLDDT.
3. **Fragmented (multi-part) AlphaFold DB entries are excluded from v0.1.0.** AlphaFold DB
   splits proteins longer than 2,700 residues into multiple `-F1`, `-F2`, … fragments per UniProt
   accession. Stitching fragments back into one per-residue array correctly (including overlap
   handling) is out of scope for this version; any DisProt accession whose AlphaFold DB entry is
   fragmented is excluded and counted in the exclusion log, not silently dropped.
4. **No independent selection-function or completeness model** for which human proteins have
   DisProt annotations in the first place; DisProt's own curation-target selection is used as-is.
5. **MobiDB is not used** as ground truth anywhere in this project (it aggregates predictors and
   experiment together, which would contaminate a test of *experimentally curated* disorder
   against a *predictor*).

## Data sources and access

- **DisProt** — REST API, base `https://disprot.org/api`. Query used:
  `GET https://disprot.org/api/search?organism=Homo%20sapiens&release=current&limit={N}&offset={M}`,
  paginated until exhausted. Confirmed live and returning `{"data": [...], "size": N}` on
  2026-08-13; confirmed `size` = 1339 human entries in the `current` release at access time (up
  from the 932 the original paper analyzed in 2023 — DisProt has grown). License: DisProt data is
  distributed under **CC BY 4.0** (per the DisProt project's own stated license). Each entry's
  `acc` field (UniProt accession) is the join key to AlphaFold DB.
- **Ground-truth region definition:** only regions with `term_namespace == "Structural state"`
  and `term_name == "disorder"` are used as the positive curated-disorder label. This
  specifically excludes `term_namespace == "Structural transition"` / `term_name == "disorder to
  order"` regions (which mark *conditional folding*, the paper's specific subject, not baseline
  disorder) and excludes non-structural namespaces present in the fetched sample (e.g. "Molecular
  function", "Interaction partner"). "Disorder to order" regions are recorded separately per
  accession and used only in the report's breakdown of where the relationship holds or fails, not
  as part of the primary ground-truth label.
- **AlphaFold DB** — REST metadata `https://alphafold.ebi.ac.uk/api/prediction/{accession}` and
  per-residue confidence JSON at the metadata's own `plddtDocUrl`
  (`https://alphafold.ebi.ac.uk/files/AF-{accession}-F1-confidence_v{N}.json`, confirmed
  2026-08-13 to contain `residueNumber`, `confidenceScore` (the per-residue pLDDT, 0–100), and
  `confidenceCategory`). License: **CC BY 4.0** (AlphaFold DB's stated license).

## Sample construction

1. Query all human DisProt entries via the search endpoint above (`release=current`), paginated,
   cached to `data/external/disprot_raw.json`.
2. Draw a **fixed-seed reproducible random sample of 400 of those entries**
   (`numpy.random.default_rng(seed=20260813)`, sampling without replacement from the full
   1,339-entry list sorted by `disprot_id` before sampling, for a deterministic order). 400 is a
   bounded, documented size chosen to keep the AlphaFold DB fetch (two HTTP requests per
   accession: metadata + confidence JSON) tractable within a reasonable single-machine run while
   remaining large enough for a meaningful per-residue analysis (expected several hundred
   thousand residues; see `data/provenance.json` for the realized count). This is a documented
   scope boundary, not a data-quality exclusion: the full 1,339-entry set was itself already a
   tractable, reproducible sample of its own by the protocol's original framing, but was reduced
   further for fetch-time practicality.
3. For each sampled entry, fetch its AlphaFold DB metadata by `acc`. Exclude and log (with
   reason) any entry where:
   - AlphaFold DB has no prediction for that accession (`404` or empty response),
   - the AlphaFold DB entry is fragmented (more than one metadata record returned, i.e. `-F2` or
     later exists),
   - the DisProt `sequence` length and the AlphaFold DB `sequence` length disagree by more than 0
     residues (an exact-length match is required; any mismatch is excluded and logged rather than
     silently truncated or padded).
4. For each remaining entry, fetch the per-residue confidence JSON and join `confidenceScore` to
   each residue index (`residueNumber`, 1-based) against a per-residue boolean "inside a
   DisProt Structural-state/disorder region" label, computed from the entry's `regions` (inclusive
   1-based `start`/`end`, verified against the fetched sample rather than assumed).
5. Report the exact final N of proteins, N of residues, and N of curated-disorder residues, and
   the exclusion count and reasons, in `data/provenance.json` and the report.

## Falsifiable hypotheses

- **H1 — residues inside a DisProt-annotated disorder region have significantly lower pLDDT than
  residues outside any DisProt-annotated region, within the same joined protein set.** Tested
  with a two-sample Mann–Whitney U test (`scipy.stats.mannwhitneyu`, two-sided) and, as a
  distributional robustness check, a two-sample Kolmogorov–Smirnov test
  (`scipy.stats.ks_2samp`), both at α = 0.05, on the pooled per-residue pLDDT values from the two
  groups (inside vs. outside curated disorder). Effect size reported as the median difference
  with a percentile bootstrap 95% CI (10,000 resamples,
  `numpy.random.default_rng(seed=20260813)`, each group resampled independently at its own
  observed size).
- **H2 — a pLDDT < 70 classifier ("not confident" per the paper's own confident/very-confident
  boundary at 70) predicts DisProt-curated disorder above chance, with documented precision,
  recall, F1, and Matthews correlation coefficient (MCC).** Positive class = "residue is inside a
  DisProt disorder region"; predicted positive = pLDDT < 70. 95% confidence intervals via Wilson
  score interval for precision/recall, and via 10,000-resample bootstrap for F1/MCC (same seed).
  **This hypothesis is compared only qualitatively to Alderson et al. 2023, not numerically
  replicated** — see the framing section above. A qualitative match would be: a majority of
  curated-disordered residues classified correctly as low-confidence, alongside a non-trivial
  minority (comparable in direction, not magnitude, to the paper's ~30% "confident" figure) of
  curated-disordered residues nonetheless receiving confident-or-higher pLDDT.
- **Breakdown (planned, not a separate falsifiable hypothesis):** classifier performance is
  additionally reported broken down by (a) whether the residue's DisProt region also carries a
  "Structural transition"/"disorder to order" annotation elsewhere on the same protein (a proxy,
  not identical to the paper's own five-database "conditionally folded" definition, for whether
  this looks like conditional folding vs. fully disordered), and (b) the evidence code (`ec_name`
  / `ec_id`) of the covering DisProt region, to see whether higher-confidence experimental
  evidence changes the classifier's apparent performance.

## Exclusion criteria (declared before results)

1. DisProt entries with no resolvable AlphaFold DB prediction for their `acc` — excluded, logged.
2. DisProt entries whose AlphaFold DB entry is fragmented (multi-part) — excluded, logged (see
   Scope boundary 3).
3. DisProt entries whose DisProt `sequence` length does not exactly match the AlphaFold DB
   `sequence` length for the same accession — excluded, logged.
4. No residue-level exclusions beyond the above protein-level exclusions: every residue of every
   included protein is used, including residues not covered by any DisProt region (these
   contribute to the "outside curated disorder" group).

## Statistical methods

- **Primary distributional test (H1):** two-sample Mann–Whitney U (`scipy.stats.mannwhitneyu`,
  `alternative="two-sided"`), plus two-sample KS as a robustness check, both α = 0.05.
- **Effect size and uncertainty:** median pLDDT difference (outside − inside), percentile
  bootstrap 95% CI, 10,000 resamples, fixed seed 20260813.
- **Classifier evaluation (H2):** precision, recall, F1, MCC at the fixed pLDDT < 70 threshold,
  each with a 95% CI (Wilson score interval for precision/recall; percentile bootstrap for
  F1/MCC, same seed and resample count as above, resampling residues with replacement).
- **Breakdown analyses:** the same precision/recall/F1/MCC metrics recomputed on the subset of
  curated-disorder residues whose covering region does/does not co-occur with a "disorder to
  order" annotation elsewhere on the protein, and recomputed per distinct evidence code observed
  in the fetched sample (only for evidence codes covering at least 200 residues, to avoid
  reporting numbers from tiny, noisy subsets).
- **No multiple-comparison correction** is applied between H1 and H2 because each is an
  individually preregistered hypothesis addressing a distinct question (does pLDDT differ in
  distribution; does a specific fixed-threshold classifier work), not an exploratory search; this
  choice is disclosed, not hidden. The breakdown analyses are explicitly labeled exploratory /
  descriptive, not hypothesis tests with their own significance claims.
- **Fixed seed throughout:** `numpy.random.default_rng(seed=20260813)`, used for both the sample
  draw and every bootstrap.

## Analysis plan

- Report H1 and H2's dispositions plainly, including a null or weak result if that is what the
  sample shows.
- Report where the classifier specifically fails: concrete false positives (confidently-folded
  residues that are nonetheless curated-disordered) and false negatives (low-pLDDT residues that
  are not curated-disordered), by protein and by DisProt term/evidence-code category, not only as
  aggregate rates.
- State the qualitative comparison to Alderson et al. 2023 explicitly and separately from H1/H2's
  own numbers — never implying numerical agreement that was not tested.
- Present uncertainty and limitations before any "pLDDT predicts disorder well" framing, both in
  the report and on the site, consistent with this maintainer's established reading-order
  discipline (see FRB Atlas, Three Body Lab, Fairshift Lab).
- Any deviation from this plan discovered after results exist is recorded as a disclosed
  amendment in `research-report.md`, not silently applied.

## Ethics and responsible framing

This project uses only public, non-personal, curated protein-sequence and structure-prediction
data; there are no human subjects and no personal data. The responsible-communication obligation
here is scientific honesty about validating a widely-used but imperfect proxy (pLDDT) against a
comparatively small, curator-selected ground-truth set (DisProt): not overstating classifier
performance, not treating a "confident" pLDDT as proof of order, not treating "not confident" as
proof of disorder, and not extending this dataset's findings into a general claim about
AlphaFold2's reliability for disorder prediction beyond the residues actually tested here.
