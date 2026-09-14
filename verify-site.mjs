import fs from "node:fs";

const html = fs.readFileSync("dist/index.html", "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
scripts.forEach((match) => new Function(match[1]));

const assetRefs = [...html.matchAll(/["'](assets\/[A-Za-z0-9_.\/-]+)["']/g)].map(
  (match) => match[1],
);
const missing = assetRefs.filter((asset) => !fs.existsSync(`dist/${asset}`));

if (missing.length) {
  throw new Error(`Missing assets: ${missing.join(", ")}`);
}

console.log(`HTML scripts and ${assetRefs.length} local asset references are valid.`);
