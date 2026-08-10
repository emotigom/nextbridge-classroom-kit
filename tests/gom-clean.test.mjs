import assert from "node:assert/strict";
import test from "node:test";
import { createGomCleanAdapter } from "../src/adapters/gom-clean.stub.js";

test("gom-clean adapter remains disabled and fail-closed", async () => {
  const adapter = createGomCleanAdapter();
  assert.equal(adapter.enabled, false);
  assert.equal(adapter.mode, "optional-gom-clean");

  await assert.rejects(adapter.exchangeJoinCode(), {
    code: "GOM_CLEAN_NOT_CONFIGURED"
  });
  await assert.rejects(adapter.submitResult(), {
    code: "GOM_CLEAN_NOT_CONFIGURED"
  });
});
