import { workflow } from '@outputai/core';
import { scoreDimension, synthesizeResults } from './steps.js';
import { workflowInputSchema, workflowOutputSchema, METHODOLOGY_DIMENSIONS } from './types.js';

export default workflow( {
  name: 'call_scorer',
  description: 'Scores a sales call transcript against a chosen methodology (MEDDIC, BANT, or SPIN)',
  inputSchema: workflowInputSchema,
  outputSchema: workflowOutputSchema,
  fn: async ( input ) => {
    const dimensions = METHODOLOGY_DIMENSIONS[ input.methodology ];

    const dimensionScores = await Promise.all(
      dimensions.map( ( dimension ) =>
        scoreDimension( {
          transcript: input.transcript,
          methodology: input.methodology,
          dimension
        } )
      )
    );

    const synthesis = await synthesizeResults( {
      methodology: input.methodology,
      dimensionScores
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
