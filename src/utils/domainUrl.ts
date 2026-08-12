const LANDING_DOMAINS = ['quickpost.in', 'www.quickpost.in'];
const APP_DOMAIN = 'app.quickpost.in';

/** On quickpost.in/www → full app subdomain URL. On localhost/app subdomain → relative path. */
export function appUrl(path: string): string {
  if (LANDING_DOMAINS.includes(window.location.hostname)) {
    return `https://${APP_DOMAIN}${path}`;
  }
  return path;
}

/** On app.quickpost.in → full landing domain URL. On localhost/landing domain → relative path. */
export function landingUrl(path = '/'): string {
  if (window.location.hostname === APP_DOMAIN) {
    return `https://quickpost.in${path}`;
  }
  return path;
}
