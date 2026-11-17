# Portal Interactivo de Asesoramiento EV Madrid 2026 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una aplicación web interactiva, rigurosa en electroquímica y fiscalidad, en tonos crema premium (`design-taste-frontend` + `apple-design`), empaquetada como un único archivo HTML auto-contenido (`index.html` e `Informe_Movilidad_Madrid_2026.html`) listo para abrir con doble clic.

**Architecture:** Código fuente modular en `src/` (`src/data/vehicles.js`, `src/js/models.js`, `src/js/springs.js`, `src/js/app.js`, `src/css/styles.css`, `src/template.html`) respaldado por tests automatizados en `tests/` ejecutados con Node.js, y un compilador (`scripts/build-bundle.mjs`) que ensambla todo en un único HTML portable sin dependencias de servidor.

**Tech Stack:** HTML5 semántico, CSS3 moderno (variables nativas, `backdrop-filter`, `@media print`, `@media (prefers-reduced-motion)`), JavaScript ES2022 + Canvas 2D / SVG dinámico, Node.js (`node:assert`) para verificación automatizada.

**Spec:** `c:\Proyectos\Coche_EV\docs\superpowers\specs\2026-11-16-asesor-ev-madrid-design.md`

## Global Constraints

- **Paleta obligatoria (`design-taste-frontend` crema premium):** `--bg-canvas: #FAF6F0`, `--bg-surface: #F2ECE1`, `--bg-elevated: #FFFFFF`, `--ink-primary: #1C1917`, `--ink-secondary: #57534E`, `--ink-muted: #78716C`, `--accent-primary: #0F5E56`, `--accent-secondary: #B45309`, `--border-subtle: #E6DEC8`. Prohibido usar tonos violetas/lavanda o estéticas "AI-slop".
- **Físicas `apple-design`:** Respuesta inmediata en `pointerdown` (`scale(0.97)`), animaciones de muelle críticamente amortiguadas (`damping: 1.0`, `response: 0.35`) siempre interrumpibles desde el valor actual en pantalla, y soporte de `prefers-reduced-motion: reduce`.
- **URLs exactas de los 3 configuradores reales:**
  - Renault 5 E-Tech: `https://www.renault.es/electricos/r5-e-tech-electrico/configurador.html?conf=https%3A%2F%2Fes.co.rplug.renault.com%2Fc%2FBAHPt%2FAmnZK2oMuA`
  - MG4 Electric: `https://www.mgmotor.es/configurator/mg4`
  - BYD Dolphin Surf: `https://www.byd.com/es-es/configurador/dolphin-surf`
- **Preservación del prototipo original:** No modificar `c:\Users\jjime\OneDrive\Desktop\Coche.html`. Entregar los archivos finales en `c:\Proyectos\Coche_EV\index.html` y `c:\Proyectos\Coche_EV\Informe_Movilidad_Madrid_2026.html`.

## Review Focus

1. **Tributación del Plan Cambia 360 en un coche de Ocasión no elegible:** Cuando el usuario selecciona un vehículo de ocasión (ej. `tesla-model3-rwd` o `mg4-standard-ocasion`), las casillas de Plan Cambia 360 (4.000 €), Achatarramiento (1.500 €) y Deducción IRPF 15% del coche deben desactivarse por defecto (mostrando aviso claro), pero las ayudas del Wallbox (65% Cambia 360 + 15% IRPF) deben seguir operativas y su ganancia patrimonial debe tributar al tipo marginal seleccionado.
2. **Base máxima de deducción IRPF del 15% tras restar ayudas directas:** La norma estatal (RDL 7/2026) exige detraer primero las subvenciones públicas directas del precio de adquisición antes de calcular la base de deducción (con tope de 20.000 € de base y 3.000 € de deducción máxima). Si un coche cuesta 19.990 € y recibe 5.500 € de Cambia 360, la base IRPF es `14.490 €` (deducción de `2.174 €`), nunca `3.000 €`.
3. **Estabilidad física del modelo de Arrhenius en extremos de SoC y temperatura:** Con `socPercent = 100` y `tempC = 30`, la retención de capacidad a 10 años de NMC debe caer visiblemente más rápido que LFP (ej. ~78–83% en NMC vs. ~91–93% en LFP) sin generar valores `NaN`, mayores de `100%` ni menores de `50%`.
4. **Comparador de dimensiones con cambio de carrocería del Opel Astra (2000):** Al conmutar entre *Opel Astra G 5p (4.110 mm, 370 L)* y *Opel Astra G Sedán 4p (4.252 mm, 460 L)*, un coche intermedio como el Volvo EX30 (4.233 mm) pasa de ser `+12,3 cm más largo` (frente al 5p) a `-1,9 cm más corto` (frente al Sedán); el cálculo de deltas y el signo deben actualizarse con precisión.
5. **Impresión limpia de la notificación legal Art. 17.5 LPH:** Al pulsar el botón de imprimir el documento legal para el administrador de fincas, la regla `@media print` debe ocultar toda la interfaz web (gráficos, simuladores, barra de navegación) y mostrar únicamente el escrito jurídico en formato A4 limpio.

---

### Task 1: Dataset Completo y Motor Matemático, Electroquímico, Patrimonial y Legal

**Files:**
- Create: `c:\Proyectos\Coche_EV\src\data\vehicles.js`
- Create: `c:\Proyectos\Coche_EV\src\js\models.js`
- Test: `c:\Proyectos\Coche_EV\tests\test-models.mjs`

**Interfaces:**
- Produces in `src/data/vehicles.js`:
  - `ASTRA_BASELINES`: `{ compact5p: { id, name, lengthMm: 4110, widthMm: 1709, heightMm: 1425, wheelbaseMm: 2606, trunkLiters: 370 }, sedan4p: { id, name, lengthMm: 4252, widthMm: 1709, heightMm: 1425, wheelbaseMm: 2606, trunkLiters: 460 } }`
  - `VEHICLES`: Array of 7 vehicle objects (`renault-5-techno`, `byd-dolphin-surf`, `mg4-electric`, `tesla-model3-rwd`, `byd-dolphin-comfort`, `citroen-ec3`, `volvo-ex30`) with exact fields: `id, name, shortName, isProtagonist, segment, condition, chemistry, batteryKwh, powerCv, powerKw, wltpKm, urbanWltpKm, highwayKwh100, dcPeakKw, dc10to80Min, priceMin, priceMax, priceAvg, pricePvp, eligibleNewAid, configuratorUrl, configSummary, lengthMm, widthMm, heightMm, wheelbaseMm, trunkLiters, frunkLiters, annualDepreciationRates, badge, notes, variants`
- Produces in `src/js/models.js`:
  - `computeTcoBreakdown(mode)` -> `{ labels, maintenance, energy, total }`
  - `computeCalendarAging({ socPercent, tempC })` -> `{ years, lfpRetention, nmcRetention, lfp10YrLoss, nmc10YrLoss, voltageCurve: { socPoints, lfpVolts, nmcVolts }, verdictText }`
  - `computeDimensionsDiff(carId, astraKey)` -> `{ car, astra, deltaLengthMm, deltaLengthCm, deltaWidthMm, deltaHeightMm, deltaWheelbaseMm, deltaTrunkLiters, totalCargoLiters, sizeVerdict }`
  - `computePatrimonialSimulation({ carId, customPrice, useCambia360, useScrappage, useIrpfCar, wallboxCost, useWallboxAid, marginalIrpfRate, horizonYears })` -> `{ car, priceUsed, directCarSub, irpfCarBase, irpfCarDed, wallboxCambia, wallboxIrpfBase, wallboxIrpf, grossTotal, totalAidsNominal, taxableSubsidies, taxBiteIrpf, netAidsAfterTax, netInitialOutlayAfterTax, yearlyCurve: { years, selectedResidual, selectedNetCost, model3UsedNetCost, iceNetCost } }`
  - `computeHighwayTrip300km({ carId, speedKmh, weather })` -> `{ car, consumptionKwh100, tripEnergyKwh, usableBatteryKwh, arrivalSocNoStop, needsStop, energyToChargeKwh, stopMinutes, annualHomeCostEur, tripCostByNetwork: { tesla, zunder, ionity } }`
  - `generateLph175Document({ ownerName, ownerDni, communityAddress, parkingSpot, recipientRole, wallboxPowerKw, installerName, plannedDate })` -> `string`

- [ ] **Step 1: Write the failing test in `c:\Proyectos\Coche_EV\tests\test-models.mjs`**

```javascript
import assert from 'node:assert/strict';
import { ASTRA_BASELINES, VEHICLES } from '../src/data/vehicles.js';
import {
  computeTcoBreakdown,
  computeCalendarAging,
  computeDimensionsDiff,
  computePatrimonialSimulation,
  computeHighwayTrip300km,
  generateLph175Document
} from '../src/js/models.js';

// 1. Verify dataset completeness & exact configurator URLs
assert.equal(VEHICLES.length, 7);
const protagonists = VEHICLES.filter(v => v.isProtagonist);
assert.equal(protagonists.length, 4);
const r5 = VEHICLES.find(v => v.id === 'renault-5-techno');
assert.equal(r5.configuratorUrl, 'https://www.renault.es/electricos/r5-e-tech-electrico/configurador.html?conf=https%3A%2F%2Fes.co.rplug.renault.com%2Fc%2FBAHPt%2FAmnZK2oMuA');
assert.equal(r5.batteryKwh, 52);
assert.equal(r5.wltpKm, 425);

const surf = VEHICLES.find(v => v.id === 'byd-dolphin-surf');
assert.equal(surf.configuratorUrl, 'https://www.byd.com/es-es/configurador/dolphin-surf');
assert.equal(surf.lengthMm, 3990);

// 2. Verify Review Focus #3: Arrhenius Calendar Aging stability & LFP vs NMC gap
const agingHighStress = computeCalendarAging({ socPercent: 100, tempC: 30 });
assert.equal(agingHighStress.years.length, 11); // 0..10
assert.ok(agingHighStress.lfpRetention[10] > agingHighStress.nmcRetention[10] + 6);
assert.ok(agingHighStress.nmcRetention[10] >= 55 && agingHighStress.lfpRetention[10] <= 100);

// 3. Verify Review Focus #4: Dimensions diff against both Opel Astra 2000 variants
const diffEx30Compact = computeDimensionsDiff('volvo-ex30', 'compact5p');
const diffEx30Sedan = computeDimensionsDiff('volvo-ex30', 'sedan4p');
assert.equal(diffEx30Compact.deltaLengthMm, 4233 - 4110); // +123 mm
assert.equal(diffEx30Sedan.deltaLengthMm, 4233 - 4252);   // -19 mm

// 4. Verify Review Focus #1 & #2: Patrimonial Simulator, IRPF base cap, and Tax Bite
const simSurf = computePatrimonialSimulation({
  carId: 'byd-dolphin-surf',
  customPrice: 19990,
  useCambia360: true,
  useScrappage: true,
  useIrpfCar: true,
  wallboxCost: 1800,
  useWallboxAid: true,
  marginalIrpfRate: 37,
  horizonYears: 6
});
assert.equal(simSurf.directCarSub, 5500);
assert.equal(simSurf.irpfCarBase, 14490); // 19990 - 5500 < 20000
assert.equal(simSurf.irpfCarDed, Math.round(14490 * 0.15)); // 2174 €
assert.equal(simSurf.wallboxCambia, Math.round(1800 * 0.65)); // 1170 €
assert.equal(simSurf.taxableSubsidies, 5500 + 1170); // 6670 €
assert.equal(simSurf.taxBiteIrpf, Math.round(6670 * 0.37)); // 2468 €
assert.equal(simSurf.yearlyCurve.years.length, 7); // 0..6

const simModel3 = computePatrimonialSimulation({
  carId: 'tesla-model3-rwd',
  useCambia360: true, // Should be ignored/0 when car.eligibleNewAid is false
  useScrappage: true,
  useIrpfCar: true,
  wallboxCost: 1800,
  useWallboxAid: true,
  marginalIrpfRate: 37,
  horizonYears: 5
});
assert.equal(simModel3.directCarSub, 0);
assert.equal(simModel3.irpfCarDed, 0);
assert.equal(simModel3.wallboxCambia, 1170);

// 5. Verify 300km Highway Trip physics & LPH 17.5 legal generator
const tripModel3 = computeHighwayTrip300km({ carId: 'tesla-model3-rwd', speedKmh: 120, weather: 'mild' });
const tripSurf = computeHighwayTrip300km({ carId: 'byd-dolphin-surf', speedKmh: 120, weather: 'winter' });
assert.equal(tripModel3.needsStop, false);
assert.equal(tripSurf.needsStop, true);
assert.ok(tripSurf.stopMinutes >= 10);

const letter = generateLph175Document({
  ownerName: 'Dr. Carlos Jiménez',
  ownerDni: '12345678Z',
  communityAddress: 'C/ Serrano 100, Madrid',
  parkingSpot: 'Plaza 42 (Sótano -2)',
  recipientRole: 'Presidente de la Comunidad y Administrador de Fincas',
  wallboxPowerKw: '7,4 kW',
  installerName: 'ChargeGuru España',
  plannedDate: '2026-12-20'
});
assert.ok(letter.includes('Artículo 17.5'));
assert.ok(letter.includes('ITC-BT-52'));
assert.ok(letter.includes('Plaza 42'));
console.log('Task 1 tests passed!');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node c:\Proyectos\Coche_EV\tests\test-models.mjs`
Expected: FAIL with `ERR_MODULE_NOT_FOUND`

- [ ] **Step 3: Implement `c:\Proyectos\Coche_EV\src\data\vehicles.js` and `c:\Proyectos\Coche_EV\src\js\models.js`**

Include the 7 EVs with their exact specifications, dimensions, variants, and depreciation curves in `src/data/vehicles.js`, and implement the 6 pure calculation functions in `src/js/models.js` enforcing `eligibleNewAid` rules, Arrhenius kinetics, aerodynamic scaling $(v / 120)^2$, and Art. 17.5 LPH legal text generation.

- [ ] **Step 4: Run test to verify it passes**

Run: `node c:\Proyectos\Coche_EV\tests\test-models.mjs`
Expected: PASS (`Task 1 tests passed!`)

---

### Task 2: Sistema de Diseño Crema Premium, Físicas Apple Spring y Plantilla HTML Semántica

**Files:**
- Create: `c:\Proyectos\Coche_EV\src\css\styles.css`
- Create: `c:\Proyectos\Coche_EV\src\js\springs.js`
- Create: `c:\Proyectos\Coche_EV\src\template.html`
- Test: `c:\Proyectos\Coche_EV\tests\test-ui-structure.mjs`

**Interfaces:**
- Consumes: Visual tokens and module structure from Spec §3 and §4.
- Produces in `src/js/springs.js`:
  - `SpringAnimator`: `{ animateValue(key, from, to, onUpdate, options), animateNumber(el, targetValue, formatter), movePillIndicator(pillEl, targetBtn) }` with `damping: 1.0, response: 0.35`, velocity preservation on interruption, and `prefers-reduced-motion` detection.
- Produces in `src/css/styles.css` and `src/template.html`:
  - Semantic layout with IDs for all 6 modules (`#hero`, `#mod-termodinamica`, `#mod-quimica`, `#mod-catalogo`, `#mod-dimensiones`, `#mod-patrimonio`, `#mod-logistica`), all interactive controls, canvases, and `#lph-print-sheet` with `@media print` isolation.

- [ ] **Step 1: Write the failing test in `c:\Proyectos\Coche_EV\tests\test-ui-structure.mjs`**

```javascript
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync('c:/Proyectos/Coche_EV/src/css/styles.css', 'utf8');
const html = fs.readFileSync('c:/Proyectos/Coche_EV/src/template.html', 'utf8');
const springs = fs.readFileSync('c:/Proyectos/Coche_EV/src/js/springs.js', 'utf8');

// Check Warm Cream tokens & Apple Design rules
assert.ok(css.includes('#FAF6F0'), 'Missing --bg-canvas warm cream token');
assert.ok(css.includes('#F2ECE1'), 'Missing --bg-surface stone cream token');
assert.ok(css.includes('#0F5E56'), 'Missing --accent-primary sage token');
assert.ok(css.includes('backdrop-filter'), 'Missing translucent material header');
assert.ok(css.includes('scale(0.97)'), 'Missing instant press feedback');
assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'), 'Missing reduced motion media query');
assert.ok(css.includes('@media print'), 'Missing print stylesheet for Art 17.5 LPH');

// Check required section IDs and controls in template.html
for (const id of [
  'mod-termodinamica',
  'mod-quimica',
  'mod-catalogo',
  'mod-dimensiones',
  'mod-patrimonio',
  'mod-logistica',
  'chem-soc-slider',
  'chem-temp-select',
  'versus-car-a',
  'versus-car-b',
  'dim-car-select',
  'dim-astra-select',
  'sim-car-select',
  'sim-irpf-bracket',
  'sim-horizon-years',
  'trip-speed-slider',
  'trip-weather-select',
  'lph-print-sheet'
]) {
  assert.ok(html.includes(`id="${id}"`), `Missing required element #${id} in template.html`);
}

assert.ok(springs.includes('SpringAnimator'), 'Missing SpringAnimator export');
console.log('Task 2 UI & design tests passed!');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node c:\Proyectos\Coche_EV\tests\test-ui-structure.mjs`
Expected: FAIL with `ENOENT`

- [ ] **Step 3: Implement `src/css/styles.css`, `src/js/springs.js`, and `src/template.html`**

Create the editorial cream design system (`styles.css`), the critically damped spring physics engine (`springs.js`), and the complete 6-module HTML template (`template.html`).

- [ ] **Step 4: Run test to verify it passes**

Run: `node c:\Proyectos\Coche_EV\tests\test-ui-structure.mjs`
Expected: PASS (`Task 2 UI & design tests passed!`)

---

### Task 3: Controlador Interactivo de los 6 Módulos, Renderizado Canvas/SVG y Bundle Auto-Contenido

**Files:**
- Create: `c:\Proyectos\Coche_EV\src\js\app.js`
- Create: `c:\Proyectos\Coche_EV\scripts\build-bundle.mjs`
- Create: `c:\Proyectos\Coche_EV\index.html`
- Create: `c:\Proyectos\Coche_EV\Informe_Movilidad_Madrid_2026.html`
- Test: `c:\Proyectos\Coche_EV\tests\test-bundle-e2e.mjs`

**Interfaces:**
- Consumes: `VEHICLES`, `ASTRA_BASELINES` from `src/data/vehicles.js`, pure functions from `src/js/models.js`, `SpringAnimator` from `src/js/springs.js`, and markup/styles from `src/template.html` + `src/css/styles.css`.
- Produces:
  - Interactive controller `src/js/app.js` rendering all 6 modules, custom high-DPI HTML5 Canvas charts (TCO stacked chart, Arrhenius 10-year capacity retention curve + LFP/NMC voltage plateau chart, scaled side/top silhouette overlay vs. Opel Astra 2000, Patrimonial waterfall & 0–8 year depreciation/TCO chart, and 300 km highway trip gauge) + pointerdown tactile handlers.
  - Bundler `scripts/build-bundle.mjs` that inlines `styles.css`, `vehicles.js`, `models.js`, `springs.js`, and `app.js` into standalone `index.html` and `Informe_Movilidad_Madrid_2026.html`.

- [ ] **Step 1: Write the failing test in `c:\Proyectos\Coche_EV\tests\test-bundle-e2e.mjs`**

```javascript
import assert from 'node:assert/strict';
import fs from 'node:fs';

assert.ok(fs.existsSync('c:/Proyectos/Coche_EV/index.html'), 'index.html missing');
assert.ok(fs.existsSync('c:/Proyectos/Coche_EV/Informe_Movilidad_Madrid_2026.html'), 'Informe_Movilidad_Madrid_2026.html missing');

const bundle = fs.readFileSync('c:/Proyectos/Coche_EV/index.html', 'utf8');
const copy = fs.readFileSync('c:/Proyectos/Coche_EV/Informe_Movilidad_Madrid_2026.html', 'utf8');
assert.equal(bundle, copy, 'Both bundle files must be identical');

// Verify self-contained bundle has no external local script/css dependencies
assert.ok(!bundle.includes('src="src/'), 'Bundle must inline all local scripts');
assert.ok(!bundle.includes('href="src/'), 'Bundle must inline all local stylesheets');

// Verify all 3 real configurator links and key scientific/financial content are embedded
assert.ok(bundle.includes('https://www.renault.es/electricos/r5-e-tech-electrico/configurador.html?conf=https%3A%2F%2Fes.co.rplug.renault.com%2Fc%2FBAHPt%2FAmnZK2oMuA'));
assert.ok(bundle.includes('https://www.mgmotor.es/configurator/mg4'));
assert.ok(bundle.includes('https://www.byd.com/es-es/configurador/dolphin-surf'));
assert.ok(bundle.includes('Opel Astra (2000)'));
assert.ok(bundle.includes('Artículo 17.5'));
console.log('Task 3 bundle E2E tests passed!');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node c:\Proyectos\Coche_EV\tests\test-bundle-e2e.mjs`
Expected: FAIL (`index.html missing`)

- [ ] **Step 3: Implement `src/js/app.js` and `scripts/build-bundle.mjs`, and generate the bundles**

Implement all interactive event bindings, high-DPI Canvas charts, SVG/Canvas vehicle silhouette overlays, Cara a Cara comparator, and LPH 17.5 live preview in `src/js/app.js`, then run `node c:\Proyectos\Coche_EV\scripts\build-bundle.mjs` to produce `index.html` and `Informe_Movilidad_Madrid_2026.html`.

- [ ] **Step 4: Run all tests to verify everything passes**

Run: `node c:\Proyectos\Coche_EV\tests\test-models.mjs && node c:\Proyectos\Coche_EV\tests\test-ui-structure.mjs && node c:\Proyectos\Coche_EV\tests\test-bundle-e2e.mjs`
Expected: PASS on all 3 test suites.
