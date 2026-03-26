import { step, z } from '@outputai/core';
import { generateText, Output } from '@outputai/llm';
import { methodologyEnum, synthesisOutputSchema } from './types.js';
import type { SynthesisOutput } from './types.js';

export const synthesizeResults = step( {
  name: 'synthesize_results',
  description: 'Synthesize dimension scores into overall assessment',
  inputSchema: z.object( {
    methodology: methodologyEnum,
    scoresText: z.string()
  } ),
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
