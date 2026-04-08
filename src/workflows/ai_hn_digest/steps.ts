import { step, z, FatalError } from '@outputai/core';
import { generateText, Output } from '@outputai/llm';
import { HnClient } from '../../clients/hn.js';
import { JinaClient } from '../../clients/jina.js';
import { BeehiivClient } from '../../clients/beehiiv.js';
import { renderDigestHtml } from '../../shared/utils/html_renderer.js';
import {
  FetchTopStoriesInputSchema,
  FetchTopStoriesOutputSchema,
  ScoreStoriesInputSchema,
  ScoreStoriesOutputSchema,
  FetchAndAnalyzeArticleInputSchema,
  FetchAndAnalyzeArticleOutputSchema,
  RenderHtmlInputSchema,
  RenderHtmlOutputSchema,
  PublishToBeehiivInputSchema,
  PublishToBeehiivOutputSchema,
  TakeawaySchema
} from './types.js';
import type { HnStory, ScoredStory } from './types.js';

const CHUNK_SIZE = 50;
const MIN_STORIES = 20;
const MAX_ARTICLE_CHARS = 12_000;

// --- Step 1: Fetch top stories from HN ---

export const fetchTopStories = step( {
  name: 'fetch_top_stories',
  description: 'Fetch up to 500 top stories from Hacker News Firebase API',
  inputSchema: FetchTopStoriesInputSchema,
  outputSchema: FetchTopStoriesOutputSchema,
  fn: async () => {
    const ids = await HnClient.getTopStoryIds( 500 );

    const stories: HnStory[] = [];

    for ( let i = 0; i < ids.length; i += CHUNK_SIZE ) {
      const chunk = ids.slice( i, i + CHUNK_SIZE );
      const items = await Promise.all(
        chunk.map( ( id: number ) => HnClient.getItem( id ) )
      );

      for ( const item of items ) {
        if ( item && item.title && typeof item.id === 'number' ) {
          stories.push( {
            id: item.id as number,
            title: item.title as string,
            url: ( item.url as string ) || undefined,
            score: ( item.score as number ) || 0,
            descendants: ( item.descendants as number ) || 0
          } );
        }
      }
    }

    if ( stories.length < MIN_STORIES ) {
      throw new FatalError(
        `Only fetched ${ stories.length } stories (minimum ${ MIN_STORIES }). HN API may be down.`
      );
    }

    return { stories };
  }
} );

// --- Step 2: Score stories by relevance using LLM ---

export const scoreStories = step( {
  name: 'score_stories',
  description: 'LLM scores stories by relevance to reader profile',
  inputSchema: ScoreStoriesInputSchema,
  outputSchema: ScoreStoriesOutputSchema,
  fn: async ( { profile, stories } ) => {
    const withUrls = stories.filter( s => s.url );

    const { output } = await generateText( {
      prompt: 'score_stories@v1',
      variables: {
        profile,
        stories: JSON.stringify(
          withUrls.map( s => ( { id: s.id, title: s.title, url: s.url, score: s.score } ) )
        )
      },
      output: Output.object( {
        schema: z.object( {
          picks: z.array( z.object( {
            id: z.number(),
            relevanceScore: z.number(),
            reason: z.string()
          } ) )
        } )
      } )
    } );

    if ( !output || !output.picks || output.picks.length === 0 ) {
      throw new FatalError( 'LLM returned no story picks' );
    }

    const merged: ScoredStory[] = [];

    for ( const pick of output.picks ) {
      const story = withUrls.find( s => s.id === pick.id );
      if ( story && story.url ) {
        merged.push( {
          ...story,
          url: story.url,
          relevanceScore: pick.relevanceScore,
          reason: pick.reason
        } );
      }
    }

    merged.sort( ( a, b ) => b.relevanceScore - a.relevanceScore );

    return { picks: merged.slice( 0, 15 ) };
  }
} );

// --- Step 3: Fetch and analyze a single article (called in parallel) ---

export const fetchAndAnalyzeArticle = step( {
  name: 'fetch_and_analyze_article',
  description: 'Fetch article content via Jina Reader and analyze with LLM',
  inputSchema: FetchAndAnalyzeArticleInputSchema,
  outputSchema: FetchAndAnalyzeArticleOutputSchema,
  fn: async ( { profile, story } ) => {
    let content: string;
    try {
      const response = await JinaClient.read( story.url );
      content = response.data.content;
    } catch {
      content = `[Article content unavailable. Title: ${ story.title }]`;
    }

    if ( content.length > MAX_ARTICLE_CHARS ) {
      content = content.slice( 0, MAX_ARTICLE_CHARS ) + '\n\n[Content truncated]';
    }

    const { output } = await generateText( {
      prompt: 'analyze_article@v1',
      variables: {
        profile,
        title: story.title,
        url: story.url,
        content
      },
      output: Output.object( {
        schema: z.object( {
          tldr: z.string(),
          takeaways: z.array( TakeawaySchema )
        } )
      } )
    } );

    if ( !output ) {
      throw new FatalError( `LLM analysis failed for story ${ story.id }` );
    }

    return {
      article: {
        id: story.id,
        title: story.title,
        url: story.url,
        hnUrl: `https://news.ycombinator.com/item?id=${ story.id }`,
        score: story.score,
        descendants: story.descendants,
        relevanceScore: story.relevanceScore,
        tldr: output.tldr,
        takeaways: output.takeaways
      }
    };
  }
} );

// --- Step 4: Render HTML digest ---

export const renderHtml = step( {
  name: 'render_html',
  description: 'Render analyzed articles into email-friendly HTML',
  inputSchema: RenderHtmlInputSchema,
  outputSchema: RenderHtmlOutputSchema,
  fn: async ( { articles, storiesScanned } ) => {
    const html = renderDigestHtml( {
      articles,
      storiesScanned,
      storiesIncluded: articles.length,
      date: new Date().toLocaleDateString( 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      } )
    } );
    return { html };
  }
} );

// --- Step 5: Publish to Beehiiv ---

export const publishToBeehiiv = step( {
  name: 'publish_to_beehiiv',
  description: 'Publish the rendered HTML digest to Beehiiv as a newsletter draft',
  inputSchema: PublishToBeehiivInputSchema,
  outputSchema: PublishToBeehiivOutputSchema,
  fn: async ( { html, title } ) => {
    const postId = await BeehiivClient.createPost( { title, html } );
    return { postId };
  }
} );
