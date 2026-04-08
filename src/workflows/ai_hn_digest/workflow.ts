import { workflow, executeInParallel } from '@outputai/core';
import {
  fetchTopStories,
  scoreStories,
  fetchAndAnalyzeArticle,
  renderHtml,
  publishToBeehiiv,
} from './steps.js';
import { inputSchema, outputSchema } from './types.js';

export default workflow( {
  name: 'ai_hn_digest',
  description: 'Create a personalized daily Hacker News digest and publish to Beehiiv',
  inputSchema,
  outputSchema,
  fn: async ( input ) => {

    // Step 1 -- Fetch top stories from HN
    const { stories } = await fetchTopStories( {} );

    // Step 2 -- Score stories by relevance to reader profile
    const { picks } = await scoreStories( {
      profile: input.profile,
      stories,
    } );

    // Step 3 -- Fetch + analyze articles in parallel (max 10 concurrent)
    const results = await executeInParallel( {
      jobs: picks.map( ( story ) => () =>
        fetchAndAnalyzeArticle( { profile: input.profile, story } )
      ),
      concurrency: 10,
    } );

    // Collect successful analyses, skip failures
    const articles = results
      .filter( ( r ) => r.ok )
      .map( ( r ) => r.result.article );

    // Step 4 -- Render HTML
    const { html } = await renderHtml( {
      articles,
      storiesScanned: stories.length,
    } );

    // Step 5 -- Publish to Beehiiv
    const { postId } = await publishToBeehiiv( {
      html,
      title: 'AI News Digest',
    } );

    return {
      storiesScanned: stories.length,
      storiesSelected: articles.length,
      articles,
      html,
      beehiivPostId: postId,
    };
  },
} );
