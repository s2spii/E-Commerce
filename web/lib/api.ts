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

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]!) : undefined;
}

// Cross-origin SPAs cannot read the API's `csrf_token` cookie via document.cookie,
// so the token value is also delivered in the body of the priming endpoint and
// cached here. Same-origin deployments read the cookie directly.
let cachedCsrfToken: string | undefined;

/**
 * Returns the CSRF token to echo in the `x-csrf-token` header for the API's
 * double-submit check. Prefers the readable cookie (same-origin); otherwise
 * fetches and caches the token from the priming endpoint's response body.
 */
async function ensureCsrfToken(forceRefresh = false): Promise<string | undefined> {
  if (forceRefresh) cachedCsrfToken = undefined;

  const fromCookie = readCookie('csrf_token');
  if (fromCookie) return fromCookie;
  if (cachedCsrfToken) return cachedCsrfToken;

  try {
    const res = await fetch(`${API_BASE}/api/csrf`, { credentials: 'include' });
    if (res.ok) {
      const body = (await res.json()) as { data?: { csrfToken?: string } };
      cachedCsrfToken = body?.data?.csrfToken ?? readCookie('csrf_token');
    }
  } catch {
    /* surfaced by the caller's normal error handling */
  }
  return cachedCsrfToken ?? readCookie('csrf_token');
}

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
  const method = (rest.method ?? 'GET').toUpperCase();
  const url = buildUrl(path, params);
  const isMutation = !SAFE_METHODS.has(method);

  const attempt = (csrf?: string): Promise<Response> => {
    const finalHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(headers as Record<string, string> | undefined),
    };
    if (isMutation && csrf) finalHeaders['x-csrf-token'] = csrf;
    const init: RequestInit = { credentials: 'include', headers: finalHeaders, ...rest };
    if (body !== undefined) init.body = typeof body === 'string' ? body : JSON.stringify(body);
    return fetch(url, init);
  };

  let res: Response;
  try {
    res = await attempt(isMutation ? await ensureCsrfToken() : undefined);

    // The CSRF token may be stale (rotated/expired). On a CSRF rejection,
    // refresh the token once and retry the request.
    if (res.status === 403 && isMutation) {
      let csrfFailure = false;
      try {
        const peek = (await res.clone().json()) as ServerError;
        csrfFailure = /csrf/i.test(peek?.error?.message ?? '');
      } catch {
        /* non-JSON body — fall through */
      }
      if (csrfFailure) {
        const refreshed = await ensureCsrfToken(true);
        if (refreshed) res = await attempt(refreshed);
      }
    }
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
