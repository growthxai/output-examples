import { CRITICALITY, evalWorkflow, getEvalWorkflowName } from '@outputai/evals';
import {
  verifySummaryLength,
  verifyKeyMomentsCount,
  verifyTakeawaysCount,
  verifyTimestampFormat,
  verifyKeyMomentDescriptions
} from './evaluators.js';

export default evalWorkflow( {
  name: getEvalWorkflowName( 'youtube_summarizer' ),
  evals: [
    { evaluator: verifySummaryLength, criticality: CRITICALITY.REQUIRED, interpret: { type: 'boolean' } },
    { evaluator: verifyKeyMomentsCount, criticality: CRITICALITY.REQUIRED, interpret: { type: 'boolean' } },
    { evaluator: verifyTakeawaysCount, criticality: CRITICALITY.REQUIRED, interpret: { type: 'boolean' } },
    { evaluator: verifyTimestampFormat, criticality: CRITICALITY.REQUIRED, interpret: { type: 'boolean' } },
    { evaluator: verifyKeyMomentDescriptions, criticality: CRITICALITY.REQUIRED, interpret: { type: 'boolean' } }
  ]
} );
