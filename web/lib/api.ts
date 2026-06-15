/**
 * Typed fetch wrapper for the Maison Luma API.
 *
 * - Prefixes every request with `NEXT_PUBLIC_API_URL` + `/api`.
 * - Always sends cookies (`credentials: 'include'`) — the cart token and the
 *   auth session both live in signed httpOnly cookies.
 * - Unwraps the `{ data }` envelope and throws an `ApiError` carrying the
 *   server-provided message on a non-2xx response.
 */

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface ServerError {
  error?: { code?: string; message?: string; details?: unknown };
}

interface Envelope<T> {
  data: T;
}

export interface ApiOptions extends Omit<RequestInit, 'body'> {
  /** Plain object serialised to JSON, or a pre-built BodyInit. */
  body?: unknown;
  /** Query string params appended to the path (undefined/null values skipped). */
  params?: Record<string, string | number | boolean | undefined | null>;
}

function buildUrl(path: string, params?: ApiOptions['params']): string {
  const url = `${API_BASE}/api${path.startsWith('/') ? path : `/${path}`}`;
  if (!params) return url;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.append(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${url}?${qs}` : url;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, params, headers, ...rest } = options;

  const init: RequestInit = {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...rest,
  };

  if (body !== undefined) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, params), init);
  } catch (err) {
    // Network failure / API unreachable.
    throw new ApiError(
      'Service indisponible. Veuillez réessayer dans un instant.',
      0,
      'NETWORK_ERROR',
      err,
    );
  }

  // 204 No Content (e.g. logout) — nothing to parse.
  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  let parsed: unknown = undefined;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = undefined;
    }
  }

  if (!res.ok) {
    const serverError = parsed as ServerError | undefined;
    const message =
      serverError?.error?.message ?? `Une erreur est survenue (${res.status}).`;
    throw new ApiError(message, res.status, serverError?.error?.code, serverError?.error?.details);
  }

  // Successful responses are wrapped as { data: ... }.
  return (parsed as Envelope<T> | undefined)?.data as T;
}

/** Formats integer cents as a French EUR string, e.g. 1990 → "19,90 €". */
export function formatPrice(cents: number | null | undefined, currency = 'EUR'): string {
  const value = (cents ?? 0) / 100;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(value);
}

/** Formats an ISO date string as a French long date. */
export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
