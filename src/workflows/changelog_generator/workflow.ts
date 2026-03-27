import { workflow } from '@outputai/core';
import { fetchRepoCommits, fetchRepoPullRequests, categorizeChanges } from './steps.js';
import { parseGitHubUrl, groupEntries, formatChangelog } from './utils.js';
import { workflowInputSchema, workflowOutputSchema } from './types.js';

export default workflow( {
  name: 'changelog_generator',
  description: 'Generate a categorized changelog from GitHub commits and merged PRs within a date range',
  inputSchema: workflowInputSchema,
  outputSchema: workflowOutputSchema,
  fn: async ( input ) => {
    const { owner, repo } = parseGitHubUrl( input.repoUrl );
    const repoSlug = `${owner}/${repo}`;
    const since = `${input.startDate}T00:00:00Z`;
    const until = `${input.endDate}T23:59:59Z`;

    const repoParams = { owner, repo, since, until };

    const [ commits, pullRequests ] = await Promise.all( [
      fetchRepoCommits( repoParams ),
      fetchRepoPullRequests( repoParams )
    ] );

    const categorized = await categorizeChanges( { commits, pullRequests } );

    const { features, fixes, breakingChanges, other } = groupEntries( categorized.entries );

    const changelog = formatChangelog(
      repoSlug,
      input.startDate,
      input.endDate,
      features,
      fixes,
      breakingChanges,
      other
    );

    return {
      repo: repoSlug,
      startDate: input.startDate,
      endDate: input.endDate,
      features,
      fixes,
      breakingChanges,
      other,
      changelog
    };
  },
  options: {
    activityOptions: {
      retry: {
        maximumAttempts: 3
      }
    }
  }
} );
