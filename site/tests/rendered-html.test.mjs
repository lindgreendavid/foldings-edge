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

test("server-renders the finished research site", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>Foldings Edge/);
  assert.match(html, /Does confidence mean/);
  assert.match(html, /pLDDT/);
  assert.match(html, /Skip to main content/);
  assert.match(html, /Read the complete data table/);
  assert.match(html, /Scientific method/);
  assert.match(html, /Mann.Whitney/);
  assert.match(html, /qualitatively/i);
  assert.match(html, /Accessibility statement/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Starter Project/);
});

test("ships accessible controls and research boundaries", async () => {
  const [page, layout, styles, packageJson] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
    readFile(new URL("package.json", root), "utf8"),
  ]);
  assert.match(page, /className="skip-link"/);
  assert.match(page, /limitations-first/);
  assert.match(page, /Read this before any/);
  assert.match(styles, /prefers-contrast: more/);
  assert.match(styles, /forced-colors: active/);
  assert.match(styles, /\.nav__links a \{ display: inline-flex; min-height: 44px/);
  assert.match(layout, /Foldings Edge/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton|drizzle/);
});

test("ships the complete frozen registry into the interactive release", async () => {
  const shipped = JSON.parse(await readFile(new URL("app/data/registry.json", root), "utf8"));
  const frozen = JSON.parse(
    await readFile(new URL("../reports/v0.1-foldings-edge-registry.json", root), "utf8"),
  );
  assert.deepEqual(shipped, frozen);
  assert.equal(shipped.schema_version, 1);
  assert.equal(shipped.dataset.total_proteins, 387);
  assert.ok(typeof shipped.h1_distribution.mann_whitney_u.p_value === "number");
  assert.ok(typeof shipped.h2_classifier.overall.precision.point === "number");
});
