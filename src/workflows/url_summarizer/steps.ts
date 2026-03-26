import { step, z } from '@outputai/core';
import { generateText, Output } from '@outputai/llm';
import { fetchBlogContent } from '../../clients/jina.js';
import { urlContentSchema, summarySchema } from './types.js';

export const fetchContent = step( {
  name: 'fetch_url_content',
  description: 'Fetch page content from URL using Jina Reader API',
  inputSchema: z.object( {
    url: z.string().url()
  } ),
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
  inputSchema: z.object( {
    title: z.string(),
    content: z.string()
  } ),
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
