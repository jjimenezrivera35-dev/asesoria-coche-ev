import { ASTRA_BASELINES, VEHICLES } from '../data/vehicles.js';

export function computeTcoBreakdown(mode = '5yr') {
  const multiplier = (mode === '8yr' || mode === '8years') ? 8 : mode === 'annual' ? 1 : 5;
  const labels = ['BEV 100% Eléctrico', 'PHEV Híbrido Enchufable', 'ICE Gasolina / MHEV'];

  // 5.000 km/año en Madrid:
  // BEV: ~51 €/año carga nocturna (0,068 €/kWh) + ~34 €/año recarga viaje 300 km = 85 €/año energía; ~95 €/año mantenimiento (filtro polen, líquido frenos).
  // PHEV: condensación acuosa en cárter por trayectos cortos (<15 km) obliga a cambios de aceite/filtros anuales y mantenimiento dual (480 €/año) + energía mixta (210 €/año).
  // ICE: 6,8 L/100km * 50 * 1,65 €/L = 561 €/año combustible; ~390 €/año mantenimiento y desgaste embrague/distribución/ITV.
  const annualMaintenance = [95, 480, 390];
  const annualEnergy = [85, 210, 560];

  const maintenance = annualMaintenance.map(v => Math.round(v * multiplier));
  const energy = annualEnergy.map(v => Math.round(v * multiplier));
  const total = maintenance.map((m, idx) => m + energy[idx]);

  return {
    mode,
    multiplier,
    labels,
    maintenance,
    energy,
    total
  };
}

export function computeCalendarAging({ socPercent = 80, tempC = 21 } = {}) {
  const soc = Math.min(100, Math.max(20, Number(socPercent) || 80));
  const temp = Math.min(40, Math.max(5, Number(tempC) || 21));

  const years = Array.from({ length: 11 }, (_, i) => i);
  const tRefK = 293.15; // 20 °C
  const tActualK = temp + 273.15;

  // Arrhenius factor exp((Ea/R) * (1/Tref - 1/T))
  // LFP olivine (covalent P-O bond, ~3.29V plateau) has lower thermal & anodic sensitivity than layered NMC (~4.20V at 100% SoC)
  const tempFactorLfp = Math.exp(3200 * (1 / tRefK - 1 / tActualK));
  const tempFactorNmc = Math.exp(4200 * (1 / tRefK - 1 / tActualK));

  const s = soc / 100;
  const socFactorLfp = 0.65 + 0.55 * Math.pow(s, 1.8);
  const socFactorNmc = 0.70 + 1.65 * Math.pow(s, 2.35);

  // Base degradation rates tuned for 5.000 km/yr (predominantly calendar SEI growth ~ t^0.72 + light cyclic fade)
  const baseRateLfp = 0.88;
  const baseRateNmc = 0.98;

  const lfpRetention = years.map(yr => {
    if (yr === 0) return 100;
    const calLoss = baseRateLfp * tempFactorLfp * socFactorLfp * Math.pow(yr, 0.72);
    const cycLoss = 0.08 * yr; // 5,000 km/yr ~ 15 full cycles/yr on LFP
    const ret = Math.min(100, Math.max(60, 100 - (calLoss + cycLoss)));
    return Number(ret.toFixed(1));
  });

  const nmcRetention = years.map(yr => {
    if (yr === 0) return 100;
    const calLoss = baseRateNmc * tempFactorNmc * socFactorNmc * Math.pow(yr, 0.72);
    const cycLoss = 0.14 * yr; // 5,000 km/yr cyclic wear on NMC
    const ret = Math.min(100, Math.max(55, 100 - (calLoss + cycLoss)));
    return Number(ret.toFixed(1));
  });

  const lfp10YrLoss = Number((100 - lfpRetention[10]).toFixed(1));
  const nmc10YrLoss = Number((100 - nmcRetention[10]).toFixed(1));

  const socPoints = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const lfpVolts = [3.00, 3.20, 3.25, 3.28, 3.29, 3.29, 3.30, 3.31, 3.32, 3.34, 3.65];
  const nmcVolts = [3.00, 3.42, 3.55, 3.62, 3.68, 3.74, 3.82, 3.91, 4.01, 4.11, 4.20];

  const gap10Yr = Number((lfpRetention[10] - nmcRetention[10]).toFixed(1));
  let verdictText = `A ${temp} °C y ${soc}% de SoC medio en garaje, el cátodo olivino LFP conserva el ${lfpRetention[10]}% de capacidad a los 10 años frente al ${nmcRetention[10]}% del NMC (ventaja de +${gap10Yr} puntos porcentuales para LFP).`;
  if (soc >= 85) {
    verdictText += ' En baterías NMC, estacionar por encima del 80% SoC mantiene el potencial catódico cerca de 4,15–4,20 V, acelerando la oxidación anódica del electrolito y el crecimiento de la capa SEI.';
  } else {
    verdictText += ' Mantener el SoC moderado en garaje mitiga la tensión electroquímica en NMC, aunque la estructura covalente P–O del LFP sigue ofreciendo mayor estabilidad termodinámica.';
  }

  return {
    years,
    lfpRetention,
    nmcRetention,
    lfp10YrLoss,
    nmc10YrLoss,
    voltageCurve: {
      socPoints,
      lfpVolts,
      nmcVolts
    },
    verdictText
  };
}

export function computeDimensionsDiff(carId, astraKey = 'compact5p') {
  const car = VEHICLES.find(v => v.id === carId) || VEHICLES[0];
  const astra = ASTRA_BASELINES[astraKey] || ASTRA_BASELINES.compact5p;

  const deltaLengthMm = car.lengthMm - astra.lengthMm;
  const deltaLengthCm = Number((deltaLengthMm / 10).toFixed(1));
  const deltaWidthMm = car.widthMm - astra.widthMm;
  const deltaHeightMm = car.heightMm - astra.heightMm;
  const deltaWheelbaseMm = car.wheelbaseMm - astra.wheelbaseMm;
  const totalCargoLiters = car.trunkLiters + (car.frunkLiters || 0);
  const deltaTrunkLiters = totalCargoLiters - astra.trunkLiters;

  let sizeVerdict = '';
  if (deltaLengthMm < -50) {
    sizeVerdict = `${Math.abs(deltaLengthCm).toFixed(1)} cm más corto que tu ${astra.name}: máxima agilidad de aparcamiento en Madrid.`;
  } else if (deltaLengthMm <= 180) {
    const sign = deltaLengthMm >= 0 ? `+${deltaLengthCm.toFixed(1)}` : `${deltaLengthCm.toFixed(1)}`;
    sizeVerdict = `Huella muy similar a tu ${astra.name} (${sign} cm de longitud), combinando facilidad en garaje y aplomo en autovía.`;
  } else {
    sizeVerdict = `+${deltaLengthCm.toFixed(1)} cm más largo que tu ${astra.name}: berlina de segmento superior con ${totalCargoLiters} L de carga total.`;
  }

  return {
    car,
    astra,
    deltaLengthMm,
    deltaLengthCm,
    deltaWidthMm,
    deltaHeightMm,
    deltaWheelbaseMm,
    deltaTrunkLiters,
    totalCargoLiters,
    sizeVerdict
  };
}

export function computePatrimonialSimulation({
  carId = 'byd-dolphin-surf',
  customPrice,
  useCambia360 = true,
  useScrappage = true,
  useIrpfCar = true,
  wallboxCost = 1800,
  useWallboxAid = true,
  marginalIrpfRate = 37,
  horizonYears = 6
} = {}) {
  const car = VEHICLES.find(v => v.id === carId) || VEHICLES[0];
  const priceUsed = typeof customPrice === 'number' && !Number.isNaN(customPrice)
    ? customPrice
    : car.priceAvg;

  const canUseNewAid = Boolean(car.eligibleNewAid);
  const cambiaBase = canUseNewAid && useCambia360 ? 4000 : 0;
  const cambiaScrap = canUseNewAid && useCambia360 && useScrappage ? 1500 : 0;
  const directCarSub = cambiaBase + cambiaScrap;

  // RDL 7/2026: Base máxima de 20.000 € tras restar ayudas públicas directas
  const irpfCarBase = canUseNewAid && useIrpfCar
    ? Math.min(20000, Math.max(0, priceUsed - directCarSub))
    : 0;
  const irpfCarDed = Math.round(irpfCarBase * 0.15);

  const wbCost = typeof wallboxCost === 'number' && !Number.isNaN(wallboxCost) ? wallboxCost : 1800;
  const wallboxCambia = useWallboxAid ? Math.round(wbCost * 0.65) : 0;
  const wallboxIrpfBase = useWallboxAid ? Math.min(4000, Math.max(0, wbCost - wallboxCambia)) : 0;
  const wallboxIrpf = Math.round(wallboxIrpfBase * 0.15);

  const grossTotal = priceUsed + wbCost;
  const totalAidsNominal = directCarSub + irpfCarDed + wallboxCambia + wallboxIrpf;

  // Las subvenciones directas (Cambia 360 coche + Wallbox) tributan como ganancia patrimonial no derivada de transmisión en la Base General del IRPF
  const taxableSubsidies = directCarSub + wallboxCambia;
  const marginalRate = typeof marginalIrpfRate === 'number' && !Number.isNaN(marginalIrpfRate)
    ? marginalIrpfRate
    : 37;
  const taxBiteIrpf = Math.round(taxableSubsidies * (marginalRate / 100));

  const netAidsAfterTax = totalAidsNominal - taxBiteIrpf;
  const netInitialOutlayAfterTax = grossTotal - netAidsAfterTax;

  const horizon = Math.min(8, Math.max(1, Number(horizonYears) || 6));
  const years = Array.from({ length: horizon + 1 }, (_, i) => i);

  // Devaluación anual del coche seleccionado sobre su precio de mercado
  const selectedResidual = [];
  let currentRes = priceUsed;
  for (let y = 0; y <= horizon; y++) {
    if (y > 0) {
      const rate = car.annualDepreciationRates[y - 1] ?? 0.05;
      currentRes = currentRes * (1 - rate);
    }
    selectedResidual.push(Math.round(currentRes));
  }

  // Referencia Tesla Model 3 RWD Ocasión (2023) que ya absorbió los 3 primeros años de caída fuerte
  const model3 = VEHICLES.find(v => v.id === 'tesla-model3-rwd') || car;
  const m3InitialOutlay = model3.priceAvg + wbCost - (wallboxCambia + wallboxIrpf - Math.round(wallboxCambia * (marginalRate / 100)));
  let m3Res = model3.priceAvg;

  // Referencia Gasolina / MHEV equivalente (24.500 € compra, sin Wallbox)
  const iceInitialPurchase = 24500;
  const iceDeprRates = [0.16, 0.11, 0.09, 0.08, 0.07, 0.06, 0.06, 0.05];
  let iceRes = iceInitialPurchase;

  const annualEvRunning = 180; // ~85 € energía + ~95 € mantenimiento + IVTM bonificado
  const annualIceRunning = 950; // ~560 € gasolina + ~390 € mantenimiento/ITV/IVTM

  const selectedNetCost = [];
  const model3UsedNetCost = [];
  const iceNetCost = [];

  for (let y = 0; y <= horizon; y++) {
    if (y > 0) {
      const m3Rate = model3.annualDepreciationRates[y - 1] ?? 0.05;
      m3Res = m3Res * (1 - m3Rate);
      const iceRate = iceDeprRates[y - 1] ?? 0.05;
      iceRes = iceRes * (1 - iceRate);
    }
    selectedNetCost.push(Math.round(netInitialOutlayAfterTax + y * annualEvRunning - selectedResidual[y]));
    model3UsedNetCost.push(Math.round(m3InitialOutlay + y * annualEvRunning - m3Res));
    iceNetCost.push(Math.round(iceInitialPurchase + y * annualIceRunning - iceRes));
  }

  return {
    car,
    priceUsed,
    directCarSub,
    irpfCarBase,
    irpfCarDed,
    wallboxCambia,
    wallboxIrpfBase,
    wallboxIrpf,
    grossTotal,
    totalAidsNominal,
    taxableSubsidies,
    taxBiteIrpf,
    netAidsAfterTax,
    netInitialOutlayAfterTax,
    yearlyCurve: {
      years,
      selectedResidual,
      selectedNetCost,
      model3UsedNetCost,
      iceNetCost
    }
  };
}

export function computeHighwayTrip300km({
  carId = 'renault-5-techno',
  speedKmh = 120,
  weather = 'mild'
} = {}) {
  const car = VEHICLES.find(v => v.id === carId) || VEHICLES[0];
  const speed = Math.min(140, Math.max(90, Number(speedKmh) || 120));

  // Escalado aerodinámico: ~28% resistencia a la rodadura + ~72% arrastre aerodinámico proporcional a (v/120)^2
  const speedFactor = 0.28 + 0.72 * Math.pow(speed / 120, 2);

  let weatherFactor = 1.0;
  if (weather === 'winter' || weather === '5') {
    weatherFactor = 1.18;
  } else if (weather === 'summer' || weather === '35') {
    weatherFactor = 1.07;
  }

  const consumptionKwh100 = Number((car.highwayKwh100 * speedFactor * weatherFactor).toFixed(1));
  const tripEnergyKwh = Number((consumptionKwh100 * 3).toFixed(1)); // 300 km
  const usableBatteryKwh = Number((car.batteryKwh * 0.96).toFixed(1));

  const arrivalSocNoStop = Math.round(((usableBatteryKwh - tripEnergyKwh) / usableBatteryKwh) * 100);
  const minSafeArrivalSoc = 12;
  const needsStop = arrivalSocNoStop < minSafeArrivalSoc;

  let energyToChargeKwh = 0;
  let stopMinutes = 0;
  if (needsStop) {
    const targetArrivalSoc = 15;
    const deficitPercent = targetArrivalSoc - arrivalSocNoStop;
    energyToChargeKwh = Number(Math.max(4, (deficitPercent / 100) * usableBatteryKwh).toFixed(1));
    const avgDcKw = car.dcPeakKw * 0.68;
    stopMinutes = Math.max(10, Math.round((energyToChargeKwh / avgDcKw) * 60 + 4));
  }

  // Coste anual cargando en garaje (~4.700 km urbanos + 300 km salida = 750 kWh/año a 0,068 €/kWh tarifa valle EV)
  const annualHomeCostEur = 51;

  const tripCostByNetwork = {
    tesla: Number((tripEnergyKwh * 0.42).toFixed(2)),
    zunder: Number((tripEnergyKwh * 0.50).toFixed(2)),
    ionity: Number((tripEnergyKwh * 0.65).toFixed(2))
  };

  return {
    car,
    speedKmh: speed,
    weather,
    consumptionKwh100,
    tripEnergyKwh,
    usableBatteryKwh,
    arrivalSocNoStop,
    needsStop,
    energyToChargeKwh,
    stopMinutes,
    annualHomeCostEur,
    tripCostByNetwork
  };
}

export function generateLph175Document({
  ownerName = 'Nombre y Apellidos del Propietario',
  ownerDni = '00000000X',
  communityAddress = 'Dirección de la Comunidad de Propietarios, Madrid',
  parkingSpot = 'Plaza de garaje nº __',
  recipientRole = 'Sr./Sra. Presidente/a de la Comunidad de Propietarios y Administrador/a de Fincas',
  wallboxPowerKw = '7,4 kW (Monofásico 32 A)',
  installerName = 'Empresa Instaladora Autorizada en Baja Tensión',
  plannedDate = '2026-12-15'
} = {}) {
  return `A LA ATENCIÓN DE: ${recipientRole}
COMUNIDAD DE PROPIETARIOS: ${communityAddress}

ASUNTO: Comunicación previa oficial de instalación de punto de recarga para vehículo eléctrico en plaza individual de garaje (Artículo 17.5 de la Ley 49/1960 de Propiedad Horizontal).

En Madrid, a fecha de notificación previa (ejecución prevista: ${plannedDate}).

D./Dña. ${ownerName}, mayor de edad, con DNI/NIF ${ownerDni}, en calidad de titular/propietario de la plaza de aparcamiento identificada como "${parkingSpot}" ubicada en el garaje comunitario de la finca sita en ${communityAddress}, comparece y, como mejor proceda en Derecho,

EXPONE:

PRIMERO.— Habilitación legal directa sin necesidad de acuerdo en Junta (Artículo 17.5 LPH).
Que de conformidad con lo dispuesto taxativamente en el Artículo 17.5 de la Ley 49/1960, de 21 de julio, sobre Propiedad Horizontal (reformado por la Ley 19/2009 y el Real Decreto-ley 7/2019):

"La instalación de un punto de recarga de vehículos eléctricos para uso privado en el aparcamiento del edificio, siempre que éste se ubique en una plaza individual de garaje, sólo requerirá la comunicación previa a la comunidad. El coste de dicha instalación y el consumo de electricidad correspondiente serán asumidos íntegramente por el o los interesados directos en la misma."

SEGUNDO.— Especificaciones técnicas y cumplimiento normativo (ITC-BT-52).
Que la instalación proyectada se ejecutará conforme al Esquema 2 de la Instrucción Técnica Complementaria ITC-BT-52 del Reglamento Electrotécnico para Baja Tensión (Real Decreto 1053/2014), conectando el suministro desde el contador individual de la vivienda de mi propiedad hasta el punto de recarga (${wallboxPowerKw}) situado exclusivamente dentro de los límites perimetrales de la ${parkingSpot}, contando con sistema de protección diferencial y control dinámico de potencia (GDP), sin afectar al suministro comunitario ni generar gasto alguno para la Comunidad.

TERCERO.— Empresa instaladora habilitada y certificación CIE.
Que los trabajos serán realizados por la empresa instaladora autorizada ${installerName}, la cual emitirá a la finalización de la obra el correspondiente Certificado de Instalación Eléctrica (Boletín CIE) diligenciado ante la Dirección General de Industria, Energía y Minas de la Comunidad de Madrid, cuya copia será remitida a la Administración de la finca para su archivo.

Por todo lo expuesto,

SOLICITA:

Tenga por presentado este escrito y por cumplido el trámite legal de COMUNICACIÓN PREVIA establecido en el Artículo 17.5 de la Ley de Propiedad Horizontal para el inicio de los trabajos previstos a partir del día ${plannedDate}, facilitando al personal técnico de ${installerName} el acceso a los cuartos de contadores y canalizaciones comunes del garaje para el tendido reglamentario según la ITC-BT-52.

Atentamente,


Fdo.: ${ownerName}
DNI: ${ownerDni}
Titular de: ${parkingSpot}
---
Recibí de la Comunidad / Administración de Fincas (Fecha, firma y sello):`;
}
