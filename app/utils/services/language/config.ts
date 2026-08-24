import type { Language } from './types';

export const languages: readonly Language[] = ['en'] as const;
export const fallbacklng: Language = 'en';

export function isSupportedLanguage(value: string | null | undefined): value is Language {
  return !!value && (languages as readonly string[]).includes(value);
}
