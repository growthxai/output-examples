import { FatalError, ValidationError } from '@outputai/core';
import { httpClient } from '@outputai/http';
import { credentials } from '@outputai/credentials';

let _client: ReturnType<typeof httpClient> | null = null;

function getClient(): ReturnType<typeof httpClient> {
  if ( !_client ) {
    const apiKey = credentials.require( 'apollo.api_key' ) as string;
    _client = httpClient( {
      prefixUrl: 'https://api.apollo.io/api/v1',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      },
      timeout: 30000,
      retry: { limit: 3, statusCodes: [ 408, 429, 500, 502, 503, 504 ] }
    } );
  }
  return _client;
}

export interface ApolloPersonMatch {
  person: {
    first_name: string;
    last_name: string;
    title: string | null;
    email: string | null;
    linkedin_url: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    organization: {
      name: string | null;
      website_url: string | null;
      industry: string | null;
      estimated_num_employees: number | null;
    } | null;
  } | null;
}

export async function matchPerson( params: { email?: string; linkedinUrl?: string } ): Promise<ApolloPersonMatch> {
  const body: Record<string, string> = {};
  if ( params.email ) body.email = params.email;
  if ( params.linkedinUrl ) body.linkedin_url = params.linkedinUrl;

  try {
    const response = await getClient().post( 'people/match', { json: body } );
    return response.json() as Promise<ApolloPersonMatch>;
  } catch ( error: unknown ) {
    const err = error as { status?: number; message?: string };
    if ( err.status === 401 || err.status === 403 ) {
      throw new FatalError( `Apollo auth failed: ${ err.message }` );
    }
    if ( err.status === 404 || err.status === 422 ) {
      throw new FatalError( `Apollo person not found: ${ err.message }` );
    }
    throw new ValidationError( `Apollo request failed: ${ err.message }` );
  }
}
