import type { LoaderFunctionArgs } from 'react-router';
import { getDocsMeta, getVersionMeta } from '~/utils/docs/meta.server';

function escapeXml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&apos;',
      '"': '&quot;',
    };

    return entities[character];
  });
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const origin = new URL(request.url).origin;
  const index = Number(params.index);
  if (!Number.isInteger(index) || index !== 0) throw new Response('Invalid sitemap index', { status: 404 });

  const docsMeta = getDocsMeta();
  const urls = [
    { path: '/', priority: '1.0' },
    ...docsMeta.versions.flatMap((version) => {
      const { versionMeta } = getVersionMeta(version);
      const versionPath = `/docs/${version.slug}`;
      const pages = versionMeta.categories.flatMap((category) =>
        category.items.map((page) => ({
          path: `${versionPath}/${category.slug}/${page.slug}`,
          priority: '0.8',
        })),
      );

      return [{ path: versionPath, priority: '0.9' }, ...pages];
    }),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((page) => {
    return `  <url>
    <loc>${escapeXml(origin + page.path)}</loc>
    <changefreq>weekly</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  })
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
