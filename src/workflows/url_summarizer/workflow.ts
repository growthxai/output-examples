import { workflow } from '@outputai/core';
import { validateUrl } from '../../shared/utils/url.js';
import { fetchContent, summarizeContent } from './steps.js';
import { workflowInputSchema, workflowOutputSchema } from './types.js';

export default workflow( {
  name: 'url_summarizer',
  description: 'Scrapes any URL and produces a clean summary with key points, FAQ, and TLDR',
  inputSchema: workflowInputSchema,
  outputSchema: workflowOutputSchema,
  fn: async ( input ) => {
    const validatedUrl = validateUrl( input.url );
    const pageContent = await fetchContent( { url: validatedUrl } );
    const summary = await summarizeContent( {
      title: pageContent.title,
      content: pageContent.content
    } );

    return {
      url: pageContent.url,
      title: pageContent.title,
      tldr: summary.tldr,
      keyPoints: summary.keyPoints,
      faq: summary.faq
    };
  },
  options: {
    activityOptions: {
      retry: {
        maximumAttempts: 3
      }
    }
  }
} );
