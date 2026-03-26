import { workflow } from '@outputai/core';
import { scoreDimension } from './evaluators.js';
import { synthesizeResults } from './steps.js';
import { workflowInputSchema, workflowOutputSchema, METHODOLOGY_DIMENSIONS } from './types.js';
import type { DimensionResult } from './types.js';

export default workflow( {
  name: 'call_scorer',
  description: 'Scores a sales call transcript against a chosen methodology (MEDDIC, BANT, or SPIN)',
  inputSchema: workflowInputSchema,
  outputSchema: workflowOutputSchema,
  fn: async ( input ) => {
    const dimensions = METHODOLOGY_DIMENSIONS[ input.methodology ];

    const evaluations = await Promise.all(
      dimensions.map( ( dimension ) =>
        scoreDimension( {
          transcript: input.transcript,
          methodology: input.methodology,
          dimension
        } )
      )
    );

    const dimensionScores: DimensionResult[] = evaluations.map( ( evaluation, i ) => ( {
      dimension: evaluation.name ?? dimensions[ i ],
      score: evaluation.value,
      confidence: evaluation.confidence,
      reasoning: evaluation.reasoning,
      feedback: evaluation.feedback
    } ) );

    const scoresText = dimensionScores.map( ( d ) =>
      `### ${d.dimension}: ${d.score}/10\n- Evidence: ${d.reasoning ?? 'N/A'}${d.feedback?.map( f => `\n- Gap: ${f.issue}${f.suggestion ? `\n- Recommendation: ${f.suggestion}` : ''}` ).join( '' ) ?? ''}`
    ).join( '\n\n' );

    const synthesis = await synthesizeResults( {
      methodology: input.methodology,
      scoresText
    } );

    const totalScore = dimensionScores.reduce( ( sum, d ) => sum + d.score, 0 );
    const maxScore = dimensions.length * 10;
    const overallScore = Math.round( ( totalScore / maxScore ) * 100 );

    return {
      methodology: input.methodology,
      overallScore,
      dimensionScores,
      gaps: synthesis.gaps,
      nextCallRecommendations: synthesis.nextCallRecommendations,
      summary: synthesis.summary
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
