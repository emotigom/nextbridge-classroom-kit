import assert from "node:assert/strict";
import test from "node:test";
import { createStandaloneAdapter } from "../src/adapters/standalone.js";

function memoryStorage() {
  const items = new Map();
  return {
    setItem: (key, value) => items.set(key, value),
    getItem: (key) => items.get(key) ?? null,
    removeItem: (key) => items.delete(key)
  };
}

function validCard(overrides = {}) {
  return {
    schemaVersion: "1.1",
    programId: "program-01",
    programVersion: "0.2.0",
    teamCode: "A-01",
    completedAt: "2026-08-10T10:00:00.000Z",
    summary: "합성 사례의 결과를 비교했습니다.",
    evidence: [{ label: "확인", value: "확인 항목 세 개를 모두 충족했습니다." }],
    nextStep: "다른 합성 사례를 한 번 더 확인합니다.",
    aiDisclosure: { status: "not-used", note: "" },
    privacyChecked: true,
    ...overrides
  };
}

test("standalone adapter saves, loads and removes one complete result", () => {
  const adapter = createStandaloneAdapter(memoryStorage());
  const card = validCard();

  assert.equal(adapter.save(card).stored, true);
  assert.deepEqual(adapter.load("program-01", "A-01"), card);
  adapter.remove("program-01", "A-01");
  assert.equal(adapter.load("program-01", "A-01"), null);
});

test("standalone adapter rejects an unsafe team code", () => {
  const adapter = createStandaloneAdapter(memoryStorage());
  assert.throws(
    () => adapter.save(validCard({ teamCode: "학생 이름" })),
    /팀코드/
  );
});

test("standalone adapter rejects an incomplete result card", () => {
  const adapter = createStandaloneAdapter(memoryStorage());
  assert.throws(
    () => adapter.save(validCard({ nextStep: "" })),
    /다음 개선/
  );
});
