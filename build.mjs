/*
 * Build: împachetează tot codul din src/ (React inclus) într-un singur
 * index.html care rulează la dublu-click — fără server, fără internet.
 *
 *   npm install      (o singură dată)
 *   npm run build
 */
import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const watch = process.argv.includes("--watch");

const result = await build({
  entryPoints: [join(HERE, "src/app/index.jsx")],
  bundle: true,
  outdir: join(HERE, "dist"),
  format: "iife",
  platform: "browser",
  target: ["es2019"],
  jsx: "automatic",
  loader: { ".js": "jsx" },
  minify: !watch,
  sourcemap: false,
  write: false,
  metafile: false,
  define: { "process.env.NODE_ENV": watch ? '"development"' : '"production"' },
});

let js = "";
let css = "";
for (const out of result.outputFiles) {
  if (out.path.endsWith(".css")) css += out.text;
  else js += out.text;
}

const template = await readFile(join(HERE, "index.template.html"), "utf8");
const html = template
  .replace("/* __CSS__ */", () => css.trim())
  .replace("// __JS__", () => js.trim());

await writeFile(join(HERE, "index.html"), html, "utf8");
console.log(`index.html  ${(html.length / 1024).toFixed(0)} KB  (js ${(js.length / 1024).toFixed(0)} KB, css ${(css.length / 1024).toFixed(1)} KB)`);
