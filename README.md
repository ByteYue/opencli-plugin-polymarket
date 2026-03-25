# opencli-plugin-polymarket

OpenCLI plugin for [Polymarket](https://polymarket.com) prediction market analysis.

Browse markets, search events, analyze price trends — all from your terminal.

## Install

```bash
opencli plugin install github:ByteYue/opencli-plugin-polymarket
```

## Commands

| Command | Description |
|---------|-------------|
| `opencli polymarket hot` | Top markets by 24h volume |
| `opencli polymarket search <query>` | Search prediction markets |
| `opencli polymarket event <slug>` | Event details with sub-markets |
| `opencli polymarket price-history <slug>` | Price history for a market |
| `opencli polymarket leaderboard` | Top traders leaderboard |

## Examples

```bash
# What does the market think about Fed rate cuts?
opencli polymarket search "fed rate cut"

# Browse hottest markets right now
opencli polymarket hot --limit 10

# Deep dive into a specific event
opencli polymarket event fed-decision-in-october

# Check price history
opencli polymarket price-history will-trump-win --interval 1w

# Top traders
opencli polymarket leaderboard --limit 10
```

## Data Sources

All read-only commands use Polymarket's public APIs directly (no authentication required):
- **Gamma API** (`gamma-api.polymarket.com`) — events, markets, search
- **CLOB API** (`clob.polymarket.com`) — orderbook, prices, price history
- **Data API** (`data-api.polymarket.com`) — trades, positions, leaderboard

## Optional: polymarket CLI

For trading operations (placing orders, managing wallet), install the [polymarket CLI](https://github.com/Polymarket/polymarket-cli):

```bash
brew tap Polymarket/polymarket-cli https://github.com/Polymarket/polymarket-cli
brew install polymarket
```

## License

MIT
