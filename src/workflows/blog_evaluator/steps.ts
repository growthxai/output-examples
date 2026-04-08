import { step, z } from '@outputai/core';
import { JinaClient } from '../../clients/jina.js';

const blogContentSchema = z.object( {
  title: z.string(),
  url: z.string(),
  content: z.string(),
  tokenCount: z.number()
} );

export const fetchContent = step( {
  name: 'fetch_blog_content',
  description: 'Fetch blog content from URL using Jina Reader API',
  inputSchema: z.object( {
    url: z.string().url()
  } ),
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
