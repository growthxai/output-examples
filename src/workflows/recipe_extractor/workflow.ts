import { workflow } from '@outputai/core';
import { fetchRecipePage, extractRecipe } from './steps.js';
import { workflowInputSchema, workflowOutputSchema } from './types.js';

export default workflow( {
  name: 'recipe_extractor',
  description: 'Extracts structured recipe data from a blog post URL, cutting through narrative content to find the recipe details',
  inputSchema: workflowInputSchema,
  outputSchema: workflowOutputSchema,
  fn: async ( { url } ) => {
    const page = await fetchRecipePage( { url } );
    const recipe = await extractRecipe( { title: page.title, content: page.content } );

    return { recipe };
  },
  options: {
    activityOptions: {
      retry: {
        maximumAttempts: 3
      }
    }
  }
} );
