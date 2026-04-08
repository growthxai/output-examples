import { step } from '@outputai/core';
import { generateText, Output } from '@outputai/llm';
import { JinaClient } from '../../clients/jina.js';
import { fetchContentInputSchema, scrapedContentSchema, recipeSchema } from './types.js';
import type { ScrapedContent, Recipe } from './types.js';

export const fetchContent = step( {
  name: 'fetch_recipe_page',
  description: 'Fetch recipe page content from URL using Jina Reader API',
  inputSchema: fetchContentInputSchema,
  outputSchema: scrapedContentSchema,
  fn: async ( { url } ) => {
    const result = await JinaClient.readDetailed( url );
    return {
      title: result.title,
      url: result.url,
      content: result.content,
      tokenCount: result.tokens
    };
  }
} );

export const extractRecipe = step( {
  name: 'extract_recipe',
  description: 'Extract structured recipe data from scraped page content using LLM',
  inputSchema: scrapedContentSchema,
  outputSchema: recipeSchema,
  fn: async ( input: ScrapedContent ) => {
    const { output } = await generateText( {
      prompt: 'extract_recipe@v1',
      variables: {
        title: input.title,
        content: input.content
      },
      output: Output.object( { schema: recipeSchema } )
    } );

    return output as Recipe;
  }
} );
