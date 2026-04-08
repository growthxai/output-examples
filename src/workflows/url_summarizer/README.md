# URL Summarizer

Scrapes any web page and produces a structured summary with TLDR, key points, and FAQ.

## Overview

This workflow accepts a URL, validates it, fetches the page content via Jina Reader (which returns clean markdown), then sends it to an LLM for structured summarization. The result includes a concise TLDR, extracted key points, and a generated FAQ section.

### Orchestration Flow

```
workflow.ts
│
├─ 1. validateUrl(url)              — in workflow (deterministic; not I/O)
├─ 2. fetchContent({ url })         — step: Jina Reader scrape (I/O in activity)
└─ 3. summarizeContent(...)         — step: LLM summarization (I/O in activity)
```

## Files

| File | Purpose |
|------|---------|
| `workflow.ts` | Workflow orchestration |
| `steps.ts` | `fetchContent`, `summarizeContent` |
| `types.ts` | Zod schemas and TypeScript types |
| `prompts/summarize@v1.prompt` | Summary generation prompt |
| `scenarios/` | Test input scenarios |

### Shared Client

- `src/clients/jina.ts` — `JinaClient.read`: fetches readable page content as markdown via [Jina Reader](https://jina.ai/reader)

## Input Schema

```json
{
  "url": "https://paulgraham.com/greatwork.html"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `url` | `string` | URL of the page to summarize |

## Output Schema

```json
{
  "url": "https://paulgraham.com/greatwork.html",
  "title": "How to Do Great Work",
  "tldr": "One or two sentence summary of the page content.",
  "keyPoints": [
    "First key takeaway from the article",
    "Second key takeaway from the article"
  ],
  "faq": [
    {
      "question": "What is the main argument?",
      "answer": "A concise answer to the question."
    }
  ]
}
```

## Prerequisites

- An `ANTHROPIC_API_KEY` configured in credentials (used by `claude-haiku-4-5` for summarization)

## Usage

### Run with scenario files

```bash
# Start dev services
npx output dev

# Run with a scenario
npx output workflow run url_summarizer --scenario happy_path
```

### Run with custom input

```bash
npx output workflow run url_summarizer --input '{"url": "https://example.com/article"}'
```

## Resources

- [Output.ai Documentation](https://docs.output.ai)
- [Temporal Documentation](https://docs.temporal.io)
