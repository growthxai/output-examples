import type { ChangeEntry } from './types.js';

export function parseGitHubUrl( url: string ): { owner: string; repo: string } {
  const match = url.match( /github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/|$)/ );

  if ( !match ) {
    throw new Error( `Invalid GitHub URL: ${url}` );
  }

  return { owner: match[ 1 ], repo: match[ 2 ] };
}

export function formatChangelog(
  repo: string,
  startDate: string,
  endDate: string,
  features: ChangeEntry[],
  fixes: ChangeEntry[],
  breakingChanges: ChangeEntry[],
  other: ChangeEntry[]
): string {
  const lines: string[] = [];

  lines.push( `# Changelog: ${repo}` );
  lines.push( `> ${startDate} to ${endDate}` );
  lines.push( '' );

  if ( breakingChanges.length > 0 ) {
    lines.push( '## Breaking Changes' );
    for ( const entry of breakingChanges ) {
      lines.push( `- ${entry.title} (${entry.reference})` );
    }
    lines.push( '' );
  }

  if ( features.length > 0 ) {
    lines.push( '## Features' );
    for ( const entry of features ) {
      lines.push( `- ${entry.title} (${entry.reference})` );
    }
    lines.push( '' );
  }

  if ( fixes.length > 0 ) {
    lines.push( '## Fixes' );
    for ( const entry of fixes ) {
      lines.push( `- ${entry.title} (${entry.reference})` );
    }
    lines.push( '' );
  }

  if ( other.length > 0 ) {
    lines.push( '## Other Changes' );
    for ( const entry of other ) {
      lines.push( `- ${entry.title} (${entry.reference})` );
    }
    lines.push( '' );
  }

  if ( features.length + fixes.length + breakingChanges.length + other.length === 0 ) {
    lines.push( '_No changes found in the specified date range._' );
    lines.push( '' );
  }

  return lines.join( '\n' );
}

export function groupEntries( entries: ChangeEntry[] ): {
  features: ChangeEntry[];
  fixes: ChangeEntry[];
  breakingChanges: ChangeEntry[];
  other: ChangeEntry[];
} {
  return {
    features: entries.filter( e => e.category === 'feature' ),
    fixes: entries.filter( e => e.category === 'fix' ),
    breakingChanges: entries.filter( e => e.category === 'breaking_change' ),
    other: entries.filter( e =>
      e.category === 'chore' || e.category === 'docs' || e.category === 'refactor'
    )
  };
}
