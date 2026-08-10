import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const toolRoot = new URL("programs/program-01/tool/", root);

for (const script of ["data.js", "engine.js", "result-card.js", "core.js"]) {
  await import(new URL(script, toolRoot));
}
const core = globalThis.NextbridgeFairnessCore;

test("program-01 tool uses twelve anonymous synthetic cases", () => {
  assert.ok(core);
  assert.equal(core.syntheticCases.length, 12);
  assert.equal(new Set(core.syntheticCases.map(({ id }) => id)).size, 12);
  for (const record of core.syntheticCases) {
    assert.match(record.id, /^S\d{2}$/);
    assert.deepEqual(Object.keys(record), ["id", "D", "S", "N", "T", "C"]);
    for (const key of ["D", "S", "N", "T", "C"]) {
      assert.ok(Number.isInteger(record[key]));
      assert.ok(record[key] >= 0 && record[key] <= 4);
    }
  }
});

test("prepared rules keep their intended contrast", () => {
  const expected = {
    v0: { priority: ["S02", "S05", "S09", "S10", "S12"], review: [] },
    v1: { priority: ["S01", "S03", "S06", "S07", "S09", "S12"], review: ["S04"] },
    v2: { priority: ["S01", "S03", "S06", "S07", "S09", "S12"], review: ["S04", "S11"] }
  };

  for (const [id, preset] of Object.entries(core.presets)) {
    const results = core.calculate(core.syntheticCases, preset);
    assert.deepEqual(
      results.filter((result) => result.decision === "priority").map(({ id: caseId }) => caseId),
      expected[id].priority
    );
    assert.deepEqual(
      results.filter((result) => result.handling === "review").map(({ id: caseId }) => caseId),
      expected[id].review
    );
  }

  const missing = core.quickTests(core.presets.v2).missing;
  assert.equal(missing.missing, true);
  assert.equal(missing.handling, "review");
});

test("tool creates a result card and blocks obvious identifiers", () => {
  const card = core.buildResultCard({
    programVersion: "0.5.0",
    teamCode: "A-01",
    completedAt: "2026-08-10T00:00:00.000Z",
    summary: "처리 방식이 달라졌습니다.",
    evidence: [{ label: "확인", value: "정상·경계·빈칸 테스트를 실행했습니다." }],
    nextStep: "사람 확인 범위를 다시 비교합니다.",
    privacyChecked: true
  });

  assert.equal(card.schemaVersion, "1.1");
  assert.equal(card.programId, "program-01");
  assert.equal(card.programVersion, "0.5.0");
  assert.equal(card.teamCode, "A-01");
  assert.equal(card.aiDisclosure.status, "not-applicable");
  assert.equal(card.privacyChecked, true);

  assert.throws(() => core.assertSafeText(["teacher@example.com"]), /이메일/);
  assert.throws(
    () => core.buildResultCard({
      programVersion: "0.5.0",
      teamCode: "A-01",
      summary: "연락처를 적었습니다.",
      evidence: [{ label: "확인", value: "010-1234-5678" }],
      nextStep: "삭제합니다.",
      privacyChecked: true
    }),
    /전화번호/
  );
});

test("published student tool is local-only and explains what it does", async () => {
  const files = [
    "index.html", "styles.css", "data.js", "engine.js", "result-card.js", "core.js",
    "app-state.js", "app-export.js", "app-controls.js", "app-render.js", "app-events.js"
  ];
  const contents = await Promise.all(files.map((path) => readFile(new URL(path, toolRoot), "utf8")));
  const joined = contents.join("\n");

  assert.match(contents[0], /기준 바꾸기 실습/);
  assert.match(contents[0], /실제 AI 모델이 아닙니다/);
  assert.match(contents[0], /합성데이터/);
  assert.match(contents[0], /네트워크 요청은 발생하지 않습니다/);
  assert.match(contents[0], /팀 결과 저장/);

  for (const marker of [
    "fetch(", "XMLHttpRequest", "WebSocket", "EventSource", "sendBeacon",
    "http://", "https://", "<iframe"
  ]) assert.equal(joined.includes(marker), false, `network marker: ${marker}`);

  assert.match(joined, /buildResultCard/);
  assert.match(joined, /schemaVersion: "1\.1"/);
  assert.match(joined, /programId: "program-01"/);
  assert.match(joined, /status: "not-applicable"/);
});
