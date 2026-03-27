import { z } from '@outputai/core';

export const workflowInputSchema = z.object( {
  repoUrl: z.string().url().describe( 'GitHub repository URL (e.g. https://github.com/owner/repo)' ),
  startDate: z.string().describe( 'Start date in ISO format (YYYY-MM-DD)' ),
  endDate: z.string().describe( 'End date in ISO format (YYYY-MM-DD)' )
} );

export const changeEntrySchema = z.object( {
  title: z.string().describe( 'Short description of the change' ),
  category: z.enum( [ 'feature', 'fix', 'breaking_change', 'chore', 'docs', 'refactor' ] ),
  source: z.enum( [ 'commit', 'pull_request' ] ),
  reference: z.string().describe( 'Commit SHA or PR number' ),
  author: z.string().optional()
} );

export const categorizedChangesSchema = z.object( {
  entries: z.array( changeEntrySchema )
} );

export const workflowOutputSchema = z.object( {
  repo: z.string().describe( 'owner/repo' ),
  startDate: z.string(),
  endDate: z.string(),
  features: z.array( changeEntrySchema ),
  fixes: z.array( changeEntrySchema ),
  breakingChanges: z.array( changeEntrySchema ),
  other: z.array( changeEntrySchema ),
  changelog: z.string().describe( 'Human-readable formatted changelog' )
} );

export const repoParamsSchema = z.object( {
  owner: z.string().describe( 'Repository owner' ),
  repo: z.string().describe( 'Repository name' ),
  since: z.string().describe( 'Start date in ISO format' ),
  until: z.string().describe( 'End date in ISO format' )
} );

export const commitDataSchema = z.array( z.object( {
  sha: z.string(),
  message: z.string(),
  author: z.string()
} ) );

export const prDataSchema = z.array( z.object( {
  number: z.number(),
  title: z.string(),
  author: z.string(),
  labels: z.array( z.string() )
} ) );

export const categorizeChangesInputSchema = z.object( {
  commits: commitDataSchema,
  pullRequests: prDataSchema
} );

export type RepoParams = z.infer<typeof repoParamsSchema>;
export type CommitData = z.infer<typeof commitDataSchema>;
export type PrData = z.infer<typeof prDataSchema>;
export type CategorizeChangesInput = z.infer<typeof categorizeChangesInputSchema>;
export type WorkflowInput = z.infer<typeof workflowInputSchema>;
export type WorkflowOutput = z.infer<typeof workflowOutputSchema>;
export type ChangeEntry = z.infer<typeof changeEntrySchema>;
export type CategorizedChanges = z.infer<typeof categorizedChangesSchema>;
