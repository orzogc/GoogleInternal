export function parseCookies(cookieString: string, keys: string[]): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};
  
  // Initialize result with undefined for all requested keys
  keys.forEach(key => {
    result[key] = undefined;
  });

  if (!cookieString) {
    return result;
  }

  const pairs = cookieString.split(';');
  for (const pair of pairs) {
    const [key, value] = pair.split('=').map(s => s.trim());
    if (keys.includes(key)) {
      result[key] = value;
    }
  }

  return result;
}
