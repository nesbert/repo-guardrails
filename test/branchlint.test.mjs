import assert from "node:assert/strict";
import test from "node:test";

import { validateBranchName } from "../src/branchlint.mjs";

test("accepts conventionally named human branches", () => {
  const branchNames = [
    "feat/42-add-search",
    "fix/session-expiration",
    "docs/git-workflow",
    "test/7-cover-invalid-requests",
    "refactor/activity-service",
    "perf/21-reduce-dashboard-load-time",
    "build/update-vite",
    "ci/12-enforce-branch-names",
    "chore/remove-temporary-files",
  ];
  for (const branchName of branchNames) {
    assert.deepEqual(validateBranchName(branchName), { valid: true, exempt: false });
  }
});

test("accepts permanent and automation-managed exemptions", () => {
  for (const branchName of ["main", "codex/dashboard-concept-4", "dependabot/npm_and_yarn/vite-7.0.0"]) {
    assert.deepEqual(validateBranchName(branchName), { valid: true, exempt: true });
  }
});

test("rejects branch names outside the convention", () => {
  for (const branchName of ["", "feature/new-ui", "feat/New_UI", "feat/42", "feat/add search", "person/search-form", "docs//git-workflow", "release/1.0.0"]) {
    assert.equal(validateBranchName(branchName).valid, false, `${branchName} should be invalid`);
  }
});
