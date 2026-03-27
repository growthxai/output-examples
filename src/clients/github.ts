import { FatalError } from '@outputai/core';
import { httpClient } from '@outputai/http';
import { credentials } from '@outputai/credentials';

const token = credentials.get( 'github.token' );

const headers: Record<string, string> = {
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28'
};

if ( token ) {
  headers[ 'Authorization' ] = `Bearer ${token}`;
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

async function fetchAllPages<T>( path: string, searchParams: Record<string, string> ): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  const perPage = 100;

  while ( true ) {
    const response = await client.get( path, {
      searchParams: { ...searchParams, page: String( page ), per_page: String( perPage ) }
    } );

    if ( response.status === 404 ) {
      throw new FatalError( `Repository not found: ${path}` );
    }

    const data = await response.json() as T[];

    if ( !Array.isArray( data ) || data.length === 0 ) {
      break;
    }

    results.push( ...data );

    if ( data.length < perPage ) {
      break;
    }

    page++;
  }

  return results;
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
    if ( !pr.merged_at ) return false;
    const mergedDate = new Date( pr.merged_at );
    return mergedDate >= sinceDate && mergedDate <= untilDate;
  } );
}
