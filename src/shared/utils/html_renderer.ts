interface Takeaway {
  boldTerm: string;
  detail: string;
}

interface Article {
  title: string;
  url: string;
  hnUrl: string;
  score: number;
  descendants: number;
  relevanceScore: number;
  tldr: string;
  takeaways: Takeaway[];
}

interface DigestInput {
  articles: Article[];
  storiesScanned: number;
  storiesIncluded: number;
  date: string;
}

function escapeHtml( str: string ): string {
  return str
    .replace( /&/g, '&amp;' )
    .replace( /</g, '&lt;' )
    .replace( />/g, '&gt;' )
    .replace( /"/g, '&quot;' );
}

function renderArticle( article: Article ): string {
  const takeawayItems = article.takeaways
    .map( t => `<li style="margin-bottom:6px;"><strong>${ escapeHtml( t.boldTerm ) }</strong> ${ escapeHtml( t.detail ) }</li>` )
    .join( '\n' );

  return `
    <div style="margin-bottom:28px;padding-bottom:28px;border-bottom:1px solid #e5e7eb;">
      <h2 style="margin:0 0 4px 0;font-size:18px;">
        <a href="${ escapeHtml( article.url ) }" style="color:#1a1a1a;text-decoration:none;">${ escapeHtml( article.title ) }</a>
      </h2>
      <p style="margin:0 0 10px 0;font-size:13px;color:#6b7280;">
        <a href="${ escapeHtml( article.hnUrl ) }" style="color:#f97316;text-decoration:none;">${ article.score } points</a>
        &middot; ${ article.descendants } comments
        &middot; relevance ${ article.relevanceScore }/10
      </p>
      <p style="margin:0 0 10px 0;font-size:15px;color:#374151;">${ escapeHtml( article.tldr ) }</p>
      <ul style="margin:0;padding-left:20px;font-size:14px;color:#374151;">
        ${ takeawayItems }
      </ul>
    </div>`;
}

export function renderDigestHtml( input: DigestInput ): string {
  const articleBlocks = input.articles.map( renderArticle ).join( '\n' );

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;background:#ffffff;">
    <h1 style="margin:0 0 4px 0;font-size:24px;color:#1a1a1a;">Hacker News Digest</h1>
    <p style="margin:0 0 24px 0;font-size:14px;color:#6b7280;">
      ${ escapeHtml( input.date ) } &middot; ${ input.storiesScanned } stories scanned, ${ input.storiesIncluded } included
    </p>
    ${ articleBlocks }
  </div>
</body>
</html>`;
}
