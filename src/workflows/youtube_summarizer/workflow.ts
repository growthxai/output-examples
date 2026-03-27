import { workflow } from '@outputai/core';
import { fetchTranscript, summarizeTranscript } from './steps.js';
import { workflowInputSchema, workflowOutputSchema } from './types.js';
import { extractVideoId } from './utils.js';

export default workflow({
  name: 'youtube_summarizer',
  description: 'Fetches YouTube transcript and generates summary with key moments and takeaways',
  inputSchema: workflowInputSchema,
  outputSchema: workflowOutputSchema,
  fn: async (input) => {
    const videoId = extractVideoId(input.url);
    const transcript = await fetchTranscript({ videoId });
    return summarizeTranscript({
      videoId,
      title: transcript.title,
      transcript: transcript.segments
    });
  },
  options: {
    activityOptions: {
      retry: {
        maximumAttempts: 3
      }
    }
  }
});
