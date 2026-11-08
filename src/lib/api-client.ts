/** Cliente HTTP del navegador (equivale a http.js + servicios de pixel-admin-panel). */
export class ApiClientError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors: Record<string, string> | null = null,
  ) {
    super(message);
  }
}

export async function api<T = unknown>(url: string, init: { method?: string; body?: unknown; formData?: FormData } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;
  if (init.formData) body = init.formData;
  else if (init.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.body);
  }
  let res: Response;
  try {
    res = await fetch(url, { method: init.method ?? (body ? "POST" : "GET"), headers, body, credentials: "same-origin" });
  } catch {
    throw new ApiClientError(0, "No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.");
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiClientError(res.status, data?.message ?? "Ocurrió un error inesperado.", data?.fieldErrors ?? null);
  return data as T;
}
