import { httpClient } from '@outputai/http';

export interface JinaReaderResponse {
  code: number;
  status: number;
  data: {
    title: string;
    description: string;
    url: string;
    content: string;
    usage: { tokens: number };
  };
}

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

  /** Fetch the readable content of a URL via Jina Reader. */
  async read( url: string ): Promise<JinaReaderResponse> {
    return client.get( url ).json<JinaReaderResponse>();
  },
};
