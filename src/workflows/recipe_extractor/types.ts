import { z } from '@outputai/core';

export const workflowInputSchema = z.object( {
  url: z.string().url().describe( 'The URL of a blog post containing a recipe' )
} );

export const recipeSchema = z.object( {
  title: z.string().describe( 'The recipe title' ),
  description: z.string().optional().describe( 'A brief 1-2 sentence description' ),
  prepTime: z.string().optional().describe( 'Preparation time, e.g. "15 minutes"' ),
  cookTime: z.string().optional().describe( 'Cooking time, e.g. "30 minutes"' ),
  totalTime: z.string().optional().describe( 'Total time, e.g. "45 minutes"' ),
  servings: z.string().optional().describe( 'Number of servings, e.g. "4 servings"' ),
  ingredients: z.array( z.object( {
    quantity: z.string().optional().describe( 'Amount, e.g. "1/2"' ),
    unit: z.string().optional().describe( 'Unit of measurement, e.g. "cup"' ),
    item: z.string().describe( 'The ingredient name' ),
    notes: z.string().optional().describe( 'Preparation notes, e.g. "diced", "melted"' )
  } ) ).describe( 'List of ingredients' ),
  instructions: z.array( z.string() ).describe( 'Step-by-step instructions' )
} );

export const workflowOutputSchema = z.object( {
  recipe: recipeSchema
} );

export type WorkflowInput = z.infer<typeof workflowInputSchema>;
export type WorkflowOutput = z.infer<typeof workflowOutputSchema>;
export type Recipe = z.infer<typeof recipeSchema>;
