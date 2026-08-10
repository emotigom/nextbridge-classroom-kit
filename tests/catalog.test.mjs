import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("catalog contains three unique Nextbridge programs", async () => {
  const catalog = JSON.parse(await readFile(new URL("programs/catalog.json", root), "utf8"));
  assert.equal(catalog.publisher, "Nextbridge");
  assert.equal(catalog.programs.length, 3);
  assert.equal(new Set(catalog.programs.map(({ id }) => id)).size, 3);
});

test("every catalog entry points to a matching manifest", async () => {
  const catalogUrl = new URL("programs/catalog.json", root);
  const catalog = JSON.parse(await readFile(catalogUrl, "utf8"));
  for (const entry of catalog.programs) {
    const manifest = JSON.parse(await readFile(new URL(entry.manifest, catalogUrl), "utf8"));
    assert.equal(manifest.id, entry.id);
    assert.equal(manifest.publisher, "Nextbridge");
    assert.equal(manifest.integration.gomCleanEnabled, false);
  }
});

