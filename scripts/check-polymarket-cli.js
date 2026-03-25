#!/usr/bin/env node

/**
 * Post-install check: verify polymarket CLI is available.
 * If not installed, print installation instructions.
 */

import { execFileSync } from 'node:child_process';

function isInstalled(binary) {
  try {
    execFileSync('which', [binary], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

const installed = isInstalled('polymarket');

if (installed) {
  console.log('✅ polymarket CLI detected.');
} else {
  console.log(`
⚠️  polymarket CLI not found.

Some advanced commands (trading, wallet) require the polymarket CLI binary.
Read-only market data commands work without it (using public APIs directly).

To install polymarket CLI:

  # Homebrew (macOS / Linux)
  brew tap Polymarket/polymarket-cli https://github.com/Polymarket/polymarket-cli
  brew install polymarket

  # Or build from source (requires Rust)
  git clone https://github.com/Polymarket/polymarket-cli
  cd polymarket-cli && cargo install --path .

More info: https://github.com/Polymarket/polymarket-cli
`);
}
