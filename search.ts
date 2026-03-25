import { cli, Strategy } from '@jackwener/opencli/registry';
import { fetchJson, formatVolume, parseOutcomePrices, truncate, GAMMA_API } from './utils.js';

cli({
  site: 'polymarket',
  name: 'search',
  description: 'Search Polymarket prediction markets by keyword',
  strategy: Strategy.PUBLIC,
  browser: false,
  args: [
    { name: 'query', type: 'str', required: true, positional: true, help: 'Search keyword (e.g. "fed rate cut", "tesla", "iran")' },
    { name: 'limit', type: 'int', default: 20, help: 'Max results' },
  ],
  columns: ['rank', 'question', 'yes', 'volume_24h', 'volume', 'slug'],
  func: async (_page, kwargs) => {
    const query = (kwargs.query as string).toLowerCase();
    const limit = kwargs.limit ?? 20;

    // Gamma API doesn't have a search parameter, so we fetch a large batch and filter client-side
    const url = `${GAMMA_API}/events?active=true&closed=false&limit=50&order=volume&ascending=false`;
    const events = await fetchJson(url);
    if (!Array.isArray(events)) return [];

    const results: any[] = [];
    for (const event of events) {
      const title = (event.title || '').toLowerCase();
      const desc = (event.description || '').toLowerCase();
      const markets = event.markets || [];
      const eventMatch = title.includes(query) || desc.includes(query);

      for (const m of markets) {
        const q = (m.question || '').toLowerCase();
        const mDesc = (m.description || '').toLowerCase();
        if (eventMatch || q.includes(query) || mDesc.includes(query)) {
          const prices = parseOutcomePrices(m);
          const vol24 = m.volume24hr || m.volume24hrClob || 0;
          results.push({
            rank: results.length + 1,
            question: truncate(m.question || event.title || '', 60),
            yes: prices.yes,
            volume_24h: formatVolume(vol24),
            volume: formatVolume(m.volumeNum || 0),
            slug: m.slug || '',
          });
        }
        if (results.length >= limit) break;
      }
      if (results.length >= limit) break;
    }

    return results.slice(0, limit);
  },
});
