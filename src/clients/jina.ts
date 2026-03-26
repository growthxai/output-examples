import { FatalError, ValidationError } from '@outputai/core';
import { httpClient } from '@outputai/http';

export interface JinaReaderResponse {
  code: number;
  status: number;
  data: {
    title: string;
    description: string;
    url: string;
    content: string;
    usage: { tokens: number; };
  };
}

const jinaClient = httpClient( {
  prefixUrl: 'https://r.jina.ai',
  timeout: 30000,
  retry: { limit: 3, statusCodes: [ 408, 429, 500, 502, 503, 504 ] }
} );

export async function fetchBlogContent( url: string ): Promise<JinaReaderResponse> {
  try {
    const response = await jinaClient.post( '', {
      json: { url },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Return-Format': 'markdown'
      }
    } );
    return response.json() as Promise<JinaReaderResponse>;
  } catch ( error: unknown ) {
    const err = error as { status?: number; message?: string };
    if ( err.status === 401 || err.status === 403 ) {
      throw new FatalError( `Jina auth failed: ${err.message}` );
    }
    if ( err.status === 404 ) {
      throw new FatalError( `Page not found: ${url}` );
    }
    throw new ValidationError( `Jina request failed: ${err.message}` );
  }
}
