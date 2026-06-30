export function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function setToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('auth_token');
}

function decodePayload(token: string): any {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodePayload(token);
  if (!decoded?.exp) return true;
  return decoded.exp * 1000 < Date.now();
}

export function getRoleFromToken(token: string): 'admin' | 'user' | null {
  const decoded = decodePayload(token);
  if (!decoded?.user) return null;
  return decoded.user.isAdmin ? 'admin' : 'user';
}

export function getUserFromToken(token: string): any {
  const decoded = decodePayload(token);
  return decoded?.user ?? null;
}
