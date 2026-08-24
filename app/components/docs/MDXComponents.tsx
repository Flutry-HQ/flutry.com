import type { MDXComponents } from 'mdx/types';

import CodeBlock from './CodeBlock';

export const mdxComponents: MDXComponents = {
  h1: ({ children }) => <h1 className="mb-6 mt-10 text-4xl font-bold tracking-tight text-white first:mt-0">{children}</h1>,

  h2: ({ children }) => <h2 className="mb-4 mt-10 text-2xl font-bold tracking-tight text-white">{children}</h2>,

  h3: ({ children }) => <h3 className="mb-3 mt-8 text-xl font-semibold text-white">{children}</h3>,

  h4: ({ children }) => <h4 className="mb-3 mt-6 text-lg font-semibold text-white">{children}</h4>,

  p: ({ children }) => <p className="mb-5 leading-7 text-slate-300">{children}</p>,

  ul: ({ children }) => <ul className="mb-5 ml-6 list-disc space-y-2 text-slate-300">{children}</ul>,

  ol: ({ children }) => <ol className="mb-5 ml-6 list-decimal space-y-2 text-slate-300">{children}</ol>,

  li: ({ children }) => <li className="leading-7">{children}</li>,

  blockquote: ({ children }) => <blockquote className="my-6 border-l-4 border-slate-700 pl-5 italic text-slate-400">{children}</blockquote>,

  a: ({ href, children }) => (
    <a href={href} className="text-sky-400 underline decoration-sky-400/30 underline-offset-4 transition hover:text-sky-300">
      {children}
    </a>
  ),

  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,

  em: ({ children }) => <em className="text-slate-200">{children}</em>,

  hr: () => <hr className="my-10 border-slate-800" />,

  /*
   * -------------------------------------------------------
   * Code
   * -------------------------------------------------------
   */

  pre: CodeBlock,

  /*
   * -------------------------------------------------------
   * Tables
   * -------------------------------------------------------
   */

  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  ),

  thead: ({ children }) => <thead className="bg-slate-900">{children}</thead>,

  tbody: ({ children }) => <tbody>{children}</tbody>,

  tr: ({ children }) => <tr className="border-b border-slate-800 last:border-b-0">{children}</tr>,

  th: ({ children }) => <th className="px-4 py-3 font-semibold text-white">{children}</th>,

  td: ({ children }) => <td className="px-4 py-3 text-slate-300">{children}</td>,
};
