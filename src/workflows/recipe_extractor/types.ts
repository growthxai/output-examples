import { z } from '@outputai/core';

export const workflowInputSchema = z.object( {
  url: z.string().url().describe( 'URL of the recipe blog post to extract from' )
} );

export const ingredientSchema = z.object( {
  name: z.string().describe( 'Ingredient name' ),
  quantity: z.string().describe( 'Amount needed' ),
  unit: z.string().optional().describe( 'Unit of measurement' ),
  notes: z.string().optional().describe( 'Preparation notes (e.g., "chopped", "room temperature")' )
} );

export const recipeSchema = z.object( {
  title: z.string().describe( 'Recipe title' ),
  description: z.string().optional().describe( 'Brief recipe description' ),
  prepTime: z.string().optional().describe( 'Preparation time' ),
  cookTime: z.string().optional().describe( 'Cook time' ),
  totalTime: z.string().optional().describe( 'Total time' ),
  servings: z.string().optional().describe( 'Number of servings' ),
  ingredients: z.array( ingredientSchema ).describe( 'List of ingredients with measurements' ),
  instructions: z.array( z.string() ).describe( 'Step-by-step cooking instructions' )
} );

export const workflowOutputSchema = recipeSchema;

export const scrapedContentSchema = z.object( {
  title: z.string(),
  url: z.string(),
  content: z.string(),
  tokenCount: z.number()
} );

export const fetchContentInputSchema = z.object( {
  url: z.string().url().describe( 'URL of the recipe page to fetch' )
} );

export type FetchContentInput = z.infer<typeof fetchContentInputSchema>;
export type WorkflowInput = z.infer<typeof workflowInputSchema>;
export type WorkflowOutput = z.infer<typeof workflowOutputSchema>;
export type Ingredient = z.infer<typeof ingredientSchema>;
export type Recipe = z.infer<typeof recipeSchema>;
export type ScrapedContent = z.infer<typeof scrapedContentSchema>;
