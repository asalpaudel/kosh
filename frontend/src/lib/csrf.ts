const HEADER = "X-XSRF-TOKEN";
const COOKIE = "XSRF-TOKEN";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);

declare global {
  interface Window {
    __koshCsrfInstalled?: boolean;
  }
}

export function csrfToken(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

/** Installs one same-API fetch boundary for CSRF token bootstrapping and attachment. */
export function installCsrf(apiBase: string): void {
  if (window.__koshCsrfInstalled === true) return;
  window.__koshCsrfInstalled = true;

  const originalFetch = window.fetch.bind(window);
  const apiUrl = new URL(apiBase, window.location.href);

  const wrappedFetch: typeof window.fetch = async (input, init = {}) => {
    const method = (init.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    if (SAFE_METHODS.has(method)) return originalFetch(input, init);

    const inputUrl = input instanceof Request ? input.url : input.toString();
    const target = new URL(inputUrl, window.location.href);
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

  window.fetch = wrappedFetch;
}
