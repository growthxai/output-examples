import { httpClient } from '@outputai/http';

const client = httpClient( {
  prefixUrl: 'https://api.osv.dev/v1',
  timeout: 30000,
  retry: { limit: 3, statusCodes: [ 408, 429, 500, 502, 503, 504 ] }
} );

export interface OsvVulnerability {
  id: string;
  summary: string;
  severity: Array<{
    type: string;
    score: string;
  }>;
  affected: Array<{
    package: {
      ecosystem: string;
      name: string;
    };
    ranges: Array<{
      type: string;
      events: Array<{ introduced?: string; fixed?: string }>;
    }>;
  }>;
  database_specific?: {
    severity?: string;
  };
}

/** Mapped result per queried package — uses `vulnerabilities` (not the raw `vulns` wire field). */
export interface OsvPackageResult {
  vulnerabilities: OsvVulnerability[];
}

export interface OsvBatchResult {
  results: OsvPackageResult[];
}

/** Minimal rows returned by `querybatch` (full records require `GET /v1/vulns/{id}`). */
interface OsvVulnStub {
  id: string;
  modified?: string;
}

/** Raw shape returned by the OSV API before mapping. */
interface OsvBatchRawResult {
  results: Array<{
    vulns?: OsvVulnStub[];
  }>;
}

/**
 * Load full vulnerability JSON (severity, summary, affected, etc.).
 * `querybatch` only returns `{ id, modified }` stubs.
 */
async function fetchVulnerabilityById( id: string ): Promise<OsvVulnerability | null> {
  const response = await client.get( `vulns/${encodeURIComponent( id )}` );

  if ( response.status !== 200 ) {
    return null;
  }

  return response.json() as Promise<OsvVulnerability>;
}

function stubToMinimalVuln( stub: OsvVulnStub ): OsvVulnerability {
  return {
    id: stub.id,
    summary: '',
    severity: [],
    affected: []
  };
}

export interface OsvQuery {
  package: { name: string; ecosystem: string };
  version?: string;
}

/**
 * Query OSV batch API for vulnerabilities across multiple packages.
 * Sends a single request with all packages for efficiency.
 */
export async function queryBatchVulnerabilities(
  packages: Record<string, string>
): Promise<OsvBatchResult> {
  const queries: OsvQuery[] = Object.entries( packages ).map( ( [ name, version ] ) => ( {
    package: { name, ecosystem: 'npm' },
    // Strip semver range characters for version lookup
    version: version.replace( /^[\^~>=<]+/, '' )
  } ) );

  const response = await client.post( 'querybatch', {
    json: { queries }
  } );

  const raw = await response.json() as OsvBatchRawResult;

  const stubs = raw.results.flatMap( r => r.vulns ?? [] );
  const uniqueIds = [ ...new Set( stubs.map( s => s.id ) ) ];

  const fullById = new Map<string, OsvVulnerability>();
  await Promise.all( uniqueIds.map( async id => {
    const full = await fetchVulnerabilityById( id );
    if ( full ) {
      fullById.set( id, full );
    }
  } ) );

  const resolveVuln = ( stub: OsvVulnStub ): OsvVulnerability =>
    fullById.get( stub.id ) ?? stubToMinimalVuln( stub );

  return {
    results: raw.results.map( entry => ( {
      vulnerabilities: ( entry.vulns ?? [] ).map( resolveVuln )
    } ) )
  };
}
