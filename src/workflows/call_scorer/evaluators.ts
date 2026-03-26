import { evaluator, EvaluationNumberResult } from '@outputai/core';
import type { EvaluationResultArgs } from '@outputai/core';
import { generateText, Output } from '@outputai/llm';
import { scoreDimensionInputSchema } from './types.js';

const DIMENSION_DESCRIPTIONS: Record<string, Record<string, string>> = {
  MEDDIC: {
    Metrics: 'Quantifiable measures of economic benefit the customer expects',
    'Economic Buyer': 'Person with authority and budget to make the purchase decision',
    'Decision Criteria': 'The formal criteria used to evaluate vendors and solutions',
    'Decision Process': 'The steps and approvals needed to finalize the purchase',
    'Identify Pain': 'The specific business pain or challenge driving the need',
    Champion: 'Internal advocate who sells on your behalf within the organization'
  },
  BANT: {
    Budget: 'Whether the prospect has allocated funds for a solution',
    Authority: 'Whether the person on the call can make or influence the purchase decision',
    Need: 'Whether a genuine business need or pain point has been established',
    Timeline: 'Whether there is a defined timeline or urgency for implementing a solution'
  },
  SPIN: {
    Situation: 'Background questions about the prospect\'s current state and context',
    Problem: 'Questions that uncover specific difficulties and dissatisfactions',
    Implication: 'Questions exploring the consequences and effects of the problems',
    'Need-Payoff': 'Questions about the value and usefulness of a solution'
  }
};

export const scoreDimension = evaluator( {
  name: 'score_dimension',
  description: 'Score a single methodology dimension against a call transcript',
  inputSchema: scoreDimensionInputSchema,
  fn: async ( { transcript, methodology, dimension } ) => {
    const dimensionDescription = DIMENSION_DESCRIPTIONS[ methodology ]?.[ dimension ] ?? '';

    const { output } = await generateText( {
      prompt: 'score_dimension@v1',
      variables: {
        transcript,
        methodology,
        dimension,
        dimensionDescription
      },
      output: Output.object( { schema: EvaluationNumberResult.schema } )
    } );

    return new EvaluationNumberResult( output as EvaluationResultArgs<number> );
  }
} );
