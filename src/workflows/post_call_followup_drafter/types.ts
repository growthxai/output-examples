import { z } from '@outputai/core';

export const actionItemSchema = z.object( {
  description: z.string().describe( 'What needs to be done' ),
  owner: z.enum( [ 'rep', 'prospect', 'both' ] ).describe( 'Who is responsible' ),
  deadline: z.string().optional().describe( 'Any mentioned timeline' )
} );

export const callInsightsSchema = z.object( {
  prospectName: z.string().describe( 'Name of the prospect on the call' ),
  prospectTitle: z.string().optional().describe( 'Job title if mentioned' ),
  companyName: z.string().describe( 'Company name of the prospect' ),
  companyUrl: z.string().optional().describe( 'Company website if mentioned or inferable' ),
  actionItems: z.array( actionItemSchema ).describe( 'Action items from the call' ),
  painPoints: z.array( z.string() ).describe( 'Pain points or challenges mentioned' ),
  keyTopics: z.array( z.string() ).describe( 'Main topics discussed' ),
  nextSteps: z.string().optional().describe( 'Agreed next steps' ),
  tone: z.enum( [ 'formal', 'casual', 'technical' ] ).describe( 'Conversational tone to match in follow-up' )
} );

export const companyContextSchema = z.object( {
  description: z.string().describe( 'Brief description of what the company does' ),
  products: z.array( z.string() ).optional().describe( 'Key products or services' ),
  industry: z.string().optional().describe( 'Industry or sector' )
} );

export const followUpEmailSchema = z.object( {
  subject: z.string().describe( 'Email subject line' ),
  body: z.string().describe( 'Full email body text' )
} );

export const workflowInputSchema = z.object( {
  transcript: z.string().describe( 'Sales call transcript text' ),
  companyUrl: z.string().url().optional().describe( 'Optional company website URL for enrichment' ),
  senderName: z.string().optional().describe( 'Name of the sales rep sending the follow-up' )
} );

export const workflowOutputSchema = z.object( {
  email: followUpEmailSchema,
  insights: callInsightsSchema
} );

export type ActionItem = z.infer<typeof actionItemSchema>;
export type CallInsights = z.infer<typeof callInsightsSchema>;
export type CompanyContext = z.infer<typeof companyContextSchema>;
export type FollowUpEmail = z.infer<typeof followUpEmailSchema>;
export type WorkflowInput = z.infer<typeof workflowInputSchema>;
export type WorkflowOutput = z.infer<typeof workflowOutputSchema>;
