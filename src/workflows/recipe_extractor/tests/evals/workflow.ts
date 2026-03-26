import { evalWorkflow } from '@outputai/evals';
import { hasTitle, hasIngredients, hasInstructions, hasCookTime } from './evaluators.js';

export default evalWorkflow( {
  name: 'recipe_extractor_eval',
  evals: [
    {
      evaluator: hasTitle,
      criticality: 'required',
      interpret: { type: 'boolean' }
    },
    {
      evaluator: hasIngredients,
      criticality: 'required',
      interpret: { type: 'boolean' }
    },
    {
      evaluator: hasInstructions,
      criticality: 'required',
      interpret: { type: 'boolean' }
    },
    {
      evaluator: hasCookTime,
      criticality: 'informational',
      interpret: { type: 'verdict' }
    }
  ]
} );
