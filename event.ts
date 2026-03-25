import { cli, Strategy } from '@jackwener/opencli/registry';
import { fetchJson, formatVolume, parseOutcomePrices, truncate, GAMMA_API } from './utils.js';

cli({
  site: 'polymarket',
  name: 'event',
  description: 'Show detailed sub-markets for a Polymarket event (by slug or ID)',
  strategy: Strategy.PUBLIC,
  browser: false,
  args: [
    { name: 'slug', type: 'str', required: true, positional: true, help: 'Event slug or ID (e.g. "fed-decision-in-october" or "500")' },
    { name: 'all', type: 'boolean', default: false, help: 'Include closed/resolved markets' },
  ],
  columns: ['rank', 'question', 'yes', 'no', 'volume', 'end_date'],
  func: async (_page, kwargs) => {
    const slug = kwargs.slug as string;

    // Try slug first, then ID
    let events: any[];
    if (/^\d+$/.test(slug)) {
      events = await fetchJson(`${GAMMA_API}/events?id=${slug}`);
    } else {
      events = await fetchJson(`${GAMMA_API}/events?slug=${encodeURIComponent(slug)}`);
    }

    if (!Array.isArray(events) || events.length === 0) {
      // Fallback: try as market slug
      const markets = await fetchJson(`${GAMMA_API}/markets?slug=${encodeURIComponent(slug)}`);
      if (Array.isArray(markets) && markets.length > 0) {
        return markets.map((m: any, i: number) => {
          const prices = parseOutcomePrices(m);
          return {
            rank: i + 1,
            question: truncate(m.question || '', 70),
            yes: prices.yes,
            no: prices.no,
            volume: formatVolume(m.volumeNum || 0),
            end_date: m.endDate ? m.endDate.split('T')[0] : '-',
          };
        });
      }
      return [];
    }

    const event = events[0];
    const markets = event.markets || [];

    // Filter to active markets unless --all
    const filtered = kwargs.all ? markets : markets.filter((m: any) => m.active && !m.closed);

    return filtered.map((m: any, i: number) => {
      const prices = parseOutcomePrices(m);
      return {
        rank: i + 1,
        question: truncate(m.question || m.groupItemTitle || '', 70),
        yes: prices.yes,
        no: prices.no,
        volume: formatVolume(m.volumeNum || 0),
        end_date: m.endDate ? m.endDate.split('T')[0] : '-',
      };
    });
  },
});
