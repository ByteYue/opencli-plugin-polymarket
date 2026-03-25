/**
 * Shared utilities for Polymarket plugin.
 * All API calls go through these helpers for consistent error handling and proxy support.
 */

const GAMMA_API = 'https://gamma-api.polymarket.com';
const CLOB_API = 'https://clob.polymarket.com';
const DATA_API = 'https://data-api.polymarket.com';

export { GAMMA_API, CLOB_API, DATA_API };

/**
 * Fetch JSON from a URL with proxy support.
 * Uses curl (which natively respects http_proxy/https_proxy env vars)
 * for reliable proxy support. Falls back to Node.js native fetch.
 */
export async function fetchJson(url: string): Promise<any> {
  const proxyUrl = process.env.https_proxy || process.env.HTTPS_PROXY ||
                   process.env.http_proxy || process.env.HTTP_PROXY;

  if (proxyUrl) {
    // Use curl for proxy support — it natively respects proxy env vars
    const { execFileSync } = await import('node:child_process');
    try {
      const result = execFileSync('curl', ['-s', '-f', '--connect-timeout', '10', url], {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });
      return JSON.parse(result);
    } catch (err: any) {
      throw new Error(`Failed to fetch ${url}: ${err.message || err}`);
    }
  }

  // No proxy — use native fetch
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} ${resp.statusText} from ${url}`);
  }
  return resp.json();
}

/**
 * Format a dollar volume into a human-readable string.
 * e.g., 1234567 → "$1.2M", 12345 → "$12.3K", 123 → "$123"
 */
export function formatVolume(value: number): string {
  if (value >= 1e9) return '$' + (value / 1e9).toFixed(1) + 'B';
  if (value >= 1e6) return '$' + (value / 1e6).toFixed(1) + 'M';
  if (value >= 1e3) return '$' + (value / 1e3).toFixed(1) + 'K';
  return '$' + Math.round(value);
}

/**
 * Format outcome price to a percentage string.
 * e.g., "0.523" → "52.3%"
 */
export function formatPrice(priceStr: string): string {
  const num = parseFloat(priceStr);
  if (isNaN(num)) return '-';
  return (num * 100).toFixed(1) + '%';
}

/**
 * Parse outcome prices from a market object.
 * Returns { yes, no } as formatted percentage strings.
 */
export function parseOutcomePrices(market: any): { yes: string; no: string } {
  try {
    const prices = JSON.parse(market.outcomePrices || '[]');
    return {
      yes: prices[0] ? formatPrice(prices[0]) : '-',
      no: prices[1] ? formatPrice(prices[1]) : '-',
    };
  } catch {
    return { yes: '-', no: '-' };
  }
}

/**
 * Truncate a string to a max length, appending "…" if truncated.
 */
export function truncate(str: string, maxLen: number = 80): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}
