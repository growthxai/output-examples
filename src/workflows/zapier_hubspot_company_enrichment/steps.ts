import { step } from '@outputai/core';
import { enrichOrganization } from '../../shared/clients/apollo.js';
import { createZapierClient } from '../../shared/clients/zapier.js';
import { enrichCompanyInputSchema, apolloCompanySchema, hubspotUpsertOutputSchema, zapierHubspotResponseSchema } from './types.js';

const HUBSPOT_CONNECTION_ID = '63210713';

function extractDomain( website: string ): string {
  const url = new URL( website );
  return url.hostname.replace( /^www\./, '' );
}

function toHubspotIndustry( industry: string ): string {
  return industry
    .toUpperCase()
    .replace( /&/g, 'AND' )
    .replace( /[^A-Z0-9]+/g, '_' )
    .replace( /^_|_$/g, '' );
}

export const enrichCompanyWithApollo = step( {
  name: 'enrich_company_with_apollo',
  description: 'Enriches company data using Apollo REST API directly',
  inputSchema: enrichCompanyInputSchema,
  outputSchema: apolloCompanySchema,
  fn: async ( { website } ) => {
    const domain = extractDomain( website );
    const org = await enrichOrganization( domain );

    if ( !org?.name ) {
      throw new Error( `Apollo returned no data for domain: ${ domain }` );
    }

    return {
      name: org.name,
      website: org.website_url ?? website,
      domain: org.primary_domain ?? domain,
      industry: org.industry ?? undefined,
      employeeCount: org.estimated_num_employees ?? undefined,
      estimatedRevenue: org.annual_revenue_printed ?? undefined,
      description: org.short_description ?? undefined,
      linkedinUrl: org.linkedin_url ?? undefined,
      city: org.city ?? undefined,
      country: org.country ?? undefined,
      keywords: Array.isArray( org.keywords ) ? org.keywords : undefined,
      totalFunding: org.total_funding ?? undefined,
      latestFundingRound: org.latest_funding_round_date ?? undefined,
      fundingStage: org.latest_funding_stage ?? undefined
    };
  }
} );

export const upsertHubspotCompany = step( {
  name: 'upsert_hubspot_company',
  description: 'Creates or updates a HubSpot company record using enriched Apollo data via Zapier SDK',
  inputSchema: apolloCompanySchema,
  outputSchema: hubspotUpsertOutputSchema,
  fn: async input => {
    const zapier = createZapierClient();

    const domain = input.domain ?? extractDomain( input.website ?? '' );

    const inputs = {
      first_search_property_name: 'name',
      first_search_property_value: input.name,
      name: input.name,
      domain: domain ?? '',
      website: input.website ?? '',
      city: input.city ?? '',
      country: input.country ?? '',
      industry: input.industry ? toHubspotIndustry( input.industry ) : '',
      numberofemployees: input.employeeCount ? String( input.employeeCount ) : '',
      description: input.description ?? '',
      linkedin_company_page: input.linkedinUrl ?? '',
      total_money_raised: input.totalFunding ? String( input.totalFunding ) : ''
    };

    const { data: result } = await zapier.apps.hubspot.search_or_write.company_crmSearch( {
      inputs,
      connectionId: HUBSPOT_CONNECTION_ID
    } );

    const [ record ] = zapierHubspotResponseSchema.parse( result );

    return hubspotUpsertOutputSchema.parse( {
      hubspotCompanyId: record.id,
      action: record.isNew ? 'created' : 'updated'
    } );
  }
} );
