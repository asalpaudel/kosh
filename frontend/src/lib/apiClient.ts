/** Root URL of the backend API. Vite variables are public build-time configuration. */
const configuredOrigin = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");
if (import.meta.env.PROD && configuredOrigin?.startsWith("http://")) {
  throw new Error("VITE_API_URL must use HTTPS in production");
}
const apiOrigin = configuredOrigin ?? (import.meta.env.PROD ? "" : "http://localhost:8080");
export const API_BASE = apiOrigin ? `${apiOrigin}/api` : "/api";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function errorMessage(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const record = body as Record<string, unknown>;
  if (typeof record.error === "string") return record.error;
  if (typeof record.message === "string") return record.message;
  return null;
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const response = await fetch(input, {
    ...init,
    credentials: init.credentials ?? "include",
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    let message = `${String(response.status)} ${response.statusText}`.trim();

    try {
      if (contentType.includes("application/json")) {
        message = errorMessage(await response.json()) ?? message;
      } else {
        message = (await response.text()) || message;
      }
    } catch {
      // Preserve the status-derived message when the body is malformed.
    }

    throw new ApiError(message, response.status);
  }

  return response;
}
