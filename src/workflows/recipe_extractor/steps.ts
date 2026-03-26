import { step, z } from '@outputai/core';
import { generateText, Output } from '@outputai/llm';
import { fetchBlogContent } from '../../clients/jina.js';
import { recipeSchema } from './types.js';

export const fetchRecipePage = step( {
  name: 'fetch_recipe_page',
  description: 'Fetch the blog post content from a URL using Jina Reader',
  inputSchema: z.object( {
    url: z.string().url()
  } ),
  outputSchema: z.object( {
    title: z.string(),
    content: z.string()
  } ),
  fn: async ( { url } ) => {
    const response = await fetchBlogContent( url );
    return {
      title: response.data.title,
      content: response.data.content
    };
  }
} );

export const extractRecipe = step( {
  name: 'extract_recipe',
  description: 'Extract structured recipe data from blog post content using an LLM',
  inputSchema: z.object( {
    title: z.string(),
    content: z.string()
  } ),
  outputSchema: recipeSchema,
  fn: async ( { title, content } ) => {
    const { output } = await generateText( {
      prompt: 'extract_recipe',
      variables: { title, content },
      output: Output.object( {
        schema: recipeSchema
      } )
    } );

    return output;
  }
} );
