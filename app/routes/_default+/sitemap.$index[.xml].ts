import type { LoaderFunctionArgs } from 'react-router';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const origin = new URL(request.url).origin;
  const index = Number(params.index);
  if (isNaN(index)) throw new Response('Invalid sitemap index', { status: 400 });

  const chunkSize = 50;
  const offset = index * chunkSize;

  const animePages = Array.from({ length: chunkSize }, (_, i) => {
    const id = offset + i + 1;
    return {
      url: `/anime/dummy-anime-${id}`,
      lastmod: new Date(Date.now() - i * 1000 * 60 * 60 * 24).toISOString().split('T')[0],
    };
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${animePages
  .map((anime) => {
    return `  <url>
    <loc>${origin}${anime.url}</loc>
    <lastmod>${anime.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`;
  })
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
