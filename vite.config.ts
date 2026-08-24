import { reactRouter } from '@react-router/dev/vite';
import rehypeShiki from '@shikijs/rehype';
import tailwindcss from '@tailwindcss/vite';
import remarkGfm from 'remark-gfm';
import mdx from '@mdx-js/rollup';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    mdx({
      providerImportSource: '@mdx-js/react',
      remarkPlugins: [remarkGfm],
      rehypePlugins: [[rehypeShiki, { theme: 'github-dark-default' }]],
    }),
    tailwindcss(),
    reactRouter(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
