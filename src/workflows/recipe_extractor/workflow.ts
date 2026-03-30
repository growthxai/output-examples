import { workflow } from '@outputai/core';
import { validateUrl } from '../../shared/utils/url.js';
import { fetchContent, extractRecipe } from './steps.js';
import { workflowInputSchema, workflowOutputSchema } from './types.js';

export default workflow( {
  name: 'recipe_extractor',
  description: 'Scrapes a recipe blog URL and extracts clean recipe data: ingredients with measurements, step-by-step instructions, and cook time',
  inputSchema: workflowInputSchema,
  outputSchema: workflowOutputSchema,
  fn: async input => {
    const validatedUrl = validateUrl( input.url );
    const pageContent = await fetchContent( { url: validatedUrl } );
    const recipe = await extractRecipe( pageContent );

    return recipe;
  },
  options: {
    activityOptions: {
      retry: {
        maximumAttempts: 3
      }
    }
  }
} );
