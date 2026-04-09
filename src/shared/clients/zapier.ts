import { FatalError } from '@outputai/core';
import { createZapierSdk } from '@zapier/zapier-sdk';
import { credentials } from '@outputai/credentials';

const clientHolder: { value: ReturnType<typeof createZapierSdk> | null } = { value: null };

function getClient(): ReturnType<typeof createZapierSdk> {
  if ( !clientHolder.value ) {
    const clientId = credentials.require( 'zapier.client_id' ) as string;
    const clientSecret = credentials.require( 'zapier.client_secret' ) as string;
    clientHolder.value = createZapierSdk( { credentials: { clientId, clientSecret } } );
  }
  return clientHolder.value;
}

export async function getConnectionId( appKey: string ): Promise<string> {
  const zapier = getClient();
  const { data: connection } = await zapier.findFirstConnection( {
    appKey,
    owner: 'me',
    isExpired: false
  } );

  if ( !connection ) {
    throw new FatalError( `No active Zapier connection found for app: ${ appKey }` );
  }

  return connection.id;
}

export function createZapierClient(): ReturnType<typeof createZapierSdk> {
  return getClient();
}
