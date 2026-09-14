import fs from "node:fs";

const htmlFiles = fs
  .readdirSync("dist")
  .filter((file) => file.endsWith(".html"))
  .map((file) => `dist/${file}`);

let scriptCount = 0;
const assetRefs = new Set();

for (const htmlFile of htmlFiles) {
  const html = fs.readFileSync(htmlFile, "utf8");
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  scripts.forEach((match) => new Function(match[1]));
  scriptCount += scripts.length;
  for (const match of html.matchAll(/["'](assets\/[A-Za-z0-9_.\/-]+)["']/g)) {
    assetRefs.add(match[1]);
  }
}

const missing = [...assetRefs].filter((asset) => !fs.existsSync(`dist/${asset}`));

if (missing.length) {
  throw new Error(`Missing assets: ${missing.join(", ")}`);
}

console.log(
  `${htmlFiles.length} HTML files, ${scriptCount} inline scripts, and ${assetRefs.size} local asset references are valid.`,
);
