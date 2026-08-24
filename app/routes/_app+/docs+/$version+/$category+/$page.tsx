import { type LoaderFunctionArgs, useLoaderData } from 'react-router';

import MDXContent from '~/components/docs/MDXContent';
import { hasDocsContent } from '~/utils/docs/mdxModules';
import { getCategory, getPage, getVersion, getVersionMeta } from '~/utils/docs/meta.server';

export async function loader({ params }: LoaderFunctionArgs) {
  const { version: versionSlug, category: categorySlug, page: pageSlug } = params;

  if (!versionSlug || !categorySlug || !pageSlug) {
    throw new Response('Invalid documentation URL', { status: 400 });
  }

  const { version } = getVersion(versionSlug);
  const { versionMeta } = getVersionMeta(version);
  const category = getCategory(versionMeta, categorySlug);
  const page = getPage(category, pageSlug);

  return {
    mdxPath: `${version.folder}/${category.folder}/${page.slug}`,
    title: page.title,
    category: category.title,
    version: version.title,
  };
}

export default function DocsPage() {
  const { mdxPath, title, category, version } = useLoaderData<typeof loader>();

  if (!hasDocsContent(mdxPath)) {
    return (
      <article className="min-w-0 flex-1 sm:px-10 px-6 py-12 lg:pt-12 pt-16 duration-200">
        <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center">
          <div className="text-center">
            <p className="mb-3 text-sm text-slate-500">
              {version} / {category}
            </p>
            <h1 className="text-3xl font-bold text-white">{title}</h1>
            <p className="mt-3 text-slate-400">This documentation page has not been created yet.</p>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="min-w-0 flex-1 sm:px-10 px-6 py-12 lg:pt-12 pt-16 duration-200">
      <div className="wrapper">
        <header className="mb-10">
          <p className="mb-2 text-sm text-slate-500">
            {version} / {category}
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-white">{title}</h1>
        </header>

        <div className="docs-content">
          <MDXContent path={mdxPath} />
        </div>
      </div>
    </article>
  );
}
