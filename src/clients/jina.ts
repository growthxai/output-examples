import { httpClient } from '@outputai/http';

const client = httpClient( {
  prefixUrl: 'https://r.jina.ai',
  timeout: 30_000,
  retry: { limit: 2 },
  headers: {
    Accept: 'application/json',
    'X-Return-Format': 'markdown'
  }
} );

export const JinaClient = {

  /** Fetch the readable content of a URL via Jina Reader. Returns markdown. */
  async read( url: string ): Promise<string> {
    const response = await client.get( url ).json<{ data: { content: string } }>();
    return response.data.content;
  },

  /** Fetch content with full metadata (title, url, token count). */
  async readDetailed( url: string ): Promise<{ title: string; url: string; content: string; tokens: number }> {
    const response = await client.get( url ).json<{
      data: { title: string; url: string; content: string; usage: { tokens: number } }
    }>();
    return {
      title: response.data.title,
      url: response.data.url,
      content: response.data.content,
      tokens: response.data.usage.tokens
    };
  }
};
