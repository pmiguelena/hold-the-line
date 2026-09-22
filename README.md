# Hold the Line

A game about being a central bank governor, built for teaching monetary policy. English and Spanish.

- **Play:** open `docs/index.html`, or the GitHub Pages site once published.
- **The game** (`game.html`): 18 quarters, four historical crises, news, political pressure, press conferences, financial markets, public debt and the households behind the averages, advisors, press, President and board who remember how you treated them, hearings in parliament, data fog and a staff forecast, a four-era career mode, staff notes and a glossary, and an end-of-term debrief against the rule and against history.
- **Player profile:** a first-run page asks for a nickname and, optionally, age, gender, education and what the player does. It stays in the browser, travels inside the result code, and is exported with the results.
- **For teachers:** the teacher desk (title screen, or `game.html#teacher`) makes a class link with fixed shocks, builds your own scenario, and checks the result codes students hand in by replaying each game. Results export as CSV; each report prints. With a collection link set (For teachers > Data, script in `tools/collect.gs`), every finished term is also posted to the teacher's own Google Sheet: profile, scenario, score, how the term ended, and the replayable result code.
- **Classic version** (`classic/desk.html`, published at `docs/classic/`): the simpler 12-quarter classroom version. It is frozen, is not linked from the front page, and new work goes into the game.

## Working on the game

The game is built from `src/` into single files, so it still opens with a double-click and can be published as one page.

```
npm install          # once: installs jsdom for the tests
npm run build        # src/ -> game.html, docs/game.html, docs/index.html, docs/classic/index.html
npm test             # build, then balance tests and full simulated playthroughs
```

| Folder | What is in it |
|---|---|
| `src/js/00-model-core.js` | The New Keynesian core: expectations, IS curve, Phillips curve, credibility, popularity |
| `src/js/05-game-model.js` | Game-layer economics: 18-quarter term, financial markets, asset purchases, removal risk, data fog, staff forecast, save/continue |
| `src/js/01-…`, `02-…` | Text in English and Spanish |
| `src/js/03-…` to `11-…` | Sound, art, news generators, screens, the quarter flow, career mode, teaching layer and classroom tools |
| `src/styles/` | CSS |
| `tests/` | `model.test.mjs` (balance and economics), `play.test.mjs` (plays every level in a simulated browser) |
| `legacy/` | Earlier versions and the original 2024 R Shiny code (kept locally, not published) |

Every change should keep `npm test` green. The balance tests check that a rule-following governor finishes every level with a sensible score, that giving in to the government costs credibility, and that hard mode is harder but winnable.

## Publishing on GitHub Pages

Push the repository, then in **Settings → Pages** choose *Deploy from a branch*, branch `main`, folder `/docs`.
