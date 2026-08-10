import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

const expectedPrograms = {
  "program-01": {
    title: "2026 찾아가는 AI교육 지원 프로그램",
    kind: "school-program",
    delivery: {
      status: "partial",
      durationMinutes: 200,
      teamSize: null,
      deviceMode: "unconfirmed",
      offlineCore: true,
      gradeBands: ["high"]
    },
    resourceStatus: "pending-review"
  },
  "program-02": {
    title: "2026 중등 학교급 전환기 찾아가는 AI·SW 프로그램",
    kind: "school-program",
    delivery: {
      status: "partial",
      durationMinutes: null,
      teamSize: null,
      deviceMode: "unconfirmed",
      offlineCore: true,
      gradeBands: ["middle", "high"]
    },
    resourceStatus: "not-started"
  },
  "program-03": {
    title: "2026 경기 성취도평가 표준화 평가도구 개발 합숙 워크숍",
    kind: "workshop",
    delivery: {
      status: "unconfirmed",
      durationMinutes: null,
      teamSize: null,
      deviceMode: "unconfirmed",
      offlineCore: true,
      gradeBands: []
    },
    resourceStatus: "not-started"
  }
};

test("catalog contains three unique Nextbridge programs", async () => {
  const catalog = JSON.parse(await readFile(new URL("programs/catalog.json", root), "utf8"));
  assert.equal(catalog.publisher, "Nextbridge");
  assert.equal(catalog.programs.length, 3);
  assert.equal(new Set(catalog.programs.map(({ id }) => id)).size, 3);
});

test("every catalog entry uses the verified business name and safe public state", async () => {
  const catalogUrl = new URL("programs/catalog.json", root);
  const catalog = JSON.parse(await readFile(catalogUrl, "utf8"));

  for (const entry of catalog.programs) {
    const manifest = JSON.parse(await readFile(new URL(entry.manifest, catalogUrl), "utf8"));
    const expected = expectedPrograms[entry.id];

    assert.ok(expected, `${entry.id} expected metadata`);
    assert.equal(manifest.schemaVersion, "1.1");
    assert.equal(manifest.id, entry.id);
    assert.equal(manifest.publisher, "Nextbridge");
    assert.equal(manifest.title, expected.title);
    assert.equal(manifest.kind, expected.kind);
    assert.doesNotMatch(manifest.title, /이름 확정 예정|Nextbridge Program 0\d/i);
    assert.deepEqual(manifest.delivery, expected.delivery);
    assert.equal(manifest.resources.status, expected.resourceStatus);
    assert.equal(manifest.resources.studentTool, null);
    assert.equal(manifest.resources.instructorGuide, null);
    assert.equal(manifest.resources.lessonMaterial, null);
    assert.equal(manifest.privacy.studentIdentifier, "team-code-only");
    assert.equal(manifest.integration.mode, "standalone");
    assert.equal(manifest.integration.gomCleanEnabled, false);
    assert.equal(manifest.integration.resultSchemaVersion, "1.1");
  }
});
