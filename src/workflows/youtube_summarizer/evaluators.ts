import { evaluator, EvaluationNumberResult, z } from '@outputai/core';
import type { EvaluationResultArgs } from '@outputai/core';
import { generateText, Output } from '@outputai/llm';
import { keyMomentSchema, evaluateSummaryQualityInputSchema } from './types.js';

export const evaluateSummaryQuality = evaluator( {
  name: 'evaluate_summary_quality',
  description: 'Score how well the summary captures the video content (1-10)',
  inputSchema: evaluateSummaryQualityInputSchema,
  fn: async input => {
    const { output } = await generateText( {
      prompt: 'evaluate_summary@v1',
      variables: {
        transcript: input.transcript,
        summary: input.summary,
        keyMoments: JSON.stringify( input.keyMoments, null, 2 ),
        takeaways: JSON.stringify( input.takeaways, null, 2 )
      },
      output: Output.object( { schema: EvaluationNumberResult.schema } )
    } );
    return new EvaluationNumberResult( output as EvaluationResultArgs<number> );
  }
} );
