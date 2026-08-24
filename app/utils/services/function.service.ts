//! Slepp timer
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

//! Formated Zod error
export const FormatZodError = (error: any) => {
  const formattedErrors: Record<string, any> = {};

  error.issues.forEach((issue: any) => {
    let current = formattedErrors;

    issue.path.forEach((key: string | number, index: number) => {
      const isLast = index === issue.path.length - 1;

      if (isLast) {
        if (!current[key]) {
          current[key] = issue.message;
        }
        return;
      }

      if (!current[key]) {
        current[key] = {};
      }

      current = current[key];
    });
  });

  return formattedErrors;
};

//! Automatic block all interaction is loading site
export function blockUserInteraction() {
  const prevent = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    return false;
  };

  document.addEventListener('click', prevent, true);
  document.addEventListener('submit', prevent, true);
  document.addEventListener('pointerdown', prevent, true);
  document.addEventListener('keydown', prevent, true);

  const links = Array.from(document.querySelectorAll('a'));
  links.forEach((link) => {
    (link as HTMLAnchorElement).addEventListener('click', prevent, true);
  });

  return function unblock() {
    document.removeEventListener('click', prevent, true);
    document.removeEventListener('submit', prevent, true);
    document.removeEventListener('pointerdown', prevent, true);
    document.removeEventListener('keydown', prevent, true);
    links.forEach((link) => {
      (link as HTMLAnchorElement).removeEventListener('click', prevent, true);
    });
  };
}

export interface SessionData {
  ip: string | null;
  device: string;
  os: string | null;
  browser: string | null;
}

import { UAParser } from 'ua-parser-js';

export const getSessionData = (request: Request, device: 'web' | 'desktop' | 'mobile'): SessionData => {
  const userAgent = request.headers.get('user-agent') ?? '';
  const result = UAParser(userAgent);
  return {
    ip: request.headers.get('cf-connecting-ip') ?? null,
    device: device,
    os: result.os.name ?? null,
    browser: result.browser.name ?? null,
  };
};
export const formatUrl = (value: string): string => {
  return value
    .trim()
    .replace(/\s/g, '_')
    .replace(/[/:?#[\]@!$&'()*+,;=<>%"{}|\\^`~]/g, '_');
};
