import { FatalError } from '@outputai/core';

export function parseGitHubUrl( url: string ): { owner: string; repo: string } {
  const match = url.match( /github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/|$)/ );

  if ( !match ) {
    throw new FatalError( `Invalid GitHub URL: ${url}` );
  }

  return { owner: match[1], repo: match[2] };
}
