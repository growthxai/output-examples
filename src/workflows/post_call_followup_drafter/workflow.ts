import { workflow } from '@outputai/core';
import { extractCallInsights, enrichProspect, enrichCompanyContext, draftFollowUpEmail } from './steps.js';
import { workflowInputSchema, workflowOutputSchema } from './types.js';

export default workflow( {
  name: 'post_call_followup_drafter',
  description: 'Extracts insights from a sales call transcript and drafts a personalized follow-up email',
  inputSchema: workflowInputSchema,
  outputSchema: workflowOutputSchema,
  fn: async input => {
    const insights = await extractCallInsights( { transcript: input.transcript } );

    const prospectEnrichment = input.prospectEmail ?
      await enrichProspect( { email: input.prospectEmail } )
        .catch( () => undefined as undefined ) :
      undefined;

    const enrichmentUrl = input.companyUrl ||
      prospectEnrichment?.organizationWebsite ||
      insights.companyUrl;

    const companyContext: string | undefined = enrichmentUrl ?
      await enrichCompanyContext( { companyUrl: enrichmentUrl } )
        .then( context => {
          const parts = [ context.description ];
          if ( context.industry ) {
            parts.push( `Industry: ${context.industry}` );
          }
          if ( context.products?.length ) {
            parts.push( `Products/Services: ${context.products.join( ', ' )}` );
          }
          return parts.join( '\n' );
        } )
        .catch( () => undefined as undefined ) :
      undefined;

    const enrichmentParts: string[] = [];
    if ( prospectEnrichment?.title ) {
      enrichmentParts.push( `Title: ${prospectEnrichment.title}` );
    }
    if ( prospectEnrichment?.linkedinUrl ) {
      enrichmentParts.push( `LinkedIn: ${prospectEnrichment.linkedinUrl}` );
    }
    if ( prospectEnrichment?.organizationName ) {
      enrichmentParts.push( `Company: ${prospectEnrichment.organizationName}` );
    }
    if ( prospectEnrichment?.organizationIndustry ) {
      enrichmentParts.push( `Industry: ${prospectEnrichment.organizationIndustry}` );
    }
    const enrichmentContext: string | undefined = enrichmentParts.length ?
      enrichmentParts.join( '\n' ) :
      undefined;

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
