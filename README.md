# Traft — Traders Draft

**Risk Manager & Pre-Trade Checklist for discretionary traders.**

Traft is a lightweight, offline-first web app that helps traders size positions correctly, enforce a pre-trade checklist before entering, and keep a structured trade journal — all running entirely in the browser with no backend or account required.

🔗 Live demo: [xian005.github.io/Traders-Draft](https://xian005.github.io/Traders-Draft/)

---

## Features

### 📐 Position Size Calculator
Calculates position size, risk amount, potential profit, and R:R ratio from account capital, risk %, entry, stop-loss, and take-profit — across four asset classes:
- **Forex** (lots, pip value, JPY pair support)
- **Crypto** (coins, notional value)
- **Indices** (contracts, point value)
- **Gold** (lots, point value)

### 🎓 Virtual Instructor
Live feedback on the current setup:
- Flags unfavorable or marginal R:R ratios
- Warns when risking more than 2% per trade
- Detects when a trade would breach a Prop Firm account's daily loss limit

### ✅ Pre-Trade Checklist
A customizable checklist (risk, market, strategy, psychology rules) that must be fully checked before a trade can be logged — enforcing discipline before execution, not after. Default rules are seeded on first run; custom rules can be added or removed freely.

### 📓 Trade Journal
- Log trades directly from the calculator once the checklist is complete
- Close open trades with an **R-multiple result** (e.g. `+2`, `-1`) rather than a blind win/loss toggle
- **Expectancy** (average R per trade) and win rate are computed automatically
- Attach a free-text **note** to any trade — at entry or after the fact (e.g. a post-mortem on a closed trade)
- Delete individual trades

### 👤 Multi-Account Support
- Create unlimited accounts, each with its own capital, currency, and trade history
- **Personal** or **Prop Firm** account types — Prop Firm accounts can set a daily loss limit, which feeds directly into the Virtual Instructor's warnings
- Delete accounts (cascades to their trades), with a confirmation step and a safeguard against deleting your last remaining account

### 🌍 Bilingual
Full French / English interface, switchable at any time via the language selector.

### 📚 Education Section
A glossary covering stop-loss/take-profit, R:R ratios, lots/pips/points, prop firm drawdown rules, and common psychological biases (FOMO, revenge trading).

---

## Tech Stack

- **Vanilla JavaScript** (ES6+, IIFE modules) — no build step, no framework
- **IndexedDB** for local, persistent, offline-first storage (accounts, trades, checklist rules, settings)
- **Tailwind CSS** (via CDN) for styling
- No external dependencies, no server, no analytics — all data stays in the browser

## Project Structure

```
├── index.html        # App shell & markup
├── app.js            # Application controller — state, event binding, rendering
├── calculator.js      # Position sizing math per asset class
├── instructor.js      # Rule-based feedback engine
├── db.js              # IndexedDB data layer (Accounts, Trades, ChecklistRules, Settings)
├── seed.js            # First-run seeding (default checklist + demo account)
└── i18n.js             # FR/EN dictionary
```

## Running Locally

No build step required — just serve the folder statically:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Or open `index.html` directly in a browser (IndexedDB works from `file://` in most browsers, though a local server is recommended for consistency).

## Data & Privacy

All data (accounts, trades, checklist rules) is stored locally in your browser's IndexedDB. Nothing is sent to a server. Clearing your browser storage for the site will erase your data.

## Disclaimer

Traft is a risk-management and journaling tool, not financial advice. Position size and risk calculations are provided for informational purposes; always verify figures against your broker's contract specifications before trading.

---

## Author

[xian005](https://github.com/xian005) — [Traders-Draft on GitHub](https://github.com/xian005/Traders-Draft)
