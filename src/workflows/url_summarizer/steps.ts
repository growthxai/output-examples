import { step } from '@outputai/core';
import { generateText, Output } from '@outputai/llm';
import { fetchBlogContent } from '../../clients/jina.js';
import { fetchContentInputSchema, urlContentSchema, summarizeContentInputSchema, summarySchema } from './types.js';

export const fetchContent = step( {
  name: 'fetch_url_content',
  description: 'Fetch page content from URL using Jina Reader API',
  inputSchema: fetchContentInputSchema,
  outputSchema: urlContentSchema,
  fn: async ( { url } ) => {
    const response = await fetchBlogContent( url );
    return {
      title: response.data.title,
      url: response.data.url,
      content: response.data.content,
      tokenCount: response.data.usage.tokens
    };
  }
} );

export const summarizeContent = step( {
  name: 'summarize_content',
  description: 'Generate structured summary with key points, FAQ, and TLDR',
  inputSchema: summarizeContentInputSchema,
  outputSchema: summarySchema,
  fn: async ( { title, content } ) => {
    const { output } = await generateText( {
      prompt: 'summarize@v1',
      variables: { title, content },
      output: Output.object( { schema: summarySchema } )
    } );

    return output;
  }
} );
