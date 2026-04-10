import { createZapierSdk } from '@zapier/zapier-sdk';
import { credentials } from '@outputai/credentials';

const holder: { value: ReturnType<typeof createZapierSdk> | null } = { value: null };

export function getZapierClient(): ReturnType<typeof createZapierSdk> {
  if ( !holder.value ) {
    const clientId = credentials.require( 'zapier.client_id' ) as string;
    const clientSecret = credentials.require( 'zapier.client_secret' ) as string;
    holder.value = createZapierSdk( { credentials: { clientId, clientSecret } } );
  }
  return holder.value;
}
