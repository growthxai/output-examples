import { FatalError } from '@outputai/core';
import { httpClient } from '@outputai/http';
import { credentials } from '@outputai/credentials';

const token = credentials.get( 'github.token' );

const headers: Record<string, string> = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28'
};

if ( token ) {
  headers['Authorization'] = `Bearer ${token}`;
}

const client = httpClient( {
  prefixUrl: 'https://api.github.com',
  headers,
  timeout: 30000,
  retry: { limit: 3, statusCodes: [ 408, 429, 500, 502, 503, 504 ] }
} );

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  author: {
    login: string;
  } | null;
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  merged_at: string | null;
  user: {
    login: string;
  } | null;
  labels: Array<{ name: string }>;
}

async function fetchAllPages<T>(
  path: string,
  searchParams: Record<string, string>,
  page = 1,
  acc: T[] = []
): Promise<T[]> {
  const perPage = 100;
  const response = await client.get( path, {
    searchParams: { ...searchParams, page: String( page ), per_page: String( perPage ) }
  } );

  if ( response.status === 404 ) {
    throw new FatalError( `Repository not found: ${path}` );
  }

  const data = await response.json() as T[];

  if ( !Array.isArray( data ) || data.length === 0 ) {
    return acc;
  }

  acc.push( ...data );

  if ( data.length < perPage ) {
    return acc;
  }

  return fetchAllPages( path, searchParams, page + 1, acc );
}

export async function fetchCommits(
  owner: string,
  repo: string,
  since: string,
  until: string
): Promise<GitHubCommit[]> {
  return fetchAllPages<GitHubCommit>(
    `repos/${owner}/${repo}/commits`,
    { since, until }
  );
}

export async function fetchMergedPullRequests(
  owner: string,
  repo: string,
  since: string,
  until: string
): Promise<GitHubPullRequest[]> {
  const allPrs = await fetchAllPages<GitHubPullRequest>(
    `repos/${owner}/${repo}/pulls`,
    { state: 'closed', sort: 'updated', direction: 'desc' }
  );

  const sinceDate = new Date( since );
  const untilDate = new Date( until );

  return allPrs.filter( pr => {
    if ( !pr.merged_at ) {
      return false;
    }
    const mergedDate = new Date( pr.merged_at );
    return mergedDate >= sinceDate && mergedDate <= untilDate;
  } );
}

// --- Dependency audit additions ---

export interface GitHubFileContent {
  content: string;
  encoding: string;
  sha: string;
}

export interface GitHubSecurityAdvisory {
  ghsa_id: string;
  cve_id: string | null;
  severity: string;
  summary: string;
  vulnerabilities: Array<{
    package: {
      ecosystem: string;
      name: string;
    };
    vulnerable_version_range: string;
    first_patched_version: { identifier: string } | null;
  }>;
}

export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  ref: string
): Promise<GitHubFileContent> {
  const response = await client.get( `repos/${owner}/${repo}/contents/${path}`, {
    searchParams: { ref }
  } );

  if ( response.status === 404 ) {
    throw new FatalError( `File not found: ${owner}/${repo}/${path}@${ref}` );
  }

  return response.json() as Promise<GitHubFileContent>;
}

export async function fetchSecurityAdvisories(
  packageNames: string[]
): Promise<GitHubSecurityAdvisory[]> {
  const advisories: GitHubSecurityAdvisory[] = [];

  for ( const name of packageNames ) {
    try {
      const response = await client.get( 'advisories', {
        searchParams: {
          ecosystem: 'npm',
          package: name,
          per_page: '100'
        }
      } );

      const data = await response.json() as GitHubSecurityAdvisory[];
      if ( Array.isArray( data ) ) {
        advisories.push( ...data );
      }
    } catch {
      // Skip packages that fail — advisory lookup is best-effort
    }
  }

  return advisories;
}
