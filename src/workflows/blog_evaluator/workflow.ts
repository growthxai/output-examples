import { workflow } from '@outputai/core';
import { validateUrl } from '../../shared/utils/url.js';
import { fetchContent } from './steps.js';
import { evaluateSignalToNoise } from './evaluators.js';
import { createWorkflowOutput } from './utils.js';
import { workflowInputSchema, workflowOutputSchema } from './types.js';

export default workflow( {
  name: 'blog_evaluator',
  description: 'AI Agents &amp; Workflows built with Output.ai for output-examples',
  inputSchema: workflowInputSchema,
  outputSchema: workflowOutputSchema,
  fn: async input => {
    const validatedUrl = validateUrl( input.url );
    const blogContent = await fetchContent( { url: validatedUrl } );
    const evaluation = await evaluateSignalToNoise( blogContent );

    return createWorkflowOutput( blogContent, evaluation );
  },
  options: {
    activityOptions: {
      retry: {
        maximumAttempts: 3
      }
    }
  }
} );
