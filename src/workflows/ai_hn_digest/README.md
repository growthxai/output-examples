# AI Hacker News Digest

Builds a personalized Hacker News newsletter by scoring top stories against a reader profile, analyzing the best matches, and publishing an HTML digest to Beehiiv.

## Overview

This workflow fetches up to 500 top stories from the Hacker News Firebase API, uses an LLM to score each story's relevance to a provided reader profile, then fetches and analyzes the top 15 articles in parallel via Jina Reader and a second LLM pass. The analyzed articles are rendered into email-friendly HTML and published as a draft post to Beehiiv.

### Orchestration Flow

```
workflow.ts
│
├─ 1. fetchTopStories()                    — step: HN Firebase API (I/O in activity)
├─ 2. scoreStories({ profile, stories })   — step: LLM relevance scoring (I/O in activity)
├─ 3. fetchAndAnalyzeArticle(...)  ×N      — step: Jina + LLM analysis (parallel, max 10)
├─ 4. renderHtml({ articles })             — step: HTML rendering (I/O in activity)
└─ 5. publishToBeehiiv({ html, title })    — step: Beehiiv API post (I/O in activity)
```

## Files

| File | Purpose |
|------|---------|
| `workflow.ts` | Workflow orchestration with parallel article processing |
| `steps.ts` | `fetchTopStories`, `scoreStories`, `fetchAndAnalyzeArticle`, `renderHtml`, `publishToBeehiiv` |
| `types.ts` | Zod schemas and TypeScript types |
| `prompts/score_stories@v1.prompt` | Story relevance scoring prompt (`claude-haiku-4-5`) |
| `prompts/analyze_article@v1.prompt` | Article analysis prompt (`claude-sonnet-4-6`) |
| `scenarios/` | Test input scenarios (2 variants) |

### Shared Clients

- `src/clients/hn.ts` — `HnClient`: fetches top story IDs and item details from the [HN Firebase API](https://github.com/HackerNews/API)
- `src/clients/jina.ts` — `JinaClient.read`: fetches readable page content as markdown via [Jina Reader](https://jina.ai/reader)
- `src/clients/beehiiv.ts` — `BeehiivClient.createPost`: publishes HTML content as a draft post to [Beehiiv](https://www.beehiiv.com/)

## Input Schema

```json
{
  "profile": "I'm a senior software engineer interested in:\n- AI/ML engineering and LLM applications\n- Systems programming (Rust, Go, C++)\n- Developer tools and productivity\n- Startup engineering culture\n- Open source projects"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `profile` | `string` | Freeform markdown describing the reader and their interests (min 10 chars) |

## Output Schema

```json
{
  "storiesScanned": 500,
  "storiesSelected": 12,
  "articles": [
    {
      "id": 12345678,
      "title": "Article Title",
      "url": "https://example.com/article",
      "hnUrl": "https://news.ycombinator.com/item?id=12345678",
      "score": 284,
      "descendants": 142,
      "relevanceScore": 9.2,
      "tldr": "One-sentence summary of the article.",
      "takeaways": [
        {
          "boldTerm": "Key Concept",
          "detail": "Explanation of why this matters."
        }
      ]
    }
  ],
  "html": "<html>...</html>",
  "beehiivPostId": "post_abc123"
}
```

## Prerequisites

- An `ANTHROPIC_API_KEY` configured in credentials (used by `claude-haiku-4-5` for scoring and `claude-sonnet-4-6` for analysis)
- A `beehiiv.api_key` configured in credentials (used to publish the digest as a draft newsletter post)

## Usage

### Run with scenario files

```bash
# Start dev services
npx output dev

# Run with a scenario
npx output workflow run ai_hn_digest --scenario default
npx output workflow run ai_hn_digest --scenario growthx
```

### Run with custom input

```bash
npx output workflow run ai_hn_digest --input '{"profile": "I am a frontend developer interested in React, TypeScript, and UI/UX design."}'
```

## Resources

- [Output.ai Documentation](https://docs.output.ai)
- [Temporal Documentation](https://docs.temporal.io)
