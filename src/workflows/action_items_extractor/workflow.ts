import { workflow } from '@outputai/core';
import { extractActionItems, enrichParticipants } from './steps.js';
import { workflowInputSchema, workflowOutputSchema } from './types.js';

export default workflow( {
  name: 'action_items_extractor',
  description: 'Extracts action items, owners, deadlines, and context from call transcripts',
  inputSchema: workflowInputSchema,
  outputSchema: workflowOutputSchema,
  fn: async input => {
    const extraction = await extractActionItems( { transcript: input.transcript } );

    const hasEmails = extraction.participants.some( p => p.email );

    const enrichedParticipantList = hasEmails ?
      await ( async () => {
        try {
          const enrichment = await enrichParticipants( { participants: extraction.participants } );
          return enrichment.participants;
        } catch {
          return extraction.participants;
        }
      } )() :
      extraction.participants;

    const repItems = extraction.actionItems.filter( item => item.ownerRole === 'rep' );
    const prospectItems = extraction.actionItems.filter( item => item.ownerRole === 'prospect' );

    return {
      participants: enrichedParticipantList,
      actionItems: extraction.actionItems,
      callSummary: extraction.callSummary,
      totalActionItems: extraction.actionItems.length,
      repActionItems: repItems.length,
      prospectActionItems: prospectItems.length
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
