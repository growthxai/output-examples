# Zapier HubSpot Company Enrichment

Enriches a company profile using Apollo and upserts the result into HubSpot via the Zapier SDK.

## Overview

This workflow takes a website URL, enriches the company data through the Apollo organization API (extracting industry, employee count, funding, LinkedIn, and more), then creates or updates the corresponding company record in HubSpot using Zapier's `search_or_write` action.

### Orchestration Flow

```
workflow.ts
│
├─ 1. enrichCompanyWithApollo({ website })                — step: Apollo REST API (I/O in activity)
└─ 2. upsertHubspotCompany(apolloData)                    — step: Zapier SDK → HubSpot (I/O in activity)
```

## Files

| File | Purpose |
|------|---------|
| `workflow.ts` | Workflow orchestration — enrich then upsert |
| `steps.ts` | `enrichCompanyWithApollo`, `upsertHubspotCompany` |
| `types.ts` | Zod schemas and TypeScript types |
| `scenarios/` | Test input scenarios (1 variant) |

### Shared Clients

- `src/shared/clients/apollo.ts` — `enrichOrganization`: enriches company data by domain via the [Apollo API](https://apolloio.github.io/apollo-api-docs/)
- `src/shared/clients/zapier.ts` — `createZapierClient`: manages Zapier SDK connections and runs actions via the [Zapier SDK](https://www.npmjs.com/package/@zapier/zapier-sdk)

## Input Schema

```json
{
  "companyName": "Stripe",
  "website": "https://stripe.com"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `companyName` | `string` | The name of the company (included in output, not used for enrichment) |
| `website` | `string` (URL) | The company website URL (e.g. `https://acme.com`) — used to extract domain for Apollo lookup |

## Output Schema

```json
{
  "companyName": "Stripe, Inc.",
  "website": "https://stripe.com",
  "hubspotCompanyId": "12345678",
  "action": "created",
  "apolloData": {
    "name": "Stripe, Inc.",
    "website": "https://stripe.com",
    "domain": "stripe.com",
    "industry": "Internet Software & Services",
    "employeeCount": 8000,
    "estimatedRevenue": "$1B+",
    "description": "Stripe is a technology company that builds economic infrastructure for the internet.",
    "linkedinUrl": "https://www.linkedin.com/company/stripe",
    "city": "San Francisco",
    "country": "United States",
    "keywords": ["payments", "fintech", "infrastructure"],
    "totalFunding": 8700000000,
    "latestFundingRound": "2023-03-15",
    "fundingStage": "Series I"
  }
}
```

## Prerequisites

- `apollo.api_key` in encrypted credentials (used to enrich company data via Apollo REST API)
- `zapier.client_id` and `zapier.client_secret` in encrypted credentials (used to authenticate the Zapier SDK)
- An active HubSpot connection in Zapier (connection ID is configured in `steps.ts`)

## Usage

### Run with scenario files

```bash
# Start dev services
npx output dev

# Run with a scenario
npx output workflow run zapier_hubspot_company_enrichment stripe
```

### Run with custom input

```bash
npx output workflow run zapier_hubspot_company_enrichment --input '{"companyName": "Acme Corp", "website": "https://acme.com"}'
```

## About the Zapier SDK

This workflow uses the [Zapier SDK](https://docs.zapier.com/sdk) — a TypeScript library that provides programmatic access to Zapier's 9,000+ app integrations. Instead of managing OAuth flows, token refresh, and API inconsistencies yourself, the SDK handles all of that through the user's existing Zapier connections.

### Key Concepts

| Concept | Description |
|---------|-------------|
| **App Key** | Identifier for an integrated app (e.g. `hubspot`, `slack`, `google_calendar`) |
| **Connection** | A user-authenticated account linked to a specific app — identified by connection ID |
| **Action** | An operation on an app: `search` (find data), `write` (create/update), `read` (list), or `search_or_write` (upsert) |

### Authentication

The SDK authenticates using a client ID and secret pair:

```typescript
import { createZapierSdk } from '@zapier/zapier-sdk';

const zapier = createZapierSdk({
  credentials: { clientId: '...', clientSecret: '...' }
});
```

In this project, credentials are stored encrypted and loaded via `@outputai/credentials` (see `src/shared/clients/zapier.ts`).

### Running Actions

Actions are called using the chained `zapier.apps.<appKey>.<actionType>.<actionKey>()` pattern with a **connection ID** and **inputs**.

```typescript
const zapier = createZapierClient();

// Run a search-or-write (upsert) action on HubSpot
const { data: result } = await zapier.apps.hubspot.search_or_write.company_crmSearch( {
  inputs: {
    first_search_property_name: 'name',
    first_search_property_value: 'Stripe',
    name: 'Stripe',
    domain: 'stripe.com',
    // ...additional fields
  },
  connectionId: HUBSPOT_CONNECTION_ID
} );
```

This is the pattern used in `steps.ts` to upsert companies into HubSpot. The SDK takes care of authentication, retries, and API specifics behind the scenes.

For full documentation, see [docs.zapier.com/sdk](https://docs.zapier.com/sdk).

## Resources

- [Output.ai Documentation](https://docs.output.ai)
- [Temporal Documentation](https://docs.temporal.io)
- [Zapier SDK Documentation](https://docs.zapier.com/sdk)
