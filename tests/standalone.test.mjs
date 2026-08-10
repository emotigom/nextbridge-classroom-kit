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

test("standalone adapter saves, loads and removes one result", () => {
  const adapter = createStandaloneAdapter(memoryStorage());
  const card = { programId: "program-01", teamCode: "A-01", summary: "테스트" };

  assert.equal(adapter.save(card).stored, true);
  assert.deepEqual(adapter.load("program-01", "A-01"), card);
  adapter.remove("program-01", "A-01");
  assert.equal(adapter.load("program-01", "A-01"), null);
});

test("standalone adapter rejects an unsafe team code", () => {
  const adapter = createStandaloneAdapter(memoryStorage());
  assert.throws(
    () => adapter.save({ programId: "program-01", teamCode: "학생 이름" }),
    /팀코드/
  );
});

