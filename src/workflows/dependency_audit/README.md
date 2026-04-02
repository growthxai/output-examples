# Dependency Audit Workflow

Audit a GitHub repository's npm dependencies for security vulnerabilities, license compliance, and abandonment risk.

## Overview

This workflow fetches a repository's `package.json` from GitHub, then scans all dependencies using the OSV vulnerability database and npm registry to produce a comprehensive audit report.

## Steps

| # | Step | Purpose | I/O |
|---|------|---------|-----|
| 1 | `fetchPackageManifest` | Get package.json from GitHub (Base64 decode) | GitHub API |
| 2 | `scanVulnerabilities` | Query OSV batch API for known vulnerabilities | OSV API |
| 3 | `fetchNpmMetadata` | Get license + publish dates from npm registry | npm registry |
| 4 | `checkLicenses` | Compare licenses against allowed list | Pure logic |
| 5 | `checkAbandonment` | Flag packages with last publish > threshold | Pure logic |
| 6 | `compileAuditReport` | Aggregate findings into final report | Pure logic |

Steps 2 and 3 run **in parallel** for efficiency.

## Files

- `workflow.ts` - Orchestration logic with parallel step execution
- `steps.ts` - All 6 step definitions with schemas
- `types.ts` - Zod schemas for all inputs, outputs, and internal types
- `utils.ts` - GitHub URL parser utility
- `scenarios/` - Test input scenarios

### Shared Clients

- `src/clients/github.ts` - GitHub API (extended with `fetchFileContent` and `fetchSecurityAdvisories`)
- `src/clients/osv.ts` - OSV batch vulnerability API (new)
- `src/clients/npm.ts` - npm registry metadata API (new)

## Input

```json
{
  "repoUrl": "https://github.com/expressjs/express",
  "ref": "main",
  "allowedLicenses": ["MIT", "ISC", "BSD-2-Clause", "BSD-3-Clause", "Apache-2.0", "0BSD"],
  "abandonmentThresholdDays": 730
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `repoUrl` | string (URL) | required | GitHub repository URL |
| `ref` | string | `"main"` | Git ref to read package.json from |
| `allowedLicenses` | string[] | Common OSS licenses | SPDX license IDs considered acceptable |
| `abandonmentThresholdDays` | number | `365` | Days since last publish to flag abandonment |

## Output

```json
{
  "repo": "expressjs/express",
  "ref": "main",
  "totalDependencies": 30,
  "vulnerabilities": [...],
  "licenseIssues": [...],
  "abandonedPackages": [...],
  "auditPassed": true,
  "summary": "# Dependency Audit Report\n..."
}
```

The `auditPassed` boolean is `true` only when there are **no CRITICAL/HIGH vulnerabilities** and **no license issues**.

## Prerequisites

- GitHub token configured in credentials (`github.token`) for private repos or higher rate limits
- No additional credentials needed for OSV or npm registry (public APIs)

## Usage

```bash
# Start dev services
npx output dev

# Run the workflow
npx output workflow run dependency_audit test_input
```

## Testing

```bash
npx output workflow run dependency_audit --input '{
  "repoUrl": "https://github.com/expressjs/express",
  "ref": "main",
  "abandonmentThresholdDays": 730
}'
```
