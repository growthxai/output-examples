import { step } from '@outputai/core';
import { generateText, Output } from '@outputai/llm';
import { fetchYouTubeTranscript } from '../../clients/youtube.js';
import { fetchTranscriptInputSchema, transcriptSchema, summarizeInputSchema, summaryOutputSchema, workflowOutputSchema } from './types.js';
import { formatTimestamp } from './utils.js';

export const fetchTranscript = step( {
  name: 'fetch_transcript',
  description: 'Fetch video transcript and title from YouTube',
  inputSchema: fetchTranscriptInputSchema,
  outputSchema: transcriptSchema,
  fn: async ( { videoId } ) => fetchYouTubeTranscript( videoId )
} );

export const summarizeTranscript = step( {
  name: 'summarize_transcript',
  description: 'Generate structured summary with key moments and takeaways',
  inputSchema: summarizeInputSchema,
  outputSchema: workflowOutputSchema,
  fn: async ( { videoId, title, transcript } ) => {
    const formattedTranscript = transcript
      .map( segment => `[${formatTimestamp( segment.start )}] ${segment.text}` )
      .join( '\n' );

    const { output } = await generateText( {
      prompt: 'summarize@v1',
      variables: { title, transcript: formattedTranscript },
      output: Output.object( { schema: summaryOutputSchema } )
    } );

    return { videoId, title, ...output };
  }
} );
