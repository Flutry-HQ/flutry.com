import { redirect, type LoaderFunctionArgs } from 'react-router';
import { getDocsMeta } from '~/utils/docs/meta.server';

export async function loader(_args: LoaderFunctionArgs) {
  const meta = getDocsMeta();

  if (!meta.versions?.length) {
    throw new Response('No documentation versions configured', { status: 500 });
  }

  const latest = meta.versions.find((version) => version.slug === 'latest') ?? meta.versions[0];

  throw redirect(`/docs/${latest.slug}`);
}
