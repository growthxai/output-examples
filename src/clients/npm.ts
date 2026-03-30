import { httpClient } from '@outputai/http';
import semver from 'semver';

const client = httpClient( {
  prefixUrl: 'https://registry.npmjs.org',
  timeout: 30000,
  retry: { limit: 3, statusCodes: [ 408, 429, 500, 502, 503, 504 ] }
} );

export interface NpmRegistryResponse {
  name: string;
  'dist-tags': Record<string, string>;
  time: Record<string, string>;
  versions: Record<string, {
    license?: string | { type: string };
  }>;
  license?: string | { type: string };
}

export interface NpmPackageInfo {
  name: string;
  /** Highest registry version that satisfies the requested semver range. */
  resolvedVersion: string;
  license: string;
  lastPublish: string;
}

type NpmLicenseField = string | { type: string } | undefined;

export interface NpmError {
  name: string,
  error: string
}

/**
 * Resolves npm registry license field to a display string, or undefined if absent.
 */
function resolveLicenseField( license: NpmLicenseField ): string | undefined {
  const fromObject =
    typeof license !== 'string' && license && typeof license === 'object' && 'type' in license ?
      license.type :
      undefined;
  return typeof license === 'string' ? license : fromObject;
}

/**
 * Fetch abbreviated metadata for a single npm package, resolving license and publish
 * time for the highest published version that satisfies `versionRange`.
 */
export async function fetchPackageMetadata(
  name: string,
  versionRange: string
): Promise<NpmPackageInfo | NpmError> {
  // Handle scoped packages — encode the slash
  const encodedName = name.startsWith( '@' ) ? `@${encodeURIComponent( name.slice( 1 ) )}` : encodeURIComponent( name );

  const response = await client.get( encodedName, {
    headers: { Accept: 'application/json' }
  } );

  if ( response.status === 404 ) {
    return {
      name,
      error: 'Package not found'
    } as NpmError;
  }

  const data = await response.json() as NpmRegistryResponse;

  const versionKeys = Object.keys( data.versions || {} );
  const maxSatisfying = semver.maxSatisfying( versionKeys, versionRange, { includePrerelease: false } );
  const resolvedVersion =
    maxSatisfying ??
    ( versionKeys.includes( versionRange ) ? versionRange : null );

  if ( resolvedVersion === null ) {
    return {
      name,
      error: `No published version satisfies range "${versionRange}"`
    } as NpmError;
  }

  const fromVersion = data.versions?.[resolvedVersion] ?
    resolveLicenseField( data.versions[resolvedVersion].license ) :
    undefined;
  const resolved = resolveLicenseField( data.license ) ?? fromVersion;
  const license = resolved ?? 'UNDECLARED';

  const lastPublish =
    data.time?.[resolvedVersion] ??
    data.time?.modified ??
    new Date( 0 ).toISOString();

  return {
    name,
    resolvedVersion,
    license,
    lastPublish
  };
}
