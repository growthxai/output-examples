import { z } from '@outputai/core';

export const methodologyEnum = z.enum( [ 'MEDDIC', 'BANT', 'SPIN' ] );

export type Methodology = z.infer<typeof methodologyEnum>;

export const METHODOLOGY_DIMENSIONS: Record<Methodology, string[]> = {
  MEDDIC: [ 'Metrics', 'Economic Buyer', 'Decision Criteria', 'Decision Process', 'Identify Pain', 'Champion' ],
  BANT: [ 'Budget', 'Authority', 'Need', 'Timeline' ],
  SPIN: [ 'Situation', 'Problem', 'Implication', 'Need-Payoff' ]
};

export const dimensionScoreSchema = z.object( {
  dimension: z.string().describe( 'Name of the methodology dimension' ),
  score: z.number().describe( 'Score from 0-10 for this dimension' ),
  evidence: z.string().describe( 'Key quotes or moments from the transcript supporting this score' ),
  gap: z.string().optional().describe( 'What was missing or could be improved' ),
  recommendation: z.string().optional().describe( 'Specific suggestion for the next call' )
} );

export const workflowInputSchema = z.object( {
  transcript: z.string().describe( 'Full text transcript of the sales call' ),
  methodology: methodologyEnum.describe( 'Sales methodology to evaluate against' )
} );

export const synthesisOutputSchema = z.object( {
  gaps: z.array( z.string() ).describe( 'Key gaps identified across the call' ),
  nextCallRecommendations: z.array( z.string() ).describe( 'Priority recommendations for the next call (max 5)' ),
  summary: z.string().describe( 'Brief overall assessment of the call' )
} );

export const workflowOutputSchema = z.object( {
  methodology: methodologyEnum,
  overallScore: z.number().describe( 'Overall score 0-100 across all dimensions' ),
  dimensionScores: z.array( dimensionScoreSchema ),
} ).merge( synthesisOutputSchema );

export type DimensionScore = z.infer<typeof dimensionScoreSchema>;
export type SynthesisOutput = z.infer<typeof synthesisOutputSchema>;
export type WorkflowInput = z.infer<typeof workflowInputSchema>;
export type WorkflowOutput = z.infer<typeof workflowOutputSchema>;
