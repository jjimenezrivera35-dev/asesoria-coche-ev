import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SpringAnimator } from '../src/js/springs.js';

const css = fs.readFileSync('c:/Proyectos/Coche_EV/src/css/styles.css', 'utf8');
const html = fs.readFileSync('c:/Proyectos/Coche_EV/src/template.html', 'utf8');
const springs = fs.readFileSync('c:/Proyectos/Coche_EV/src/js/springs.js', 'utf8');

// Check Warm Cream tokens & Apple Design rules
assert.ok(css.includes('#FAF6F0'), 'Missing --bg-canvas warm cream token');
assert.ok(css.includes('#F2ECE1'), 'Missing --bg-surface stone cream token');
assert.ok(css.includes('#FFFFFF'), 'Missing --bg-elevated white token');
assert.ok(css.includes('#1C1917'), 'Missing --ink-primary token');
assert.ok(css.includes('#57534E'), 'Missing --ink-secondary token');
assert.ok(css.includes('#78716C'), 'Missing --ink-muted token');
assert.ok(css.includes('#0F5E56'), 'Missing --accent-primary sage token');
assert.ok(css.includes('#B45309'), 'Missing --accent-secondary copper token');
assert.ok(css.includes('#E6DEC8'), 'Missing --border-subtle token');
assert.ok(css.includes('backdrop-filter'), 'Missing translucent material header');
assert.ok(css.includes('scale(0.97)'), 'Missing instant press feedback');
assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'), 'Missing reduced motion media query');
assert.ok(css.includes('@media (prefers-reduced-transparency: reduce)'), 'Missing reduced transparency media query');
assert.ok(css.includes('@media print'), 'Missing print stylesheet for Art 17.5 LPH');

// Check Task 4 Typography, Sidebar & Layout rules
assert.ok(!css.includes('Instrument Serif') && !html.includes('Instrument Serif'), 'Instrument Serif must be completely removed');
assert.ok(css.includes("'Outfit'") && html.includes('Outfit'), 'Missing Outfit display typography');
assert.ok(css.includes('.page-shell'), 'Missing .page-shell two-column layout');
assert.ok(css.includes('.side-index'), 'Missing .side-index vertical sidebar');
assert.ok(css.includes('.side-nav-link'), 'Missing .side-nav-link sidebar item styles');
assert.ok(css.includes('repeat(2, minmax(0, 1fr))'), 'Missing deterministic 2-column .grid-2');
assert.ok(html.includes('class="skip-link"'), 'Missing accessibility skip-link');
assert.ok(html.includes('meta name="theme-color" content="#FAF6F0"'), 'Missing theme-color meta');
assert.ok(html.includes('ÍNDICE DEL DICTAMEN'), 'Missing left vertical sidebar index header');

// Check required section IDs and controls in template.html
for (const id of [
  'hero',
  'mod-termodinamica',
  'mod-quimica',
  'mod-catalogo',
  'mod-dimensiones',
  'mod-patrimonio',
  'mod-logistica',
  'tab-bev',
  'tab-phev',
  'tech-pill',
  'tech-detail-panel',
  'tco-mode-select',
  'tco-canvas',
  'chem-soc-slider',
  'chem-soc-val',
  'chem-temp-select',
  'card-lfp',
  'card-nmc',
  'aging-canvas',
  'voltage-canvas',
  'chem-verdict-box',
  'protagonist-grid',
  'filter-chem-ALL',
  'filter-chem-LFP',
  'filter-chem-NMC',
  'filter-condition',
  'filter-budget',
  'budget-label',
  'catalog-grid',
  'versus-car-a',
  'versus-car-b',
  'vs-preset-r5-surf',
  'vs-preset-mg4-m3',
  'vs-preset-r5-m3',
  'versus-comparison-body',
  'dim-car-select',
  'dim-astra-select',
  'dimensions-canvas',
  'dim-delta-length',
  'dim-delta-width',
  'dim-delta-wheelbase',
  'dim-delta-trunk',
  'dim-verdict-text',
  'dim-all-cars-bars',
  'sim-car-select',
  'sim-custom-price',
  'sim-price-label',
  'chk-cambia360',
  'chk-achatarra',
  'chk-irpf-car',
  'sim-wallbox-cost',
  'sim-wallbox-label',
  'chk-wallbox-aid',
  'sim-irpf-bracket',
  'sim-horizon-years',
  'sim-occasion-warning',
  'res-gross',
  'res-aids-nominal',
  'res-tax-bite',
  'res-net-initial',
  'res-residual-val',
  'res-tco-net',
  'patrimonial-waterfall-canvas',
  'depreciation-curve-canvas',
  'sim-breakdown-text',
  'trip-car-select',
  'trip-speed-slider',
  'trip-speed-val',
  'trip-weather-select',
  'trip-canvas',
  'trip-results-panel',
  'lph-owner-name',
  'lph-owner-dni',
  'lph-address',
  'lph-spot',
  'lph-recipient',
  'lph-power',
  'lph-installer',
  'lph-date',
  'btn-print-lph',
  'btn-copy-lph',
  'lph-print-sheet'
]) {
  assert.ok(html.includes(`id="${id}"`), `Missing required element #${id} in template.html`);
}

assert.ok(springs.includes('SpringAnimator'), 'Missing SpringAnimator export');
assert.ok(springs.includes('animateValue'), 'Missing animateValue in SpringAnimator');
assert.ok(springs.includes('animateNumber'), 'Missing animateNumber in SpringAnimator');
assert.ok(springs.includes('movePillIndicator'), 'Missing movePillIndicator in SpringAnimator');
assert.ok(springs.includes('bindTactilePress'), 'Missing bindTactilePress in SpringAnimator');

// Verify SpringAnimator runtime methods
assert.equal(typeof SpringAnimator.animateValue, 'function');
assert.equal(typeof SpringAnimator.animateNumber, 'function');
assert.equal(typeof SpringAnimator.movePillIndicator, 'function');
assert.equal(typeof SpringAnimator.bindTactilePress, 'function');

let updatedVal = null;
SpringAnimator.animateValue('test-snap', 100, 100, (v) => { updatedVal = v; });
assert.equal(updatedVal, 100);

console.log('Task 2 & Task 4 UI & design tests passed!');
