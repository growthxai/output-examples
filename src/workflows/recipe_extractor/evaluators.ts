import { evaluator, EvaluationBooleanResult } from '@outputai/core';
import { recipeSchema } from './types.js';

export const evaluateRecipeCompleteness = evaluator( {
  name: 'evaluate_recipe_completeness',
  description: 'Check if extracted recipe has all essential fields',
  inputSchema: recipeSchema,
  fn: async ( recipe ) => {
    const checks = [
      { field: 'title', present: !!recipe.title, weight: 0.2 },
      { field: 'ingredients', present: recipe.ingredients.length > 0, weight: 0.35 },
      { field: 'instructions', present: recipe.instructions.length > 0, weight: 0.35 },
      { field: 'cookTime', present: !!recipe.cookTime, weight: 0.1 }
    ];

    const score = checks.reduce( ( sum, c ) => sum + ( c.present ? c.weight : 0 ), 0 );
    const missing = checks.filter( c => !c.present ).map( c => c.field );

    return new EvaluationBooleanResult( {
      value: score >= 0.9,
      confidence: score,
      reasoning: missing.length === 0
        ? 'All essential recipe fields present'
        : `Missing fields: ${missing.join( ', ' )}`
    } );
  }
} );
