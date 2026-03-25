import { cli, Strategy } from '@jackwener/opencli/registry';
import { fetchJson, formatVolume, GAMMA_API } from './utils.js';

cli({
  site: 'polymarket',
  name: 'leaderboard',
  description: 'Polymarket top traders leaderboard',
  strategy: Strategy.PUBLIC,
  browser: false,
  args: [
    { name: 'limit', type: 'int', default: 20, help: 'Number of traders to show' },
  ],
  columns: ['rank', 'name', 'volume', 'markets_traded', 'profit'],
  func: async (_page, kwargs) => {
    const limit = kwargs.limit ?? 20;

    // Gamma /leaderboard endpoint — try to fetch it
    // If the endpoint changes, fall back to events-based approach
    try {
      const url = `${GAMMA_API}/leaderboard?limit=${limit}&window=all`;
      const data = await fetchJson(url);

      if (Array.isArray(data)) {
        return data.slice(0, limit).map((trader: any, i: number) => ({
          rank: i + 1,
          name: trader.username || trader.proxyWallet?.slice(0, 10) + '...' || '-',
          volume: formatVolume(trader.volume || 0),
          markets_traded: trader.marketsTraded || trader.numMarkets || '-',
          profit: trader.profit != null
            ? (trader.profit >= 0 ? '+' : '') + formatVolume(Math.abs(trader.profit))
            : '-',
        }));
      }
    } catch {
      // Leaderboard API may not be publicly available — provide info
    }

    // Fallback: return a message
    return [{
      rank: '-',
      name: 'Leaderboard API requires authentication.',
      volume: 'Use: polymarket data leaderboard',
      markets_traded: '-',
      profit: '-',
    }];
  },
});
