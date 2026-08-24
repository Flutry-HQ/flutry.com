import { type LoaderFunctionArgs, useLoaderData } from 'react-router';

import MDXContent from '~/components/docs/MDXContent';
import { hasDocsContent } from '~/utils/docs/mdxModules';
import { getVersion, getVersionMeta } from '~/utils/docs/meta.server';

export async function loader({ params }: LoaderFunctionArgs) {
  const versionSlug = params.version;

  if (!versionSlug) {
    throw new Response('Documentation version is required', { status: 400 });
  }

  const { version } = getVersion(versionSlug);
  getVersionMeta(version); // validates the version directory exists

  return { mdxPath: `${version.folder}/index`, version: version.title };
}

export default function DocsIndex() {
  const { mdxPath, version } = useLoaderData<typeof loader>();

  return (
    <article className="min-w-0 flex-1 sm:px-10 px-6 py-12 lg:pt-12 pt-16 duration-200">
      <div className="wrapper">
        {!hasDocsContent(mdxPath) ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <p className="mb-3 text-sm text-slate-500">{version}</p>
              <h1 className="text-3xl font-bold text-white">Welcome</h1>
              <p className="mt-3 text-slate-400">This documentation page has not been created yet.</p>
            </div>
          </div>
        ) : (
          <div className="docs-content">
            <MDXContent path={mdxPath} />
          </div>
        )}
      </div>
    </article>
  );
}
