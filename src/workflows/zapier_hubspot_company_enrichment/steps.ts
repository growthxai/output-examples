import { step } from '@outputai/core';
import { generateText, Output } from '@outputai/llm';
import { enrichOrganization } from '../../shared/clients/apollo.js';
import { getZapierClient } from '../../shared/clients/zapier.js';
import {
  enrichCompanyInputSchema, apolloCompanySchema,
  fetchHubspotIndustriesOutputSchema,
  mapHubspotIndustryInputSchema, mapHubspotIndustryOutputSchema,
  hubspotUpsertInputSchema, hubspotUpsertOutputSchema,
  zapierHubspotResponseSchema
} from './types.js';

const HUBSPOT_CONNECTION_ID = '63213154';

function extractDomain( website: string ): string {
  if ( !website ) {
    return '';
  }
  const url = new URL( website );
  return url.hostname.replace( /^www\./, '' );
}

export const fetchHubspotIndustries = step( {
  name: 'fetch_hubspot_industries',
  description: 'Fetches available HubSpot industry field choices via Zapier SDK',
  outputSchema: fetchHubspotIndustriesOutputSchema,
  fn: async () => {
    const zapier = getZapierClient();

    const industries: { key?: string; label?: string; value?: string }[] = [];
    for await ( const item of zapier.listInputFieldChoices( {
      appKey: 'hubspot',
      actionType: 'search_or_write',
      actionKey: 'company_crmSearch',
      inputFieldKey: 'industry',
      connectionId: HUBSPOT_CONNECTION_ID
    } ).items() ) {
      industries.push( item );
    }

    return { industries };
  }
} );

export const mapHubspotIndustry = step( {
  name: 'map_hubspot_industry',
  description: 'Maps a raw industry string to a valid HubSpot industry enum value using an LLM',
  inputSchema: mapHubspotIndustryInputSchema,
  outputSchema: mapHubspotIndustryOutputSchema,
  fn: async ( { industry, hubspotIndustries } ) => {
    const choicesList = hubspotIndustries
      .map( c => c.value ?? c.key ?? c.label )
      .filter( Boolean )
      .join( ', ' );

    const { output } = await generateText( {
      prompt: 'map_hubspot_industry@v1',
      variables: { industry, hubspotIndustries: choicesList },
      output: Output.object( { schema: mapHubspotIndustryOutputSchema } )
    } );

    return output;
  }
} );

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
  inputSchema: hubspotUpsertInputSchema,
  outputSchema: hubspotUpsertOutputSchema,
  fn: async input => {
    const zapier = getZapierClient();

    const domain = input.domain ?? extractDomain( input.website ?? '' );

    const inputs = {
      first_search_property_name: 'name',
      first_search_property_value: input.name,
      name: input.name,
      domain: domain ?? '',
      website: input.website ?? '',
      city: input.city ?? '',
      country: input.country ?? '',
      industry: input.hubspotIndustry ?? '',
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

    return {
      hubspotCompanyId: record.id,
      action: record.isNew ? 'created' : 'updated' as const
    };
  }
} );
