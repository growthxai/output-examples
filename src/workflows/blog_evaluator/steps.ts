import { step } from '@outputai/core';
import { JinaClient } from '../../clients/jina.js';
import { workflowInputSchema, blogContentSchema } from './types.js';

export const fetchContent = step( {
  name: 'fetch_blog_content',
  description: 'Fetch blog content from URL using Jina Reader API',
  inputSchema: workflowInputSchema,
  outputSchema: blogContentSchema,
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
