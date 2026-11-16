// Static safety checks for the visual concept. Run: node tools/collector-cockpit-v2.test.mjs
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const html=readFileSync(new URL("../labs/collector-cockpit-v2.html",import.meta.url),"utf8");
assert.match(html,/<meta name="robots" content="noindex,nofollow">/);
assert.match(html,/prefers-reduced-motion:reduce/);
assert.match(html,/id="flip"/);
assert.match(html,/id="light"/);
assert.match(html,/id="search"/);
assert.match(html,/id="grade"/);
assert.match(html,/NOT A LIVE STORE|NO PRICES/);
assert.doesNotMatch(html,/<script[^>]+src=/);
assert.doesNotMatch(html,/(?:checkout\/session|publish\/listing|api\/inventory\/write)/);
const inline=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(inline,"Expected a single inline script");
new vm.Script(inline[1]);
console.log("Collector Cockpit V2 static safety and JS syntax tests passed.");
