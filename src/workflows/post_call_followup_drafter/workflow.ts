import { workflow } from '@outputai/core';
import { extractCallInsights, enrichProspect, enrichCompanyContext, draftFollowUpEmail } from './steps.js';
import { workflowInputSchema, workflowOutputSchema } from './types.js';

export default workflow( {
  name: 'post_call_followup_drafter',
  description: 'Extracts insights from a sales call transcript and drafts a personalized follow-up email',
  inputSchema: workflowInputSchema,
  outputSchema: workflowOutputSchema,
  fn: async ( input ) => {
    const insights = await extractCallInsights( { transcript: input.transcript } );

    let prospectEnrichment;
    if ( input.prospectEmail ) {
      try {
        prospectEnrichment = await enrichProspect( { email: input.prospectEmail } );
      } catch {
        // Apollo enrichment is optional — proceed without it
      }
    }

    const enrichmentUrl = input.companyUrl
      || prospectEnrichment?.organizationWebsite
      || insights.companyUrl;
    let companyContext: string | undefined;

    if ( enrichmentUrl ) {
      try {
        const context = await enrichCompanyContext( { companyUrl: enrichmentUrl } );
        const parts = [ context.description ];
        if ( context.industry ) parts.push( `Industry: ${context.industry}` );
        if ( context.products?.length ) parts.push( `Products/Services: ${context.products.join( ', ' )}` );
        companyContext = parts.join( '\n' );
      } catch {
        // Company enrichment is optional — proceed without it
      }
    }

    let enrichmentContext: string | undefined;
    if ( prospectEnrichment ) {
      const parts: string[] = [];
      if ( prospectEnrichment.title ) parts.push( `Title: ${prospectEnrichment.title}` );
      if ( prospectEnrichment.linkedinUrl ) parts.push( `LinkedIn: ${prospectEnrichment.linkedinUrl}` );
      if ( prospectEnrichment.organizationName ) parts.push( `Company: ${prospectEnrichment.organizationName}` );
      if ( prospectEnrichment.organizationIndustry ) parts.push( `Industry: ${prospectEnrichment.organizationIndustry}` );
      if ( parts.length ) enrichmentContext = parts.join( '\n' );
    }

    const email = await draftFollowUpEmail( {
      prospectName: insights.prospectName,
      prospectTitle: prospectEnrichment?.title || insights.prospectTitle,
      companyName: insights.companyName,
      painPoints: insights.painPoints,
      actionItems: insights.actionItems,
      keyTopics: insights.keyTopics,
      nextSteps: insights.nextSteps,
      tone: insights.tone,
      companyContext,
      enrichmentContext,
      senderName: input.senderName
    } );

    return {
      email,
      insights,
      prospectEnrichment
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
