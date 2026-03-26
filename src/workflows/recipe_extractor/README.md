# Recipe Extractor Workflow

Extracts structured recipe data from blog post URLs, cutting through narrative content, life stories, and advertisements to find just the recipe details.

## Overview

The `recipe_extractor` workflow accepts a URL pointing to a blog post containing a recipe, scrapes the page content via Jina Reader, then uses an LLM to extract structured recipe data (title, ingredients, instructions, times, servings).

## Flow

```
Input (url) → fetchRecipePage (Jina Reader) → extractRecipe (LLM) → Output (recipe)
```

## Files

| File | Purpose |
|------|---------|
| `workflow.ts` | Orchestration: URL in, structured recipe out |
| `steps.ts` | Two steps: `fetchRecipePage` and `extractRecipe` |
| `types.ts` | Zod schemas for input, output, and recipe structure |
| `evaluators.ts` | Recipe completeness evaluator (runtime) |
| `prompts/extract_recipe@v2.prompt` | LLM prompt for recipe extraction |
| `scenarios/` | Test input URLs for different recipe types |
| `tests/` | Offline eval test suite with datasets |

## Input Schema

```json
{
  "url": "https://example.com/blog-post-with-recipe/"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string (URL) | Yes | URL of a blog post containing a recipe |

## Output Schema

```json
{
  "recipe": {
    "title": "Chocolate Chip Cookies",
    "description": "Classic homemade chocolate chip cookies",
    "prepTime": "15 minutes",
    "cookTime": "12 minutes",
    "totalTime": "27 minutes",
    "servings": "36 cookies",
    "ingredients": [
      {
        "quantity": "2 1/4",
        "unit": "cups",
        "item": "all-purpose flour",
        "notes": "spooned and leveled"
      }
    ],
    "instructions": [
      "Preheat oven to 375 degrees F.",
      "Whisk together flour, baking soda, and salt in a bowl."
    ]
  }
}
```

## Steps

### `fetchRecipePage`
Fetches the blog post content from the given URL using the Jina Reader API. Returns the page title and markdown content. The Jina client includes error classification (FatalError for 401/403/404, ValidationError for transient errors) and automatic retries.

### `extractRecipe`
Sends the page content to an LLM (Claude Haiku) with the `extract_recipe@v2` prompt to extract structured recipe data. Uses `Output.object` for schema-validated structured output.

## Scenarios

| File | Description |
|------|-------------|
| `happy_path.json` | Sally's chocolate chip cookies |
| `minimal_recipe.json` | Simple recipe with minimal metadata |
| `verbose_blog.json` | Recipe buried in a long blog narrative |
| `international_recipe.json` | BBC Good Food recipe with metric measurements |

## Testing

```bash
# Start dev services
npx output dev

# Run the workflow with a scenario
npx output workflow run recipe_extractor happy_path

# Run eval tests
npx output workflow test recipe_extractor --save

# Run eval tests with cached output (fast)
npx output workflow test recipe_extractor --cached
```

## Prerequisites

- Anthropic API key configured (for Claude Haiku LLM calls)
- Output dev services running (`npx output dev`)
