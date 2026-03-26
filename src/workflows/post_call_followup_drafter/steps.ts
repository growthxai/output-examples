import { step, z, FatalError } from '@outputai/core';
import { generateText, Output } from '@outputai/llm';
import { fetchBlogContent } from '../../clients/jina.js';
import { callInsightsSchema, companyContextSchema, followUpEmailSchema } from './types.js';

export const extractCallInsights = step( {
  name: 'extract_call_insights',
  description: 'Extract action items, pain points, and key details from a sales call transcript',
  inputSchema: z.object( {
    transcript: z.string()
  } ),
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

export const enrichCompanyContext = step( {
  name: 'enrich_company_context',
  description: 'Scrape company website for context using Jina Reader',
  inputSchema: z.object( {
    companyUrl: z.string().url()
  } ),
  outputSchema: companyContextSchema,
  fn: async ( { companyUrl } ) => {
    const response = await fetchBlogContent( companyUrl );

    const content = response.data.content;
    const title = response.data.title;

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
  inputSchema: z.object( {
    prospectName: z.string(),
    prospectTitle: z.string().optional(),
    companyName: z.string(),
    painPoints: z.array( z.string() ),
    actionItems: z.array( z.object( {
      description: z.string(),
      owner: z.enum( [ 'rep', 'prospect', 'both' ] ),
      deadline: z.string().optional()
    } ) ),
    keyTopics: z.array( z.string() ),
    nextSteps: z.string().optional(),
    tone: z.enum( [ 'formal', 'casual', 'technical' ] ),
    companyContext: z.string().optional(),
    senderName: z.string().optional()
  } ),
  outputSchema: followUpEmailSchema,
  fn: async ( input ) => {
    const painPointsText = input.painPoints.map( p => `- ${p}` ).join( '\n' );
    const actionItemsText = input.actionItems.map( item => {
      let text = `- ${item.description} (Owner: ${item.owner})`;
      if ( item.deadline ) text += ` — by ${item.deadline}`;
      return text;
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
