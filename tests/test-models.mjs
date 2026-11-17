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
