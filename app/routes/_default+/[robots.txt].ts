import type { LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const origin = new URL(request.url).origin;

  const content = `
User-agent: *
Allow: /

# Crawl-delay
Crawl-delay: 1


Sitemap: ${origin}/sitemap.xml
`.trim();

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
