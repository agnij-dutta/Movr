export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://movr-api.vercel.app';

/**
 * Search for packages.
 * @param {string} query - Search term. Pass a single whitespace to retrieve all packages.
 * @param {object} options - Additional CLI options such as network or verbose.
 */
export async function searchPackages(query, options = {}) {
  const res = await fetch(`${API_BASE}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, options })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * Convenience helper for fetching the full package list.
 */
export async function getAllPackages(options = {}) {
  // An empty query string would be rejected by the backend, so use a single space.
  return searchPackages(' ', options);
} 