import fs from 'node:fs';
import path from 'node:path';

import type { DocsMeta, VersionMeta } from '~/utils/types/docs';

export const DOCS_PATH = path.resolve('app/assets/docs');

function readJSON<T>(filePath: string, notFoundMessage: string): T {
  if (!fs.existsSync(filePath)) {
    throw new Response(notFoundMessage, { status: 500 });
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

export function getDocsMeta(): DocsMeta {
  return readJSON<DocsMeta>(path.join(DOCS_PATH, 'meta.json'), 'Documentation metadata not found');
}

export function getVersion(versionSlug: string) {
  const meta = getDocsMeta();
  const version = meta.versions.find((item) => item.slug === versionSlug);

  if (!version) {
    throw new Response(`Documentation version "${versionSlug}" not found`, { status: 404 });
  }

  return { meta, version };
}

export function getVersionMeta(version: DocsMeta['versions'][number]) {
  const versionPath = path.join(DOCS_PATH, version.folder);

  if (!fs.existsSync(versionPath)) {
    throw new Response(`Documentation directory "${version.folder}" not found`, { status: 404 });
  }

  const versionMeta = readJSON<VersionMeta>(path.join(versionPath, 'meta.json'), `Documentation metadata for "${version.title}" was not found`);

  return { versionPath, versionMeta };
}

export function getCategory(versionMeta: VersionMeta, categorySlug: string) {
  const category = versionMeta.categories.find((item) => item.slug === categorySlug);

  if (!category) {
    throw new Response(`Documentation category "${categorySlug}" not found`, { status: 404 });
  }

  return category;
}

export function getPage(category: VersionMeta['categories'][number], pageSlug: string) {
  const page = category.items.find((item) => item.slug === pageSlug);

  if (!page) {
    throw new Response(`Documentation page "${pageSlug}" not found`, { status: 404 });
  }

  return page;
}
