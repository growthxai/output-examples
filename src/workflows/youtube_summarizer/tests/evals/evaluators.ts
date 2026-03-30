import { EvaluationBooleanResult } from '@outputai/core';
import { Verdict, verify } from '@outputai/evals';
import { workflowInputSchema, workflowOutputSchema } from '../../types.js';
import type { WorkflowOutput } from '../../types.js';

type KeyMoment = WorkflowOutput['keyMoments'][number];

function requireNumber( groundTruth: Record<string, unknown>, key: string ): EvaluationBooleanResult | null {
  const v = groundTruth[key];
  if ( typeof v === 'number' ) {
    return null;
  }
  return new EvaluationBooleanResult( {
    value: false,
    confidence: 1,
    reasoning: `ground_truth.${key} must be a number`
  } );
}

/** Summary meets minimum character length */
export const verifySummaryLength = verify(
  {
    name: 'verify_summary_length',
    input: workflowInputSchema,
    output: workflowOutputSchema
  },
  ( { output, context } ) => {
    const missing = requireNumber( context.ground_truth, 'summaryMinLength' );
    if ( missing ) {
      return missing;
    }
    const min = context.ground_truth.summaryMinLength as number;
    return Verdict.gte( output.summary.length, min );
  }
);

/** Output contains minimum number of key moments */
export const verifyKeyMomentsCount = verify(
  {
    name: 'verify_key_moments_count',
    input: workflowInputSchema,
    output: workflowOutputSchema
  },
  ( { output, context } ) => {
    const missing = requireNumber( context.ground_truth, 'minKeyMoments' );
    if ( missing ) {
      return missing;
    }
    const min = context.ground_truth.minKeyMoments as number;
    return Verdict.gte( output.keyMoments.length, min );
  }
);

/** Output contains minimum number of takeaways */
export const verifyTakeawaysCount = verify(
  {
    name: 'verify_takeaways_count',
    input: workflowInputSchema,
    output: workflowOutputSchema
  },
  ( { output, context } ) => {
    const missing = requireNumber( context.ground_truth, 'minTakeaways' );
    if ( missing ) {
      return missing;
    }
    const min = context.ground_truth.minTakeaways as number;
    return Verdict.gte( output.takeaways.length, min );
  }
);

/** Key moments contain valid timestamps when required */
export const verifyTimestampFormat = verify(
  {
    name: 'verify_timestamp_format',
    input: workflowInputSchema,
    output: workflowOutputSchema
  },
  ( { output, context } ) => {
    const should = context.ground_truth.shouldContainTimestamp;
    if ( should !== true ) {
      return Verdict.isTrue( true );
    }
    const pattern = /^\d+:\d{2}(:\d{2})?$/;
    const invalid = output.keyMoments.filter( ( m: KeyMoment ) => !pattern.test( m.timestamp ) );
    return Verdict.isTrue( invalid.length === 0 );
  }
);

/** All key moments have non-empty title and description */
export const verifyKeyMomentDescriptions = verify(
  {
    name: 'verify_key_moment_descriptions',
    input: workflowInputSchema,
    output: workflowOutputSchema
  },
  ( { output } ) => {
    const empty = output.keyMoments.filter( ( m: KeyMoment ) => !m.title.trim() || !m.description.trim() );
    return Verdict.isTrue( empty.length === 0 );
  }
);
