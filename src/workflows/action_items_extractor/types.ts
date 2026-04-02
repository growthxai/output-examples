import { z } from '@outputai/core';

export const actionItemSchema = z.object( {
  description: z.string().describe( 'Clear description of what needs to be done' ),
  owner: z.string().describe( 'Name of the person responsible for this action item' ),
  ownerRole: z.enum( [ 'rep', 'prospect', 'unknown' ] ).describe( 'Which side of the call the owner is on' ),
  deadline: z.string().nullable().describe( 'Deadline mentioned, or null if none specified' ),
  priority: z.enum( [ 'high', 'medium', 'low' ] ).describe( 'Priority based on urgency and context' ),
  context: z.string().describe( 'Relevant excerpt or context from the transcript' )
} );

export const participantSchema = z.object( {
  name: z.string().describe( 'Name of the participant' ),
  role: z.enum( [ 'rep', 'prospect', 'unknown' ] ).describe( 'Role in the call' ),
  email: z.string().nullable().optional().describe( 'Email if mentioned in transcript' ),
  company: z.string().nullable().optional().describe( 'Company if mentioned in transcript' )
} );

export const enrichedParticipantSchema = participantSchema.extend( {
  title: z.string().optional().describe( 'Job title from enrichment' ),
  linkedinUrl: z.string().optional().describe( 'LinkedIn URL from enrichment' ),
  organizationName: z.string().optional().describe( 'Organization name from enrichment' ),
  organizationIndustry: z.string().optional().describe( 'Industry from enrichment' )
} );

export const extractionResultSchema = z.object( {
  participants: z.array( participantSchema ).describe( 'All participants identified in the call' ),
  actionItems: z.array( actionItemSchema ).describe( 'All action items extracted from the transcript' ),
  callSummary: z.string().describe( 'Brief 2-3 sentence summary of the call' )
} );

export const workflowInputSchema = z.object( {
  transcript: z.string().describe( 'Full call transcript text' )
} );

export const workflowOutputSchema = z.object( {
  participants: z.array( enrichedParticipantSchema ),
  actionItems: z.array( actionItemSchema ),
  callSummary: z.string(),
  totalActionItems: z.number(),
  repActionItems: z.number(),
  prospectActionItems: z.number()
} );

export type ActionItem = z.infer<typeof actionItemSchema>;
export type Participant = z.infer<typeof participantSchema>;
export type EnrichedParticipant = z.infer<typeof enrichedParticipantSchema>;
export type ExtractionResult = z.infer<typeof extractionResultSchema>;
export type WorkflowInput = z.infer<typeof workflowInputSchema>;
export type WorkflowOutput = z.infer<typeof workflowOutputSchema>;
