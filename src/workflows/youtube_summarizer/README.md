# YouTube Summarizer Workflow

Fetches a YouTube video transcript and generates a structured summary with TLDR, key moments (with timestamps), and actionable takeaways.

## Overview

This workflow accepts a YouTube video URL, derives the video id in workflow code with `extractVideoId` (pure, no I/O — safe for Temporal), then runs steps only for network/LLM work: `fetchTranscript` uses [`youtube-transcript`](https://www.npmjs.com/package/youtube-transcript) plus YouTube oEmbed via `@outputai/http`, then `summarizeTranscript` calls the LLM.

### Orchestration Flow

```
workflow.ts
│
├─ 1. extractVideoId(url)            — in workflow (deterministic; not I/O)
├─ 2. fetchTranscript({ videoId })   — step: captions + oEmbed title (I/O in activity)
└─ 3. summarizeTranscript(...)       — step: LLM (I/O in activity)
```

## Files

| File | Purpose |
|------|---------|
| `workflow.ts` | Workflow orchestration |
| `steps.ts` | `fetchTranscript`, `summarizeTranscript` |
| `types.ts` | Zod schemas and TypeScript types |
| `utils.ts` | `extractVideoId`, `formatTimestamp` |
| `evaluators.ts` | LLM-powered summary quality evaluator (1-10 score) |
| `prompts/summarize@v1.prompt` | Summary generation prompt |
| `prompts/evaluate_summary@v1.prompt` | Evaluation scoring prompt |
| `scenarios/` | Test input scenarios (4 variants) |
| `tests/` | Offline eval datasets and eval workflow |

### Shared Client

- `src/clients/youtube.ts` — `fetchYouTubeTranscript`: [`youtube-transcript`](https://www.npmjs.com/package/youtube-transcript) for captions, YouTube oEmbed via `@outputai/http` for title

## Input Schema

```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

Supports YouTube URL formats: `watch?v=`, `youtu.be/`, `embed/`, `shorts/`

## Output Schema

```json
{
  "videoId": "dQw4w9WgXcQ",
  "title": "Video Title",
  "summary": "2-3 sentence TLDR of the video content.",
  "keyMoments": [
    {
      "timestamp": "1:23",
      "title": "Key Moment Title",
      "description": "One-sentence description of the moment."
    }
  ],
  "takeaways": [
    "Actionable insight or key learning"
  ]
}
```

## Prerequisites

- An `ANTHROPIC_API_KEY` configured in credentials (used by `claude-haiku-4-5` for summarization and evaluation)

## Usage

### Run with scenario files

```bash
# Start dev services
npx output dev

# Run with a scenario
npx output workflow run youtube_summarizer --scenario happy_path
npx output workflow run youtube_summarizer --scenario long_video
npx output workflow run youtube_summarizer --scenario short_url
```

### Run with custom input

```bash
npx output workflow run youtube_summarizer --input '{"url": "https://www.youtube.com/watch?v=VIDEO_ID"}'
```

## Testing

### Eval Tests (Offline, Dataset-Driven)

```bash
# Run eval tests with cached outputs
npx output workflow test youtube_summarizer --cached

# Run fresh and save new outputs
npx output workflow test youtube_summarizer --save

# List available datasets
npx output workflow dataset list youtube_summarizer
```

### Eval Checks

- `verify_summary_length` — Summary meets minimum character length
- `verify_key_moments_count` — Sufficient key moments returned
- `verify_takeaways_count` — Sufficient takeaways returned
- `verify_timestamp_format` — All timestamps match `MM:SS` or `HH:MM:SS`
- `verify_key_moment_descriptions` — No empty titles or descriptions

## Resources

- [Output.ai Documentation](https://docs.output.ai)
- [Temporal Documentation](https://docs.temporal.io)
