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
  client: string;
  os: string;
  browser: string;
  ip_address: string;
  country: string;
  region: string;
  city: string;
}

import { UAParser } from 'ua-parser-js';

export const getSessionData = (request: Request): SessionData => {
  const userAgent = request.headers.get('user-agent') ?? '';
  const result = UAParser(userAgent);

  let client = 'Desktop';
  if (result.device.type === 'mobile') {
    client = 'Mobile';
  } else if (result.device.type === 'tablet') {
    client = 'Tablet';
  }
  return {
    client: client || 'Unknown',
    os: result.os.name || 'Unknown',
    browser: result.browser.name || 'Unknown',
    ip_address: request.headers.get('cf-connecting-ip') || 'Unknown',
    country: request.headers.get('cf-ipcountry') || 'Unknown',
    region: request.headers.get('cf-region') || 'Unknown',
    city: request.headers.get('cf-ipcity') || 'Unknown',
  };
};
export const formatUrl = (value: string): string => {
  return value
    .trim()
    .replace(/\s/g, '_')
    .replace(/[/:?#[\]@!$&'()*+,;=<>%"{}|\\^`~]/g, '_');
};
