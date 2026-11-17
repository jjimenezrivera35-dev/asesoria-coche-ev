import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = 'c:/Proyectos/Coche_EV';

function stripEsModuleSyntax(code) {
  return code
    // Remove multi-line or single-line import statements
    .replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    // Remove `export default ...` lines
    .replace(/^\s*export\s+default\s+.*$/gm, '')
    // Replace `export const/let/var/function/class` with `const/let/var/function/class`
    .replace(/^\s*export\s+(const|let|var|function|class)\s+/gm, '$1 ');
}

const templateHtml = fs.readFileSync(path.join(ROOT, 'src/template.html'), 'utf8');
const stylesCss = fs.readFileSync(path.join(ROOT, 'src/css/styles.css'), 'utf8');
const vehiclesJs = stripEsModuleSyntax(fs.readFileSync(path.join(ROOT, 'src/data/vehicles.js'), 'utf8'));
const modelsJs = stripEsModuleSyntax(fs.readFileSync(path.join(ROOT, 'src/js/models.js'), 'utf8'));
const springsJs = stripEsModuleSyntax(fs.readFileSync(path.join(ROOT, 'src/js/springs.js'), 'utf8'));
const appJs = stripEsModuleSyntax(fs.readFileSync(path.join(ROOT, 'src/js/app.js'), 'utf8'));

const combinedScript = `(() => {
"use strict";

/* --- 1. Vehicle Dataset & Opel Astra (2000) Baselines --- */
${vehiclesJs.trim()}

/* --- 2. Thermodynamic, Electrochemical, Fiscal & Legal Models --- */
${modelsJs.trim()}

/* --- 3. Critically Damped Apple Spring Physics Engine --- */
${springsJs.trim()}

/* --- 4. Interactive Controller & HiDPI Canvas Renderers --- */
${appJs.trim()}

})();`;

// Validate combined script syntax before writing bundle
new vm.Script(combinedScript, { filename: 'bundle-inline.js' });

const finalHtml = templateHtml
  .replace(
    /<link\s+rel="stylesheet"\s+href="src\/css\/styles\.css"\s*\/?>/,
    `<style>\n${stylesCss}\n  </style>`
  )
  .replace(
    /<script\s+type="module"\s+src="src\/js\/app\.js"><\/script>/,
    `<script>\n${combinedScript}\n  </script>`
  );

const indexPath = path.join(ROOT, 'index.html');
const reportPath = path.join(ROOT, 'Informe_Movilidad_Madrid_2026.html');
const asesoriaPath = path.join(ROOT, 'Asesoria_EV.html');

if (fs.existsSync(indexPath)) {
  fs.unlinkSync(indexPath);
}

fs.writeFileSync(reportPath, finalHtml, 'utf8');
fs.writeFileSync(asesoriaPath, finalHtml, 'utf8');

console.log(`Single HTML bundle built successfully:
- ${reportPath} (${Buffer.byteLength(finalHtml, 'utf8')} bytes)
- ${asesoriaPath} (${Buffer.byteLength(finalHtml, 'utf8')} bytes)
- index.html removed: ${!fs.existsSync(indexPath)}`);
