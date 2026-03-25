import { cli, Strategy } from '@jackwener/opencli/registry';
import { fetchJson, GAMMA_API, CLOB_API } from './utils.js';

cli({
  site: 'polymarket',
  name: 'price-history',
  description: 'Show price history for a Polymarket market',
  strategy: Strategy.PUBLIC,
  browser: false,
  args: [
    { name: 'slug', type: 'str', required: true, positional: true, help: 'Market slug (e.g. "will-trump-win")' },
    {
      name: 'interval', type: 'str', default: '1w',
      help: 'Time interval: 1h, 6h, 1d, 1w, 1m, max',
      choices: ['1h', '6h', '1d', '1w', '1m', 'max'],
    },
    { name: 'fidelity', type: 'int', default: 60, help: 'Data points granularity in minutes' },
  ],
  columns: ['time', 'yes_price', 'change'],
  func: async (_page, kwargs) => {
    const slug = kwargs.slug as string;
    const interval = kwargs.interval || '1w';
    const fidelity = kwargs.fidelity || 60;

    // Step 1: Get market by slug to find token IDs
    const markets = await fetchJson(`${GAMMA_API}/markets?slug=${encodeURIComponent(slug)}`);
    if (!Array.isArray(markets) || markets.length === 0) {
      throw new Error(`Market not found: "${slug}". Try using the slug from the URL, e.g. "will-trump-win".`);
    }

    const market = markets[0];
    let tokenIds: string[];
    try {
      tokenIds = JSON.parse(market.clobTokenIds || '[]');
    } catch {
      throw new Error('Failed to parse token IDs from market data.');
    }

    if (tokenIds.length === 0) {
      throw new Error('No token IDs found for this market.');
    }

    // Step 2: Fetch price history from CLOB API (YES token = first token)
    const yesTokenId = tokenIds[0];
    const historyUrl = `${CLOB_API}/prices-history?market=${yesTokenId}&interval=${interval}&fidelity=${fidelity}`;
    const history = await fetchJson(historyUrl);

    if (!history || !history.history || !Array.isArray(history.history)) {
      return [];
    }

    let prevPrice = 0;
    return history.history.map((point: any) => {
      const price = parseFloat(point.p) * 100;
      const change = prevPrice === 0 ? '-' : (price - prevPrice > 0 ? '+' : '') + (price - prevPrice).toFixed(1) + '%';
      prevPrice = price;

      const date = new Date(point.t * 1000);
      return {
        time: date.toISOString().replace('T', ' ').slice(0, 16),
        yes_price: price.toFixed(1) + '%',
        change: change,
      };
    });
  },
});
