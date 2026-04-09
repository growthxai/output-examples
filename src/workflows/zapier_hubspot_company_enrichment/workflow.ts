import { workflow } from '@outputai/core';
import { enrichCompanyWithApollo, fetchHubspotIndustries, mapHubspotIndustry, upsertHubspotCompany } from './steps.js';
import { workflowInputSchema, workflowOutputSchema } from './types.js';

export default workflow( {
  name: 'zapier_company_enrichment',
  description: 'Enriches a company profile using Apollo via REST API and upserts the result into HubSpot via Zapier SDK',
  inputSchema: workflowInputSchema,
  outputSchema: workflowOutputSchema,
  fn: async input => {
    const [ apolloData, { industries } ] = await Promise.all( [
      enrichCompanyWithApollo( { website: input.website } ),
      fetchHubspotIndustries()
    ] );

    const hubspotIndustry = apolloData.industry ?
      ( await mapHubspotIndustry( {
        industry: apolloData.industry,
        hubspotIndustries: industries
      } ) ).hubspotIndustry :
      undefined;

    const { hubspotCompanyId, action } = await upsertHubspotCompany( {
      ...apolloData,
      hubspotIndustry
    } );

    return {
      companyName: apolloData.name,
      website: input.website,
      hubspotCompanyId,
      apolloData,
      action
    };
  }
} );
