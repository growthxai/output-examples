import { z } from '@outputai/core';

// --- Atomic schemas reused across steps ---

export const HnStorySchema = z.object( {
  id: z.number(),
  title: z.string(),
  url: z.string().optional(),
  score: z.number(),
  descendants: z.number().default( 0 ),
} );

export type HnStory = z.infer<typeof HnStorySchema>;

export const ScoredStorySchema = z.object( {
  id: z.number(),
  title: z.string(),
  url: z.string(),
  score: z.number(),
  descendants: z.number(),
  relevanceScore: z.number().min( 0 ).max( 10 )
    .describe( 'How relevant this story is to the reader profile, 0-10' ),
  reason: z.string()
    .describe( 'One-sentence explanation of why this story was selected' ),
} );

export type ScoredStory = z.infer<typeof ScoredStorySchema>;

export const TakeawaySchema = z.object( {
  boldTerm: z.string().describe( 'Short bolded leading term, 1-4 words' ),
  detail: z.string().describe( 'The rest of the takeaway sentence' ),
} );

export type Takeaway = z.infer<typeof TakeawaySchema>;

export const AnalyzedArticleSchema = z.object( {
  id: z.number(),
  title: z.string(),
  url: z.string(),
  hnUrl: z.string(),
  score: z.number(),
  descendants: z.number(),
  relevanceScore: z.number(),
  tldr: z.string().describe( 'One-sentence TL;DR of the article' ),
  takeaways: z.array( TakeawaySchema ).min( 3 ).max( 5 )
    .describe( 'Key takeaways with bolded leading terms' ),
} );

export type AnalyzedArticle = z.infer<typeof AnalyzedArticleSchema>;

// --- Workflow Input / Output ---

export const inputSchema = z.object( {
  profile: z.string().min( 10 )
    .describe( 'Freeform markdown describing the reader and their interests' ),
} );

export const outputSchema = z.object( {
  storiesScanned: z.number(),
  storiesSelected: z.number(),
  articles: z.array( AnalyzedArticleSchema ),
  html: z.string(),
  beehiivPostId: z.string(),
} );

export type WorkflowInput = z.infer<typeof inputSchema>;
export type WorkflowOutput = z.infer<typeof outputSchema>;

// --- Step Input / Output Schemas ---

export const FetchTopStoriesInputSchema = z.object( {} );
export const FetchTopStoriesOutputSchema = z.object( {
  stories: z.array( HnStorySchema ),
} );

export const ScoreStoriesInputSchema = z.object( {
  profile: z.string(),
  stories: z.array( HnStorySchema ),
} );
export const ScoreStoriesOutputSchema = z.object( {
  picks: z.array( ScoredStorySchema ),
} );

export const FetchAndAnalyzeArticleInputSchema = z.object( {
  profile: z.string(),
  story: ScoredStorySchema,
} );
export const FetchAndAnalyzeArticleOutputSchema = z.object( {
  article: AnalyzedArticleSchema,
} );

export const RenderHtmlInputSchema = z.object( {
  articles: z.array( AnalyzedArticleSchema ),
  storiesScanned: z.number(),
} );
export const RenderHtmlOutputSchema = z.object( {
  html: z.string(),
} );

export const PublishToBeehiivInputSchema = z.object( {
  html: z.string(),
  title: z.string(),
} );
export const PublishToBeehiivOutputSchema = z.object( {
  postId: z.string(),
} );
