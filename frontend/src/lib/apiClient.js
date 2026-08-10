export async function apiFetch(input, init = {}) {
  const response = await fetch(input, {
    ...init,
    credentials: init.credentials ?? "include",
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    let message = `${response.status} ${response.statusText}`.trim();

    try {
      if (contentType.includes("application/json")) {
        const body = await response.json();
        message = body.error || body.message || message;
      } else {
        message = (await response.text()) || message;
      }
    } catch {
      // Keep the HTTP status when the error body cannot be decoded.
    }

    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return response;
}
