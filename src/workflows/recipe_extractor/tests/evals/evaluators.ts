import { verify, Verdict } from '@outputai/evals';
import { z } from '@outputai/core';
import { workflowInputSchema, workflowOutputSchema } from '../../types.js';

export const hasTitle = verify(
  {
    name: 'has_title',
    input: workflowInputSchema,
    output: workflowOutputSchema
  },
  ( { output, context } ) => {
    const minLength = Number( context.ground_truth.min_length ?? 3 );
    return Verdict.gte( output.recipe.title.length, minLength );
  }
);

export const hasIngredients = verify(
  {
    name: 'has_ingredients',
    input: workflowInputSchema,
    output: workflowOutputSchema
  },
  ( { output, context } ) => {
    const minCount = Number( context.ground_truth.min_count ?? 5 );
    return Verdict.gte( output.recipe.ingredients.length, minCount );
  }
);

export const hasInstructions = verify(
  {
    name: 'has_instructions',
    input: workflowInputSchema,
    output: workflowOutputSchema
  },
  ( { output, context } ) => {
    const minCount = Number( context.ground_truth.min_count ?? 3 );
    return Verdict.gte( output.recipe.instructions.length, minCount );
  }
);

export const hasCookTime = verify(
  {
    name: 'has_cook_time',
    input: workflowInputSchema,
    output: workflowOutputSchema
  },
  ( { output } ) => {
    return output.recipe.cookTime
      ? Verdict.pass( 'Cook time is present' )
      : Verdict.fail( 'Cook time is missing' );
  }
);
