import { FatalError } from '@outputai/core';
import { httpClient } from '@outputai/http';
import { credentials } from '@outputai/credentials';

const PUBLICATION_ID = 'pub_71623089-deed-447a-b0f4-000e91ffc188';

function getClient() {
  const apiKey = credentials.require( 'beehiiv.api_key' ) as string;
  return httpClient( {
    prefixUrl: 'https://api.beehiiv.com/v2',
    timeout: 30_000,
    retry: { limit: 2 },
    headers: {
      Authorization: `Bearer ${ apiKey }`,
    },
  } );
}

export const BeehiivClient = {

  /** Create a new post with HTML content blocks. Returns the post ID. */
  async createPost( params: { title: string; html: string } ): Promise<string> {
    const client = getClient();
    const response = await client.post(
      `publications/${ PUBLICATION_ID }/posts`,
      {
        json: {
          title: params.title,
          subtitle: '',
          status: 'draft',
          blocks: [
            { type: 'html', html: params.html },
          ],
        },
      }
    ).json<{ data: { id: string } }>();
    return response.data.id;
  },
};
