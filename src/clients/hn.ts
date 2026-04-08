import { FatalError } from '@outputai/core';
import { httpClient } from '@outputai/http';

const client = httpClient( {
  prefixUrl: 'https://hacker-news.firebaseio.com/v0',
  timeout: 15_000,
  retry: { limit: 2 },
} );

export const HnClient = {

  /** Fetch up to `limit` top story IDs (default 500). */
  async getTopStoryIds( limit = 500 ): Promise<number[]> {
    const ids = await client.get( 'topstories.json' ).json<number[]>();
    return ids.slice( 0, limit );
  },

  /** Fetch a single item by ID. Returns null on failure. */
  async getItem( id: number ): Promise<Record<string, unknown> | null> {
    try {
      return await client.get( `item/${ id }.json` ).json();
    } catch {
      return null;
    }
  },
};
