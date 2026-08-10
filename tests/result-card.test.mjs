import assert from "node:assert/strict";
import test from "node:test";
import {
  assertResultCard,
  findProhibitedData,
  validateResultCard
} from "../src/result-card.js";

function validCard(overrides = {}) {
  return {
    schemaVersion: "1.1",
    programId: "program-01",
    programVersion: "0.2.0",
    teamCode: "A-01",
    completedAt: "2026-08-10T10:00:00.000Z",
    summary: "합성데이터를 사용해 두 가지 설계를 비교했습니다.",
    evidence: [
      {
        label: "비교 결과",
        value: "두 번째 설계가 정해진 확인 항목 세 개를 모두 충족했습니다."
      }
    ],
    nextStep: "다른 합성 사례에서도 같은 결과가 나오는지 확인합니다.",
    aiDisclosure: {
      status: "not-used",
      note: ""
    },
    privacyChecked: true,
    ...overrides
  };
}

test("common result card 1.1 accepts a complete synthetic example", () => {
  assert.deepEqual(validateResultCard(validCard()), []);
  assert.doesNotThrow(() => assertResultCard(validCard()));
});

test("result card requires a next improvement step", () => {
  assert.match(validateResultCard(validCard({ nextStep: "   " })).join("\n"), /다음 개선/);
});

test("AI use requires a concrete disclosure note", () => {
  const errors = validateResultCard(
    validCard({
      aiDisclosure: {
        status: "used",
        note: ""
      }
    })
  );
  assert.match(errors.join("\n"), /AI 사용 설명/);
});

test("result card rejects likely personal contact information", () => {
  const card = validCard({ summary: "문의 주소는 student@example.com 입니다." });
  assert.equal(findProhibitedData(card)[0].code, "EMAIL");
  assert.throws(() => assertResultCard(card), /이메일/);
});

test("result card rejects likely secret values", () => {
  const card = validCard({
    evidence: [
      {
        label: "설정",
        value: `키는 ${"sk-" + "A".repeat(24)} 입니다.`
      }
    ]
  });
  assert.throws(() => assertResultCard(card), /API 키/);
});
