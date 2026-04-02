import { z } from '@outputai/core';

// --- Vulnerability schemas ---

export const vulnerabilitySchema = z.object( {
  id: z.string().describe( 'Vulnerability ID (e.g. GHSA-xxxx or CVE-xxxx)' ),
  package: z.string(),
  severity: z.enum( [ 'CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'UNKNOWN' ] ),
  summary: z.string(),
  fixedVersions: z.array( z.string() ).optional()
} );

// --- License schemas ---

export const licenseIssueSchema = z.object( {
  package: z.string(),
  version: z.string(),
  license: z.string(),
  reason: z.string()
} );

// --- Abandonment schemas ---

export const abandonedPackageSchema = z.object( {
  package: z.string(),
  version: z.string(),
  lastPublish: z.string(),
  daysSinceLastPublish: z.number()
} );

// --- NPM metadata schemas (same shape for resolved registry rows and failure fallbacks) ---

export const npmPackageSchema = z.object( {
  name: z.string(),
  versionRange: z.string(),
  version: z.string(),
  license: z.string(),
  lastPublish: z.string()
} );

export const npmFailureSchema = z.object( {
  name: z.string(),
  versionRange: z.string(),
  error: z.string()
} );

// --- Package manifest schemas ---

export const packageManifestSchema = z.object( {
  dependencies: z.record( z.string(), z.string() ).default( {} ),
  devDependencies: z.record( z.string(), z.string() ).default( {} ),
  peerDependencies: z.record( z.string(), z.string() ).default( {} )
} );

// --- Workflow input/output schemas ---

export const workflowInputSchema = z.object( {
  repoUrl: z.string().url().describe( 'GitHub repository URL (e.g. https://github.com/owner/repo)' ),
  ref: z.string().default( 'main' ).describe( 'Git ref (branch/tag/sha) to read package.json from' ),
  allowedLicenses: z.array( z.string() ).default( [
    'MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', '0BSD', 'CC0-1.0', 'Unlicense', 'BlueOak-1.0.0'
  ] ).describe( 'SPDX license identifiers considered acceptable' ),
  abandonmentThresholdDays: z.number().default( 365 ).describe( 'Days since last publish to flag a package as potentially abandoned' )
} );

export const workflowOutputSchema = z.object( {
  repo: z.string().describe( 'owner/repo' ),
  ref: z.string(),
  totalDependencies: z.number(),
  npmFailures: z.array( npmFailureSchema ),
  vulnerabilities: z.array( vulnerabilitySchema ),
  licenseIssues: z.array( licenseIssueSchema ),
  abandonedPackages: z.array( abandonedPackageSchema ),
  auditPassed: z.boolean().describe(
    'True only if no CRITICAL/HIGH vulnerabilities, no license issues, and no npm registry errors'
  ),
  summary: z.string().describe( 'Human-readable audit summary' )
} );

// --- Step input/output schemas ---

export const fetchManifestInputSchema = z.object( {
  owner: z.string(),
  repo: z.string(),
  ref: z.string()
} );

export const scanVulnerabilitiesInputSchema = z.object( {
  packages: z.record( z.string(), z.string() ).describe( 'Map of package name to version range' )
} );

export const fetchNpmMetadataInputSchema = z.object( {
  name: z.string().describe( 'npm package name' ),
  versionRange: z.string().describe( 'Version range from package.json' )
} );

export const fetchNpmMetadataOutputSchema = z.union( [ npmPackageSchema, npmFailureSchema ] );

export const checkLicensesInputSchema = z.object( {
  npmPackages: z.array( npmPackageSchema ),
  allowedLicenses: z.array( z.string() )
} );

export const checkAbandonmentInputSchema = z.object( {
  npmPackages: z.array( npmPackageSchema ),
  thresholdDays: z.number()
} );

export const compileReportInputSchema = z.object( {
  repo: z.string(),
  ref: z.string(),
  totalDependencies: z.number(),
  npmFailures: z.array( npmFailureSchema ),
  vulnerabilities: z.array( vulnerabilitySchema ),
  licenseIssues: z.array( licenseIssueSchema ),
  abandonedPackages: z.array( abandonedPackageSchema )
} );

// --- Type exports ---

export type WorkflowInput = z.infer<typeof workflowInputSchema>;
export type WorkflowOutput = z.infer<typeof workflowOutputSchema>;
export type Vulnerability = z.infer<typeof vulnerabilitySchema>;
export type LicenseIssue = z.infer<typeof licenseIssueSchema>;
export type AbandonedPackage = z.infer<typeof abandonedPackageSchema>;
export type PackageManifest = z.infer<typeof packageManifestSchema>;
export type NpmPackage = z.infer<typeof npmPackageSchema>;
export type NpmFailure = z.infer<typeof npmFailureSchema>;
