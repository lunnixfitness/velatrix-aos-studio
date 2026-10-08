/**
 * Client-Side Authentication & Session Token Handler
 * Uses in-memory token cache backed by sessionStorage (NOT localStorage)
 */

let inMemoryToken: string | null = null;
let isInterceptorInitialized = false;

export function getSessionToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem('velatrix_auth_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.token) {
        inMemoryToken = parsed.token;
        return inMemoryToken;
      }
    }
  } catch {
    // Ignore parse error
  }
  return null;
}

export function setSessionToken(token: string | null): void {
  inMemoryToken = token;
}

export function handleUnauthorized(): void {
  inMemoryToken = null;
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem('velatrix_auth_session');
    localStorage.removeItem('velatrix_auth_session');
    localStorage.removeItem('velatrix_auth_user');
  } catch {
    // Ignore storage error
  }
  window.dispatchEvent(new CustomEvent('velatrix:unauthorized'));
}

/**
 * Authenticated fetch wrapper that attaches Authorization: Bearer <token>
 * and handles 401 by triggering automatic session termination.
 */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlStr =
    typeof input === 'string'
      ? input
      : input instanceof URL
      ? input.toString()
      : (input as Request).url;

  const isApiRequest = urlStr.includes('/api/');
  const isLoginEndpoint = urlStr.includes('/api/v1/auth/login');

  if (isApiRequest) {
    const token = getSessionToken();
    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : {}));

    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const updatedInit: RequestInit = {
      ...init,
      headers
    };

    const response = await fetch(input, updatedInit);

    if (response.status === 401 && !isLoginEndpoint && token) {
        // Só encerra sessão se havia token: 401 anônimo (pré-login) é esperado e não deve poluir o console.
        console.warn(`[AUTH] Sessão inválida/expirada (401) em ${urlStr}. Encerrando sessão.`);
        handleUnauthorized();
      }

    return response;
  }

  return fetch(input, init);
}

/**
 * Initializes global fetch interceptor to guarantee that:
 * 1. Every fetch to `/api/*` automatically carries `Authorization: Bearer <token>`.
 * 2. Any 401 response from `/api/*` (except login itself) immediately triggers logout.
 * 
 * Safely handles environments where window.fetch is read-only / has only a getter.
 */
export function initAuthFetchInterceptor(): void {
  if (typeof window === 'undefined' || isInterceptorInitialized) return;
  isInterceptorInitialized = true;

  try {
    const originalFetch = window.fetch ? window.fetch.bind(window) : undefined;
    if (!originalFetch) return;

    const interceptedFetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const urlStr =
        typeof input === 'string'
          ? input
          : input instanceof URL
          ? input.toString()
          : (input as Request).url;

      const isApiRequest = urlStr.includes('/api/');
      const isLoginEndpoint = urlStr.includes('/api/v1/auth/login');

      if (isApiRequest) {
        const token = getSessionToken();
        const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : {}));

        if (token && !headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`);
        }

        const updatedInit: RequestInit = {
          ...init,
          headers
        };

        const response = await originalFetch(input, updatedInit);

        if (response.status === 401 && !isLoginEndpoint && token) {
        // Só encerra sessão se havia token: 401 anônimo (pré-login) é esperado e não deve poluir o console.
        console.warn(`[AUTH] Sessão inválida/expirada (401) em ${urlStr}. Encerrando sessão.`);
        handleUnauthorized();
      }

        return response;
      }

      return originalFetch(input, init);
    };

    try {
      window.fetch = interceptedFetch;
    } catch {
      try {
        Object.defineProperty(window, 'fetch', {
          value: interceptedFetch,
          writable: true,
          configurable: true
        });
      } catch (defErr) {
        console.debug('[AUTH] window.fetch cannot be re-defined in sandbox; authFetch is used directly:', defErr);
      }
    }
  } catch (err) {
    console.debug('[AUTH] initAuthFetchInterceptor fallback:', err);
  }
}
