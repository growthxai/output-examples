import { httpClient } from '@outputai/http';

const client = httpClient( {
  prefixUrl: 'https://r.jina.ai',
  timeout: 30_000,
  retry: { limit: 2 },
  headers: {
    'Accept': 'application/json',
    'X-Return-Format': 'markdown',
  },
} );

export const JinaClient = {

  /** Fetch the readable content of a URL via Jina Reader. Returns markdown. */
  async read( url: string ): Promise<string> {
    const response = await client.get( url ).json<{ data: { content: string } }>();
    return response.data.content;
  },
};
