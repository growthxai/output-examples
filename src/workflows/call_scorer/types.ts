import { z } from '@outputai/core';

export const methodologyEnum = z.enum( [ 'MEDDIC', 'BANT', 'SPIN' ] );

export type Methodology = z.infer<typeof methodologyEnum>;

export const METHODOLOGY_DIMENSIONS: Record<Methodology, string[]> = {
  MEDDIC: [ 'Metrics', 'Economic Buyer', 'Decision Criteria', 'Decision Process', 'Identify Pain', 'Champion' ],
  BANT: [ 'Budget', 'Authority', 'Need', 'Timeline' ],
  SPIN: [ 'Situation', 'Problem', 'Implication', 'Need-Payoff' ]
};

export const workflowInputSchema = z.object( {
  transcript: z.string().describe( 'Full text transcript of the sales call' ),
  methodology: methodologyEnum.describe( 'Sales methodology to evaluate against' )
} );

export const dimensionResultSchema = z.object( {
  dimension: z.string().describe( 'Name of the methodology dimension' ),
  score: z.number().describe( 'Score from 0-10 for this dimension' ),
  confidence: z.number().describe( 'Confidence in the evaluation 0-1' ),
  reasoning: z.string().optional().describe( 'Evidence from the transcript supporting the score' ),
  feedback: z.array( z.object( {
    issue: z.string(),
    suggestion: z.string().optional(),
    reference: z.string().optional(),
    priority: z.enum( [ 'low', 'medium', 'high', 'critical' ] ).optional()
  } ) ).optional().describe( 'Gaps and recommendations for this dimension' )
} );

export const synthesisOutputSchema = z.object( {
  gaps: z.array( z.string() ).describe( 'Key gaps identified across the call' ),
  nextCallRecommendations: z.array( z.string() ).describe( 'Priority recommendations for the next call (max 5)' ),
  summary: z.string().describe( 'Brief overall assessment of the call' )
} );

export const workflowOutputSchema = z.object( {
  methodology: methodologyEnum,
  overallScore: z.number().describe( 'Overall score 0-100 across all dimensions' ),
  dimensionScores: z.array( dimensionResultSchema )
} ).merge( synthesisOutputSchema );

export type DimensionResult = z.infer<typeof dimensionResultSchema>;
export type SynthesisOutput = z.infer<typeof synthesisOutputSchema>;
export type WorkflowInput = z.infer<typeof workflowInputSchema>;
export type WorkflowOutput = z.infer<typeof workflowOutputSchema>;
