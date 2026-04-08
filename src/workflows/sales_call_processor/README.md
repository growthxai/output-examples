# process_transcript

Process a sales call transcript into clean meeting notes and parallel recipe analyses.

## Input

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `transcript` | `string` | Yes | Raw sales call transcript text (min 50 chars) |
| `recipes` | `string[]` | No | Recipe names to run. If omitted, auto-classifies and selects. Valid: `follow_up_email`, `deal_brief`, `meddic_score` |

## Output

| Field | Type | Description |
|-------|------|-------------|
| `notes` | `string` | Compact third-person past-tense meeting notes |
| `meetingType` | `string?` | Detected meeting type (only present when auto-classified) |
| `recipes` | `array` | Array of `{ recipeName, content }` objects |

## Steps

1. **extractNotes** — Produces journalist-prose meeting notes from the raw transcript (Opus 4.6, temp 0.15)
2. **classifyMeeting** — Auto-selects recipes based on meeting type when recipes not provided (Sonnet 4, temp 0.0)
3. **processRecipe** — Runs each recipe in parallel using dynamic prompt loading (model varies per recipe)

## Recipes

| Recipe | Model | Temp | Purpose |
|--------|-------|------|---------|
| `follow_up_email` | Sonnet 4 | 0.6 | Follow-up email referencing pain points with next steps |
| `deal_brief` | Opus 4.6 | 0.2 | Structured intel: stakeholders, pain points, competitors, objections, decision process, next steps |
| `meddic_score` | Opus 4.6 | 0.1 | MEDDIC scorecard with Strong/Partial/Gap ratings, gap analysis, next-call playbook |

## Scenarios

| Scenario | Recipes | Tests |
|----------|---------|-------|
| `discovery_call` | Explicit: all three | Skips classification, runs all recipes |
| `discovery_call_auto` | Omitted | Auto-classification path |
| `pipeline_review` | Omitted | Internal meeting classification |
| `negotiation` | Omitted | Negotiation meeting classification |

## Usage

```bash
# With explicit recipes
npx output workflow run process_transcript --scenario discovery_call

# With auto-classification
npx output workflow run process_transcript --scenario discovery_call_auto
```
