import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("ships an accessible, keyboard-operable pLDDT threshold slider", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();

  // A real range input, not a div-based fake control, with a visible/associated label.
  assert.match(html, /<input[^>]*id="threshold-slider"[^>]*type="range"/);
  assert.match(html, /for="threshold-slider"/);
  assert.match(html, /min="0"/);
  assert.match(html, /max="100"/);

  // aria-valuetext must carry the actual threshold and headline stats in words, not a bare number.
  assert.match(html, /aria-valuetext="pLDDT threshold 70[^"]*precision[^"]*recall[^"]*F1[^"]*MCC/);

  // Live-updating stats must be in an aria-live="polite" region for screen reader users.
  assert.match(html, /role="status" aria-live="polite"/);

  // A clearly labeled reset control back to the preregistered threshold. React SSR inserts
  // `<!-- -->` hydration markers between adjacent text/expression JSX children, so tolerate
  // an optional comment marker around the interpolated "70".
  assert.match(html, /Reset to preregistered threshold \((?:<!-- -->)?70(?:<!-- -->)?\)/);

  // A static, always-visible reference table as a non-interactive fallback/equivalent.
  assert.match(html, /Read the reference table \(thresholds 50 \/ 70 \/ 90\)/);
  assert.match(html, /preregistered\)/);
});

test("threshold explorer defaults to the preregistered threshold and exposes the conditional-flag split", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(html, /value="70"/);
  assert.match(html, /Aggregate/);
  assert.match(html, /Conditional-folding-flagged/);
  assert.match(html, /No conditional flag/);
});

test("ships the threshold sweep and it is internally consistent with the frozen registry at threshold=70", async () => {
  const [sweep, registry] = await Promise.all([
    readFile(new URL("app/data/threshold-sweep.json", root), "utf8").then(JSON.parse),
    readFile(new URL("../reports/v0.1-foldings-edge-registry.json", root), "utf8").then(JSON.parse),
  ]);

  assert.equal(sweep.preregistered_threshold, 70);
  assert.equal(sweep.threshold_min, 0);
  assert.equal(sweep.threshold_max, 100);

  const at70 = sweep.overall.find((row) => row.threshold === 70);
  assert.ok(at70, "sweep must include threshold=70");

  const frozen = registry.h2_classifier.overall;
  assert.deepEqual(at70.confusion, {
    true_positive: frozen.confusion.true_positive,
    false_positive: frozen.confusion.false_positive,
    true_negative: frozen.confusion.true_negative,
    false_negative: frozen.confusion.false_negative,
  });
  assert.ok(Math.abs(at70.precision - frozen.precision.point) < 1e-9);
  assert.ok(Math.abs(at70.recall - frozen.recall.point) < 1e-9);
  assert.ok(Math.abs(at70.f1 - frozen.f1.point) < 1e-9);
  assert.ok(Math.abs(at70.mcc - frozen.mcc.point) < 1e-9);

  const conditionalAt70 = sweep.by_conditional_flag.conditional_disorder_regions.find(
    (row) => row.threshold === 70,
  );
  const nonConditionalAt70 = sweep.by_conditional_flag.non_conditional_disorder_regions.find(
    (row) => row.threshold === 70,
  );
  const frozenConditional = registry.h2_classifier.by_conditional_flag.conditional_disorder_regions;
  const frozenNonConditional =
    registry.h2_classifier.by_conditional_flag.non_conditional_disorder_regions;
  assert.ok(Math.abs(conditionalAt70.precision - frozenConditional.precision.point) < 1e-9);
  assert.ok(Math.abs(conditionalAt70.mcc - frozenConditional.mcc.point) < 1e-9);
  assert.ok(Math.abs(nonConditionalAt70.precision - frozenNonConditional.precision.point) < 1e-9);
  assert.ok(Math.abs(nonConditionalAt70.mcc - frozenNonConditional.mcc.point) < 1e-9);
});
