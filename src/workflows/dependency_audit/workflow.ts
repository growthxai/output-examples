import { workflow, executeInParallel } from '@outputai/core';
import {
  fetchPackageManifest,
  scanVulnerabilities,
  fetchNpmMetadata,
  checkLicenses,
  checkAbandonment,
  compileAuditReport
} from './steps.js';
import { parseGitHubUrl } from './utils.js';
import { NpmFailure, NpmPackage, workflowInputSchema, workflowOutputSchema } from './types.js';

export default workflow( {
  name: 'dependency_audit',
  description: 'Audit a GitHub repository\'s npm dependencies for vulnerabilities, license compliance, and abandonment risk',
  inputSchema: workflowInputSchema,
  outputSchema: workflowOutputSchema,
  fn: async input => {
    const { owner, repo } = parseGitHubUrl( input.repoUrl );
    const repoSlug = `${owner}/${repo}`;

    // Step 1: Fetch package.json
    const manifest = await fetchPackageManifest( { owner, repo, ref: input.ref } );

    // Merge all dependencies (including peer) for scanning
    const allPackages: Record<string, string> = {
      ...manifest.dependencies,
      ...manifest.devDependencies,
      ...manifest.peerDependencies
    };

    // Steps 2 & 3: Run vulnerability scan and per-package npm metadata (orchestrated) in parallel
    const dependencyEntries = Object.entries( allPackages );
    const [ vulnerabilities, parallelNpmResults ] = await Promise.all( [
      scanVulnerabilities( { packages: allPackages } ),
      executeInParallel( {
        jobs: dependencyEntries.map( ( [ name, versionRange ] ) =>
          () => fetchNpmMetadata( { name, versionRange } )
        ),
        concurrency: 5
      } )
    ] );

    const npmPackages : NpmPackage[] = [];
    const npmFailures : NpmFailure[] = [];

    parallelNpmResults.filter( r => r.ok ).map( p => {
      if ( Object.hasOwn( p.result, 'error' ) ) {
        npmFailures.push( p.result as NpmFailure );
      } else {
        npmPackages.push( p.result as NpmPackage );
      }
    } );

    // Step 4: Check licenses against allowed list
    const licenseIssues = await checkLicenses( {
      npmPackages,
      allowedLicenses: input.allowedLicenses
    } );

    // Step 5: Check for abandoned packages
    const abandonedPackages = await checkAbandonment( {
      npmPackages,
      thresholdDays: input.abandonmentThresholdDays
    } );

    // Step 6: Compile final audit report
    const report = await compileAuditReport( {
      repo: repoSlug,
      ref: input.ref,
      totalDependencies: dependencyEntries.length,
      npmFailures,
      vulnerabilities,
      licenseIssues,
      abandonedPackages
    } );

    return report;
  },
  options: {
    activityOptions: {
      retry: {
        maximumAttempts: 3
      }
    }
  }
} );
