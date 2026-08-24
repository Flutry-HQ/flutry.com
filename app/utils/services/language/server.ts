import parser from 'accept-language-parser';

import type { Language } from './types';
import { fallbacklng, isSupportedLanguage } from './config';

export function getLanguage(request: Request): Language {
  const cookie = request.headers.get('cookie');
  const match = cookie?.match(/(?:^|;\s*)lang=([^;]+)/);
  const cookieLang = match?.[1];

  if (isSupportedLanguage(cookieLang)) {
    return cookieLang;
  }

  const accept = request.headers.get('accept-language');
  const parsed = parser.parse(accept ?? '');
  const found = parsed.find((item) => isSupportedLanguage(item.code));

  return found ? (found.code as Language) : fallbacklng;
}
