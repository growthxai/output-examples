# Output.ai Examples

A gallery of production-ready AI workflows built with [Output.ai](https://output.ai) — an open-source framework for durable, LLM-powered workflows orchestrated by [Temporal](https://temporal.io).

Each workflow is a self-contained example you can run locally, learn from, and fork.

## Workflows

| Workflow | Description | APIs |
|----------|-------------|------|
| [blog_evaluator](src/workflows/blog_evaluator/) | Evaluate blog post signal-to-noise quality | Jina Reader |
| [call_scorer](src/workflows/call_scorer/) | Score sales call transcripts against MEDDIC, BANT, or SPIN | LLM only |
| [changelog_generator](src/workflows/changelog_generator/) | Generate categorized changelogs from GitHub commits and PRs | GitHub |
| [dependency_audit](src/workflows/dependency_audit/) | Audit npm dependencies for vulnerabilities, licenses, and abandonment | GitHub, OSV, npm |
| [recipe_extractor](src/workflows/recipe_extractor/) | Extract structured recipes from blog URLs | Jina Reader |
| [url_summarizer](src/workflows/url_summarizer/) | Summarize any webpage into TLDR, key points, and FAQ | Jina Reader |
| [youtube_summarizer](src/workflows/youtube_summarizer/) | Summarize YouTube videos with key moments and takeaways | YouTube |
| [ai_hn_digest](src/workflows/ai_hn_digest/) | Personalized Hacker News digest published to Beehiiv newsletter | HN, Jina Reader, Beehiiv |
| [sales_call_processor](src/workflows/sales_call_processor/) | Process sales call transcripts into notes + parallel recipe analyses | LLM only |

## Prerequisites

- Node.js >= 24.3
- Docker and Docker Compose (for local development)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Credentials

Output.ai uses encrypted credentials to manage API keys. To set up your own:

```bash
# Initialize a new credentials file and encryption key
npx output credentials init

# Edit credentials (opens in your $EDITOR)
npx output credentials edit
```

See [`config/credentials.yml.template`](config/credentials.yml.template) for the full list of available credentials. At minimum, you need:

```yaml
anthropic:
  api_key: "<your-anthropic-api-key>"
```

Some workflows require additional credentials — check each workflow's README for details.

| Credential | Where to get it | Used by |
|------------|-----------------|---------|
| `anthropic.api_key` | [console.anthropic.com](https://console.anthropic.com/) | All workflows |
| `github.token` | [github.com/settings/tokens](https://github.com/settings/tokens) | changelog_generator, dependency_audit |
| `beehiiv.api_key` | [app.beehiiv.com](https://app.beehiiv.com/) | ai_hn_digest |

### 3. Start Output Services

```bash
npm run dev
```

This starts:
- Temporal server and UI (http://localhost:8080)
- PostgreSQL and Redis databases
- Output.ai API server (http://localhost:3001)
- Worker process for executing workflows

### 4. Run a Workflow

In a new terminal:

```bash
npx output workflow run blog_evaluator paulgraham_hwh
```

Each workflow has scenario files in its `scenarios/` folder for quick testing.

### 5. Stop Services

Press `Ctrl+C` in the terminal running `npm run dev` to stop all services.

## Project Structure

```
src/
├── clients/                   # Shared API clients (GitHub, Jina, YouTube, etc.)
├── shared/                    # Shared utilities across workflows
│   └── utils/
└── workflows/                 # Workflow implementations
    └── <workflow_name>/
        ├── workflow.ts        # Orchestration logic (deterministic, no I/O)
        ├── steps.ts           # Step functions (all I/O happens here)
        ├── types.ts           # Zod schemas and TypeScript types
        ├── evaluators.ts      # Quality evaluators (optional)
        ├── utils.ts           # Local utilities (optional)
        ├── prompts/           # LLM prompt templates
        └── scenarios/         # Test input scenarios
```

### Import Rules

**Workflows** can import from: local steps, evaluators, utilities, and shared clients/utilities.

**Steps and Evaluators** can import from: local utilities and shared clients/utilities.

**Steps and Evaluators cannot** import from other steps or evaluators (Temporal activity isolation).

## Resources

- [Output.ai Documentation](https://docs.output.ai)
- [Temporal Documentation](https://docs.temporal.io)
