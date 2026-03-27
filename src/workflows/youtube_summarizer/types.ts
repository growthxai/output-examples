import { z } from '@outputai/core';

export const transcriptSegmentSchema = z.object({
  start: z.number().describe('Start time in seconds'),
  duration: z.number().describe('Duration in seconds'),
  text: z.string()
});

export const transcriptSchema = z.object({
  title: z.string(),
  segments: z.array(transcriptSegmentSchema)
});

export const fetchTranscriptInputSchema = z.object({ videoId: z.string() });

export const summarizeInputSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  transcript: z.array(transcriptSegmentSchema)
});

export const keyMomentSchema = z.object({
  timestamp: z.string().describe('MM:SS or HH:MM:SS'),
  title: z.string(),
  description: z.string()
});

export const summaryOutputSchema = z.object({
  summary: z.string().describe('2-3 sentence TLDR'),
  keyMoments: z.array(keyMomentSchema).describe('5-10 key moments with timestamps'),
  takeaways: z.array(z.string()).describe('3-7 actionable takeaways')
});

export const workflowInputSchema = z.object({
  url: z.string().url().describe('YouTube video URL')
});

export const workflowOutputSchema = z.object({
  videoId: z.string(),
  title: z.string()
}).merge(summaryOutputSchema);

export type TranscriptSegment = z.infer<typeof transcriptSegmentSchema>;
export type Transcript = z.infer<typeof transcriptSchema>;
export type SummaryOutput = z.infer<typeof summaryOutputSchema>;
export type WorkflowInput = z.infer<typeof workflowInputSchema>;
export type WorkflowOutput = z.infer<typeof workflowOutputSchema>;
