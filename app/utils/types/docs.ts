export interface DocsVersion {
  title: string;
  folder: string;
  slug: string;
  index?: string;
}

export interface DocsMeta {
  versions: DocsVersion[];
}

export interface DocsItem {
  title: string;
  slug: string;
}

export interface DocsCategory {
  title: string;
  folder: string;
  slug: string;
  items: DocsItem[];
}

export interface VersionMeta {
  title: string;
  index?: string;
  categories: DocsCategory[];
}

export interface DocsNavigationItem extends DocsItem {
  url: string;
}

export interface DocsNavigationCategory {
  title: string;
  folder: string;
  slug: string;
  items: DocsNavigationItem[];
}

export interface DocsLoaderData {
  versions: DocsVersion[];
  currentVersion: DocsVersion;
  categories: DocsNavigationCategory[];
}

export interface SidebarLeftProps {
  versions: DocsVersion[];
  currentVersion: DocsVersion;
  categories: DocsNavigationCategory[];
}
