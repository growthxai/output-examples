# Blog Evaluator Workflow

Fetches a blog post by URL and evaluates its signal-to-noise ratio, returning a score, confidence level, and actionable feedback.

## Overview

This workflow accepts a blog post URL, fetches the content using the Jina Reader API, then runs an LLM-powered evaluator to assess the signal-to-noise ratio of the article. The evaluator scores content on a 0-100 scale and provides prioritized feedback on issues like filler, redundancy, or lack of substance.

### Orchestration Flow

```
workflow.ts
│
├─ 1. validateUrl(url)                   — in workflow (deterministic; not I/O)
├─ 2. fetchContent({ url })              — step: scrape blog via Jina Reader (I/O in activity)
└─ 3. evaluateSignalToNoise(blogContent) — evaluator: LLM scoring (I/O in activity)
```

## Files

| File | Purpose |
|------|---------|
| `workflow.ts` | Workflow orchestration |
| `steps.ts` | `fetchContent` — fetches blog content via Jina Reader |
| `evaluators.ts` | `evaluateSignalToNoise` — LLM-powered signal-to-noise evaluator |
| `types.ts` | Zod schemas and TypeScript types |
| `utils.ts` | `createWorkflowOutput` — assembles final result from content + evaluation |
| `prompts/signal_noise@v1.prompt` | Signal-to-noise evaluation prompt |
| `scenarios/` | Test input scenarios (1 variant) |

### Shared Client

- `src/clients/jina.ts` — `fetchBlogContent`: scrapes web pages using the [Jina Reader API](https://jina.ai/reader/)

## Input Schema

```json
{
  "url": "https://paulgraham.com/hwh.html"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `url` | `string` | URL of the blog post to evaluate |

## Output Schema

```json
{
  "url": "https://paulgraham.com/hwh.html",
  "title": "How to Work Hard",
  "signalToNoiseScore": 87,
  "confidence": 0.92,
  "reasoning": "Dense, actionable content with minimal filler...",
  "feedback": [
    {
      "issue": "Some repetition in the middle section",
      "suggestion": "Consolidate overlapping points about effort vs. direction",
      "priority": "low"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `url` | `string` | URL of the evaluated blog post |
| `title` | `string` | Title of the blog post |
| `signalToNoiseScore` | `number` | Score from 0-100 (0-20 mostly filler, 81-100 exceptional) |
| `confidence` | `number` | Confidence in the evaluation, 0-1 |
| `reasoning` | `string` | Explanation supporting the score |
| `feedback` | `array` | Prioritized issues with suggestions and references |

## Prerequisites

- An `ANTHROPIC_API_KEY` configured in credentials (used by `claude-haiku-4-5` for evaluation)

## Usage

### Run with scenario files

```bash
# Start dev services
npx output dev

# Run with a scenario
npx output workflow run blog_evaluator --scenario paulgraham_hwh
```

### Run with custom input

```bash
npx output workflow run blog_evaluator --input '{"url": "https://example.com/some-blog-post"}'
```

## Resources

- [Output.ai Documentation](https://docs.output.ai)
- [Temporal Documentation](https://docs.temporal.io)
