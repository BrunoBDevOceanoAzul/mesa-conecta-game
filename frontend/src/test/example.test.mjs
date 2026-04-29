import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("frontend test harness", () => {
  it("runs on the native Node test runner", () => {
    assert.equal(true, true);
  });
});
