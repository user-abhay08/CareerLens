const TOKEN_KEY = 'careerlens_token';
const AUTH_CREDENTIAL_ROUTES = ['/auth/login', '/auth/register', '/auth/social'];

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, { method = 'GET', body, formData } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  // Never set Content-Type for FormData — the browser must generate the
  // multipart boundary itself, otherwise the server cannot parse the body.
  if (body && !formData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: formData || (body ? JSON.stringify(body) : undefined),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    if (res.status === 401 && !AUTH_CREDENTIAL_ROUTES.some((p) => path.startsWith(p))) {
      setToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('careerlens:unauthorized', { detail: data?.error || '' }));
      }
    }
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}
