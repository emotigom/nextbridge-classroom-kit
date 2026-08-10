import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

const expectedPrograms = {
  "program-01": {
    version: "0.5.0",
    title: "학교 AI 수업",
    kind: "school-program",
    resources: {
      status: "published",
      studentTool: "./tool/index.html",
      instructorGuide: "./instructor-guide.md",
      lessonMaterial: null
    }
  },
  "program-02": {
    version: "0.4.0",
    title: "전환기 AI·SW 수업",
    kind: "school-program",
    resources: {
      status: "not-started",
      studentTool: null,
      instructorGuide: null,
      lessonMaterial: null
    }
  },
  "program-03": {
    version: "0.4.0",
    title: "교육 도구 워크숍",
    kind: "workshop",
    resources: {
      status: "not-started",
      studentTool: null,
      instructorGuide: null,
      lessonMaterial: null
    }
  }
};

const unconfirmedDelivery = {
  status: "unconfirmed",
  durationMinutes: null,
  teamSize: null,
  deviceMode: "unconfirmed",
  offlineCore: true,
  gradeBands: []
};

test("catalog contains three unique Nextbridge programs", async () => {
  const catalog = JSON.parse(await readFile(new URL("programs/catalog.json", root), "utf8"));
  assert.equal(catalog.publisher, "Nextbridge");
  assert.equal(catalog.programs.length, 3);
  assert.equal(new Set(catalog.programs.map(({ id }) => id)).size, 3);
});

test("every catalog entry uses a simple public label and a safe state", async () => {
  const catalogUrl = new URL("programs/catalog.json", root);
  const catalog = JSON.parse(await readFile(catalogUrl, "utf8"));

  for (const entry of catalog.programs) {
    const manifest = JSON.parse(await readFile(new URL(entry.manifest, catalogUrl), "utf8"));
    const expected = expectedPrograms[entry.id];

    assert.ok(expected, `${entry.id} expected metadata`);
    assert.equal(manifest.schemaVersion, "1.1");
    assert.equal(manifest.id, entry.id);
    assert.equal(manifest.version, expected.version);
    assert.equal(manifest.publisher, "Nextbridge");
    assert.equal(manifest.title, expected.title);
    assert.equal(manifest.kind, expected.kind);
    assert.doesNotMatch(manifest.title, /2026|학교명|지원 프로그램|성취도평가/i);
    assert.deepEqual(manifest.delivery, unconfirmedDelivery);
    assert.deepEqual(manifest.resources, expected.resources);
    assert.equal(manifest.privacy.studentIdentifier, "team-code-only");
    assert.equal(manifest.integration.mode, "standalone");
    assert.equal(manifest.integration.gomCleanEnabled, false);
    assert.equal(manifest.integration.resultSchemaVersion, "1.1");
  }
});
