import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

assert.ok(!fs.existsSync('c:/Proyectos/Coche_EV/index.html'), 'index.html should be removed so only Informe_Movilidad_Madrid_2026.html exists');
assert.ok(fs.existsSync('c:/Proyectos/Coche_EV/Informe_Movilidad_Madrid_2026.html'), 'Informe_Movilidad_Madrid_2026.html missing');

const bundle = fs.readFileSync('c:/Proyectos/Coche_EV/Informe_Movilidad_Madrid_2026.html', 'utf8');

// Verify self-contained bundle has no external local script/css dependencies
assert.ok(!bundle.includes('src="src/'), 'Bundle must inline all local scripts');
assert.ok(!bundle.includes('href="src/'), 'Bundle must inline all local stylesheets');
assert.ok(bundle.includes('<style>'), 'Bundle must contain inline <style>');
assert.ok(bundle.includes('<script>'), 'Bundle must contain inline <script>');

// Verify all 6 modules, sidebar index, and canvases exist in the bundle
for (const id of [
  'hero',
  'mod-termodinamica',
  'mod-quimica',
  'mod-catalogo',
  'mod-dimensiones',
  'mod-patrimonio',
  'mod-logistica',
  'tco-canvas',
  'aging-canvas',
  'voltage-canvas',
  'dimensions-canvas',
  'patrimonial-waterfall-canvas',
  'depreciation-curve-canvas',
  'trip-canvas',
  'lph-print-sheet'
]) {
  assert.ok(bundle.includes(`id="${id}"`), `Missing #${id} in bundle`);
}

assert.ok(bundle.includes('ÍNDICE DEL DICTAMEN'), 'Bundle must include left vertical sidebar index');
assert.ok(!bundle.includes('Instrument Serif'), 'Bundle must not use narrow Instrument Serif');

// Verify all 3 real configurator links and key scientific/financial content are embedded
assert.ok(bundle.includes('https://www.renault.es/electricos/r5-e-tech-electrico/configurador.html?conf=https%3A%2F%2Fes.co.rplug.renault.com%2Fc%2FBAHPt%2FAmnZK2oMuA'));
assert.ok(bundle.includes('https://www.mgmotor.es/configurator/mg4'));
assert.ok(bundle.includes('https://www.byd.com/es-es/configurador/dolphin-surf'));
assert.ok(bundle.includes('Opel Astra (2000)'));
assert.ok(bundle.includes('Artículo 17.5'));
assert.ok(bundle.includes('ITC-BT-52'));

// Extract inline <script> and verify zero JavaScript syntax errors
const scriptMatch = bundle.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(scriptMatch && scriptMatch[1].length > 5000, 'Inline script missing or too short');
assert.doesNotThrow(() => {
  new vm.Script(scriptMatch[1], { filename: 'inline-bundle.js' });
}, 'Inline bundle script must have zero JS syntax errors');

console.log('Task 3 & Task 4 single-bundle E2E tests passed!');
