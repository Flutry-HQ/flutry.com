import type { LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const origin = new URL(request.url).origin;

  const totalAnimeCount = 10;
  const chunkSize = 50;
  const chunkCount = Math.ceil(totalAnimeCount / chunkSize);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from({ length: chunkCount }, (_, i) => {
  return `  <sitemap><loc>${origin}/sitemap/${i}.xml</loc></sitemap>`;
}).join('\n')}
</sitemapindex>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
