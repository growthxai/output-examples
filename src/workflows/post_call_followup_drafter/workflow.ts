import { workflow } from '@outputai/core';
import { extractCallInsights, enrichCompanyContext, draftFollowUpEmail } from './steps.js';
import { workflowInputSchema, workflowOutputSchema } from './types.js';

export default workflow( {
  name: 'post_call_followup_drafter',
  description: 'Extracts insights from a sales call transcript and drafts a personalized follow-up email',
  inputSchema: workflowInputSchema,
  outputSchema: workflowOutputSchema,
  fn: async ( input ) => {
    const insights = await extractCallInsights( { transcript: input.transcript } );

    const enrichmentUrl = input.companyUrl || insights.companyUrl;
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

    const email = await draftFollowUpEmail( {
      prospectName: insights.prospectName,
      prospectTitle: insights.prospectTitle,
      companyName: insights.companyName,
      painPoints: insights.painPoints,
      actionItems: insights.actionItems,
      keyTopics: insights.keyTopics,
      nextSteps: insights.nextSteps,
      tone: insights.tone,
      companyContext,
      senderName: input.senderName
    } );

    return {
      email,
      insights
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
