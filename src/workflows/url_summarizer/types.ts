import { z } from '@outputai/core';

export const urlContentSchema = z.object( {
  title: z.string(),
  url: z.string(),
  content: z.string(),
  tokenCount: z.number()
} );

export const faqItemSchema = z.object( {
  question: z.string(),
  answer: z.string()
} );

export const summarySchema = z.object( {
  tldr: z.string().describe( 'A one or two sentence TLDR of the page content' ),
  keyPoints: z.array( z.string() ).describe( 'List of key points extracted from the content' ),
  faq: z.array( faqItemSchema ).describe( 'FAQ section generated from the content' )
} );

export const fetchContentInputSchema = z.object( {
  url: z.string().url()
} );

export const summarizeContentInputSchema = z.object( {
  title: z.string(),
  content: z.string()
} );

export const workflowInputSchema = z.object( {
  url: z.string().url().describe( 'URL of the page to summarize' )
} );

export const workflowOutputSchema = z.object( {
  url: z.string(),
  title: z.string()
} ).merge( summarySchema );

export type UrlContent = z.infer<typeof urlContentSchema>;
export type Summary = z.infer<typeof summarySchema>;
export type WorkflowInput = z.infer<typeof workflowInputSchema>;
export type WorkflowOutput = z.infer<typeof workflowOutputSchema>;
