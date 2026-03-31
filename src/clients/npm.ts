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
  version: string;
  license: string;
  lastPublish: string;
}

type NpmLicenseField = string | { type: string } | undefined;

export interface NpmError {
  name: string,
  error: string
}

function resolveLicenseField( license: NpmLicenseField ): string {
  if ( license === undefined ) {
    return 'UNDECLARED';
  }
  return typeof license === 'object' ? license.type : license;
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
    return { name, error: 'Package not found' } as NpmError;
  }

  const { versions, time: pubDates } = await response.json() as NpmRegistryResponse;

  const maxSatisfying = semver.maxSatisfying( Object.keys( versions ), versionRange, { includePrerelease: false } ) as string | null;
  const fallbackVersion = Object.hasOwn( versions, versionRange ) ? versionRange : null;
  const version = maxSatisfying ?? fallbackVersion;

  if ( version === null ) {
    return { name, error: `No published version satisfies range "${versionRange}"` } as NpmError;
  }

  return {
    name,
    version,
    license: resolveLicenseField( versions[version].license ),
    lastPublish: pubDates.modified
  };
}
