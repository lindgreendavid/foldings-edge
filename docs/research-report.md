# Research report

What the frozen registry
([`reports/v0.1-foldings-edge-registry.json`](../reports/v0.1-foldings-edge-registry.json))
actually shows, compared against the preregistered hypotheses in
[`research-protocol.md`](research-protocol.md), reported without suppressing an adverse or
unexpected result.

## Sample

400 human DisProt entries sampled (fixed seed 20260813) from **1,339 total human entries**
in the DisProt `current` release, accessed 2026-08-13. **387 proteins / 228,662 residues**
survived the preregistered exclusions and were joined to AlphaFold DB per-residue pLDDT: **13
excluded** (7 with no resolvable AlphaFold DB prediction, 6 with a genuinely fragmented
AlphaFold DB entry, 0 sequence-length mismatches). Of the 228,662 joined residues, **36,988
(16.2%) fall inside a DisProt "Structural state"/"disorder" region**; 191,674 do not. 5,435 of
the 36,988 disorder-annotated residues (14.7%) are on a protein that also carries at least one
"disorder to order" (conditional-folding) annotation elsewhere. Full counts and the exclusion
log: [`data/provenance.json`](../data/provenance.json),
[`data/external/exclusions_log.json`](../data/external/exclusions_log.json).

Two API behaviors differed from what was documented going into this project (both disclosed in
full in `research-protocol.md` and `data/provenance.json`, and fixed in
`scripts/fetch_data.py` before this registry was generated): DisProt's search endpoint ignores
`limit`/`offset` when an `organism` filter is present (it always returns the full 1,339-entry
result), and AlphaFold DB's metadata endpoint returns UniProt **isoform** records alongside the
canonical entry rather than the `-F1`/`-F2`/`-F3` long-protein sequence fragments this project
initially expected — so "more than one record returned" mostly meant "has isoforms," not
"fragmented," and the exclusion logic was corrected to filter on an exact accession match before
deciding.

## H1 — pLDDT is significantly lower inside curated disorder regions: **confirmed**

| Test | Statistic | p-value | Significant (α=0.05) |
| --- | --- | --- | --- |
| Mann–Whitney U (primary) | U = 5,476,452,882 | ≈ 0 | yes |
| Kolmogorov–Smirnov (robustness) | D = 0.484 | ≈ 0 | yes |

| Median pLDDT, inside disorder | Median pLDDT, outside disorder | Median difference (outside − inside) | Bootstrap 95% CI |
| --- | --- | --- | --- |
| 45.09 | 88.75 | 43.66 | [43.34, 43.97] |

Residues inside a DisProt-curated disorder region have a median pLDDT 43.7 points lower than
residues outside one, on a sample of 228,662 residues across 387 proteins, and both the
preregistered primary test and the KS robustness check reject the null hypothesis of equal
distributions at effectively p = 0. **H1 is confirmed, unambiguously, on this fresh sample.**

## H2 — a pLDDT<70 classifier predicts DisProt disorder: **confirmed above chance, with a large, characterizable failure mode**

| Metric | Point estimate | 95% CI |
| --- | --- | --- |
| Precision | 0.341 | [0.338, 0.344] |
| Recall | 0.765 | [0.761, 0.770] |
| F1 | 0.472 | [0.468, 0.475] |
| MCC | 0.367 | [0.363, 0.371] |

Confusion counts (n = 228,662): TP = 28,306, FP = 54,760, TN = 136,914, FN = 8,682.

The classifier catches most curated disorder (76.5% recall) but is a noisy predictor of it: only
34.1% of "not confident" (pLDDT<70) residues are actually inside a curated disorder region — the
rest are simply un-annotated regions of otherwise-ordered proteins, structured loops, termini, or
regions DisProt has not curated at all. MCC (0.367) is a fairer single summary than F1 here
given the large TN pool, and indicates a real but moderate, not strong, association.

### Qualitative comparison to Alderson et al. 2023 — not a numerical replication

**23.5%** of curated-disorder residues in this sample (8,682 of 36,988) received a confident-or-
higher pLDDT (≥70) — i.e. AlphaFold2 was confident about a region DisProt curators call
disordered. This is in the same direction and rough order of magnitude as the paper's own
figure for DisProt specifically ("nearly 30%... have confident pLDDT scores"), even though this
project's sample, ground-truth scope (all DisProt disorder, not the five-database
conditionally-folded-IDR subset), and classifier are all different from the paper's, exactly as
anticipated in the preregistered protocol. **This is reported as a qualitative, directional
match, not a replication of the paper's specific 30% figure or its 88%/10%/0.76 ROC numbers**,
which this project never attempted to reproduce.

## Where the relationship breaks down

### By conditional-folding flag (protein-level proxy)

| Group | n | Precision | Recall | F1 | MCC |
| --- | --- | --- | --- | --- | --- |
| Disorder residues on a protein with a "disorder to order" region elsewhere | 197,109 | 0.063 | 0.681 | 0.116 | 0.142 |
| Disorder residues on a protein with no such region | 223,227 | 0.310 | 0.780 | 0.444 | 0.360 |

Both precision and MCC are substantially worse for disorder residues on proteins that also carry
a conditional-folding annotation elsewhere. This is directionally consistent with Alderson et
al.'s central finding: regions capable of folding given the right partner or PTM are exactly the
regions where pLDDT is a less reliable signal of "curator called this disordered." **Caveat,
stated plainly:** this flag is a *protein-level* proxy (does this protein have a "disorder to
order" region *anywhere*), not a *region-level* overlap with the specific disorder residue being
classified, and is not identical to Alderson et al.'s own five-database conditionally-folded-IDR
definition — a real region-level analysis is out of scope for v0.1.0 and is named directly as a
limitation below.

### By evidence code

Recall varies far more informatively than precision across DisProt evidence codes here, because
precision's denominator is dominated by the same large, shared 191,674-residue non-disorder pool
in every breakdown (a design property disclosed here, not a bug: it makes precision comparisons
across evidence codes uninformative, so recall is the metric to read in this table).

| Evidence code | Meaning | n disorder residues | Recall |
| --- | --- | --- | --- |
| ECO:0007064 | Dynamic light scattering assay | 384 | 99.7% |
| ECO:0001184 | Gel-filtration evidence | 226 | 99.6% |
| ECO:0000302 | Author statement | 882 | 98.6% |
| ECO:0007680 | Chromatography evidence | 776 | 97.6% |
| ECO:0006208 | Cryogenic electron microscopy evidence | 238 | 89.5% |
| ECO:0006224 | Cryo-EM structural model, missing residue coordinates | 5,547 | 86.7% |
| ECO:0007689 | SDS-PAGE evidence | 631 | 86.1% |
| ECO:0008035 | Author inference from disorder prediction | 629 | 89.7% |
| ECO:0006165 | NMR spectroscopy evidence | 7,563 | 77.2% |
| ECO:0006204 | Far-UV circular dichroism evidence | 4,337 | 75.7% |
| ECO:0006220 | X-ray structure, missing residue coordinates | 11,817 | 70.2% |
| ECO:0007691 | Cleavage assay evidence | 859 | 51.9% |
| ECO:0006198 | Proton-based NMR evidence | 375 | 89.1%* |
| ECO:0005642 | Heteronuclear single quantum coherence (HSQC) NMR | 308 | 57.8% |
| **ECO:0006236** | **Hydrogen-deuterium exchange mass spectrometry** | **578** | **35.1%** |

\* listed for completeness; see the frozen registry for the full, exact set.

Only evidence codes covering at least 200 disorder residues are shown, per the preregistered
minimum. **The single weakest evidence code is hydrogen-deuterium exchange mass spectrometry
(HDX-MS, ECO:0006236), where the classifier catches only 35.1% of curated-disorder residues.**
HDX-MS is frequently used to characterize partially protected, dynamic, or transiently structured
states rather than fully unfolded chains — precisely the kind of residual-structure-bearing
disorder that would plausibly earn a higher, more "confident" pLDDT from AlphaFold2. X-ray- and
cryo-EM-based "missing coordinates" evidence (regions unresolved in an experimental structure,
which can include flexible-but-not-fully-disordered loops as well as genuinely disordered
segments) and NMR/CD evidence also show comparatively low recall (70–78%), while indirect,
lower-resolution methods (dynamic light scattering, gel filtration, author statement,
chromatography) show near-total recall — plausibly because these methods are typically applied
to, or reported for, more unambiguously and extensively disordered regions.

### By protein — concrete examples

Field names below follow the same positive-class convention as the classifier metrics above
(positive = "residue is inside curated disorder," predicted positive = pLDDT<70): a **false
negative** is a curated-disorder residue that nonetheless received a confident pLDDT (the direct
analogue of Alderson et al.'s "conditionally folded" phenomenon), and a **false positive** is a
non-disorder residue that received a low pLDDT.

Proteins with a **100% false-negative rate** — every one of their curated-disorder residues
received a confident pLDDT — include several with modest disorder-region sizes: A6NI73/DP02812
(11 residues), P01111/DP03882 (12), P02788/DP00616 (22), P06239/DP01580 (36), P08263/DP01506 (15,
a protein also flagged `is_conditional`), P13674/DP03259 (10), and P16050/DP02162 (141 residues —
the largest fully-missed disorder region in the sample). These are exactly the individual,
concrete cases this project's H2 breakdown is meant to surface, rather than reporting only an
aggregate rate.

The five proteins with the largest absolute false-positive counts (residues outside curated
disorder that nonetheless received a low, "not confident" pLDDT — i.e. the classifier's largest
sources of raw false-alarm volume, not necessarily its worst per-protein rate, since these are
also simply large proteins) are P49790/DP01799 (1,245 of 1,475 residues), Q7RTP6/DP02396 (1,160 of
2,002), P15941/DP01790 (1,114 of 1,255), Q92793/DP02004 (1,040 of 2,442), and Q86YV5/DP02420 (998
of 1,406). Q92793 (613 curated-disorder residues, the largest disorder region in the sample) is
notable for being called *correctly* on its own disorder region (only 2.1% false-negative rate)
while still contributing a large false-positive count elsewhere on the same long protein. Full
per-protein table: `reports/v0.1-foldings-edge-registry.json` → `protein_breakdown`, and the
site's full accessible data table.

## Hypothesis dispositions

- **H1 (pLDDT lower inside curated disorder): confirmed**, unambiguously, by both the primary
  Mann–Whitney U test and the KS robustness check.
- **H2 (pLDDT<70 classifies curated disorder above chance): confirmed**, with moderate overall
  performance (MCC 0.367) that degrades substantially and specifically on disorder regions
  co-occurring with conditional-folding annotations and on regions supported by evidence types
  associated with partial/dynamic structure (HDX-MS weakest at 35.1% recall).
- **Qualitative comparison to Alderson et al. 2023:** the ~23.5% "confidently-folded despite
  curated disorder" rate found here is directionally and roughly magnitude-consistent with the
  paper's own ~30% DisProt figure, despite a different sample, ground-truth scope, and
  classifier — not claimed as a numerical replication.

## Limitations

- **Single database snapshot, single organism.** DisProt human entries, `release=current` as of
  2026-08-13 only. No other organism, no older DisProt release, no AlphaFold3.
- **400-of-1,339 sample, not the full human DisProt set.** A fixed-seed, documented, reproducible
  sample was drawn for fetch-time tractability, per the preregistered protocol; the full
  1,339-entry set was not analyzed.
- **13 proteins excluded** (7 no AlphaFold DB prediction, 6 genuinely fragmented AlphaFold DB
  entries) per the preregistered exclusion criteria; these are not included in any statistic
  above.
- **The "conditional folding" proxy used in the breakdown is protein-level, not region-level** —
  it flags whether a protein has *any* "disorder to order" annotation anywhere, not whether the
  specific classified residue's region is the one that conditionally folds, and does not use
  Alderson et al.'s own five-database definition. A cleaner region-level replication of that
  specific analysis is out of scope for v0.1.0.
- **Per-evidence-code precision is not informative for cross-code comparison** because every
  breakdown shares the same large non-disorder residue pool as its precision denominator; only
  recall is emphasized in that section.
- **DisProt annotation coverage, not just AlphaFold accuracy, drives the large false-positive
  count.** Most pLDDT<70 residues are not inside a curated disorder region (54,760 of 83,066
  "not confident" residues) — some of this is presumably genuine order, and some is presumably
  real disorder that DisProt simply has not (yet) curated for that protein; this project cannot
  distinguish those two cases and does not attempt to.
- **This project does not claim to evaluate AlphaFold2's disorder-prediction reliability in
  general, only what this disclosed pipeline finds on this disclosed 387-protein, 228,662-residue
  sample.** It makes no claim about AlphaFold3, no claim about intrinsically disordered proteins
  beyond this dataset, and does not attempt to resolve any open question in the IDP structural-
  biology literature about the functional meaning of conditional folding.

## Amendment log

No deviations from the preregistered protocol were made after results existed. Two disclosed
*data-access* deviations (DisProt pagination behavior; AlphaFold DB isoform-vs-fragment
behavior) were discovered and fixed **before** the frozen registry was generated, not after
seeing results, and are documented in `docs/research-protocol.md` and `data/provenance.json`
rather than here.
