import type { ReactNode } from 'react';
import { useLanguage } from './context';
import { resolveTranslation } from './translator';

type RichTextProps = {
  k: string;
  values?: Record<string, ReactNode>;
};

export function RichText({ k, values = {} }: RichTextProps) {
  const { messages } = useLanguage();

  const resolved = resolveTranslation(messages, k);

  if (typeof resolved !== 'string') {
    return k;
  }

  return (
    <>
      {resolved.split(/(\{\{.*?\}\})/g).map((part, index) => {
        const match = part.match(/^\{\{(.+?)\}\}$/);

        if (!match) {
          return part;
        }

        const key = match[1];

        return <span key={index}>{values[key] ?? part}</span>;
      })}
    </>
  );
}
