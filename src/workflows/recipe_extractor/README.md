# Recipe Extractor Workflow

Scrapes a recipe blog URL and extracts clean, structured recipe data: ingredients with measurements, step-by-step instructions, and timing info.

## Overview

This workflow accepts a recipe blog URL, scrapes the page content using Jina Reader (cutting through ads, life stories, and filler), then uses an LLM to extract structured recipe data. The result is a clean JSON object with ingredients, instructions, prep/cook times, and servings.

### Orchestration Flow

```
workflow.ts
│
├─ 1. validateUrl(url)              — in workflow (deterministic; not I/O)
├─ 2. fetchContent({ url })         — step: Jina Reader API (I/O in activity)
└─ 3. extractRecipe(pageContent)    — step: LLM (I/O in activity)
```

## Files

| File | Purpose |
|------|---------|
| `workflow.ts` | Workflow orchestration |
| `steps.ts` | `fetchContent`, `extractRecipe` |
| `types.ts` | Zod schemas and TypeScript types |
| `prompts/extract_recipe@v1.prompt` | LLM prompt for recipe extraction |
| `scenarios/` | Test input scenarios |

### Shared Client

- `src/clients/jina.ts` — `fetchBlogContent`: Jina Reader API for clean web page scraping

## Input Schema

```json
{
  "url": "https://sallysbakingaddiction.com/chocolate-chip-cookies/"
}
```

| Field | Description |
|-------|-------------|
| `url` | URL of the recipe blog post to extract from |

## Output Schema

```json
{
  "title": "Chocolate Chip Cookies",
  "description": "Thick, chewy chocolate chip cookies with crispy edges.",
  "prepTime": "15 minutes",
  "cookTime": "12 minutes",
  "totalTime": "27 minutes",
  "servings": "36 cookies",
  "ingredients": [
    {
      "name": "all-purpose flour",
      "quantity": "2 1/4",
      "unit": "cups",
      "notes": "spooned and leveled"
    }
  ],
  "instructions": [
    "Whisk the flour, baking soda, and salt together in a large bowl. Set aside.",
    "Cream the butter and sugars together until light and fluffy, about 3-4 minutes."
  ]
}
```

## Prerequisites

- An `ANTHROPIC_API_KEY` configured in credentials (used by `claude-haiku-4-5` for recipe extraction)

## Usage

### Run with scenario files

```bash
# Start dev services
npx output dev

# Run with a scenario
npx output workflow run recipe_extractor --scenario happy_path
```

### Run with custom input

```bash
npx output workflow run recipe_extractor --input '{"url": "https://example.com/your-recipe-page"}'
```

## Resources

- [Output.ai Documentation](https://docs.output.ai)
- [Temporal Documentation](https://docs.temporal.io)
