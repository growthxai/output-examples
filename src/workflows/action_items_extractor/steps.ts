import { step, z } from '@outputai/core';
import { generateText, Output } from '@outputai/llm';
import { extractionResultSchema } from './types.js';
import type { ExtractionResult } from './types.js';

export const extractActionItems = step( {
  name: 'extract_action_items',
  description: 'Extract action items, participants, and summary from a call transcript using LLM',
  inputSchema: z.object( {
    transcript: z.string()
  } ),
  outputSchema: extractionResultSchema,
  fn: async ( { transcript } ): Promise<ExtractionResult> => {
    const { output } = await generateText( {
      prompt: 'extract_actions@v1',
      variables: { transcript },
      output: Output.object( { schema: extractionResultSchema } )
    } );

    return output as ExtractionResult;
  }
} );
