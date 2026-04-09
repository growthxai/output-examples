import { workflow } from '@outputai/core';
import { enrichCompanyWithApollo, upsertHubspotCompany } from './steps.js';
import { workflowInputSchema, workflowOutputSchema } from './types.js';

export default workflow( {
  name: 'zapier_company_enrichment',
  description: 'Enriches a company profile using Apollo via REST API and upserts the result into HubSpot via Zapier SDK',
  inputSchema: workflowInputSchema,
  outputSchema: workflowOutputSchema,
  fn: async input => {
    const apolloData = await enrichCompanyWithApollo( {
      website: input.website
    } );

    const { hubspotCompanyId, action } = await upsertHubspotCompany( apolloData );

    return {
      companyName: apolloData.name,
      website: input.website,
      hubspotCompanyId,
      apolloData,
      action
    };
  }
} );
