# v1.0.0 release audit

Audit date: 2026-08-13. Scientific baseline: `ca53bbe8acf243d4524b3b020c5e37c6f2d246db`.
The exact product-release commit is the commit resolved by annotated tag `v1.0.0`.

## Evidence checked

- DisProt provenance and AlphaFold DB accession/version metadata were checked against the committed
  CC BY 4.0 derived dataset. AlphaFold DB's own guidance treats low pLDDT as confidence, with
  disorder association requiring cautious interpretation.
- The committed analysis contains 387 human proteins and 228,662 residues: 36,988 annotated
  disordered and 191,674 non-disordered residues.
- The fixed threshold, 10,000-resample uncertainty procedure, per-protein breakdown and threshold
  sweep were regenerated and compared with the frozen v0.1 registry.

## Integrity

SHA-256 of `reports/v0.1-foldings-edge-registry.json`:
`7f844399ca0a6069f8416929b1daaf3e9a6ec7e359506688d1164538d0f5cba4`.

## Boundary

v1.0.0 is product maturity, not a new biological study. Low pLDDT is not identical to disorder,
residues are clustered within proteins, and results are limited to the declared joined snapshot.
