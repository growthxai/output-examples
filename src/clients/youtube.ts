/**
 * YouTube transcript and title helpers.
 *
 * The `youtube-transcript` package types apply to the package root, but this project imports the
 * ESM build at `youtube-transcript/dist/youtube-transcript.esm.js`. Node ESM must use that path
 * because `package.json` `main` targets a CommonJS file that does not provide named exports to ESM
 * consumers.
 *
 * TypeScript has no typings for that subpath. `tsconfig.json` maps that specifier to
 * `node_modules/youtube-transcript/dist/index.d.ts` so the compiler reuses the published API types.
 *
 * @see https://www.npmjs.com/package/youtube-transcript
 */
import { FatalError, ValidationError } from '@outputai/core';
import { httpClient } from '@outputai/http';
import {
  fetchTranscript,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptTooManyRequestError,
  YoutubeTranscriptVideoUnavailableError
} from 'youtube-transcript/dist/youtube-transcript.esm.js';

export interface TranscriptSegment {
  start: number;
  duration: number;
  text: string;
}

export interface YouTubeTranscript {
  title: string;
  segments: TranscriptSegment[];
}

const youtubeOembedClient = httpClient({
  prefixUrl: 'https://www.youtube.com/oembed',
  timeout: 15000,
  headers: {
    'Accept': 'application/json'
  },
  retry: { limit: 2, statusCodes: [408, 429, 500, 502, 503, 504] }
});

/**
 * Fetches timed captions and the video title (YouTube oEmbed).
 * @param videoId - 11-character YouTube video id
 */
export async function fetchYouTubeTranscript(videoId: string): Promise<YouTubeTranscript> {
  try {
    const [items, title] = await Promise.all([
      fetchTranscript(videoId),
      fetchVideoTitle(videoId)
    ]);
    const segments = items
      .map((item) => ({
        start: offsetToSeconds(item.offset),
        duration: durationToSeconds(item.duration),
        text: item.text.trim()
      }))
      .filter((s) => s.text.length > 0);

    if (segments.length === 0) {
      throw new FatalError(`No transcript segments returned for video ${videoId}`);
    }

    return { title, segments };
  } catch (error: unknown) {
    if (error instanceof FatalError || error instanceof ValidationError) {
      throw error;
    }
    if (error instanceof YoutubeTranscriptVideoUnavailableError) {
      throw new FatalError(`Video not found or unavailable: ${videoId}`);
    }
    if (error instanceof YoutubeTranscriptDisabledError) {
      throw new FatalError(`Transcripts disabled for video ${videoId}`);
    }
    if (error instanceof YoutubeTranscriptNotAvailableError) {
      throw new FatalError(`No captions available for video ${videoId}`);
    }
    if (error instanceof YoutubeTranscriptNotAvailableLanguageError) {
      throw new FatalError(error.message);
    }
    if (error instanceof YoutubeTranscriptTooManyRequestError) {
      throw new ValidationError('YouTube rate-limited transcript requests; retry later.');
    }
    throw new ValidationError(
      `Failed to fetch transcript: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Resolves the display title for a video via the YouTube oEmbed endpoint (`format=json`).
 * Passes the canonical watch URL so the API returns metadata including `title`.
 * On network errors, non-JSON responses, or missing `title`, returns `'Untitled'` instead of throwing
 * so transcript fetching can still succeed without a title.
 * @param videoId - 11-character YouTube video id
 * @returns Trimmed title, or `'Untitled'` when unavailable
 */
async function fetchVideoTitle(videoId: string): Promise<string> {
  try {
    const response = await youtubeOembedClient.get('', {
      searchParams: {
        url: `https://www.youtube.com/watch?v=${videoId}`,
        format: 'json'
      }
    });
    const data = await response.json() as { title?: string };
    return data.title?.trim() || 'Untitled';
  } catch {
    return 'Untitled';
  }
}

/**
 * Normalizes a caption start offset from `youtube-transcript` to **seconds**.
 * The library returns **milliseconds** for srv3-style captions (large integers) and **seconds**
 * for classic XML captions. Non-finite values become `0`; non-integers are assumed already in seconds.
 * Integer offsets greater than `500` are treated as milliseconds and divided by 1000; smaller
 * integers are treated as whole seconds (classic format).
 * @param offset - Raw `offset` from a transcript item
 * @returns Start time in seconds
 */
function offsetToSeconds(offset: number): number {
  if (!Number.isFinite(offset)) {
    return 0;
  }
  if (!Number.isInteger(offset)) {
    return offset;
  }
  return offset > 500 ? offset / 1000 : offset;
}

/**
 * Normalizes a caption segment duration from `youtube-transcript` to **seconds**, using the same
 * srv3-vs-classic heuristic as {@link offsetToSeconds}: non-finite → `0`, non-integer → unchanged,
 * integers above `50` treated as milliseconds (srv3), otherwise as seconds (classic).
 * @param duration - Raw `duration` from a transcript item
 * @returns Duration in seconds
 */
function durationToSeconds(duration: number): number {
  if (!Number.isFinite(duration)) {
    return 0;
  }
  if (!Number.isInteger(duration)) {
    return duration;
  }
  return duration > 50 ? duration / 1000 : duration;
}
