// Vite resolves this at build time into a map of { filePath: () => import(filePath) }.
// Because every .mdx file is now compiled by the @mdx-js/rollup plugin, each entry
// resolves directly to a React component - no manual compile/eval step needed.
export const docsMdxModules = import.meta.glob('/app/assets/docs/**/*.mdx');

export function hasDocsContent(mdxPath: string) {
  return `/app/assets/docs/${mdxPath}.mdx` in docsMdxModules;
}

export function loadDocsContent(mdxPath: string) {
  const key = `/app/assets/docs/${mdxPath}.mdx`;

  return docsMdxModules[key] as (() => Promise<{ default: React.ComponentType }>) | undefined;
}
