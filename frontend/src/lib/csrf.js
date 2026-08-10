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
export function installCsrf(apiBase) {
  if (typeof window === "undefined" || window.__koshCsrfInstalled) return;
  window.__koshCsrfInstalled = true;

  const originalFetch = window.fetch.bind(window);
  const apiUrl = new URL(apiBase, window.location.href);

  window.fetch = async (input, init = {}) => {
    const method = (init.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    if (SAFE_METHODS.has(method)) return originalFetch(input, init);

    const target = new URL(input instanceof Request ? input.url : input, window.location.href);
    const apiPath = apiUrl.pathname.endsWith("/") ? apiUrl.pathname : `${apiUrl.pathname}/`;
    const isApiRequest = target.origin === apiUrl.origin
      && (target.pathname === apiUrl.pathname || target.pathname.startsWith(apiPath));
    if (!isApiRequest) return originalFetch(input, init);

    if (!csrfToken()) {
      await originalFetch(`${apiUrl.toString().replace(/\/$/, "")}/csrf`, {
        method: "GET",
        credentials: "include",
      });
    }

    const token = csrfToken();
    if (!token) return originalFetch(input, init);

    const headers = new Headers(init.headers ?? (input instanceof Request ? input.headers : undefined));
    if (!headers.has(HEADER)) headers.set(HEADER, token);

    return originalFetch(input, { ...init, headers });
  };
}
