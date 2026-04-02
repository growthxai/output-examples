import { step } from '@outputai/core';
import { generateText, Output } from '@outputai/llm';
import { synthesizeResultsInputSchema, synthesisOutputSchema } from './types.js';
import type { SynthesisOutput } from './types.js';

export const synthesizeResults = step( {
  name: 'synthesize_results',
  description: 'Synthesize dimension scores into overall assessment',
  inputSchema: synthesizeResultsInputSchema,
  outputSchema: synthesisOutputSchema,
  fn: async ( { methodology, scoresText } ) => {
    const { output } = await generateText( {
      prompt: 'synthesize@v1',
      variables: {
        methodology,
        scoresText
      },
      output: Output.object( { schema: synthesisOutputSchema } )
    } );

    return output as SynthesisOutput;
  }
} );
