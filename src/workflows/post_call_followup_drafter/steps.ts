import { step, FatalError } from '@outputai/core';
import { generateText, Output } from '@outputai/llm';
import { JinaClient } from '../../clients/jina.js';
import { matchPerson } from '../../shared/clients/apollo.js';
import {
  callInsightsSchema,
  companyContextSchema,
  followUpEmailSchema,
  prospectEnrichmentSchema,
  extractCallInsightsInputSchema,
  enrichProspectInputSchema,
  enrichCompanyContextInputSchema,
  draftFollowUpEmailInputSchema
} from './types.js';

export const extractCallInsights = step( {
  name: 'extract_call_insights',
  description: 'Extract action items, pain points, and key details from a sales call transcript',
  inputSchema: extractCallInsightsInputSchema,
  outputSchema: callInsightsSchema,
  fn: async ( { transcript } ) => {
    const { output } = await generateText( {
      prompt: 'extract_insights@v1',
      variables: { transcript },
      output: Output.object( { schema: callInsightsSchema } )
    } );

    if ( !output ) {
      throw new FatalError( 'Failed to extract insights from transcript' );
    }

    return output;
  }
} );

export const enrichProspect = step( {
  name: 'enrich_prospect',
  description: 'Enrich prospect profile using Apollo People Match API',
  inputSchema: enrichProspectInputSchema,
  outputSchema: prospectEnrichmentSchema,
  fn: async ( { email } ) => {
    const result = await matchPerson( { email } );

    const p = result.person;
    if ( !p ) {
      return {
        email
      };
    }

    return {
      firstName: p.first_name || undefined,
      lastName: p.last_name || undefined,
      title: p.title ?? undefined,
      email: p.email ?? email,
      linkedinUrl: p.linkedin_url ?? undefined,
      organizationName: p.organization?.name ?? undefined,
      organizationWebsite: p.organization?.website_url ?? undefined,
      organizationIndustry: p.organization?.industry ?? undefined
    };
  }
} );

export const enrichCompanyContext = step( {
  name: 'enrich_company_context',
  description: 'Scrape company website for context using Jina Reader',
  inputSchema: enrichCompanyContextInputSchema,
  outputSchema: companyContextSchema,
  fn: async ( { companyUrl } ) => {
    const result = await JinaClient.readDetailed( companyUrl );

    const content = result.content;
    const title = result.title;

    const { output } = await generateText( {
      prompt: 'summarize_company@v1',
      variables: { title, content },
      output: Output.object( { schema: companyContextSchema } )
    } );

    if ( !output ) {
      return {
        description: title || 'Company website content unavailable',
        products: [],
        industry: undefined
      };
    }

    return output;
  }
} );

export const draftFollowUpEmail = step( {
  name: 'draft_follow_up_email',
  description: 'Draft a personalized follow-up email based on call insights and company context',
  inputSchema: draftFollowUpEmailInputSchema,
  outputSchema: followUpEmailSchema,
  fn: async input => {
    const painPointsText = input.painPoints.map( p => `- ${p}` ).join( '\n' );
    const actionItemsText = input.actionItems.map( item => {
      const base = `- ${item.description} (Owner: ${item.owner})`;
      return item.deadline ? `${base} — by ${item.deadline}` : base;
    } ).join( '\n' );
    const keyTopicsText = input.keyTopics.map( t => `- ${t}` ).join( '\n' );

    const { output } = await generateText( {
      prompt: 'draft_followup@v1',
      variables: {
        prospectName: input.prospectName,
        prospectTitle: input.prospectTitle || '',
        companyName: input.companyName,
        painPoints: painPointsText,
        actionItems: actionItemsText,
        keyTopics: keyTopicsText,
        nextSteps: input.nextSteps || '',
        companyContext: input.companyContext || '',
        enrichmentContext: input.enrichmentContext || '',
        tone: input.tone,
        senderName: input.senderName || ''
      },
      output: Output.object( { schema: followUpEmailSchema } )
    } );

    if ( !output ) {
      throw new FatalError( 'Failed to draft follow-up email' );
    }

    return output;
  }
} );
