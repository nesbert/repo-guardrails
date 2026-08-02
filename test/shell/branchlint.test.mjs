import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const script = fileURLToPath(new URL("../../src/shell/branchlint.sh", import.meta.url));
const policyFile = fileURLToPath(new URL("../../policy/branch-names.conf", import.meta.url));
const fixtureFile = new URL("../fixtures/branch-names.json", import.meta.url);
const fixtures = JSON.parse(readFileSync(fixtureFile, "utf8"));

function run(branchName) {
  return spawnSync("bash", [script, branchName], {
    encoding: "utf8",
    env: { ...process.env, REPO_GUARDRAILS_POLICY_FILE: policyFile },
  });
}

test("shell: accepts conventionally named branches and exemptions", () => {
  for (const branchName of [...fixtures.valid, ...fixtures.exempt]) {
    assert.equal(run(branchName).status, 0, branchName);
  }
});

test("shell: rejects branch names outside the shared convention", () => {
  for (const branchName of fixtures.invalid) {
    assert.notEqual(run(branchName).status, 0, branchName);
  }
});
