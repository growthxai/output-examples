import { workflow } from '@outputai/core';
import { extractActionItems } from './steps.js';
import { workflowInputSchema, workflowOutputSchema } from './types.js';

export default workflow( {
  name: 'action_items_extractor',
  description: 'Extracts action items, owners, deadlines, and context from call transcripts',
  inputSchema: workflowInputSchema,
  outputSchema: workflowOutputSchema,
  fn: async ( input ) => {
    const extraction = await extractActionItems( { transcript: input.transcript } );

    const repItems = extraction.actionItems.filter( ( item ) => item.ownerRole === 'rep' );
    const prospectItems = extraction.actionItems.filter( ( item ) => item.ownerRole === 'prospect' );

    return {
      participants: extraction.participants,
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
