import { ASTRA_BASELINES, VEHICLES } from '../data/vehicles.js';
import {
  computeTcoBreakdown,
  computeCalendarAging,
  computeDimensionsDiff,
  computePatrimonialSimulation,
  computeHighwayTrip300km,
  generateLph175Document
} from './models.js';
import { SpringAnimator } from './springs.js';

const PALETTE = {
  bgCanvas: '#FAF6F0',
  bgSurface: '#F2ECE1',
  bgElevated: '#FFFFFF',
  inkPrimary: '#1C1917',
  inkSecondary: '#57534E',
  inkMuted: '#78716C',
  sage: '#0F5E56',
  sageSoft: '#E6F2F0',
  sageMid: '#2D8A7E',
  copper: '#B45309',
  copperSoft: '#FEF3C7',
  danger: '#991B1B',
  dangerSoft: '#FEE2E2',
  borderSubtle: '#E6DEC8',
  borderStrong: '#D4C8AE'
};

const state = {
  techTab: 'bev',
  tcoMode: '5years',
  chemSoc: 100,
  chemTemp: 21,
  selectedChemFocus: 'LFP',
  catalogChem: 'ALL',
  catalogCondition: 'ALL',
  catalogBudget: 35000,
  versusCarA: 'renault-5-techno',
  versusCarB: 'byd-dolphin-surf',
  dimCarId: 'renault-5-techno',
  dimAstraKey: 'compact5p',
  simCarId: 'byd-dolphin-surf',
  simCustomPrice: 23990,
  simUseCambia360: true,
  simUseScrappage: true,
  simUseIrpfCar: true,
  simWallboxCost: 1800,
  simUseWallboxAid: true,
  simIrpfBracket: 37,
  simHorizonYears: 6,
  tripCarId: 'renault-5-techno',
  tripSpeed: 120,
  tripWeather: 'mild'
};

function formatSpanishInteger(n) {
  const rounded = Math.round(Number(n) || 0);
  const isNeg = rounded < 0;
  const s = Math.abs(rounded).toString();
  const formatted = s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (isNeg ? '-' : '') + formatted;
}

function fmtInt(n) {
  return formatSpanishInteger(n);
}

function fmtEur(n) {
  return `${fmtInt(n)} €`;
}

function fmtSignedEur(n) {
  const rounded = Math.round(Number(n) || 0);
  const sign = rounded > 0 ? '+' : rounded < 0 ? '-' : '';
  return `${sign}${formatSpanishInteger(Math.abs(rounded))} €`;
}

function niceMax(val, step = 1000) {
  const raw = Math.max(Number(val) || 0, step);
  return Math.ceil(raw / step) * step;
}

function setupHiDPICanvas(canvas, defaultWidth = 600, defaultHeight = 280) {
  if (!canvas) return null;
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? Math.min(window.devicePixelRatio, 2.5) : 1;
  const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : null;
  const cssWidth = (rect && rect.width > 40) ? Math.floor(rect.width) : (canvas.width || defaultWidth);
  const aspect = defaultHeight / defaultWidth;
  const cssHeight = Math.max(210, Math.round(cssWidth * aspect));

  if (canvas.width !== Math.round(cssWidth * dpr) || canvas.height !== Math.round(cssHeight * dpr)) {
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);
  return { ctx, width: cssWidth, height: cssHeight };
}

function drawRoundedRect(ctx, x, y, w, h, r = 6) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawPillCallout(ctx, text, centerX, topY, textColor, borderColor, bgColor = PALETTE.bgCanvas) {
  ctx.save();
  ctx.font = '700 10.5px "JetBrains Mono", monospace';
  const textW = ctx.measureText(text).width;
  const padX = 8;
  const pillW = textW + padX * 2;
  const pillH = 20;
  const x = centerX - pillW / 2;
  const y = topY;

  ctx.fillStyle = bgColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.2;
  drawRoundedRect(ctx, x, y, pillW, pillH, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.fillText(text, centerX, y + 13.5);
  ctx.restore();
}

/* ==========================================================================
   MODULE 1: TERMODINÁMICA Y MECÁNICA (BEV vs PHEV)
   ========================================================================== */
function updateTechDetailPanel() {
  const panel = document.getElementById('tech-detail-panel');
  const tabBev = document.getElementById('tab-bev');
  const tabPhev = document.getElementById('tab-phev');
  const pill = document.getElementById('tech-pill');
  if (!panel) return;

  if (state.techTab === 'bev') {
    if (tabBev) {
      tabBev.classList.add('active');
      tabBev.setAttribute('aria-selected', 'true');
    }
    if (tabPhev) {
      tabPhev.classList.remove('active');
      tabPhev.setAttribute('aria-selected', 'false');
    }
    panel.setAttribute('aria-labelledby', 'tab-bev');
    if (pill && tabBev) SpringAnimator.movePillIndicator(pill, tabBev, 'tech-pill');

    panel.innerHTML = `
      <h3>Arquitectura BEV: Simplicidad Termodinámica (η ≈ 88–92%)</h3>
      <p>
        Un vehículo eléctrico puro elimina más de 2.000 piezas móviles sujetas a fricción, fatiga térmica y tribología crítica (turbocompresor, inyectores, embrague, correa de distribución, filtro de partículas GPF y catalizador de tres vías).
      </p>
      <ul style="color: var(--ink-secondary); font-size: 0.92rem; padding-left: 1.2rem; display: grid; gap: 0.5rem; margin-bottom: 0;">
        <li><strong>Sin degradación por trayectos cortos:</strong> El motor síncrono de imanes permanentes o rotor bobinado opera con eficiencia máxima desde t = 0 s, sin requerir calentamiento de fluidos ni alcanzar temperatura de régimen.</li>
        <li><strong>Frenada regenerativa en Madrid:</strong> En tráfico urbano (M-30 y almendra central), recupera entre el 25% y el 35% de la energía cinética, preservando discos y pastillas por más de 100.000 km.</li>
        <li><strong>Mantenimiento anual testimonial (~95 €/año):</strong> Limitado a filtro de habitáculo (carbón activo), revisión de neumáticos y líquido de frenos cada 2–3 años.</li>
      </ul>
    `;
  } else {
    if (tabPhev) {
      tabPhev.classList.add('active');
      tabPhev.setAttribute('aria-selected', 'true');
    }
    if (tabBev) {
      tabBev.classList.remove('active');
      tabBev.setAttribute('aria-selected', 'false');
    }
    panel.setAttribute('aria-labelledby', 'tab-phev');
    if (pill && tabPhev) SpringAnimator.movePillIndicator(pill, tabPhev, 'tech-pill');

    panel.innerHTML = `
      <h3 style="color: var(--accent-secondary);">Por qué el PHEV está contraindicado a 5.000 km/año</h3>
      <p>
        En recorridos diarios cortos (&lt;15 km), el híbrido enchufable arranca esporádicamente su motor de combustión en frío por picos de demanda o mantenimiento de gasolina vieja, sin alcanzar los <strong>90–95 °C</strong> necesarios en el cárter para evaporar el agua condensada.
      </p>
      <ul style="color: var(--ink-secondary); font-size: 0.92rem; padding-left: 1.2rem; display: grid; gap: 0.5rem; margin-bottom: 0;">
        <li><strong>Emulsión acuosa y dilución ácida del aceite:</strong> El vapor de agua (C<sub>n</sub>H<sub>m</sub> + O<sub>2</sub> → CO<sub>2</sub> + H<sub>2</sub>O) y los hidrocarburos inquemados condensan en las camisas frías, degradando los aditivos detergentes (ZDDP) y obligando a cambios de aceite cada 12 meses.</li>
        <li><strong>Batería pequeña sometida a estrés de ciclado:</strong> Con solo 10–14 kWh, sufre entre 4 y 5 veces más ciclos profundos anuales que una batería BEV de 52–60 kWh para los mismos kilómetros.</li>
        <li><strong>Lastre muerto de 150–200 kg:</strong> En ciudad arrastras un motor térmico apagado y su transmisión; en el viaje de 300 km arrastras una batería descargada con mayor consumo de gasolina (~480 €/año solo en taller oficial).</li>
      </ul>
    `;
  }
}

function renderTcoCanvas() {
  const canvas = document.getElementById('tco-canvas');
  const setup = setupHiDPICanvas(canvas, 620, 300);
  if (!setup) return;
  const { ctx, width, height } = setup;

  const data = computeTcoBreakdown(state.tcoMode);
  const pad = { top: 38, right: 24, bottom: 52, left: 68 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const rawMax = Math.max(...data.total, 800) * 1.15;
  const stepUnit = state.tcoMode === 'annual' ? 400 : 2000;
  const maxVal = niceMax(rawMax, stepUnit);

  // Gridlines
  ctx.strokeStyle = PALETTE.borderSubtle;
  ctx.lineWidth = 1;
  ctx.font = '500 11px "JetBrains Mono", monospace';
  ctx.fillStyle = PALETTE.inkMuted;
  ctx.textAlign = 'right';

  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const val = Math.round((maxVal / steps) * i);
    const y = pad.top + plotH - (val / maxVal) * plotH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();
    ctx.fillText(fmtEur(val), pad.left - 8, y + 4);
  }

  // Legend
  ctx.textAlign = 'left';
  ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = PALETTE.sage;
  ctx.fillRect(pad.left, 10, 12, 12);
  ctx.fillStyle = PALETTE.inkPrimary;
  ctx.fillText('Energía / Combustible', pad.left + 17, 20);

  ctx.fillStyle = PALETTE.copper;
  ctx.fillRect(pad.left + 168, 10, 12, 12);
  ctx.fillStyle = PALETTE.inkPrimary;
  ctx.fillText('Mantenimiento Taller e ITV', pad.left + 185, 20);

  // Stacked Bars
  const groupW = plotW / data.labels.length;
  const barW = Math.min(82, groupW * 0.46);

  data.labels.forEach((label, idx) => {
    const eVal = data.energy[idx];
    const mVal = data.maintenance[idx];
    const tot = data.total[idx];

    const centerX = pad.left + groupW * idx + groupW / 2;
    const x = centerX - barW / 2;

    const eH = (eVal / maxVal) * plotH;
    const mH = (mVal / maxVal) * plotH;

    const yEnergy = pad.top + plotH - eH;
    const yMaint = yEnergy - mH;

    // Energy segment (bottom)
    ctx.fillStyle = idx === 0 ? PALETTE.sage : '#64748B';
    drawRoundedRect(ctx, x, yEnergy, barW, eH, 4);
    ctx.fill();

    // Maintenance segment (top)
    ctx.fillStyle = idx === 0 ? PALETTE.sageMid : PALETTE.copper;
    drawRoundedRect(ctx, x, yMaint, barW, mH, 4);
    ctx.fill();

    // Total badge above bar
    ctx.fillStyle = PALETTE.inkPrimary;
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(fmtEur(tot), centerX, yMaint - 8);

    // X-axis label
    ctx.fillStyle = PALETTE.inkSecondary;
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(label, centerX, pad.top + plotH + 21);

    ctx.fillStyle = PALETTE.inkMuted;
    ctx.font = '500 9.5px "JetBrains Mono", monospace';
    ctx.fillText(`E:${fmtInt(eVal)}€ · T:${fmtInt(mVal)}€`, centerX, pad.top + plotH + 36);
  });
}

/* ==========================================================================
   MODULE 2: LABORATORIO ELECTROQUÍMICO LFP vs NMC
   ========================================================================== */
function renderElectrochemistryModule() {
  const socLabel = document.getElementById('chem-soc-val');
  if (socLabel) socLabel.textContent = `${state.chemSoc}% SoC`;

  const cardLfp = document.getElementById('card-lfp');
  const cardNmc = document.getElementById('card-nmc');
  if (cardLfp && cardNmc) {
    const isLfp = state.selectedChemFocus === 'LFP';
    cardLfp.style.boxShadow = isLfp ? 'var(--shadow-elevated)' : 'var(--shadow-card)';
    cardNmc.style.boxShadow = !isLfp ? 'var(--shadow-elevated)' : 'var(--shadow-card)';
    cardLfp.setAttribute('aria-pressed', isLfp ? 'true' : 'false');
    cardNmc.setAttribute('aria-pressed', !isLfp ? 'true' : 'false');
  }

  const aging = computeCalendarAging({ socPercent: state.chemSoc, tempC: state.chemTemp });

  const verdictBox = document.getElementById('chem-verdict-box');
  if (verdictBox) {
    verdictBox.innerHTML = `
      <strong>Dictamen Electroquímico a 10 Años (${state.chemTemp} °C · ${state.chemSoc}% SoC en garaje):</strong>
      Pérdida acumulada LFP (LiFePO<sub>4</sub>): <strong class="tabular" style="color: var(--accent-primary);">-${aging.lfp10YrLoss}%</strong> (retiene <strong>${aging.lfpRetention[10]}% SoH</strong>)
      frente a pérdida NMC: <strong class="tabular" style="color: var(--accent-secondary);">-${aging.nmc10YrLoss}%</strong> (retiene <strong>${aging.nmcRetention[10]}% SoH</strong>).
      <div style="margin-top: 0.35rem; color: var(--ink-secondary);">${aging.verdictText}</div>
    `;
  }

  renderAgingCanvas(aging);
  renderVoltageCanvas(aging);
}

function renderAgingCanvas(aging) {
  const canvas = document.getElementById('aging-canvas');
  const setup = setupHiDPICanvas(canvas, 580, 290);
  if (!setup) return;
  const { ctx, width, height } = setup;

  const pad = { top: 44, right: 64, bottom: 42, left: 48 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const minY = 70;
  const maxY = 100;

  // Top legend header (never collides with curves)
  const lfpEnd = aging.lfpRetention[10];
  const nmcEnd = aging.nmcRetention[10];
  ctx.font = '600 10.5px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';

  ctx.fillStyle = PALETTE.sage;
  ctx.fillRect(pad.left, 11, 10, 10);
  ctx.fillStyle = PALETTE.inkPrimary;
  const lfpLegTxt = `LFP Olivino (10a): ${String(lfpEnd).replace('.', ',')}% SoH`;
  ctx.fillText(lfpLegTxt, pad.left + 14, 20);

  const nmcLegX = pad.left + ctx.measureText(lfpLegTxt).width + 26;
  ctx.fillStyle = PALETTE.copper;
  ctx.fillRect(nmcLegX, 11, 10, 10);
  ctx.fillStyle = PALETTE.inkPrimary;
  ctx.fillText(`NMC Laminar (10a): ${String(nmcEnd).replace('.', ',')}% SoH`, nmcLegX + 14, 20);

  // Grid
  ctx.strokeStyle = PALETTE.borderSubtle;
  ctx.lineWidth = 1;
  ctx.font = '500 10.5px "JetBrains Mono", monospace';
  ctx.fillStyle = PALETTE.inkMuted;
  ctx.textAlign = 'right';

  for (let v = minY; v <= maxY; v += 5) {
    const y = pad.top + plotH - ((v - minY) / (maxY - minY)) * plotH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotW, y);
    ctx.stroke();
    ctx.fillText(`${v}%`, pad.left - 7, y + 3.5);
  }

  // X-axis years 0..10 (uniform format)
  ctx.textAlign = 'center';
  aging.years.forEach((yr, idx) => {
    const x = pad.left + (idx / 10) * plotW;
    ctx.fillText(`${yr}a`, x, height - 14);
  });

  const getY = (val) => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    return pad.top + plotH - ((clamped - minY) / (maxY - minY)) * plotH;
  };

  const drawCurve = (values, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    values.forEach((val, idx) => {
      const x = pad.left + (idx / 10) * plotW;
      const y = getY(val);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    values.forEach((val, idx) => {
      const x = pad.left + (idx / 10) * plotW;
      const y = getY(val);
      ctx.fillStyle = PALETTE.bgElevated;
      ctx.beginPath();
      ctx.arc(x, y, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };

  drawCurve(aging.lfpRetention, PALETTE.sage);
  drawCurve(aging.nmcRetention, PALETTE.copper);

  // Right-margin endpoint pills (drawn strictly outside plotW so they never touch Years 7-10 curve lines)
  let lfpPillY = getY(lfpEnd) - 10;
  let nmcPillY = getY(nmcEnd) - 10;
  if (Math.abs(nmcPillY - lfpPillY) < 22) {
    const mid = (lfpPillY + nmcPillY) / 2;
    lfpPillY = mid - 11;
    nmcPillY = mid + 11;
  }
  const pillCenterX = pad.left + plotW + 33;
  drawPillCallout(ctx, `${String(lfpEnd).replace('.', ',')}%`, pillCenterX, lfpPillY, PALETTE.sage, PALETTE.sage, PALETTE.bgElevated);
  drawPillCallout(ctx, `${String(nmcEnd).replace('.', ',')}%`, pillCenterX, nmcPillY, PALETTE.copper, PALETTE.copper, PALETTE.bgElevated);
}

function renderVoltageCanvas(aging) {
  const canvas = document.getElementById('voltage-canvas');
  const setup = setupHiDPICanvas(canvas, 580, 290);
  if (!setup) return;
  const { ctx, width, height } = setup;

  const pad = { top: 46, right: 24, bottom: 42, left: 54 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const minV = 2.9;
  const maxV = 4.3;

  const getY = (v) => pad.top + plotH - ((v - minV) / (maxV - minV)) * plotH;

  // High anodic oxidation stress zone (> 4.02 V) shaded inside plot area
  const stressYTop = getY(4.3);
  const stressYBot = getY(4.02);
  ctx.fillStyle = 'rgba(180, 83, 9, 0.08)';
  ctx.fillRect(pad.left, stressYTop, plotW, stressYBot - stressYTop);

  // Top header badge for stress zone (above 4.20V gridline so line never cuts text)
  ctx.save();
  ctx.fillStyle = PALETTE.copperSoft;
  ctx.strokeStyle = 'rgba(180, 83, 9, 0.35)';
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, pad.left, 8, Math.min(plotW, 385), 22, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PALETTE.copper;
  ctx.font = '600 10.5px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('▲ Zona >4,02 V: Oxidación acelerada del electrolito en NMC', pad.left + 8, 22.5);
  ctx.restore();

  // Grid
  ctx.strokeStyle = PALETTE.borderSubtle;
  ctx.lineWidth = 1;
  ctx.font = '500 10.5px "JetBrains Mono", monospace';
  ctx.fillStyle = PALETTE.inkMuted;
  ctx.textAlign = 'right';

  for (let v = 3.0; v <= 4.21; v += 0.3) {
    const y = getY(v);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();
    ctx.fillText(`${v.toFixed(2).replace('.', ',')} V`, pad.left - 7, y + 3.5);
  }

  // Current SoC vertical marker
  const socX = pad.left + (state.chemSoc / 100) * plotW;
  ctx.strokeStyle = PALETTE.inkPrimary;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(socX, pad.top);
  ctx.lineTo(socX, pad.top + plotH);
  ctx.stroke();
  ctx.setLineDash([]);

  // X-axis SoC labels
  ctx.textAlign = 'center';
  aging.voltageCurve.socPoints.forEach((s) => {
    const x = pad.left + (s / 100) * plotW;
    ctx.fillStyle = PALETTE.inkMuted;
    ctx.fillText(`${s}%`, x, height - 14);
  });

  const drawVoltLine = (volts, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    volts.forEach((v, idx) => {
      const s = aging.voltageCurve.socPoints[idx];
      const x = pad.left + (s / 100) * plotW;
      const y = getY(v);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  };

  drawVoltLine(aging.voltageCurve.lfpVolts, PALETTE.sage);
  drawVoltLine(aging.voltageCurve.nmcVolts, PALETTE.copper);

  // Place callout pills in guaranteed clear zones above NMC and below LFP
  // NMC at 65% SoC is ~3.88V; placing NMC pill above 3.92V in the left-center (36% SoC) keeps it strictly above the NMC curve
  const nmcHighestInSpanY = getY(3.86);
  const nmcPillTop = Math.max(pad.top + 18, nmcHighestInSpanY - 26);
  drawPillCallout(
    ctx,
    'Pendiente NMC (3,65–4,20 V)',
    pad.left + plotW * 0.36,
    nmcPillTop,
    PALETTE.copper,
    PALETTE.copper,
    PALETTE.bgElevated
  );

  // LFP in 25%-85% SoC is flat at 3.25-3.32V; placing LFP pill below 3.20V keeps it strictly below the LFP plateau
  const lfpLowestInSpanY = getY(3.22);
  const lfpPillTop = Math.min(pad.top + plotH - 22, lfpLowestInSpanY + 6);
  drawPillCallout(
    ctx,
    'Meseta LFP ~3,29 V (FePO₄/LiFePO₄)',
    pad.left + plotW * 0.56,
    lfpPillTop,
    PALETTE.sage,
    PALETTE.sage,
    PALETTE.bgElevated
  );
}

/* ==========================================================================
   MODULE 3: PÓKER PROTAGONISTA, CATÁLOGO Y CARA A CARA (1 vs 1)
   ========================================================================== */
function populateVehicleSelects() {
  const selectIds = ['versus-car-a', 'versus-car-b', 'dim-car-select', 'sim-car-select', 'trip-car-select'];
  selectIds.forEach((id) => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = VEHICLES.map((v) => {
      const priceTxt = fmtInt(v.priceAvg);
      return `<option value="${v.id}">${v.shortName} · ${v.chemistry} ${v.batteryKwh} kWh (${priceTxt} €)</option>`;
    }).join('');
  });

  const vsA = document.getElementById('versus-car-a');
  const vsB = document.getElementById('versus-car-b');
  const dimSel = document.getElementById('dim-car-select');
  const simSel = document.getElementById('sim-car-select');
  const tripSel = document.getElementById('trip-car-select');

  if (vsA) vsA.value = state.versusCarA;
  if (vsB) vsB.value = state.versusCarB;
  if (dimSel) dimSel.value = state.dimCarId;
  if (simSel) simSel.value = state.simCarId;
  if (tripSel) tripSel.value = state.tripCarId;
}

function renderProtagonistGrid() {
  const grid = document.getElementById('protagonist-grid');
  if (!grid) return;

  const protagonists = VEHICLES.filter((v) => v.isProtagonist);
  grid.innerHTML = protagonists.map((car) => {
    const sim = computePatrimonialSimulation({
      carId: car.id,
      customPrice: car.priceAvg,
      useCambia360: true,
      useScrappage: true,
      useIrpfCar: true,
      wallboxCost: 1800,
      useWallboxAid: true,
      marginalIrpfRate: 37,
      horizonYears: 6
    });
    const chemClass = car.chemistry === 'LFP' ? 'lfp' : 'nmc';
    const variantsHtml = (car.variants || []).map((vr) =>
      `<div style="display:flex; justify-content:space-between; font-size:0.78rem; padding:0.2rem 0; border-bottom:1px dashed var(--border-subtle);">
         <span>${vr.name}</span>
         <strong class="tabular">${vr.wltpKm} km · ${fmtEur(vr.priceEur)}</strong>
       </div>`
    ).join('');

    return `
      <article class="vehicle-card protagonist">
        <div>
          <div class="badge-row" style="margin-bottom: 0.55rem;">
            <span class="tag ${chemClass}">${car.chemistry} · ${car.batteryKwh} kWh</span>
            <span class="tag">${car.condition}</span>
            <span class="tag tabular">${car.wltpKm} km WLTP</span>
            <span class="tag">${car.badge}</span>
          </div>
          <h3 style="margin-bottom: 0.35rem; font-size: 1.28rem;">${car.name}</h3>
          <p style="font-size: 0.86rem; margin-bottom: 0.75rem;">${car.configSummary}</p>

          <div class="spec-grid-mini" style="margin-bottom: 0.75rem;">
            <div><span style="color:var(--ink-muted);">Precio Contado:</span> <strong class="tabular">${fmtEur(car.priceAvg)}</strong></div>
            <div><span style="color:var(--ink-muted);">Neto tras IRPF+WB:</span> <strong class="tabular" style="color:var(--accent-primary);">${fmtEur(sim.netInitialOutlayAfterTax)}</strong></div>
            <div><span style="color:var(--ink-muted);">Dimensiones:</span> <strong class="tabular">${fmtInt(car.lengthMm)} × ${fmtInt(car.widthMm)} mm</strong></div>
            <div><span style="color:var(--ink-muted);">Maletero:</span> <strong class="tabular">${car.trunkLiters + (car.frunkLiters || 0)} L</strong></div>
            <div><span style="color:var(--ink-muted);">Consumo 120 km/h:</span> <strong class="tabular">${car.highwayKwh100} kWh/100</strong></div>
            <div><span style="color:var(--ink-muted);">Carga DC 10-80%:</span> <strong class="tabular">${car.dcPeakKw} kW (${car.dc10to80Min} min)</strong></div>
          </div>

          <div style="margin-bottom: 0.75rem;">
            <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--ink-muted); margin-bottom:0.25rem;">Variantes y Precios Verificados:</div>
            ${variantsHtml}
          </div>
          <p style="font-size: 0.82rem; color: var(--ink-secondary); margin-bottom: 0;">${car.notes}</p>
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--border-subtle);">
          <a href="${car.configuratorUrl}" target="_blank" rel="noopener noreferrer" class="btn-apple primary sm">
            Abrir Configurador Oficial ↗
          </a>
          <button type="button" class="btn-apple sm js-load-sim" data-car-id="${car.id}">
            Simular IRPF y Devaluación
          </button>
          <button type="button" class="btn-apple sm js-load-dim" data-car-id="${car.id}">
            Medir vs Opel Astra
          </button>
        </div>
      </article>
    `;
  }).join('');
}

function renderCatalogGrid() {
  const grid = document.getElementById('catalog-grid');
  const budgetLabel = document.getElementById('budget-label');
  if (budgetLabel) budgetLabel.textContent = fmtEur(state.catalogBudget);
  if (!grid) return;

  const filtered = VEHICLES.filter((car) => {
    if (state.catalogChem !== 'ALL' && car.chemistry !== state.catalogChem) return false;
    if (state.catalogCondition !== 'ALL' && car.condition !== state.catalogCondition) return false;
    if (car.priceMin > state.catalogBudget && car.priceAvg > state.catalogBudget) return false;
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="card" style="grid-column: 1 / -1; text-align: center;">
        <p style="margin-bottom: 0;">Ningún vehículo coincide con los filtros seleccionados. Amplía el presupuesto o selecciona "Todas las Químicas".</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map((car) => {
    const chemClass = car.chemistry === 'LFP' ? 'lfp' : 'nmc';
    return `
      <article class="vehicle-card ${car.isProtagonist ? 'protagonist' : ''}">
        <div>
          <div class="badge-row" style="margin-bottom: 0.45rem;">
            <span class="tag ${chemClass}">${car.chemistry} ${car.batteryKwh} kWh</span>
            <span class="tag">${car.condition}</span>
            <span class="tag tabular">${fmtEur(car.priceAvg)}</span>
          </div>
          <h4 style="margin-bottom: 0.25rem;">${car.name}</h4>
          <p style="font-size: 0.82rem; margin-bottom: 0.65rem;">${car.segment} · ${car.powerCv} CV · ${car.wltpKm} km WLTP</p>
          <div class="spec-grid-mini">
            <div>Largo: <strong class="tabular">${fmtInt(car.lengthMm)} mm</strong></div>
            <div>Maletero: <strong class="tabular">${car.trunkLiters + (car.frunkLiters || 0)} L</strong></div>
            <div>Autovía: <strong class="tabular">${car.highwayKwh100} kWh</strong></div>
            <div>Pico DC: <strong class="tabular">${car.dcPeakKw} kW</strong></div>
          </div>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
          <a href="${car.configuratorUrl}" target="_blank" rel="noopener noreferrer" class="btn-apple sm">Web Oficial ↗</a>
          <button type="button" class="btn-apple sm js-load-sim" data-car-id="${car.id}">Simular</button>
          <button type="button" class="btn-apple sm js-load-vs" data-car-id="${car.id}">Comparar 1vs1</button>
        </div>
      </article>
    `;
  }).join('');
}

function renderVersusComparison() {
  const container = document.getElementById('versus-comparison-body');
  if (!container) return;

  const carA = VEHICLES.find((v) => v.id === state.versusCarA) || VEHICLES[0];
  const carB = VEHICLES.find((v) => v.id === state.versusCarB) || VEHICLES[1];

  const simA = computePatrimonialSimulation({ carId: carA.id, horizonYears: 5 });
  const simB = computePatrimonialSimulation({ carId: carB.id, horizonYears: 5 });
  const tripA = computeHighwayTrip300km({ carId: carA.id, speedKmh: 120, weather: 'mild' });
  const tripB = computeHighwayTrip300km({ carId: carB.id, speedKmh: 120, weather: 'mild' });

  const realHighwayRangeA = Math.round((carA.batteryKwh * 0.96 / carA.highwayKwh100) * 100);
  const realHighwayRangeB = Math.round((carB.batteryKwh * 0.96 / carB.highwayKwh100) * 100);

  const cargoA = carA.trunkLiters + (carA.frunkLiters || 0);
  const cargoB = carB.trunkLiters + (carB.frunkLiters || 0);

  const tco5A = simA.yearlyCurve.selectedNetCost[5];
  const tco5B = simB.yearlyCurve.selectedNetCost[5];

  const metrics = [
    {
      title: 'Química Catódica y Estabilidad por Calendario',
      valA: `${carA.chemistry} (${carA.batteryKwh} kWh)`,
      valB: `${carB.chemistry} (${carB.batteryKwh} kWh)`,
      pctA: (carA.batteryKwh / 65) * 100,
      pctB: (carB.batteryKwh / 65) * 100,
      winner: carA.chemistry === 'LFP' && carB.chemistry !== 'LFP' ? carA.shortName
        : carB.chemistry === 'LFP' && carA.chemistry !== 'LFP' ? carB.shortName
        : carA.batteryKwh >= carB.batteryKwh ? carA.shortName : carB.shortName
    },
    {
      title: 'Autonomía Real en Autovía a 120 km/h (100% → 0%)',
      valA: `${realHighwayRangeA} km (${carA.highwayKwh100} kWh/100)`,
      valB: `${realHighwayRangeB} km (${carB.highwayKwh100} kWh/100)`,
      pctA: (realHighwayRangeA / 420) * 100,
      pctB: (realHighwayRangeB / 420) * 100,
      winner: realHighwayRangeA >= realHighwayRangeB ? carA.shortName : carB.shortName
    },
    {
      title: 'Potencia Pico Carga Rápida DC (10% a 80%)',
      valA: `${carA.dcPeakKw} kW (${carA.dc10to80Min} min)`,
      valB: `${carB.dcPeakKw} kW (${carB.dc10to80Min} min)`,
      pctA: (carA.dcPeakKw / 180) * 100,
      pctB: (carB.dcPeakKw / 180) * 100,
      winner: carA.dcPeakKw >= carB.dcPeakKw ? carA.shortName : carB.shortName
    },
    {
      title: 'Capacidad Total de Maletero (incl. Frunk) y Longitud',
      valA: `${cargoA} L (${fmtInt(carA.lengthMm)} mm)`,
      valB: `${cargoB} L (${fmtInt(carB.lengthMm)} mm)`,
      pctA: (cargoA / 620) * 100,
      pctB: (cargoB / 620) * 100,
      winner: cargoA >= cargoB ? `${carA.shortName} (+Carga)` : `${carB.shortName} (+Carga)`
    },
    {
      title: 'Desembolso Inicial Neto Real (con Wallbox, Ayudas e IRPF)',
      valA: `${fmtEur(simA.netInitialOutlayAfterTax)} (Bruto ${fmtEur(carA.priceAvg)})`,
      valB: `${fmtEur(simB.netInitialOutlayAfterTax)} (Bruto ${fmtEur(carB.priceAvg)})`,
      pctA: (simA.netInitialOutlayAfterTax / 35000) * 100,
      pctB: (simB.netInitialOutlayAfterTax / 35000) * 100,
      winner: simA.netInitialOutlayAfterTax <= simB.netInitialOutlayAfterTax ? `${carA.shortName} (Más económico)` : `${carB.shortName} (Más económico)`
    },
    {
      title: 'Coste Patrimonial Neto a 5 Años (Compra + Uso − Reventa)',
      valA: `${fmtEur(tco5A)} (Viaje 300 km: ${tripA.needsStop ? `${tripA.stopMinutes} min parada` : 'Sin parar'})`,
      valB: `${fmtEur(tco5B)} (Viaje 300 km: ${tripB.needsStop ? `${tripB.stopMinutes} min parada` : 'Sin parar'})`,
      pctA: (tco5A / 18000) * 100,
      pctB: (tco5B / 18000) * 100,
      winner: tco5A <= tco5B ? `${carA.shortName} (Menor pérdida patrimonial)` : `${carB.shortName} (Menor pérdida patrimonial)`
    }
  ];

  container.innerHTML = metrics.map((m) => `
    <div class="vs-metric-row">
      <div class="vs-metric-top">
        <span class="vs-metric-title">${m.title}</span>
        <span class="tag lfp vs-winner-badge">Ventaja: ${m.winner}</span>
      </div>
      <div class="vs-metric-cols">
        <div class="vs-col">
          <div class="vs-val-label car-a">${carA.shortName}: ${m.valA}</div>
          <div class="vs-bar-track">
            <div class="vs-bar-fill" style="width: ${Math.min(100, Math.max(8, m.pctA)).toFixed(1)}%;"></div>
          </div>
        </div>
        <div class="vs-col">
          <div class="vs-val-label car-b">${carB.shortName}: ${m.valB}</div>
          <div class="vs-bar-track">
            <div class="vs-bar-fill car-b" style="width: ${Math.min(100, Math.max(8, m.pctB)).toFixed(1)}%;"></div>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

/* ==========================================================================
   MODULE 4: COMPARADOR VISUAL DE TAMAÑO VS OPEL ASTRA (2000)
   ========================================================================== */
function renderDimensionsModule() {
  const diff = computeDimensionsDiff(state.dimCarId, state.dimAstraKey);

  const elLen = document.getElementById('dim-delta-length');
  const elWid = document.getElementById('dim-delta-width');
  const elWb = document.getElementById('dim-delta-wheelbase');
  const elTrk = document.getElementById('dim-delta-trunk');
  const elVerdict = document.getElementById('dim-verdict-text');

  const signCm = (mm) => {
    const cm = (mm / 10).toFixed(1).replace('.', ',');
    return mm > 0 ? `+${cm} cm` : `${cm} cm`;
  };
  const signL = (liters) => (liters > 0 ? `+${liters} L` : `${liters} L`);

  if (elLen) elLen.textContent = signCm(diff.deltaLengthMm);
  if (elWid) elWid.textContent = signCm(diff.deltaWidthMm);
  if (elWb) elWb.textContent = signCm(diff.deltaWheelbaseMm);
  if (elTrk) elTrk.textContent = signL(diff.deltaTrunkLiters);

  if (elVerdict) {
    elVerdict.innerHTML = `
      <strong>Comparativa Metrológica (${diff.car.name} vs. ${diff.astra.name}):</strong>
      ${diff.sizeVerdict}
      Longitud: <strong class="tabular">${fmtInt(diff.car.lengthMm)} mm</strong> vs <strong class="tabular">${fmtInt(diff.astra.lengthMm)} mm</strong> ·
      Anchura: <strong class="tabular">${fmtInt(diff.car.widthMm)} mm</strong> vs <strong class="tabular">${fmtInt(diff.astra.widthMm)} mm</strong> ·
      Capacidad total de carga: <strong class="tabular">${diff.totalCargoLiters} L</strong> vs <strong class="tabular">${diff.astra.trunkLiters} L</strong>.
    `;
  }

  renderDimensionsCanvas(diff);
  renderAllCarsDimensionBars(diff.astra);
}

function renderDimensionsCanvas(diff) {
  const canvas = document.getElementById('dimensions-canvas');
  const setup = setupHiDPICanvas(canvas, 820, 330);
  if (!setup) return;
  const { ctx, width, height } = setup;

  const { car, astra } = diff;
  const maxMm = 4900;
  const leftZoneW = width * 0.62;
  const rightZoneX = width * 0.66;
  const rightZoneW = width * 0.31;

  // Ground line for side profile
  const groundY = height - 56;
  const scaleX = (leftZoneW - 60) / maxMm;
  const startX = 32;

  ctx.strokeStyle = PALETTE.borderStrong;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(startX - 10, groundY);
  ctx.lineTo(leftZoneW, groundY);
  ctx.stroke();

  const drawSideProfile = (v, isAstra) => {
    const lenPx = v.lengthMm * scaleX;
    const hPx = v.heightMm * scaleX * 1.15;
    const wbPx = v.wheelbaseMm * scaleX;
    const wheelR = 21;
    const frontWheelX = startX + lenPx * 0.19;
    const rearWheelX = frontWheelX + wbPx;

    ctx.save();
    if (isAstra) {
      ctx.strokeStyle = PALETTE.copper;
      ctx.lineWidth = 2.2;
      ctx.setLineDash([6, 4]);
      ctx.fillStyle = 'rgba(180, 83, 9, 0.08)';
    } else {
      ctx.strokeStyle = PALETTE.sage;
      ctx.lineWidth = 2.6;
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(15, 94, 86, 0.16)';
    }

    ctx.beginPath();
    ctx.moveTo(startX, groundY - wheelR * 0.9);
    ctx.lineTo(startX + lenPx * 0.05, groundY - hPx * 0.52);
    ctx.lineTo(startX + lenPx * 0.28, groundY - hPx * 0.58);
    ctx.lineTo(startX + lenPx * 0.44, groundY - hPx);
    ctx.lineTo(startX + lenPx * 0.78, groundY - hPx * 0.96);
    ctx.lineTo(startX + lenPx * 0.96, groundY - hPx * 0.55);
    ctx.lineTo(startX + lenPx, groundY - wheelR * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    [frontWheelX, rearWheelX].forEach((wx) => {
      ctx.beginPath();
      ctx.arc(wx, groundY - wheelR, wheelR, 0, Math.PI * 2);
      ctx.fillStyle = isAstra ? 'rgba(180, 83, 9, 0.15)' : 'rgba(15, 94, 86, 0.25)';
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();
  };

  drawSideProfile(car, false);
  drawSideProfile(astra, true);

  ctx.font = '700 11.5px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = PALETTE.sage;
  ctx.textAlign = 'left';
  ctx.fillText(`■ ${car.shortName}: ${fmtInt(car.lengthMm)} mm largo × ${fmtInt(car.heightMm)} mm alto (Batalla ${fmtInt(car.wheelbaseMm)} mm)`, startX, 24);

  ctx.fillStyle = PALETTE.copper;
  ctx.fillText(`▢ ${astra.name}: ${fmtInt(astra.lengthMm)} mm largo × ${fmtInt(astra.heightMm)} mm alto (Batalla ${fmtInt(astra.wheelbaseMm)} mm)`, startX, 44);

  const evEndPx = startX + car.lengthMm * scaleX;
  const astraEndPx = startX + astra.lengthMm * scaleX;
  ctx.font = '600 11px "JetBrains Mono", monospace';
  ctx.fillStyle = PALETTE.sage;
  ctx.fillText(`${(car.lengthMm / 1000).toFixed(2).replace('.', ',')} m`, evEndPx - 42, groundY + 20);
  ctx.fillStyle = PALETTE.copper;
  ctx.fillText(`Astra: ${(astra.lengthMm / 1000).toFixed(2).replace('.', ',')} m`, astraEndPx - 78, groundY + 38);

  // Right zone: Top-down garage footprint comparison
  const topScaleY = (height - 84) / maxMm;
  const topScaleX = topScaleY * 1.25;
  const centerX = rightZoneX + rightZoneW / 2;
  const topOriginY = 48;

  ctx.fillStyle = PALETTE.inkPrimary;
  ctx.font = '700 11.5px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Planta en Plaza de Garaje (Ancho × Largo)', centerX, 24);

  const evW = car.widthMm * topScaleX;
  const evL = car.lengthMm * topScaleY;
  ctx.fillStyle = 'rgba(15, 94, 86, 0.16)';
  ctx.strokeStyle = PALETTE.sage;
  ctx.lineWidth = 2.2;
  drawRoundedRect(ctx, centerX - evW / 2, topOriginY, evW, evL, 12);
  ctx.fill();
  ctx.stroke();

  const asW = astra.widthMm * topScaleX;
  const asL = astra.lengthMm * topScaleY;
  ctx.save();
  ctx.strokeStyle = PALETTE.copper;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  drawRoundedRect(ctx, centerX - asW / 2, topOriginY, asW, asL, 10);
  ctx.stroke();
  ctx.restore();

  ctx.font = '600 10.5px "JetBrains Mono", monospace';
  ctx.fillStyle = PALETTE.inkPrimary;
  ctx.fillText(`Ancho EV: ${fmtInt(car.widthMm)} mm`, centerX, topOriginY + evL / 2 - 6);
  ctx.fillStyle = PALETTE.copper;
  ctx.fillText(`Astra: ${fmtInt(astra.widthMm)} mm`, centerX, topOriginY + evL / 2 + 12);
}

function renderAllCarsDimensionBars(astra) {
  const container = document.getElementById('dim-all-cars-bars');
  if (!container) return;

  const allRows = [
    {
      name: `★ ${astra.name}`,
      lengthMm: astra.lengthMm,
      cargoL: astra.trunkLiters,
      isAstra: true
    },
    ...VEHICLES.map((v) => ({
      name: v.shortName,
      lengthMm: v.lengthMm,
      cargoL: v.trunkLiters + (v.frunkLiters || 0),
      isAstra: false,
      isSelected: v.id === state.dimCarId
    }))
  ];

  container.innerHTML = allRows.map((row) => {
    const pctLen = Math.min(100, (row.lengthMm / 4850) * 100).toFixed(1);
    const barColor = row.isAstra ? 'var(--accent-secondary)' : row.isSelected ? 'var(--accent-primary)' : '#64748B';
    const diffMm = row.lengthMm - astra.lengthMm;
    const diffTxt = row.isAstra ? 'Referencia' : `${diffMm >= 0 ? '+' : ''}${(diffMm / 10).toFixed(1).replace('.', ',')} cm`;

    return `
      <div class="dim-bar-item">
        <div style="font-weight: ${row.isAstra || row.isSelected ? '700' : '500'}; color: var(--ink-primary);">
          ${row.name}
        </div>
        <div class="dim-bar-track">
          <div class="dim-bar-fill" style="width: ${pctLen}%; background: ${barColor};"></div>
        </div>
        <div class="tabular" style="text-align: right; font-size: 0.78rem;">
          <strong>${fmtInt(row.lengthMm)} mm</strong> · ${row.cargoL} L
          <div style="color: var(--ink-muted);">${diffTxt}</div>
        </div>
      </div>
    `;
  }).join('');
}

/* ==========================================================================
   MODULE 5: SIMULADOR PATRIMONIAL (5-8 AÑOS) + CASCADA IRPF + DEPRECIACIÓN
   ========================================================================== */
function renderPatrimonialModule() {
  const car = VEHICLES.find((v) => v.id === state.simCarId) || VEHICLES[0];

  const chkCambia = document.getElementById('chk-cambia360');
  const chkScrap = document.getElementById('chk-achatarra');
  const chkIrpfCar = document.getElementById('chk-irpf-car');
  const warningBanner = document.getElementById('sim-occasion-warning');

  if (!car.eligibleNewAid) {
    if (warningBanner) warningBanner.style.display = 'block';
    [chkCambia, chkScrap, chkIrpfCar].forEach((el) => {
      if (el) {
        el.checked = false;
        el.disabled = true;
      }
    });
  } else {
    if (warningBanner) warningBanner.style.display = 'none';
    [chkCambia, chkScrap, chkIrpfCar].forEach((el) => {
      if (el) el.disabled = false;
    });
    if (chkCambia) chkCambia.checked = state.simUseCambia360;
    if (chkScrap) chkScrap.checked = state.simUseScrappage;
    if (chkIrpfCar) chkIrpfCar.checked = state.simUseIrpfCar;
  }

  const priceLabel = document.getElementById('sim-price-label');
  const wbLabel = document.getElementById('sim-wallbox-label');
  if (priceLabel) priceLabel.textContent = fmtEur(state.simCustomPrice);
  if (wbLabel) wbLabel.textContent = fmtEur(state.simWallboxCost);

  const sim = computePatrimonialSimulation({
    carId: state.simCarId,
    customPrice: state.simCustomPrice,
    useCambia360: state.simUseCambia360,
    useScrappage: state.simUseScrappage,
    useIrpfCar: state.simUseIrpfCar,
    wallboxCost: state.simWallboxCost,
    useWallboxAid: state.simUseWallboxAid,
    marginalIrpfRate: state.simIrpfBracket,
    horizonYears: state.simHorizonYears
  });

  const endIdx = sim.yearlyCurve.years.length - 1;
  const endResidual = sim.yearlyCurve.selectedResidual[endIdx];
  const endNetTco = sim.yearlyCurve.selectedNetCost[endIdx];

  SpringAnimator.animateNumber(document.getElementById('res-gross'), sim.grossTotal, fmtEur);
  SpringAnimator.animateNumber(document.getElementById('res-aids-nominal'), -sim.totalAidsNominal, fmtSignedEur);
  SpringAnimator.animateNumber(document.getElementById('res-tax-bite'), sim.taxBiteIrpf, fmtSignedEur);
  SpringAnimator.animateNumber(document.getElementById('res-net-initial'), sim.netInitialOutlayAfterTax, fmtEur);
  SpringAnimator.animateNumber(document.getElementById('res-residual-val'), endResidual, fmtEur);
  SpringAnimator.animateNumber(document.getElementById('res-tco-net'), endNetTco, fmtEur);

  const breakdownEl = document.getElementById('sim-breakdown-text');
  if (breakdownEl) {
    const m3EndCost = sim.yearlyCurve.model3UsedNetCost[endIdx];
    const iceEndCost = sim.yearlyCurve.iceNetCost[endIdx];
    breakdownEl.innerHTML = `
      <strong>Auditoría Fiscal y Patrimonial a ${state.simHorizonYears} años (${sim.car.shortName}):</strong>
      Subvenciones directas sujetas a IRPF: <strong class="tabular">${fmtEur(sim.taxableSubsidies)}</strong>
      (Coche: ${fmtEur(sim.directCarSub)} + Wallbox Cambia 360: ${fmtEur(sim.wallboxCambia)}) →
      Retención en Renta al ${state.simIrpfBracket}%: <strong class="tabular" style="color:var(--accent-secondary);">+${fmtEur(sim.taxBiteIrpf)}</strong>.
      Deducciones estatales exentas (15% IRPF): <strong class="tabular" style="color:var(--accent-primary);">-${fmtEur(sim.irpfCarDed + sim.wallboxIrpf)}</strong>.
      <div style="margin-top:0.35rem; color:var(--ink-secondary);">
        Al cabo de <strong>${state.simHorizonYears} años</strong>, tu coste patrimonial neto acumulado (compra neta + energía/taller − valor residual de reventa de ${fmtEur(endResidual)}) es de
        <strong class="tabular">${fmtEur(endNetTco)}</strong>, frente a <strong class="tabular">${fmtEur(m3EndCost)}</strong> en un Tesla Model 3 RWD Ocasión y
        <strong class="tabular">${fmtEur(iceEndCost)}</strong> en un gasolina equivalente.
      </div>
    `;
  }

  renderWaterfallCanvas(sim);
  renderDepreciationCanvas(sim);
}

function renderWaterfallCanvas(sim) {
  const canvas = document.getElementById('patrimonial-waterfall-canvas');
  const setup = setupHiDPICanvas(canvas, 660, 260);
  if (!setup) return;
  const { ctx, width, height } = setup;

  const pad = { top: 34, right: 20, bottom: 52, left: 68 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const steps = [
    { lines: ['Factura', 'Bruta'], val: sim.grossTotal, color: '#475569' },
    { lines: ['Ayudas', 'Coche+WB'], val: -sim.taxableSubsidies, color: PALETTE.sage },
    { lines: ['Deducción', '15% IRPF'], val: -(sim.irpfCarDed + sim.wallboxIrpf), color: PALETTE.sageMid },
    { lines: ['Mordisco', 'IRPF'], val: sim.taxBiteIrpf, color: PALETTE.copper },
    { lines: ['Desembolso', 'Neto Final'], val: sim.netInitialOutlayAfterTax, color: PALETTE.inkPrimary }
  ];

  const maxVal = niceMax(Math.max(sim.grossTotal, sim.netInitialOutlayAfterTax, 10000) * 1.15, 4000);

  // Grid
  ctx.strokeStyle = PALETTE.borderSubtle;
  ctx.lineWidth = 1;
  ctx.font = '500 10.5px "JetBrains Mono", monospace';
  ctx.fillStyle = PALETTE.inkMuted;
  ctx.textAlign = 'right';

  for (let i = 0; i <= 4; i++) {
    const v = Math.round((maxVal / 4) * i);
    const y = pad.top + plotH - (v / maxVal) * plotH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();
    ctx.fillText(fmtEur(v), pad.left - 8, y + 3.5);
  }

  const colW = plotW / steps.length;
  const barW = Math.min(64, colW * 0.55);

  steps.forEach((st, idx) => {
    const absVal = Math.abs(st.val);
    const barH = Math.max(6, (absVal / maxVal) * plotH);
    const centerX = pad.left + colW * idx + colW / 2;
    const x = centerX - barW / 2;
    const y = pad.top + plotH - barH;

    ctx.fillStyle = st.color;
    drawRoundedRect(ctx, x, y, barW, barH, 5);
    ctx.fill();

    ctx.fillStyle = st.color;
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    const txt = idx === 0 || idx === 4 ? fmtEur(st.val) : fmtSignedEur(st.val);
    ctx.fillText(txt, centerX, y - 8);

    // 2-line stacked X-axis labels so adjacent columns never collide
    ctx.fillStyle = PALETTE.inkSecondary;
    ctx.font = '600 10.5px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(st.lines[0], centerX, pad.top + plotH + 18);
    ctx.fillText(st.lines[1], centerX, pad.top + plotH + 32);
  });
}

function renderDepreciationCanvas(sim) {
  const canvas = document.getElementById('depreciation-curve-canvas');
  const setup = setupHiDPICanvas(canvas, 660, 295);
  if (!setup) return;
  const { ctx, width, height } = setup;

  const { years, selectedResidual, selectedNetCost, model3UsedNetCost, iceNetCost } = sim.yearlyCurve;
  const pad = { top: 56, right: 24, bottom: 42, left: 68 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const allVals = [...selectedResidual, ...selectedNetCost, ...model3UsedNetCost, ...iceNetCost];
  const maxVal = niceMax(Math.max(...allVals, 20000) * 1.12, 4000);

  // 2x2 Grid Legend at top (zero right-edge clipping)
  ctx.font = '600 10.5px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  const legends = [
    { label: `Coste Neto ${sim.car.shortName}`, color: PALETTE.sage },
    { label: 'Coste Neto Model 3 Ocasión', color: PALETTE.copper },
    { label: 'Coste Neto Gasolina', color: PALETTE.danger },
    { label: 'Valor Residual Reventa', color: '#64748B' }
  ];
  const colStep = Math.floor(plotW * 0.5);
  legends.forEach((lg, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const lx = pad.left + col * colStep;
    const ly = 10 + row * 19;
    ctx.fillStyle = lg.color;
    ctx.fillRect(lx, ly, 10, 10);
    ctx.fillStyle = PALETTE.inkPrimary;
    ctx.fillText(lg.label, lx + 15, ly + 9);
  });

  // Gridlines
  ctx.strokeStyle = PALETTE.borderSubtle;
  ctx.lineWidth = 1;
  ctx.font = '500 10.5px "JetBrains Mono", monospace';
  ctx.fillStyle = PALETTE.inkMuted;
  ctx.textAlign = 'right';

  for (let i = 0; i <= 4; i++) {
    const v = Math.round((maxVal / 4) * i);
    const y = pad.top + plotH - (v / maxVal) * plotH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();
    ctx.fillText(fmtEur(v), pad.left - 8, y + 3.5);
  }

  const maxYr = years[years.length - 1] || 6;
  ctx.textAlign = 'center';
  years.forEach((yr) => {
    const x = pad.left + (yr / maxYr) * plotW;
    ctx.fillText(`Año ${yr}`, x, height - 14);
  });

  const drawSeries = (arr, color, dashed = false) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    if (dashed) ctx.setLineDash([5, 4]);
    ctx.beginPath();
    arr.forEach((v, idx) => {
      const x = pad.left + (idx / maxYr) * plotW;
      const y = pad.top + plotH - (Math.max(0, v) / maxVal) * plotH;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();
  };

  drawSeries(selectedResidual, '#64748B', true);
  drawSeries(selectedNetCost, PALETTE.sage, false);
  drawSeries(model3UsedNetCost, PALETTE.copper, false);
  drawSeries(iceNetCost, PALETTE.danger, true);
}

/* ==========================================================================
   MODULE 6: SIMULADOR VIAJE 300 KM + GENERADOR LEGAL ART. 17.5 LPH
   ========================================================================== */
function renderTripModule() {
  const speedLabel = document.getElementById('trip-speed-val');
  if (speedLabel) speedLabel.textContent = `${state.tripSpeed} km/h`;

  const trip = computeHighwayTrip300km({
    carId: state.tripCarId,
    speedKmh: state.tripSpeed,
    weather: state.tripWeather
  });

  const panel = document.getElementById('trip-results-panel');
  if (panel) {
    const stopBadge = trip.needsStop
      ? `<span class="tag nmc">Parada breve necesaria: ${trip.stopMinutes} min (+${trip.energyToChargeKwh} kWh en DC)</span>`
      : `<span class="tag lfp">Directo sin parar · Llegas con ${trip.arrivalSocNoStop}% de batería</span>`;

    panel.innerHTML = `
      <div class="badge-row" style="margin-bottom: 0.65rem;">
        ${stopBadge}
        <span class="tag tabular">${trip.consumptionKwh100} kWh/100 km</span>
      </div>
      <div class="spec-grid-mini" style="margin-bottom: 0.9rem;">
        <div><span style="color:var(--ink-muted);">Energía Ruta 300 km:</span> <strong class="tabular">${trip.tripEnergyKwh} kWh</strong></div>
        <div><span style="color:var(--ink-muted);">Batería Útil (96%):</span> <strong class="tabular">${trip.usableBatteryKwh} kWh</strong></div>
        <div><span style="color:var(--ink-muted);">SoC Llegada sin parar:</span> <strong class="tabular" style="color:${trip.needsStop ? 'var(--accent-secondary)' : 'var(--accent-primary)'};">${trip.arrivalSocNoStop}%</strong></div>
        <div><span style="color:var(--ink-muted);">Tiempo Carga DC:</span> <strong class="tabular">${trip.needsStop ? `${trip.stopMinutes} min` : '0 min (En destino)'}</strong></div>
      </div>

      <div style="background: var(--bg-canvas); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 0.8rem; font-size: 0.84rem;">
        <div style="font-weight: 700; margin-bottom: 0.35rem; color: var(--ink-primary);">
          Comparativa Tarifaria Anual (Garaje Madrid) y Recarga en Ruta (300 km):
        </div>
        <ul style="margin: 0; padding-left: 1.15rem; color: var(--ink-secondary); display: grid; gap: 0.25rem;">
          <li><strong>Garaje 5.000 km/año (Valle EV):</strong> <strong class="tabular" style="color:var(--accent-primary);">~${trip.annualHomeCostEur} €/año</strong> con Octopus Intelligent Go (0,068 €/kWh) o ~60 €/año con Iberdrola Plan Vehículo Eléctrico (0,08 €/kWh).</li>
          <li><strong>Coste energético puntual de los 300 km en cargador público DC:</strong> Tesla Supercharger: <strong class="tabular">${trip.tripCostByNetwork.tesla.toFixed(2).replace('.', ',')} €</strong> (0,42 €/kWh) · Zunder / Wenea: <strong class="tabular">${trip.tripCostByNetwork.zunder.toFixed(2).replace('.', ',')} €</strong> (0,50 €/kWh) · Ionity Libre: <strong class="tabular">${trip.tripCostByNetwork.ionity.toFixed(2).replace('.', ',')} €</strong> (0,65 €/kWh).</li>
        </ul>
      </div>
    `;
  }

  renderTripCanvas(trip);
}

function renderTripCanvas(trip) {
  const canvas = document.getElementById('trip-canvas');
  const setup = setupHiDPICanvas(canvas, 600, 310);
  if (!setup) return;
  const { ctx, width } = setup;

  const pad = { top: 24, right: 20, bottom: 24, left: 20 };
  const innerW = width - pad.left - pad.right;

  ctx.fillStyle = PALETTE.inkPrimary;
  ctx.font = '700 11.5px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Balance Energético en Autovía (300 km a ${trip.speedKmh} km/h): ${trip.car.shortName}`, pad.left, 20);

  // Consumption text drawn in high-contrast dark ink above the gauge bar (never white-on-cream)
  const usedRatio = Math.min(1, trip.tripEnergyKwh / trip.usableBatteryKwh);
  const usedPct = Math.round((trip.tripEnergyKwh / trip.usableBatteryKwh) * 100);
  ctx.fillStyle = PALETTE.inkSecondary;
  ctx.font = '600 10.5px "JetBrains Mono", monospace';
  ctx.fillText(
    `Consumido en 300 km: ${trip.tripEnergyKwh} kWh de ${trip.usableBatteryKwh} kWh útiles (${usedPct}% SoC requerido)`,
    pad.left,
    37
  );

  // Horizontal battery gauge bar
  const barY = 44;
  const barH = 24;
  ctx.fillStyle = PALETTE.bgSurface;
  drawRoundedRect(ctx, pad.left, barY, innerW, barH, 7);
  ctx.fill();

  const usedW = Math.max(12, usedRatio * innerW);
  ctx.fillStyle = trip.needsStop ? PALETTE.copper : PALETTE.sage;
  drawRoundedRect(ctx, pad.left, barY, usedW, barH, 7);
  ctx.fill();

  // Compare all 4 protagonists on this same 300 km route
  const compareCars = VEHICLES.filter((v) => v.isProtagonist);
  ctx.fillStyle = PALETTE.inkSecondary;
  ctx.font = '600 10.5px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Comparativa de llegada en los 4 protagonistas a esta misma velocidad y clima:', pad.left, 90);

  compareCars.forEach((c, idx) => {
    const t = computeHighwayTrip300km({ carId: c.id, speedKmh: state.tripSpeed, weather: state.tripWeather });
    const rowY = 102 + idx * 28;
    const labelW = 138;
    const trackW = innerW - labelW - 110;
    const remPct = Math.max(0, t.arrivalSocNoStop);

    ctx.fillStyle = PALETTE.inkPrimary;
    ctx.font = '600 10.5px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(c.shortName, pad.left, rowY + 12);

    ctx.fillStyle = PALETTE.bgSurface;
    drawRoundedRect(ctx, pad.left + labelW, rowY, trackW, 15, 5);
    ctx.fill();

    const fillW = Math.max(6, (Math.min(100, remPct) / 100) * trackW);
    ctx.fillStyle = t.needsStop ? PALETTE.copper : PALETTE.sage;
    drawRoundedRect(ctx, pad.left + labelW, rowY, fillW, 15, 5);
    ctx.fill();

    ctx.fillStyle = t.needsStop ? PALETTE.copper : PALETTE.sage;
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    const statusTxt = t.needsStop ? `Parar ${t.stopMinutes} min` : `Llega con ${t.arrivalSocNoStop}%`;
    ctx.fillText(statusTxt, width - pad.right, rowY + 12);
  });
}

function renderLphDocument() {
  const sheet = document.getElementById('lph-print-sheet');
  if (!sheet) return;

  const docText = generateLph175Document({
    ownerName: document.getElementById('lph-owner-name')?.value || 'Nombre y Apellidos del Propietario',
    ownerDni: document.getElementById('lph-owner-dni')?.value || '00000000X',
    communityAddress: document.getElementById('lph-address')?.value || 'Dirección de la Comunidad, Madrid',
    parkingSpot: document.getElementById('lph-spot')?.value || 'Plaza de garaje nº __',
    recipientRole: document.getElementById('lph-recipient')?.value || 'Sr./Sra. Presidente/a de la Comunidad',
    wallboxPowerKw: document.getElementById('lph-power')?.value || '7,4 kW (Monofásico 32 A)',
    installerName: document.getElementById('lph-installer')?.value || 'Empresa Instaladora Autorizada',
    plannedDate: document.getElementById('lph-date')?.value || '2026-12-15'
  });

  sheet.textContent = docText;
}

/* ==========================================================================
   SIDEBAR SCROLL-SPY & EVENT BINDINGS
   ========================================================================== */
function initSidebarScrollSpy() {
  const navLinks = Array.from(document.querySelectorAll('.side-nav-link'));
  if (!navLinks.length) return;

  const sectionIds = [
    'hero',
    'mod-termodinamica',
    'mod-quimica',
    'mod-catalogo',
    'mod-dimensiones',
    'mod-patrimonio',
    'mod-logistica'
  ];

  const setActiveLink = (sectionId) => {
    navLinks.forEach((link) => {
      const isMatch = link.getAttribute('data-section') === sectionId || link.getAttribute('href') === `#${sectionId}`;
      link.classList.toggle('is-active', isMatch);
    });
  };

  const updateActiveOnScroll = () => {
    let activeId = sectionIds[0];
    const triggerLine = 220;
    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (rect.top <= triggerLine) {
        activeId = id;
      }
    }
    setActiveLink(activeId);
  };

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const targetId = link.getAttribute('data-section');
      if (targetId) setActiveLink(targetId);
    });
  });

  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', updateActiveOnScroll, { passive: true });
    updateActiveOnScroll();
  }
}

function copyTextWithFallback(text) {
  if (typeof document === 'undefined') return false;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(textarea);
  return ok;
}

function bindAllEvents() {
  SpringAnimator.bindTactilePress(document);
  initSidebarScrollSpy();

  // Module 1
  document.getElementById('tab-bev')?.addEventListener('click', () => {
    state.techTab = 'bev';
    updateTechDetailPanel();
  });
  document.getElementById('tab-phev')?.addEventListener('click', () => {
    state.techTab = 'phev';
    updateTechDetailPanel();
  });
  document.getElementById('tco-mode-select')?.addEventListener('change', (e) => {
    state.tcoMode = e.target.value;
    renderTcoCanvas();
  });

  // Module 2
  document.getElementById('chem-soc-slider')?.addEventListener('input', (e) => {
    state.chemSoc = Number(e.target.value);
    renderElectrochemistryModule();
  });
  document.getElementById('chem-temp-select')?.addEventListener('change', (e) => {
    state.chemTemp = Number(e.target.value);
    renderElectrochemistryModule();
  });

  const selectChemCard = (chem) => {
    state.selectedChemFocus = chem;
    renderElectrochemistryModule();
  };

  const cardLfp = document.getElementById('card-lfp');
  const cardNmc = document.getElementById('card-nmc');
  cardLfp?.addEventListener('click', () => selectChemCard('LFP'));
  cardLfp?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectChemCard('LFP');
    }
  });
  cardNmc?.addEventListener('click', () => selectChemCard('NMC'));
  cardNmc?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectChemCard('NMC');
    }
  });

  // Module 3 Filters & Versus
  ['ALL', 'LFP', 'NMC'].forEach((chem) => {
    document.getElementById(`filter-chem-${chem}`)?.addEventListener('click', (e) => {
      state.catalogChem = chem;
      document.querySelectorAll('.filter-pill').forEach((btn) => btn.classList.remove('active'));
      e.currentTarget.classList.add('active');
      renderCatalogGrid();
    });
  });

  document.getElementById('filter-condition')?.addEventListener('change', (e) => {
    state.catalogCondition = e.target.value;
    renderCatalogGrid();
  });

  document.getElementById('filter-budget')?.addEventListener('input', (e) => {
    state.catalogBudget = Number(e.target.value);
    renderCatalogGrid();
  });

  document.getElementById('versus-car-a')?.addEventListener('change', (e) => {
    state.versusCarA = e.target.value;
    renderVersusComparison();
  });
  document.getElementById('versus-car-b')?.addEventListener('change', (e) => {
    state.versusCarB = e.target.value;
    renderVersusComparison();
  });

  const setVersusPreset = (a, b) => {
    state.versusCarA = a;
    state.versusCarB = b;
    const selA = document.getElementById('versus-car-a');
    const selB = document.getElementById('versus-car-b');
    if (selA) selA.value = a;
    if (selB) selB.value = b;
    renderVersusComparison();
  };

  document.getElementById('vs-preset-r5-surf')?.addEventListener('click', () =>
    setVersusPreset('renault-5-techno', 'byd-dolphin-surf')
  );
  document.getElementById('vs-preset-mg4-m3')?.addEventListener('click', () =>
    setVersusPreset('mg4-electric', 'tesla-model3-rwd')
  );
  document.getElementById('vs-preset-r5-m3')?.addEventListener('click', () =>
    setVersusPreset('renault-5-techno', 'tesla-model3-rwd')
  );

  // Delegated clicks on Protagonist & Catalog cards
  document.addEventListener('click', (e) => {
    const simBtn = e.target.closest?.('.js-load-sim');
    if (simBtn) {
      const carId = simBtn.dataset.carId;
      const car = VEHICLES.find((v) => v.id === carId);
      if (car) {
        state.simCarId = car.id;
        state.simCustomPrice = car.priceAvg;
        const simSel = document.getElementById('sim-car-select');
        const priceSlider = document.getElementById('sim-custom-price');
        if (simSel) simSel.value = car.id;
        if (priceSlider) priceSlider.value = String(car.priceAvg);
        renderPatrimonialModule();
        document.getElementById('mod-patrimonio')?.scrollIntoView({ behavior: 'smooth' });
      }
    }

    const dimBtn = e.target.closest?.('.js-load-dim');
    if (dimBtn) {
      const carId = dimBtn.dataset.carId;
      state.dimCarId = carId;
      const dimSel = document.getElementById('dim-car-select');
      if (dimSel) dimSel.value = carId;
      renderDimensionsModule();
      document.getElementById('mod-dimensiones')?.scrollIntoView({ behavior: 'smooth' });
    }

    const vsBtn = e.target.closest?.('.js-load-vs');
    if (vsBtn) {
      const carId = vsBtn.dataset.carId;
      state.versusCarB = carId;
      const selB = document.getElementById('versus-car-b');
      if (selB) selB.value = carId;
      renderVersusComparison();
      document.getElementById('versus-car-a')?.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Module 4
  document.getElementById('dim-car-select')?.addEventListener('change', (e) => {
    state.dimCarId = e.target.value;
    renderDimensionsModule();
  });
  document.getElementById('dim-astra-select')?.addEventListener('change', (e) => {
    state.dimAstraKey = e.target.value;
    renderDimensionsModule();
  });

  // Module 5
  document.getElementById('sim-car-select')?.addEventListener('change', (e) => {
    state.simCarId = e.target.value;
    const car = VEHICLES.find((v) => v.id === state.simCarId);
    if (car) {
      state.simCustomPrice = car.priceAvg;
      const slider = document.getElementById('sim-custom-price');
      if (slider) slider.value = String(car.priceAvg);
    }
    renderPatrimonialModule();
  });

  document.getElementById('sim-custom-price')?.addEventListener('input', (e) => {
    state.simCustomPrice = Number(e.target.value);
    renderPatrimonialModule();
  });

  document.getElementById('chk-cambia360')?.addEventListener('change', (e) => {
    state.simUseCambia360 = e.target.checked;
    renderPatrimonialModule();
  });
  document.getElementById('chk-achatarra')?.addEventListener('change', (e) => {
    state.simUseScrappage = e.target.checked;
    renderPatrimonialModule();
  });
  document.getElementById('chk-irpf-car')?.addEventListener('change', (e) => {
    state.simUseIrpfCar = e.target.checked;
    renderPatrimonialModule();
  });
  document.getElementById('sim-wallbox-cost')?.addEventListener('input', (e) => {
    state.simWallboxCost = Number(e.target.value);
    renderPatrimonialModule();
  });
  document.getElementById('chk-wallbox-aid')?.addEventListener('change', (e) => {
    state.simUseWallboxAid = e.target.checked;
    renderPatrimonialModule();
  });
  document.getElementById('sim-irpf-bracket')?.addEventListener('change', (e) => {
    state.simIrpfBracket = Number(e.target.value);
    renderPatrimonialModule();
  });
  document.getElementById('sim-horizon-years')?.addEventListener('change', (e) => {
    state.simHorizonYears = Number(e.target.value);
    renderPatrimonialModule();
  });

  // Module 6
  document.getElementById('trip-car-select')?.addEventListener('change', (e) => {
    state.tripCarId = e.target.value;
    renderTripModule();
  });
  document.getElementById('trip-speed-slider')?.addEventListener('input', (e) => {
    state.tripSpeed = Number(e.target.value);
    renderTripModule();
  });
  document.getElementById('trip-weather-select')?.addEventListener('change', (e) => {
    state.tripWeather = e.target.value;
    renderTripModule();
  });

  [
    'lph-owner-name',
    'lph-owner-dni',
    'lph-address',
    'lph-spot',
    'lph-recipient',
    'lph-power',
    'lph-installer',
    'lph-date'
  ].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', renderLphDocument);
    document.getElementById(id)?.addEventListener('change', renderLphDocument);
  });

  document.getElementById('btn-print-lph')?.addEventListener('click', () => {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  });

  document.getElementById('btn-copy-lph')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const text = document.getElementById('lph-print-sheet')?.textContent || '';
    const prev = 'Copiar Escrito';
    let copied = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        copied = true;
      }
    } catch {
      copied = false;
    }
    if (!copied) {
      copied = copyTextWithFallback(text);
    }
    btn.textContent = copied ? '✓ Escrito Copiado' : 'Selecciona e imprime en A4';
    setTimeout(() => { btn.textContent = prev; }, 2000);
  });

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', () => {
      renderTcoCanvas();
      renderElectrochemistryModule();
      renderDimensionsModule();
      renderPatrimonialModule();
      renderTripModule();
    });
  }
}

export function initApp() {
  if (typeof document === 'undefined') return;
  populateVehicleSelects();
  updateTechDetailPanel();
  renderTcoCanvas();
  renderElectrochemistryModule();
  renderProtagonistGrid();
  renderCatalogGrid();
  renderVersusComparison();
  renderDimensionsModule();
  renderPatrimonialModule();
  renderTripModule();
  renderLphDocument();
  bindAllEvents();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}
