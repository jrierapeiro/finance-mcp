# Improvement Plan

Issues found during deep review, grouped by priority.

---

## P0 — Bugs / Broken

- [ ] **`getMarketOverview` ignores custom indices** — the MCP tool accepts an optional `indices` array but `yfinance.js:getMarketOverview()` takes no arguments and hardcodes `['^GSPC', '^DJI', '^IXIC']`. Wire the parameter through.
- [ ] **`integration.test.js` imports `zod/v4`** while the server imports from `zod`. If `zod/v4` doesn't exist in the installed version, tests fail. Align the import path.

---

## P1 — Dead Code & Artifacts

- [ ] **Remove orphaned prototypes**: `simple-server.js` (1 line, broken import), `yfinance-mcp-server.js` (2 lines, unused imports), `index.js` (71 lines, legacy API, pre-dates `server/src/index.js`).
- [ ] **Remove artifact directories**: `server/node_modules/` and `server/package-lock.json` — remnants of a previous `npm install` inside `server/`, no `server/package.json` exists.
- [ ] **Remove unused `express` dependency** from `package.json` — the server uses stdio transport, not HTTP.

---

## P2 — Test Coverage Gaps

- [ ] **Add unit tests for `searchStocks`** (module imports, valid query, empty query, error handling).
- [ ] **Add unit tests for `getMarketOverview`** (module imports, returns array with expected shape, error handling).
- [ ] **Add unit tests for `fetchMarketData`** — `test/fetch-market-data.test.js` only checks that the function exists (10 lines). Add tests for valid ticker, invalid ticker, return structure.
- [ ] **Mock Yahoo Finance in unit tests** — tests currently make real network calls. Use `vi.mock()` for reliable, fast tests. Document in tests that integration/e2e tests still hit the real API.
- [ ] **Switch test environment from `happy-dom` to `node`** in `vitest.config.js` — this is a server project, not a browser/DOM project.

---

## P3 — Housekeeping

- [ ] **Commit `package-lock.json`** — `.gitignore` currently excludes it. Lockfiles should be committed for reproducible installs (standard practice for apps, not libraries).
- [ ] **Update task files** — `tasks/4-searchStocks-2.1.md` through `tasks/9-getMarketOverview-3.3.md` are marked "No" but the code is already implemented. Mark them completed or remove them.
- [ ] **Clarify `server/config.js:tickerMap` purpose** — it's an identity map (AAPL→AAPL, etc.). Either document the remapping use case or remove if unused.

---

## P4 — Future Features (Phase 4)

- [ ] **Implement `getCompanyInfo`** — outlined in `tasks/10-getCompanyInfo-4.1.md` through `12-getCompanyInfo-4.3.md`. Would expose company profile, sector, industry, employees, description, etc. via `yf.quoteSummary()` or `yf.insights()`.

---

## P5 — Nice-to-Have

- [ ] **`resolveSymbol` config parity** — `fetchMultipleMarketData` calls `fetchMarketData` per ticker, which calls `resolveSymbol`. The nested `Promise.allSettled` + per-item symbol resolution is fine, but worth a second look if the ticker map grows large.
- [ ] **News-fetch redundancy** — `fetchMarketData` calls `yf.search()` solely for news, on top of the `yf.quote()` call. This means every single-stock fetch makes two API calls. Consider using `yf.quoteSummary()` with modules to reduce trips.
