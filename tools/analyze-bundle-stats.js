const fs = require("fs");
const stats = JSON.parse(fs.readFileSync("../dist/bundle-stats.json", "utf8"));

const libs = {};
const totalSize = stats.modules.reduce((sum, m) => sum + (m.size || 0), 0);

stats.modules.forEach((m) => {
  if (!m.name) return;
  let lib = "app-code";
  if (m.name.includes("node_modules")) {
    const match = m.name.match(/node_modules[\\\/]([^\\\/]+)/);
    if (match) lib = match[1];
  }
  if (!libs[lib]) libs[lib] = 0;
  libs[lib] += m.size || 0;
});

const sorted = Object.entries(libs).sort((a, b) => b[1] - a[1]);

console.log("=== BUNDLE BREAKDOWN (by source size) ===\n");
console.log(`Total Unminified: ${(totalSize / 1024 / 1024).toFixed(2)} MiB`);
console.log(
  `Minified Bundle: ${(stats.assets[0].size / 1024).toFixed(2)} KiB\n`
);

sorted.forEach(([lib, size]) => {
  const kb = (size / 1024).toFixed(1);
  const pct = ((size / totalSize) * 100).toFixed(1);
  console.log(
    `${lib.padEnd(30)} ${kb.padStart(10)} KiB  (${pct.padStart(5)}%)`
  );
});
