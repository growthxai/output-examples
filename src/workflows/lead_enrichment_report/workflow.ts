import { workflow } from '@outputai/core';
import { enrichPerson, scrapeCompanyWebsite, classifyPersona, generateIcebreakers } from './steps.js';
import { workflowInputSchema, workflowOutputSchema } from './types.js';

export default workflow( {
  name: 'lead_enrichment_report',
  description: 'Enriches a lead with professional profile, company context, persona classification, and personalized icebreakers',
  inputSchema: workflowInputSchema,
  outputSchema: workflowOutputSchema,
  fn: async ( input ) => {
    const person = await enrichPerson( {
      email: input.email,
      linkedinUrl: input.linkedinUrl
    } );

    let companyContext;
    if ( person.organizationWebsite ) {
      try {
        companyContext = await scrapeCompanyWebsite( {
          websiteUrl: person.organizationWebsite
        } );
      } catch {
        // Non-fatal: continue without company website context
      }
    }

    const persona = await classifyPersona( {
      person,
      companyContext: companyContext?.websiteContent
    } );

    const { icebreakers } = await generateIcebreakers( {
      person,
      persona,
      companyContext: companyContext?.websiteContent
    } );

    return {
      person,
      companyContext,
      persona,
      icebreakers
    };
  },
  options: {
    activityOptions: {
      retry: {
        maximumAttempts: 3
      }
    }
  }
} );
