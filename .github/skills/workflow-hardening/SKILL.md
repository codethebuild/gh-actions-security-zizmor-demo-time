---
name: workflow-hardening
description: Automatically hardens GitHub Actions workflows by applying security best practices based on zizmor findings. Use this when asked to harden workflows, apply zizmor fixes, or secure GitHub Actions.
---

# Workflow Hardening Skill

Automatically hardens GitHub Actions workflows by applying security best practices based on zizmor findings.

## When to use this skill

Use this skill when you need to:
- Harden GitHub Actions workflows with security best practices
- Apply zizmor security findings automatically
- Pin actions to commit SHAs with version tracking
- Add minimal permissions to workflows
- Protect credentials in checkout steps
- Add concurrency controls
- Configure Dependabot cooldown for GitHub Actions
- Add a zizmor CI workflow to scan workflows for security issues

## Usage

Ask Copilot to:
- "Harden workflows"
- "Apply zizmor fixes"
- "Secure GitHub Actions workflows"
- "Pin actions to SHAs"
- "Add workflow permissions"
- "Add zizmor CI workflow"

## What it does

The skill runs `.github/scripts/harden-workflows.sh` which:

1. **Scans workflows with zizmor** in pedantic mode to detect security issues
2. **Pins all actions to SHAs** - converts mutable refs like `@v6` to immutable SHAs with version comments
3. **Adds minimal permissions** - sets `permissions: {}` at workflow level, adds job-level scopes
4. **Protects credentials** - adds `persist-credentials: false` to checkout steps
5. **Adds concurrency controls** - prevents resource waste with `cancel-in-progress: true`
6. **Configures Dependabot cooldown** - adds 7-day cooldown to prevent update fatigue
7. **Creates a zizmor CI workflow** - adds `.github/workflows/zizmor.yml` to continuously scan workflows for security issues (resolves latest action versions dynamically and pins them to SHAs)

## Commands

```bash
# Dry run mode (preview changes without applying)
.github/scripts/harden-workflows.sh --dry-run

# Apply all fixes automatically
.github/scripts/harden-workflows.sh

# Run zizmor scan only
.github/scripts/harden-workflows.sh --scan-only
```

## Iterative Verification

**IMPORTANT**: After applying any changes, always run:

```bash
zizmor --persona pedantic .
```

Repeat fixes and re-run until the output is:

```
No findings to report. Good job!
```

Do **not** consider hardening complete until `zizmor --persona pedantic .` reports zero findings. Common findings that require follow-up fixes are:

- `insufficient-cooldown` — add `cooldown: default-days: 7` to the `github-actions` ecosystem entry in `.github/dependabot.yml`
- `permissions-without-comment` — every non-obvious permission scope (`actions: read`, `security-events: write`, etc.) must have a trailing inline comment explaining why it is needed

## SHA Resolution Strategy

For each action `uses: owner/repo@ref`:

- **Mutable refs** like `@v6` or `@v1`: Query GitHub API for latest patch version in that major series (e.g., `v6.0.2`), fetch its SHA
- **Specific versions** like `@v6.0.2`: Fetch SHA directly for that tag
- **Already pinned SHAs**: Keep as-is (Dependabot will update them)
- **Format**: Always `@{sha} # {version}` for human readability

### Example transformation

```yaml
# Before
uses: actions/checkout@v6

# After
uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
```

## Zizmor Finding Remediation

| Finding Type | Fix Applied |
|-------------|-------------|
| `unpinned-uses` | Pin action to SHA with version comment |
| `excessive-permissions` | Add workflow-level `permissions: {}` + job-level minimal scopes |
| `ref-confusion` | Add `persist-credentials: false` to checkout steps |
| `dangerous-triggers` | Add warnings or restrict to protected branches |
| `artipacked` | Add retention policies to artifact uploads |
| `template-injection` | Use environment variables for user input |
| Missing concurrency | Add concurrency group with `cancel-in-progress: true` |
| Missing Dependabot cooldown | Add `cooldown: { default-days: 7 }` to `.github/dependabot.yml` |

## Files Modified

- `.github/workflows/*.yml` - All workflow files
- `.github/workflows/zizmor.yml` - Zizmor CI workflow (created if it doesn't exist)
- `.github/dependabot.yml` - Dependabot configuration (if exists)

## Best Practices

1. **Always use dry-run first** to preview changes before applying
2. **Review SHA comments** to ensure correct versions are pinned
3. **Test workflows** after hardening to ensure they still work
4. **Keep Dependabot enabled** to receive security updates for pinned actions
5. **Run zizmor regularly** to catch new security issues

## Prerequisites

Required tools:
- `zizmor` - Install with: `cargo install zizmor`
- `gh` - GitHub CLI (https://cli.github.com/)
- `yq` - Optional but recommended for YAML processing

## Create zizmor CI Workflow

When asked to add a zizmor CI workflow (or as part of full hardening), create the file `.github/workflows/zizmor.yml` that runs zizmor on every push to `main` and on all pull requests when workflow files change.

### Resolving latest action versions

**IMPORTANT**: Before creating the workflow, you MUST resolve the latest versions and their pinned commit SHAs for the following actions:

1. **`actions/checkout`** — Use the GitHub API (`mcp_io_github_git_get_latest_release` for `owner: actions`, `repo: checkout`) to get the latest release tag, then resolve its commit SHA via the API or terminal (`gh api repos/actions/checkout/git/ref/tags/<tag> --jq '.object.sha'`).
2. **`zizmorcore/zizmor-action`** — Use the GitHub API (`mcp_io_github_git_get_latest_release` for `owner: zizmorcore`, `repo: zizmor-action`) to get the latest release tag, then resolve its commit SHA similarly.

Pin both actions to their full 40-character commit SHA with a version comment: `@<sha> # <version>`

### Workflow template

Use the following structure as the template. Replace `<checkout-sha>`, `<checkout-version>`, `<zizmor-sha>`, and `<zizmor-version>` with the dynamically resolved values:

```yaml
name: GitHub Actions Security Analysis with zizmor

on:
  push:
    branches: ["main"]
    paths:
      - ".github/workflows/**"
  pull_request:
    branches: ["**"]
    paths:
      - ".github/workflows/**"

permissions: {}

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  zizmor:
    name: Run zizmor
    runs-on: ubuntu-latest
    permissions:
      contents: read
      actions: read           # to read actions in status in the repo
      security-events: write  # to create security alerts
    steps:
      - name: Checkout repository
        uses: actions/checkout@<checkout-sha> # <checkout-version>
        with:
          persist-credentials: false

      - name: Run zizmor
        uses: zizmorcore/zizmor-action@<zizmor-sha> # <zizmor-version>
        with:
          persona: pedantic
          advanced-security: false
          annotations: true
```

### Key security properties

- **`permissions: {}`** at workflow level — no default permissions leak
- **Job-level permissions** — minimal scopes: `contents: read`, `actions: read`, `security-events: write`
- **`persist-credentials: false`** — prevents credential leakage from checkout
- **Concurrency control** — cancels redundant runs
- **Pinned actions** — immutable SHA references prevent supply-chain attacks
- **Path filter** — only runs when workflow files actually change

## Integration

This skill implements the same hardening steps shown in Demo Time presentations but in an automated, repeatable way suitable for production use.
