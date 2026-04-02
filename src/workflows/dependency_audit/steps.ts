import { step, z } from '@outputai/core';
import { fetchFileContent } from '../../clients/github.js';
import { queryBatchVulnerabilities } from '../../clients/osv.js';
import { fetchPackageMetadata, NpmError, NpmPackageInfo } from '../../clients/npm.js';
import { toVulnerabilityEntry } from './vulnerability_mapper.js';
import {
  fetchManifestInputSchema,
  packageManifestSchema,
  scanVulnerabilitiesInputSchema,
  vulnerabilitySchema,
  fetchNpmMetadataInputSchema,
  fetchNpmMetadataOutputSchema,
  checkLicensesInputSchema,
  licenseIssueSchema,
  checkAbandonmentInputSchema,
  abandonedPackageSchema,
  compileReportInputSchema,
  workflowOutputSchema
} from './types.js';

/**
 * Step 1: Fetch package.json from a GitHub repo and decode it.
 */
export const fetchPackageManifest = step( {
  name: 'fetch_package_manifest',
  description: 'Fetch package.json from GitHub repository and extract dependencies',
  inputSchema: fetchManifestInputSchema,
  outputSchema: packageManifestSchema,
  fn: async ( { owner, repo, ref } ) => {
    const file = await fetchFileContent( owner, repo, 'package.json', ref );
    const decoded = Buffer.from( file.content, 'base64' ).toString( 'utf-8' );
    const pkg = JSON.parse( decoded );

    return {
      dependencies: pkg.dependencies ?? {},
      devDependencies: pkg.devDependencies ?? {},
      peerDependencies: pkg.peerDependencies ?? {}
    };
  }
} );

/**
 * Step 2: Query OSV batch API for known vulnerabilities.
 */
export const scanVulnerabilities = step( {
  name: 'scan_vulnerabilities',
  description: 'Scan dependencies for known vulnerabilities via OSV batch API',
  inputSchema: scanVulnerabilitiesInputSchema,
  outputSchema: z.array( vulnerabilitySchema ),
  fn: async ( { packages } ) => {
    const packageNames = Object.keys( packages );
    if ( packageNames.length === 0 ) {
      return [];
    }

    const batchResult = await queryBatchVulnerabilities( packages );

    return batchResult.results.flatMap( ( result, index ) =>
      result.vulnerabilities.map( vuln =>
        toVulnerabilityEntry( vuln, packageNames[index] )
      )
    );
  }
} );

/**
 * Step 3: Fetch license + publish date metadata for one npm package from the registry.
 * Registry failures are returned as structured rows (not thrown) so parallel runs stay deterministic.
 */
export const fetchNpmMetadata = step( {
  name: 'fetch_npm_metadata',
  description: 'Fetch license and publish date metadata from npm registry for a single package',
  inputSchema: fetchNpmMetadataInputSchema,
  outputSchema: fetchNpmMetadataOutputSchema,
  fn: async ( { name, versionRange } ) => {
    const response = await fetchPackageMetadata( name, versionRange );
    if ( Object.hasOwn( response, 'error' ) ) {
      return {
        name,
        versionRange,
        error: ( response as NpmError ).error
      };
    } else {
      const pkgInfo = response as NpmPackageInfo;
      return {
        name,
        versionRange,
        version: pkgInfo.version,
        license: pkgInfo.license,
        lastPublish: pkgInfo.lastPublish
      };
    }
  }
} );

/**
 * Step 4: Check licenses against allowed list. Pure logic — no I/O.
 */
export const checkLicenses = step( {
  name: 'check_licenses',
  description: 'Compare package licenses against allowed license list',
  inputSchema: checkLicensesInputSchema,
  outputSchema: z.array( licenseIssueSchema ),
  fn: async ( { npmPackages, allowedLicenses } ) => {
    const normalizedAllowed = new Set( allowedLicenses.map( l => l.toUpperCase() ) );

    return npmPackages
      .filter( pkg => !normalizedAllowed.has( pkg.license.toUpperCase() ) )
      .map( pkg => ( {
        package: pkg.name,
        version: pkg.version,
        license: pkg.license,
        reason: pkg.license === 'UNDECLARED' ?
          'License is not declared in npm registry metadata (package or latest version)' :
          `License "${pkg.license}" is not in the allowed list`
      } ) );
  }
} );

/**
 * Step 5: Flag packages with last publish older than threshold. Pure logic.
 */
export const checkAbandonment = step( {
  name: 'check_abandonment',
  description: 'Flag packages that have not been published recently',
  inputSchema: checkAbandonmentInputSchema,
  outputSchema: z.array( abandonedPackageSchema ),
  fn: async ( { npmPackages, thresholdDays } ) => {
    const nowMs = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;

    return npmPackages
      .map( pkg => {
        const lastPublishMs = new Date( pkg.lastPublish ).getTime();
        const daysSince = Math.floor( ( nowMs - lastPublishMs ) / msPerDay );
        return { pkg, daysSince };
      } )
      .filter( ( { daysSince } ) => daysSince > thresholdDays )
      .map( ( { pkg, daysSince } ) => ( {
        package: pkg.name,
        version: pkg.version,
        lastPublish: pkg.lastPublish,
        daysSinceLastPublish: daysSince
      } ) );
  }
} );

/**
 * Step 6: Compile all findings into a final audit report. Pure logic.
 */
export const compileAuditReport = step( {
  name: 'compile_audit_report',
  description: 'Aggregate vulnerability, license, and abandonment findings into an audit report',
  inputSchema: compileReportInputSchema,
  outputSchema: workflowOutputSchema,
  fn: async ( { repo, ref, npmFailures, totalDependencies, vulnerabilities, licenseIssues, abandonedPackages } ) => {
    const criticalHighVulnerabilities = vulnerabilities.filter(
      v => v.severity === 'CRITICAL' || v.severity === 'HIGH'
    );
    const auditPassed = criticalHighVulnerabilities.length === 0 &&
      licenseIssues.length === 0 &&
      npmFailures.length === 0;

    const lines: string[] = [
      '# Dependency Audit Report',
      '',
      `**Repository:** ${repo}`,
      `**Ref:** ${ref}`,
      `**Total dependencies scanned:** ${totalDependencies}`,
      `**Audit result:** ${auditPassed ? '✅ PASSED' : '❌ FAILED'}`,
      ''
    ];

    // Vulnerabilities section
    lines.push( `## Vulnerabilities (${vulnerabilities.length} found)` );
    if ( vulnerabilities.length === 0 ) {
      lines.push( '', 'No known vulnerabilities detected.' );
    } else {
      for ( const v of vulnerabilities ) {
        const fix = v.fixedVersions && v.fixedVersions.length > 0 ?
          ` (fix: ${v.fixedVersions.join( ', ' )})` :
          '';
        lines.push( `- **[${v.severity}]** ${v.package}: ${v.summary} (${v.id})${fix}` );
      }
    }
    lines.push( '' );

    // NPM registry fetch errors (missing package, network, etc.)
    lines.push( `## NPM registry errors (${npmFailures.length} found)` );
    if ( npmFailures.length === 0 ) {
      lines.push( '', 'All dependency packages were resolved from the npm registry.' );
    } else {
      lines.push( ...npmFailures.map( p => `- **${p.name}@${p.versionRange}**: ${p.error}` ) );
    }
    lines.push( '' );

    // License issues section
    lines.push( `## License Issues (${licenseIssues.length} found)` );
    if ( licenseIssues.length === 0 ) {
      lines.push( '', 'All packages have acceptable licenses.' );
    } else {
      lines.push( ...licenseIssues.map( l => `- **${l.package}@${l.version}**: ${l.reason}` ) );
    }
    lines.push( '' );

    // Abandonment section
    lines.push( `## Potentially Abandoned Packages (${abandonedPackages.length} found)` );
    if ( abandonedPackages.length === 0 ) {
      lines.push( '', 'All packages have recent activity.' );
    } else {
      lines.push(
        ...abandonedPackages.map( a => `- **${a.package}@${a.version}**: Last published ${a.daysSinceLastPublish} days ago (${a.lastPublish})` )
      );
    }

    return {
      repo,
      ref,
      totalDependencies,
      npmFailures,
      vulnerabilities,
      licenseIssues,
      abandonedPackages,
      auditPassed,
      summary: lines.join( '\n' )
    };
  }
} );
