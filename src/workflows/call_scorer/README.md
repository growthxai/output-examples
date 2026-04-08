# Call Scorer Workflow

Scores a sales call transcript against a chosen methodology (MEDDIC, BANT, or SPIN), returning per-dimension scores, gap analysis, and next-call recommendations.

## Overview

This workflow accepts a sales call transcript and a methodology choice, then fans out LLM evaluations in parallel — one per methodology dimension. Each dimension is scored independently with evidence and feedback. The individual scores are then synthesized into an overall assessment with prioritized recommendations for the next call. Pure LLM workflow with no external API dependencies.

### Orchestration Flow

```
workflow.ts
│
├─ 1. scoreDimension({ ... }) x N      — evaluators: parallel LLM scoring per dimension (I/O in activity)
└─ 2. synthesizeResults({ ... })        — step: LLM synthesis of all scores (I/O in activity)
```

## Files

| File | Purpose |
|------|---------|
| `workflow.ts` | Workflow orchestration — fans out parallel dimension evaluations, computes overall score |
| `steps.ts` | `synthesizeResults` — LLM synthesis of dimension scores into gaps and recommendations |
| `evaluators.ts` | `scoreDimension` — LLM-powered evaluator for a single methodology dimension |
| `types.ts` | Zod schemas, TypeScript types, and `METHODOLOGY_DIMENSIONS` mapping |
| `prompts/score_dimension@v1.prompt` | Per-dimension scoring prompt |
| `prompts/synthesize@v1.prompt` | Overall synthesis prompt |
| `scenarios/` | Test input scenarios (2 variants) |

## Input Schema

```json
{
  "transcript": "Rep: Hi Jane, thanks for taking the time today...",
  "methodology": "MEDDIC"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `transcript` | `string` | Full text transcript of the sales call |
| `methodology` | `enum` | Sales methodology to evaluate against: `MEDDIC`, `BANT`, or `SPIN` |

### Methodology Dimensions

| Methodology | Dimensions |
|-------------|------------|
| MEDDIC | Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion |
| BANT | Budget, Authority, Need, Timeline |
| SPIN | Situation, Problem, Implication, Need-Payoff |

## Output Schema

```json
{
  "methodology": "MEDDIC",
  "overallScore": 68,
  "dimensionScores": [
    {
      "dimension": "Metrics",
      "score": 7,
      "confidence": 0.85,
      "reasoning": "Prospect mentioned '15 hours a week' on manual reporting...",
      "feedback": [
        {
          "issue": "No ROI projection discussed",
          "suggestion": "Quantify potential time savings in dollar terms",
          "priority": "medium"
        }
      ]
    }
  ],
  "gaps": [
    "Decision process not fully mapped — no clarity on approval steps"
  ],
  "nextCallRecommendations": [
    "Set up a technical deep-dive with the internal champion (Mike)",
    "Map the full decision process and approval chain with Jane"
  ],
  "summary": "Strong discovery call with good pain identification and champion engagement. Key gaps remain around decision process clarity and quantified metrics."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `methodology` | `enum` | The methodology used for evaluation |
| `overallScore` | `number` | Aggregate score 0-100 across all dimensions |
| `dimensionScores` | `array` | Per-dimension score (0-10), confidence, reasoning, and feedback |
| `gaps` | `array` | Key gaps identified across the entire call |
| `nextCallRecommendations` | `array` | Priority recommendations for the next call (max 5) |
| `summary` | `string` | Brief overall assessment of the call |

## Prerequisites

- An `ANTHROPIC_API_KEY` configured in credentials (used by `claude-haiku-4-5` for dimension scoring and synthesis)

## Usage

### Run with scenario files

```bash
# Start dev services
npx output dev

# Run with a scenario
npx output workflow run call_scorer --scenario happy_path
npx output workflow run call_scorer --scenario bant_example
```

### Run with custom input

```bash
npx output workflow run call_scorer --input '{"transcript": "Rep: Hi...", "methodology": "SPIN"}'
```

## Resources

- [Output.ai Documentation](https://docs.output.ai)
- [Temporal Documentation](https://docs.temporal.io)
