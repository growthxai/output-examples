import { z } from '@outputai/core';

export const workflowInputSchema = z.object( {
  companyName: z.string().describe( 'The name of the company to enrich' ),
  website: z.string().url().describe( 'The company website URL (e.g. https://acme.com)' )
} );

export const enrichCompanyInputSchema = z.object( {
  website: z.string().url()
} );

export const zapierHubspotResponseSchema = z.array( z.object( {
  id: z.coerce.string(),
  isNew: z.boolean().optional().default( false )
} ) ).min( 1, 'HubSpot upsert returned no company record' );

export const apolloCompanySchema = z.object( {
  name: z.string(),
  website: z.string().optional(),
  domain: z.string().optional(),
  industry: z.string().optional(),
  employeeCount: z.number().optional(),
  estimatedRevenue: z.string().optional(),
  description: z.string().optional(),
  linkedinUrl: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  keywords: z.array( z.string() ).optional(),
  totalFunding: z.number().optional().describe( 'Total funding raised in USD' ),
  latestFundingRound: z.string().optional().describe( 'Most recent funding round amount or label (e.g. "$10M Series B")' ),
  fundingStage: z.string().optional().describe( 'Current funding stage (e.g. "Series A", "Seed", "IPO")' )
} );

export const hubspotUpsertOutputSchema = z.object( {
  hubspotCompanyId: z.string().describe( 'HubSpot company record ID' ),
  action: z.enum( [ 'created', 'updated' ] ).describe( 'Whether the HubSpot record was created or updated' )
} );

export const workflowOutputSchema = z.object( {
  companyName: z.string(),
  website: z.string(),
  hubspotCompanyId: z.string().describe( 'HubSpot company record ID created or updated' ),
  apolloData: apolloCompanySchema,
  action: z.enum( [ 'created', 'updated' ] ).describe( 'Whether the HubSpot record was created or updated' )
} );

export type WorkflowInput = z.infer<typeof workflowInputSchema>;
export type EnrichCompanyInput = z.infer<typeof enrichCompanyInputSchema>;
export type ApolloCompany = z.infer<typeof apolloCompanySchema>;
export type HubspotUpsertOutput = z.infer<typeof hubspotUpsertOutputSchema>;
export type WorkflowOutput = z.infer<typeof workflowOutputSchema>;
