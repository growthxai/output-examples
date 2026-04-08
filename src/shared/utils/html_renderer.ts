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
  tldr: string;
  takeaways: Takeaway[];
}

interface DigestParams {
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
    .map( ( t ) => `<li><strong>${ escapeHtml( t.boldTerm ) }</strong> ${ escapeHtml( t.detail ) }</li>` )
    .join( '\n' );

  return `<div style="margin-bottom:32px">
  <h2 style="margin:0 0 4px"><a href="${ escapeHtml( article.url ) }">${ escapeHtml( article.title ) }</a></h2>
  <p style="margin:0 0 8px;font-size:13px;color:#666">
    ${ article.score } points | <a href="${ escapeHtml( article.hnUrl ) }">${ article.descendants } comments</a>
  </p>
  <p style="margin:0 0 8px"><em>${ escapeHtml( article.tldr ) }</em></p>
  <ul style="margin:0;padding-left:20px">${ takeawayItems }</ul>
</div>`;
}

export function renderDigestHtml( params: DigestParams ): string {
  const { articles, storiesScanned, storiesIncluded, date } = params;

  const articleBlocks = articles.map( renderArticle ).join( '\n' );

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;max-width:640px;margin:0 auto;padding:20px;color:#222">
  <h1 style="margin:0 0 4px">Hacker News Digest</h1>
  <p style="margin:0 0 24px;font-size:14px;color:#666">${ escapeHtml( date ) } &mdash; ${ storiesIncluded } articles from ${ storiesScanned } stories</p>
${ articleBlocks }
</body>
</html>`;
}
