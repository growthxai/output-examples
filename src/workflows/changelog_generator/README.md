# Changelog Generator Workflow

Fetches GitHub commits and merged PRs within a date range and generates a categorized changelog using LLM classification.

## Overview

This workflow accepts a GitHub repository URL and a date range, fetches commits and merged pull requests in parallel via the GitHub API, then uses an LLM to categorize each change (feature, fix, breaking change, chore, docs, refactor). The categorized entries are grouped and formatted into a human-readable changelog.

### Orchestration Flow

```
workflow.ts
│
├─ 1. parseGitHubUrl(repoUrl)              — in workflow (deterministic; not I/O)
├─ 2a. fetchRepoCommits({ owner, repo })   — step: GitHub API (I/O in activity)
├─ 2b. fetchRepoPullRequests({ ... })       — step: GitHub API (I/O in activity, parallel with 2a)
├─ 3. categorizeChanges({ commits, prs })   — step: LLM (I/O in activity)
├─ 4. groupEntries(entries)                 — in workflow (deterministic)
└─ 5. formatChangelog(...)                  — in workflow (deterministic)
```

## Files

| File | Purpose |
|------|---------|
| `workflow.ts` | Workflow orchestration |
| `steps.ts` | `fetchRepoCommits`, `fetchRepoPullRequests`, `categorizeChanges` |
| `types.ts` | Zod schemas and TypeScript types |
| `utils.ts` | `parseGitHubUrl`, `groupEntries`, `formatChangelog` |
| `prompts/categorize_changes@v1.prompt` | LLM prompt for change categorization |
| `scenarios/` | Test input scenarios |

### Shared Client

- `src/clients/github.ts` — `fetchCommits`, `fetchMergedPullRequests`: GitHub REST API calls for repository commits and merged PRs

## Input Schema

```json
{
  "repoUrl": "https://github.com/anthropics/anthropic-sdk-python",
  "startDate": "2025-04-01",
  "endDate": "2025-04-30"
}
```

| Field | Description |
|-------|-------------|
| `repoUrl` | GitHub repository URL (e.g. `https://github.com/owner/repo`) |
| `startDate` | Start date in `YYYY-MM-DD` format |
| `endDate` | End date in `YYYY-MM-DD` format |

## Output Schema

```json
{
  "repo": "anthropics/anthropic-sdk-python",
  "startDate": "2025-04-01",
  "endDate": "2025-04-30",
  "features": [
    {
      "title": "Add streaming support for tool use",
      "category": "feature",
      "source": "pull_request",
      "reference": "PR #412",
      "author": "username"
    }
  ],
  "fixes": [],
  "breakingChanges": [],
  "other": [],
  "changelog": "# Changelog: anthropics/anthropic-sdk-python\n> 2025-04-01 to 2025-04-30\n\n## Features\n- Add streaming support for tool use (PR #412)\n"
}
```

## Prerequisites

- An `ANTHROPIC_API_KEY` configured in credentials (used by `claude-haiku-4-5` for change categorization)
- A `GITHUB_TOKEN` configured in credentials (optional; needed for private repos or to avoid rate limits)

## Usage

### Run with scenario files

```bash
# Start dev services
npx output dev

# Run with a scenario
npx output workflow run changelog_generator --scenario happy_path
```

### Run with custom input

```bash
npx output workflow run changelog_generator --input '{"repoUrl": "https://github.com/owner/repo", "startDate": "2025-03-01", "endDate": "2025-03-31"}'
```

## Resources

- [Output.ai Documentation](https://docs.output.ai)
- [Temporal Documentation](https://docs.temporal.io)
