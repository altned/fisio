const cache: Record<string, string> = {};

export function getEnv(name: 'NEXT_PUBLIC_API_BASE_URL'): string {
  if (cache[name]) return cache[name];
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing env: ${name}`);
  }
  cache[name] = value;
  return value;
}

export function getAdminToken(): string | undefined {
  const token = process.env.NEXT_PUBLIC_ADMIN_TOKEN;
  return token && token.trim().length > 0 ? token : undefined;
}
