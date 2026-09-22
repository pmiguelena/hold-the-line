// Builds the game from src/ into:
//   game.html        — page fragment (the claude.ai artifact adds <!doctype>/<head>/<body>)
//   docs/game.html   — full standalone page for GitHub Pages or a double-click
//   tools/model.cjs  — the pure game model, for tests and balance simulations
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const rd = p => readFileSync(join(root, p), "utf8");
const list = dir => readdirSync(join(root, dir)).filter(f => /\.(js|css)$/.test(f)).sort().map(f => `${dir}/${f}`);

const css = list("src/styles").map(rd);
const js = list("src/js").map(rd).join("");
const head = rd("src/page/head.html"), body = rd("src/page/body.html");

const fragment = head + css.map(c => `<style>\n${c}</style>\n`).join("\n") + body + `\n<script>\n(() => {\n"use strict";\n${js}\n})();\n</script>\n`;
writeFileSync(join(root, "game.html"), fragment);

mkdirSync(join(root, "docs"), { recursive: true });
const full = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${head}${css.map(c => `<style>\n${c}</style>\n`).join("\n")}</head>\n<body>\n${body}<script>\n(() => {\n"use strict";\n${js}\n})();\n</script>\n</body>\n</html>\n`;
writeFileSync(join(root, "docs/game.html"), full);

// GitHub Pages site: landing page, the game, and the frozen classic version (index.html is its claude.ai source).
writeFileSync(join(root, "docs/index.html"), rd("src/page/landing.html"));
const desk = rd("index.html");
writeFileSync(join(root, "docs/desk.html"), `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n${desk}\n</body>\n</html>\n`);
writeFileSync(join(root, "docs/.nojekyll"), "");

// Model bundle for Node: everything that does not touch the DOM.
const modelParts = ["src/js/00-model-core.js", "src/js/05-game-model.js"].map(rd).join("\n");
const cut = modelParts.indexOf("function advance(inp)");
writeFileSync(join(root, "tools/model.cjs"), modelParts.slice(0, cut) +
  "\nmodule.exports = { M, MOVES, SCEN, buildScenario, extendScenario, initGame, prepGame, stepGame, scoreGame, ruleBoundGame, drawdown, taylorRate, seenOf, staffForecast, FOG, econDetail, CPI_W };\n");
console.log(`built game.html (${fragment.length} chars), docs/game.html, tools/model.cjs`);
