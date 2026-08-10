const HEADER = "X-XSRF-TOKEN";
const COOKIE = "XSRF-TOKEN";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);

export function csrfToken() {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Attaches the CSRF token to every mutating request the app makes.
 *
 * Wrapping fetch once is deliberate: the components call fetch directly in dozens of
 * places, and a single choke point cannot be forgotten the way a per-call header can.
 * Requests that already set the header keep theirs, and safe methods are left alone.
 */
export function installCsrf() {
  if (typeof window === "undefined" || window.__koshCsrfInstalled) return;
  window.__koshCsrfInstalled = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = (input, init = {}) => {
    const method = (init.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    if (SAFE_METHODS.has(method)) return originalFetch(input, init);

    const token = csrfToken();
    if (!token) return originalFetch(input, init);

    const headers = new Headers(init.headers ?? (input instanceof Request ? input.headers : undefined));
    if (!headers.has(HEADER)) headers.set(HEADER, token);

    return originalFetch(input, { ...init, headers });
  };
}
