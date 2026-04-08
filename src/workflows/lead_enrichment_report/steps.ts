import { step } from '@outputai/core';
import { generateText, Output } from '@outputai/llm';
import { matchPerson } from '../../shared/clients/apollo.js';
import { JinaClient } from '../../clients/jina.js';
import {
  personProfileSchema,
  companyContextSchema,
  personaClassificationSchema,
  enrichPersonInputSchema,
  scrapeCompanyWebsiteInputSchema,
  classifyPersonaInputSchema,
  generateIcebreakersInputSchema,
  generateIcebreakersOutputSchema
} from './types.js';

function formatEmployeeCount( count: number ): string {
  if ( count < 10 ) {
    return '1-10';
  }
  if ( count < 50 ) {
    return '11-50';
  }
  if ( count < 200 ) {
    return '51-200';
  }
  if ( count < 1000 ) {
    return '201-1000';
  }
  if ( count < 5000 ) {
    return '1001-5000';
  }
  return '5000+';
}

export const enrichPerson = step( {
  name: 'enrich_person',
  description: 'Enrich a lead using Apollo People Match API',
  inputSchema: enrichPersonInputSchema,
  outputSchema: personProfileSchema,
  fn: async input => {
    const result = await matchPerson( {
      email: input.email,
      linkedinUrl: input.linkedinUrl
    } );

    if ( !result.person ) {
      throw new Error( 'No person found for the given input' );
    }

    const p = result.person;
    const org = p.organization;

    return {
      firstName: p.first_name ?? '',
      lastName: p.last_name ?? '',
      title: p.title ?? undefined,
      email: p.email ?? undefined,
      linkedinUrl: p.linkedin_url ?? undefined,
      city: p.city ?? undefined,
      state: p.state ?? undefined,
      country: p.country ?? undefined,
      organizationName: org?.name ?? undefined,
      organizationWebsite: org?.website_url ?? undefined,
      organizationIndustry: org?.industry ?? undefined,
      organizationSize: org?.estimated_num_employees ?
        formatEmployeeCount( org.estimated_num_employees ) :
        undefined
    };
  }
} );

export const scrapeCompanyWebsite = step( {
  name: 'scrape_company_website',
  description: 'Scrape company website for additional context using Jina Reader',
  inputSchema: scrapeCompanyWebsiteInputSchema,
  outputSchema: companyContextSchema,
  fn: async ( { websiteUrl } ) => {
    const result = await JinaClient.readDetailed( websiteUrl );
    return {
      websiteContent: result.content.slice( 0, 5000 ),
      websiteUrl
    };
  }
} );

export const classifyPersona = step( {
  name: 'classify_persona',
  description: 'Classify the lead into a buyer persona using LLM',
  inputSchema: classifyPersonaInputSchema,
  outputSchema: personaClassificationSchema,
  fn: async input => {
    const { output } = await generateText( {
      prompt: 'classify_persona@v1',
      variables: {
        name: `${ input.person.firstName } ${ input.person.lastName }`,
        title: input.person.title ?? 'Unknown',
        company: input.person.organizationName ?? 'Unknown',
        industry: input.person.organizationIndustry ?? 'Unknown',
        companyContext: input.companyContext ?? 'No additional context available'
      },
      output: Output.object( { schema: personaClassificationSchema } )
    } );

    return output;
  }
} );

export const generateIcebreakers = step( {
  name: 'generate_icebreakers',
  description: 'Generate personalized icebreakers for the lead',
  inputSchema: generateIcebreakersInputSchema,
  outputSchema: generateIcebreakersOutputSchema,
  fn: async input => {
    const { output } = await generateText( {
      prompt: 'generate_icebreakers@v1',
      variables: {
        name: `${ input.person.firstName } ${ input.person.lastName }`,
        title: input.person.title ?? 'Unknown',
        company: input.person.organizationName ?? 'Unknown',
        industry: input.person.organizationIndustry ?? 'Unknown',
        location: [ input.person.city, input.person.state, input.person.country ]
          .filter( Boolean )
          .join( ', ' ) || 'Unknown',
        persona: input.persona.persona,
        personaReasoning: input.persona.reasoning,
        companyContext: input.companyContext ?? 'No additional context available'
      },
      output: Output.object( {
        schema: generateIcebreakersOutputSchema
      } )
    } );

    return output;
  }
} );
