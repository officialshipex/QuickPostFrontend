// Renders every template to /html so you can preview in a browser or paste into Quickpost.
// Run:  npx esbuild export-html.jsx --bundle --platform=node --outfile=.export.cjs --loader:.js=jsx && node .export.cjs
import fs from "fs";
import { templates, renderEmail } from "./index";

fs.mkdirSync("html", { recursive: true });
for (const [name, { component }] of Object.entries(templates)) {
  fs.writeFileSync(`html/${name}.html`, renderEmail(component));
  console.log("✓ html/" + name + ".html");
}
