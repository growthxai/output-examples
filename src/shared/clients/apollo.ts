import { FatalError, ValidationError } from '@outputai/core';
import { httpClient } from '@outputai/http';
import { credentials } from '@outputai/credentials';

const clientHolder: { value: ReturnType<typeof httpClient> | null } = { value: null };

function getClient(): ReturnType<typeof httpClient> {
  if ( !clientHolder.value ) {
    const apiKey = credentials.require( 'apollo.api_key' ) as string;
    clientHolder.value = httpClient( {
      prefixUrl: 'https://api.apollo.io/api/v1',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      },
      timeout: 30000,
      retry: { limit: 3, statusCodes: [ 408, 429, 500, 502, 503, 504 ] }
    } );
  }
  return clientHolder.value;
}

export interface ApolloOrganization {
  name: string;
  website_url?: string;
  primary_domain?: string;
  industry?: string;
  estimated_num_employees?: number;
  annual_revenue_printed?: string;
  short_description?: string;
  linkedin_url?: string;
  city?: string;
  country?: string;
  keywords?: string[];
  total_funding?: number;
  latest_funding_round_date?: string;
  latest_funding_stage?: string;
}

export async function enrichOrganization( domain: string ): Promise<ApolloOrganization | null> {
  try {
    const response = await getClient().post( 'organizations/enrich', { json: { domain } } );
    const body = await response.json() as { organization: ApolloOrganization | null };
    return body.organization ?? null;
  } catch ( error: unknown ) {
    const err = error as { status?: number; message?: string };
    if ( err.status === 401 || err.status === 403 ) {
      throw new FatalError( `Apollo auth failed: ${ err.message }` );
    }
    if ( err.status === 404 || err.status === 422 ) {
      return null;
    }
    throw new ValidationError( `Apollo request failed: ${ err.message }` );
  }
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
  if ( params.email ) {
    body.email = params.email;
  }
  if ( params.linkedinUrl ) {
    body.linkedin_url = params.linkedinUrl;
  }

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
