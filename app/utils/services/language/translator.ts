import type { Messages } from './types';

export type MessageValue =
  | string
  | number
  | boolean
  | MessageValue[]
  | {
      [key: string]: MessageValue;
    };

function resolveMessage(messages: Messages, key: string): MessageValue | undefined {
  const parts = key.split('.');

  let current: MessageValue | undefined = messages;

  for (const part of parts) {
    if (typeof current !== 'object' || current === null || Array.isArray(current)) {
      return undefined;
    }

    current = current[part];
  }

  return current;
}

export function resolveTranslation(messages: Messages, key: string) {
  return resolveMessage(messages, key);
}

function replaceParams(text: string, params?: Record<string, string | number>) {
  if (!params) {
    return text;
  }

  for (const [key, value] of Object.entries(params)) {
    text = text.replaceAll(`{{${key}}}`, String(value));
  }

  return text;
}

export function createTranslator(messages: Messages) {
  return function t<T = string>(key: string, params?: Record<string, string | number>): T {
    const resolved = resolveMessage(messages, key);

    if (resolved === undefined) {
      if (import.meta.env?.DEV) {
        console.warn(`[MoonLocale] Missing translation key: "${key}"`);
      }

      return key as T;
    }

    if (typeof resolved !== 'string') {
      return resolved as T;
    }

    return replaceParams(resolved, params) as T;
  };
}
