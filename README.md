# repo-guardrails

`repo-guardrails` gives Node.js repositories consistent Git contribution rules: Conventional Commit messages, predictable branch names, local Husky hooks, matching GitHub Actions checks, and documented `main` branch protection.

It is designed to provide fast local feedback while making GitHub the authority for merging. Local hooks can be bypassed and are not a security boundary. A failed GitHub check blocks merging only when that exact check is required by an active ruleset.

Use it when you want contributors to follow the same commit and branch conventions locally and in pull requests without rebuilding the tooling in every repository.

## Set up a repository

Follow these steps in order.

### 1. Check the requirements

You need Git, Node.js 20 or newer, an npm project with a committed lockfile, and repository administration access to configure GitHub rules.

### 2. Install and initialize

From the npm and Git repository root:

```bash
npm install --save-dev repo-guardrails
npx repo-guardrails init
```

`init` adds missing `branchlint`, `commitlint`, and `prepare` scripts and creates:

```text
commitlint.config.mjs
.husky/commit-msg
.husky/pre-push
.github/workflows/commitlint.yml
.github/workflows/branchlint.yml
```

Existing files and differing scripts are reported and preserved, never silently replaced. Review all generated changes before committing them.

### 3. Push the workflows and open a pull request

Commit the generated files and package changes on a conventionally named branch, push it, and open a pull request into `main`. This first pull request registers the `Commitlint` and `Branchlint` checks with GitHub.

Wait for both checks to finish. Fix any failure before configuring the ruleset.

### 4. Protect `main`

The package cannot change repository rules without administration permission:

1. Open **Settings → Rules → Rulesets**.
2. Create a branch ruleset targeting the default branch, or import [`templates/main-ruleset.json`](templates/main-ruleset.json).
3. Require pull requests, at least one approval, and resolved conversations when appropriate.
4. Block force pushes and branch deletion.
5. Require branches to be up to date before merging.
6. Require the exact `Commitlint` and `Branchlint` status checks.
7. Review imported check names, integration identifiers, default branch, merge methods, and repository-specific settings.

Select checks whose source is **GitHub Actions**. Do not choose the generic **Any source** entry. If `Branchlint` is not listed with GitHub Actions as its source, return to the previous step and let it run on a pull request first.

### 5. Verify the protection

Confirm both checks are required in the active ruleset. Test with a pull request from an invalid branch such as `feature/invalid-name` or with a commit such as `bad message`. The appropriate check should fail and GitHub should prevent merging.

You can also run the checks manually:

```bash
npx repo-guardrails branchlint
npx repo-guardrails branchlint feat/42-add-search
printf 'feat: add search\n' | npx repo-guardrails commitlint
```

## Conventions

### Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>[optional scope]: <description>
```

```text
feat: add account settings
fix(auth): preserve the user session
docs: update contributor instructions
test(api): cover invalid requests
chore: update tooling
```

Common types include `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`, `build`, `perf`, `style`, and `revert`. Scopes are optional. Defaults come from `@commitlint/config-conventional`.

### Branch names

Human-created branches use:

```text
<type>/[<issue-number>-]<short-description>
```

Allowed types are `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `build`, `ci`, and `chore`. Use lowercase letters and numbers with hyphens, including an issue number when one exists.

```text
feat/42-add-search
fix/session-expiration
docs/git-workflow
```

`main`, `codex/*`, and `dependabot/*` are exempt. Names such as `feature/new-ui`, `feat/New_UI`, and `release/1.0.0` are rejected.

## How enforcement works

- `.husky/commit-msg` checks each commit locally.
- `.husky/pre-push` checks every pushed branch.
- `commitlint.yml` checks pull-request commits and commits pushed to `main`.
- `branchlint.yml` checks every pull request's source branch.
- The GitHub ruleset makes the remote checks authoritative for merging.

Each repository must contain workflow YAML because GitHub reads workflows before npm installs dependencies; it cannot discover workflows inside `node_modules`. Small copied workflows are easy to inspect, but template updates must be applied manually.

## Update, configure, or remove

```bash
npm install --save-dev repo-guardrails@latest
npx repo-guardrails init
```

`init` preserves existing files. Compare them with `node_modules/repo-guardrails/templates/` when adopting template updates. Version one keeps branch rules fixed; projects can import `validateBranchName` from `repo-guardrails` for custom behavior.

To remove it, run `npm uninstall repo-guardrails`, delete its three scripts and five generated files if unused, and remove `.husky/` when no hooks remain. You can then run `git config --unset core.hooksPath`.

## Troubleshooting

- **Hooks do not run:** run `npm install`, then `npm run prepare`, and commit `.husky/`.
- **`npm ci` fails in Actions:** commit the lockfile produced by the supported package manager and Node version.
- **Bad changes can merge:** require the exact GitHub Actions-sourced `Commitlint` and `Branchlint` checks.
- **`init` skipped a file:** compare it with the matching packaged template and merge intentionally.
- **Detached HEAD:** pass the branch explicitly: `repo-guardrails branchlint <name>`.

## Development and publishing

```bash
npm install
npm test
npm pack --dry-run
```

Before publishing, confirm the package name is available, inspect the exact tarball contents, test installation in a disposable repository, and ensure no secrets or unrelated files are included. Releases follow semantic versioning.

## Security and license

Hooks are bypassable, workflows can be changed, and administrators may be allowed to bypass rules. Review workflow and ruleset changes as security-sensitive configuration.

This project uses the [MIT License](LICENSE), allowing use, modification, distribution, sublicensing, and sale while retaining the notice and providing no warranty.
