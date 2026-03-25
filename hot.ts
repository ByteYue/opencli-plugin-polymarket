import { cli, Strategy } from '@jackwener/opencli/registry';
import { fetchJson, formatVolume, parseOutcomePrices, truncate, GAMMA_API } from './utils.js';

cli({
  site: 'polymarket',
  name: 'hot',
  description: 'Top Polymarket prediction markets by 24h trading volume',
  strategy: Strategy.PUBLIC,
  browser: false,
  args: [
    { name: 'limit', type: 'int', default: 20, help: 'Number of markets to show' },
    { name: 'tag', type: 'str', help: 'Filter by tag (e.g. politics, crypto, sports)' },
  ],
  columns: ['rank', 'question', 'yes', 'volume_24h', 'volume', 'end_date'],
  func: async (_page, kwargs) => {
    const limit = kwargs.limit ?? 20;
    let url = `${GAMMA_API}/events?active=true&closed=false&order=volume_24hr&ascending=false&limit=${limit}`;
    if (kwargs.tag) {
      url += `&tag=${encodeURIComponent(kwargs.tag)}`;
    }

    const events = await fetchJson(url);
    if (!Array.isArray(events)) return [];

    const results: any[] = [];
    for (const event of events) {
      const markets = event.markets || [];
      if (markets.length === 0) continue;

      // Use primary (highest-volume) market from the event
      const m = markets[0];
      const prices = parseOutcomePrices(m);
      const vol24 = m.volume24hr || m.volume24hrClob || 0;

      results.push({
        rank: results.length + 1,
        question: truncate(m.question || event.title || '', 60),
        yes: prices.yes,
        volume_24h: formatVolume(vol24),
        volume: formatVolume(m.volumeNum || 0),
        end_date: m.endDate ? m.endDate.split('T')[0] : '-',
      });
    }

    return results;
  },
});
