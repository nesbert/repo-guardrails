import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { validateBranchName } from "../../src/node/branchlint.mjs";

const fixtureFile = new URL("../fixtures/branch-names.json", import.meta.url);
const fixtures = JSON.parse(readFileSync(fixtureFile, "utf8"));

test("node: accepts conventionally named human branches", () => {
  for (const branchName of fixtures.valid) {
    assert.deepEqual(validateBranchName(branchName), { valid: true, exempt: false });
  }
});

test("node: accepts permanent and automation-managed exemptions", () => {
  for (const branchName of fixtures.exempt) {
    assert.deepEqual(validateBranchName(branchName), { valid: true, exempt: true });
  }
});

test("node: rejects branch names outside the convention", () => {
  for (const branchName of fixtures.invalid) {
    assert.equal(validateBranchName(branchName).valid, false, `${branchName} should be invalid`);
  }
});
