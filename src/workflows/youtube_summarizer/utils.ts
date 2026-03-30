/**
 * Extracts an 11-character YouTube video id from supported URL shapes (or a bare id).
 * @param url - Watch, youtu.be, embed, shorts URL, or raw video id
 */
export function extractVideoId( url: string ): string {
  const trimmed = url.trim();
  if ( /^[a-zA-Z0-9_-]{11}$/.test( trimmed ) ) {
    return trimmed;
  }
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
  ];
  for ( const pattern of patterns ) {
    const match = trimmed.match( pattern );
    if ( match ) {
      return match[1];
    }
  }
  throw new Error( `Invalid YouTube URL: ${url}` );
}

export function formatTimestamp( seconds: number ): string {
  const h = Math.floor( seconds / 3600 );
  const m = Math.floor( ( seconds % 3600 ) / 60 );
  const s = Math.floor( seconds % 60 );
  if ( h > 0 ) {
    return `${h}:${String( m ).padStart( 2, '0' )}:${String( s ).padStart( 2, '0' )}`;
  }
  return `${m}:${String( s ).padStart( 2, '0' )}`;
}
