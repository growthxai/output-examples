import { step, z } from '@outputai/core';
import { generateText, Output } from '@outputai/llm';
import { fetchCommits, fetchMergedPullRequests } from '../../clients/github.js';
import { categorizedChangesSchema, changeEntrySchema } from './types.js';

const repoParamsSchema = z.object( {
  owner: z.string(),
  repo: z.string(),
  since: z.string(),
  until: z.string()
} );

const commitDataSchema = z.array( z.object( {
  sha: z.string(),
  message: z.string(),
  author: z.string()
} ) );

const prDataSchema = z.array( z.object( {
  number: z.number(),
  title: z.string(),
  author: z.string(),
  labels: z.array( z.string() )
} ) );

export const fetchRepoCommits = step( {
  name: 'fetch_repo_commits',
  description: 'Fetch commits from GitHub repository within date range',
  inputSchema: repoParamsSchema,
  outputSchema: commitDataSchema,
  fn: async ( { owner, repo, since, until } ) => {
    const commits = await fetchCommits( owner, repo, since, until );

    return commits.map( c => ( {
      sha: c.sha.slice( 0, 7 ),
      message: c.commit.message.split( '\n' )[ 0 ],
      author: c.author?.login ?? c.commit.author.name
    } ) );
  }
} );

export const fetchRepoPullRequests = step( {
  name: 'fetch_repo_pull_requests',
  description: 'Fetch merged pull requests from GitHub repository within date range',
  inputSchema: repoParamsSchema,
  outputSchema: prDataSchema,
  fn: async ( { owner, repo, since, until } ) => {
    const prs = await fetchMergedPullRequests( owner, repo, since, until );

    return prs.map( pr => ( {
      number: pr.number,
      title: pr.title,
      author: pr.user?.login ?? 'unknown',
      labels: pr.labels.map( l => l.name )
    } ) );
  }
} );

export const categorizeChanges = step( {
  name: 'categorize_changes',
  description: 'Use LLM to categorize commits and PRs into changelog categories',
  inputSchema: z.object( {
    commits: commitDataSchema,
    pullRequests: prDataSchema
  } ),
  outputSchema: categorizedChangesSchema,
  fn: async ( { commits, pullRequests } ) => {
    if ( commits.length === 0 && pullRequests.length === 0 ) {
      return { entries: [] };
    }

    const { output } = await generateText( {
      prompt: 'categorize_changes@v1',
      variables: {
        commitsJson: JSON.stringify( commits ),
        pullRequestsJson: JSON.stringify( pullRequests )
      },
      output: Output.object( {
        schema: z.object( {
          entries: z.array( changeEntrySchema )
        } )
      } )
    } );

    return output;
  }
} );
