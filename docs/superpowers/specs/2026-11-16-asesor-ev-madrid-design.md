# Documento de Diseño (Spec): Portal Interactivo de Asesoramiento en Movilidad Eléctrica — Comunidad de Madrid (2026)

## 1. Propósito, Contexto y Audiencia ("El Porqué")

- **Destinatario principal:** Profesor universitario de Química residente en la Comunidad de Madrid, propietario actual de un **Opel Astra del año 2000** (sin distintivo ambiental DGT, categoría "A") susceptible de achatarramiento.
- **Patrón de uso real:** ~**5.000 km anuales** (desplazamientos urbanos cortos en Madrid + **1 viaje interurbano anual de ~300 km** por autovía).
- **Presupuesto máximo:** Techo de **35.000 €** (con objetivo de inversión neta real entre **13.000 € y 25.000 €** tras ayudas o en mercado de ocasión).
- **Doble objetivo del proyecto:**
  1. Ofrecer una herramienta rigurosa, científica y financiera que le permita tomar la mejor decisión de compra comparando sus **4 opciones favoritas** (**Renault 5 E-Tech**, **MG4 Electric**, **BYD Dolphin Surf** y **Tesla Model 3 RWD Ocasión**) junto al resto del catálogo analizado en el informe (**BYD Dolphin Comfort Km 0**, **Citroën ë-C3**, **Volvo EX30**).
  2. Demostrar el nivel de ingeniería, rigor químico-matemático y diseño de interfaces que puede lograr un equipo de agentes de IA autónomos coordinados desde este proyecto.

---

## 2. Objetivos, No-Objetivos y Anti-Objetivos

### Objetivos (Goals)
- **Portabilidad total sin fricción (Enfoque A):** Entregar un archivo auto-contenido (`index.html` y `Informe_Movilidad_Madrid_2026.html` en `c:\Proyectos\Coche_EV`) que el usuario pueda abrir con doble clic en cualquier navegador sin instalar servidores ni dependencias locales, manteniendo además el código modular organizado en `src/` para el trabajo en paralelo de los subagentes.
- **Rigor científico para un químico:** Modelar con precisión la electroquímica de estado sólido ($\text{LiFePO}_4$ estructura olivino con enlace covalente $\text{P–O}$ frente a $\text{LiNi}_x\text{Mn}_y\text{Co}_z\text{O}_2$ laminar), la cinética de envejecimiento por calendario tipo Arrhenius en función de temperatura y estado de carga ($\text{SoC}$), y la degradación del aceite por condensación de agua en motores térmicos híbridos (PHEV) con baja utilización.
- **Transparencia financiera y patrimonial a 5–8 años:** Integrar el precio real al contado, las ayudas del Plan Cambia 360 + achatarramiento, la deducción estatal del 15% en el IRPF, el **"mordisco fiscal"** (tributación de las subvenciones directas como ganancia patrimonial al tipo marginal del IRPF del comprador) y la **curva de devaluación / valor residual** comparando comprar nuevo con ayudas frente a comprar un seminuevo ya depreciado (ej. Tesla Model 3 RWD 2023).
- **Comparación visual de dimensiones:** Permitir comparar gráficamente a escala el tamaño exterior (largo, ancho, alto, batalla) y capacidad de maletero de cada coche frente al **Opel Astra (2000)** actual, mostrando de forma neutra tanto la ventaja de agilidad urbana en modelos más compactos como la ganancia de habitabilidad y maletero en modelos mayores.
- **Accionabilidad inmediata:** Enlaces directos a las 3 configuraciones reales proporcionadas (Renault 5, MG4, BYD Dolphin Surf), comparador directo "Cara a Cara" (1 vs 1), simulador físico del viaje anual de 300 km y generador imprimible de la notificación legal del **Art. 17.5 de la Ley de Propiedad Horizontal (LPH)** para instalar el Wallbox.

### No-Objetivos (Non-Goals)
- No requiere backend, base de datos ni autenticación de usuarios.
- No incluye comparativa de tamaño de plaza de garaje en planta con columnas ni radio de giro de aparcamiento (descartado expresamente: el comparador de dimensiones se centra en el tamaño del vehículo respecto a su Opel Astra actual).

### Anti-Objetivos (Anti-Goals)
- **Cero estética genérica "AI-slop":** Prohibidos los fondos oscuros con neones violetas/púrpuras, textos con gradiente, tarjetas que hacen *tilt* 3D o animaciones que bloquean el scroll (`design-taste-frontend`).
- **Cero fricción técnica para el tío:** Que nunca tenga que ejecutar comandos en terminal para ver la web.

---

## 3. Sistema de Diseño y Físicas de Interacción (`design-taste-frontend` + `apple-design`)

### Paleta Cromática: "Warm Cream & Scientific Editorial"
- `--bg-canvas`: `#FAF6F0` (Crema alabastro cálido principal)
- `--bg-surface`: `#F2ECE1` (Crema piedra suave para contenedores de sección y tarjetas secundarias)
- `--bg-elevated`: `#FFFFFF` (Blanco cálido puro para tarjetas interactivas y paneles de datos)
- `--bg-glass`: `rgba(250, 246, 240, 0.78)` con `backdrop-filter: blur(20px) saturate(180%)` y borde superior luminoso `1px solid rgba(255, 255, 255, 0.6)` para la barra de navegación flotante (`apple-design` §12).
- `--ink-primary`: `#1C1917` (Carbón cálido profundo para máxima legibilidad)
- `--ink-secondary`: `#57534E` (Piedra medio para texto explicativo)
- `--ink-muted`: `#78716C` (Metadatos, etiquetas técnicas y notas al pie)
- `--accent-primary`: `#0F5E56` (Verde salvia profundo / laboratorio para acciones principales, química LFP y métricas óptimas)
- `--accent-secondary`: `#B45309` (Ámbar/cobre cálido para avisos térmicos, química NMC y contrastes comparativos)
- `--border-subtle`: `#E6DEC8` (Línea divisoria crema tostado)

### Tipografía y Ritmo Espacial (`apple-design` §15 + `design-taste-frontend`)
- **Fuentes:** Sistema tipográfico editorial combinando `Instrument Serif` o `Newsreader` (Google Fonts con fallback a `Georgia, serif`) para titulares de sección y fórmulas destacadas, `Plus Jakarta Sans` / `Inter` (`system-ui`) para interfaz y cuerpo, y `JetBrains Mono` para magnitudes físicas, ecuaciones químicas y precios tabulares (`font-variant-numeric: tabular-nums`).
- **Optical sizing y tracking:** Titulares grandes con `letter-spacing: -0.025em` y `line-height: 1.08`; cuerpo de lectura con `line-height: 1.6`; etiquetas técnicas con `letter-spacing: 0.04em`.
- **Estructura de pantalla:** Contenedor `.wrap` centrado con márgenes laterales idénticos (`max-width: 1240px`, `padding-inline: clamp(1.25rem, 4vw, 3rem)`), jerarquía clara con un tema dominante por bloque visual.

### Micro-interacciones y Físicas (`apple-design` §1, §3, §4, §14)
- **Respuesta instantánea en `pointerdown`:** Todos los botones, selectores de coches y píldoras de filtro responden en el instante del contacto (`transform: scale(0.97)` en `pointerdown` / `:active` con transición de `90ms ease-out`), sin esperar al `click`.
- **Muelles críticamente amortiguados (`damping: 1.0`, `response: 0.35s`):** Un motor ligero de muelles en JS (`SpringAnimator` basado en `requestAnimationFrame` que lee siempre el valor actual en pantalla para ser 100% interrumpible a mitad de vuelo) anima:
  - El indicador deslizante (*pill indicator*) de las pestañas y selectores segmentados.
  - Las barras comparativas de dimensiones (Opel Astra vs. EV seleccionado).
  - La interpolación numérica suave de los contadores de precios y ahorro en los simuladores.
- **Accesibilidad (`prefers-reduced-motion`):** Si el sistema solicita movimiento reducido, las animaciones de muelle se sustituyen automáticamente por transiciones de opacidad instantáneas.

---

## 4. Arquitectura de Contenidos y Especificación de los 6 Módulos

### Cabecera y Hero Ejecutivo
- **Barra de navegación translúcida:** Acceso directo a los 6 módulos + botón rápido para ir al Simulador Patrimonial.
- **Hero de Caso de Estudio:** Presenta el dictamen ejecutivo personalizado (*"De un Opel Astra (2000) a la Movilidad Eléctrica en Madrid: Análisis Termodinámico, Electroquímico y Patrimonial para 5.000 km/año"*), con las 4 métricas clave (5.000 km/año, Presupuesto máx. 35.000 €, Bono Achatarramiento +5.500 € Cambia 360, Coste energético en garaje ~51 €/año) y acceso rápido al **Póker de Candidatos**.

### Módulo 1 · Termodinámica y Mecánica: Por qué el Híbrido Enchufable (PHEV) fracasa a 5.000 km/año
- **Explicación físico-química:** En recorridos urbanos cortos (<15 km), el PHEV opera en modo eléctrico y mantiene el motor de combustión inactivo durante meses. Esto impide alcanzar la temperatura de evaporación en el cárter (>90 °C), provocando **condensación de vapor de agua, formación de emulsiones ácidas y dilución del lubricante por hidrocarburos inquemados** en los escasos arranques en frío, además de arrastrar 150–200 kg de lastre mecánico en el viaje de 300 km.
- **Gráfico interactivo TCO Operativo (Taller + Energía):** Comparativa BEV vs. PHEV vs. Gasolina (conmutable entre Acumulado a 5 años, Acumulado a 8 años y Promedio Anual).

### Módulo 2 · Laboratorio Electroquímico: $\text{LiFePO}_4$ (LFP) vs. $\text{LiNi}_x\text{Mn}_y\text{Co}_z\text{O}_2$ (NMC)
- **Fundamento cristalográfico para un químico:**
  - **LFP (Olivino ortorrómbico):** Enlace covalente fuerte $\text{P–O}$ en el polianión $(\text{PO}_4)^{3-}$ que estabiliza el oxígeno reticular (entalpía de descomposición térmica >270 °C, inmunidad a *thermal runaway*) y potencial redox $\text{Fe}^{2+}/\text{Fe}^{3+}$ de ~3,20 V vs. $\text{Li/Li}^+$, situado por debajo del umbral de oxidación anódica del electrolito carbonatado.
  - **NMC (Óxido laminar):** Potencial de celda de ~4,20 V al 100% $\text{SoC}$; el alto potencial químico en estacionamiento prolongado acelera la oxidación parásita del electrolito, la disolución de metales de transición y el engrosamiento de la interfase $\text{SEI}$.
- **Simulador Interactivo de Degradación por Calendario (10 años):**
  - **Controles:**
    1. Deslizador de **$\text{SoC}$ habitual de estacionamiento en garaje** (20% a 100%).
    2. Selector/deslizador de **Temperatura media del garaje en Madrid** (Garaje subterráneo fresco 16 °C / Estándar 21 °C / Superficie cálido 27 °C).
  - **Salidas dinámicas:**
    - Gráfica Canvas de **Retención de Capacidad ($\text{SoH}$ %) de 0 a 10 años** comparando LFP vs. NMC bajo esas condiciones exactas (ley de Arrhenius $k \propto A \cdot e^{-E_a / RT} \cdot f(\text{SoC})$).
    - Visualizador de la **curva de voltaje vs. $\text{SoC}$** explicando por qué el BMS de una batería LFP necesita cargarse al 100% periódicamente (meseta bifásica plana $\text{FePO}_4 / \text{LiFePO}_4$ a ~3,29 V) frente a la pendiente continua del NMC.

### Módulo 3 · El Póker de Candidatos (Tus 4 Favoritos) + Catálogo y Comparador "Cara a Cara"
- **Las 4 Opciones Principales Destacadas (con datos verificados en los configuradores oficiales):**
  1. **Renault 5 E-Tech Eléctrico (Configuración Guardada del Usuario):**
     - **URL exacta:** `https://www.renault.es/electricos/r5-e-tech-electrico/configurador.html?conf=https%3A%2F%2Fes.co.rplug.renault.com%2Fc%2FBAHPt%2FAmnZK2oMuA`
     - **Especificación extraída:** Acabado **techno**, motor **110 kW (150 CV)**, batería **52 kWh NMC** (*Autonomía Confort*, **425 km WLTP**), color **Azul Noche**, llantas **18" techno**, tapicería **tejido reciclado gris jaspeado / denim**. Precio con promociones/ayudas en configurador: **25.522 €** (PVP tarifa: **34.005 €**; incluye además selector para comparar con la variante *Evolution 40 kWh / 312 km WLTP* de ~23.600 € contado del informe).
     - **Dimensiones:** 3.922 mm largo × 1.774 mm ancho × 1.498 mm alto · Batalla: 2.540 mm · Maletero: 326 L.
  2. **MG4 Electric (Nuevo LFP / Ocasión 23–24):**
     - **URL exacta:** `https://www.mgmotor.es/configurator/mg4`
     - **Especificación extraída:** Gama **MG4 EV LFP** con opciones *54 kWh Comfort* (**415 km WLTP**, **21.690 €** al contado con promo), *43 kWh Comfort* (**325 km WLTP**, **19.690 €** al contado) y variante del informe *MG4 Standard 51 kWh LFP Ocasión 23/24* (**350 km WLTP**, **18.490 € – 19.990 €**).
     - **Dimensiones:** 4.287 mm largo × 1.836 mm ancho × 1.504 mm alto · Batalla: 2.705 mm · Maletero: 363 L.
  3. **BYD Dolphin Surf (Gama Oficial España — Blade Battery LFP):**
     - **URL exacta:** `https://www.byd.com/es-es/configurador/dolphin-surf`
     - **Especificación extraída:** Batería **LFP Blade Battery**. Versiones: **Boost 43,2 kWh** (88 CV, **322 km WLTP** / 507 km urbano, DC 85 kW, **23.990 €** PVP), **Comfort 43,2 kWh** (156 CV, **310 km WLTP**, cámara 360°, **26.490 €** PVP) y **Active 30 kWh** (88 CV, 220 km WLTP, **19.990 €** PVP / **14.455 €** con campañas y ayudas).
     - **Dimensiones:** 3.990 mm largo × 1.720 mm ancho × 1.590 mm alto · Batalla: 2.500 mm · Maletero: 316 L (hasta 1.037 L).
  4. **Tesla Model 3 RWD (Ocasión 2023–2024):**
     - **Especificación del informe:** Batería **60 kWh LFP** (CATL), **283 CV** propulsión trasera, **491 km WLTP** (>330 km reales en autovía a 120 km/h con consumo líder de 14,5 kWh/100 km, $C_d = 0,219$). Precio mercado de ocasión en Madrid (Autohero / MuyCar, 40k–70k km): **28.990 € – 33.990 €** (media **31.490 €**).
     - **Dimensiones:** 4.720 mm largo × 1.849 mm ancho × 1.441 mm alto · Batalla: 2.875 mm · Maletero: 594 L (513 L trasero + 88 L *frunk* delantero).
- **Modelos Complementarios del Informe:**
  5. **BYD Dolphin Comfort (Km 0):** Segmento C, **60,4 kWh LFP**, 204 CV, **427 km WLTP**, precio Km 0 Madrid **20.490 € – 23.199 €** (4.290 mm largo, 345 L maletero).
  6. **Citroën ë-C3 You (Nuevo / Km 0):** Segmento B, **44 kWh LFP**, 113 CV, **320 km WLTP**, precio real contado **16.275 € – 19.100 €** (4.015 mm largo, 310 L maletero).
  7. **Volvo EX30 Single Motor (Km 0):** B-SUV Premium, **51 kWh**, 272 CV, **344 km WLTP**, precio Km 0 Madrid **28.900 € – 31.900 €** (4.233 mm largo, 318 L maletero).
- **Comparador Interactivo "Cara a Cara" (Versus 1 vs 1):**
  - Dos selectores desplegables para enfrentar cualquier par de vehículos (por defecto: *Renault 5 E-Tech Techno 52 kWh* vs. *BYD Dolphin Surf Boost/Comfort 43,2 kWh*, con botones rápidos para cruzar contra *MG4* o *Tesla Model 3*).
  - Tabla y barras comparativas con ganador por categoría: Química y Ciclos, Autonomía Real en Autovía (120 km/h), Potencia de Carga Rápida DC (kW y tiempo 10–80%), Capacidad de Maletero, Precio Neto tras Ayudas y Coste Total a 5 años.

### Módulo 4 · Comparador Visual de Tamaño y Habitabilidad frente al Opel Astra (2000)
- **Referencia base:** **Opel Astra G (Año 2000)** (con selector para alternar entre carrocería *5 Puertas Compacto: 4.110 mm largo × 1.709 mm ancho × 1.425 mm alto, 2.606 mm batalla, 370 L maletero* y *Sedán 4 Puertas: 4.252 mm largo, 460 L maletero*).
- **Visualización interactiva a escala:**
  - Superposición gráfica proporcional (vista lateral y planta esquemática en Canvas/SVG limpio) entre el **Opel Astra (2000)** y el eléctrico seleccionado (o comparativa simultánea de los 4 candidatos principales).
  - Indicadores diferenciales claros y neutros:
    - $\Delta$ **Longitud (mm y cm):** Muestra si es más corto y fácil de aparcar en Madrid (ej. Renault 5: $-19\text{ cm}$; BYD Dolphin Surf: $-12\text{ cm}$) o más largo y con mayor presencia en carretera (ej. MG4: $+18\text{ cm}$; Tesla Model 3: $+61\text{ cm}$).
    - $\Delta$ **Batalla (espacio interior para piernas):** Destaca cómo la plataforma dedicada eléctrica ofrece batallas de 2.500 a 2.875 mm sin túnel central.
    - $\Delta$ **Capacidad de Maletero (Litros):** Comparativa visual de barras de volumen de carga (incluyendo *frunk* delantero en el Model 3).

### Módulo 5 · Simulador Patrimonial Completo (5 a 8 Años): Ayudas, "Mordisco Fiscal" IRPF y Devaluación
- **Panel de Configuración Financiera:**
  - Selector de vehículo (cualquiera de los 7 modelos) + deslizador para ajustar el precio de compra real al contado.
  - Checkboxes de incentivos:
    - **Plan Cambia 360 Madrid (4.000 €)** + **Achatarramiento Opel Astra 2000 sin etiqueta (+1.500 €) = 5.500 €**.
    - **Deducción Estatal IRPF 15% Vehículo** (hasta 3.000 € sobre base máxima de 20.000 € tras restar ayudas directas).
    - **Instalación Wallbox (deslizador 1.200 € – 2.200 €)** con ayuda **65% Cambia 360** + **15% deducción IRPF**.
  - **Selector de Tramo Marginal de IRPF del Comprador ("El Mordisco Fiscal en Renta"):**
    - Opciones: `24%`, `30%`, `37% (Habitual Prof. Titular / Catedrático)`, `45%`.
    - Calcula automáticamente cuánto tendrá que devolver a Hacienda en la declaración del año siguiente por las subvenciones directas recibidas (que tributan como ganancia patrimonial en la base general) y muestra el **Incentivo Neto Real después de impuestos**.
  - **Horizonte Temporal (5 a 8 años) y Curva de Devaluación:**
    - Gráfica interactiva con dos vistas:
      1. **Cascada de Precio Neto (Bruto → Subvenciones → Retención IRPF → Deducción 15% → Desembolso Real).**
      2. **Curva Patrimonial y Devaluación (Años 0 a 8):** Compara la depreciación del vehículo escogido frente al **Tesla Model 3 RWD de ocasión** (que no recibe Cambia 360 pero ya absorbió la caída fuerte de los primeros 3 años) y frente a un coche de gasolina equivalente, calculando el **Coste Total de Propiedad Neto (Compra Neta + Energía + Taller + Impuestos − Valor Residual de Reventa)**.

### Módulo 6 · Simulador del Viaje Anual de 300 km + Generador Legal Art. 17.5 LPH
- **Parte A: Simulador Físico del Viaje de 300 km por Autovía:**
  - Controles: **Velocidad de crucero** (`100`, `110`, `120`, `130 km/h`) y **Climatología** (`Invierno 5 °C`, `Templado 20 °C`, `Verano 35 °C con A/C`).
  - Calcula para los modelos principales el consumo real en ruta ($\text{kWh/100 km}$ según $C_d \cdot A$ y eficiencia térmica), el % de batería restante o necesario, los **minutos exactos de parada** en cargador rápido (0 min en Model 3 / Dolphin 60 kWh a 120 km/h; ~14–18 min en R5 / Dolphin Surf / MG4 Standard) y el coste del viaje según red (**Tesla Superchargers 0,42 €/kWh**, **Zunder/Wenea 0,50 €/kWh**, **Ionity sin bono 0,65 €/kWh**) comparado con el coste anual en casa (**Octopus Drive 0,068 €/kWh → ~51 €/año**).
- **Parte B: Generador Interactivo del Escrito Legal (Art. 17.5 LPH):**
  - Formulario con campos editables (Nombre del propietario, DNI, Dirección de la finca en Madrid, Nº de plaza de garaje, Potencia del Wallbox p. ej. 7,4 kW, Empresa instaladora p. ej. ChargeGuru / CargaTuCoche, Fecha prevista de inicio +30 días).
  - Previsualización en vivo del documento jurídico citando el **Artículo 17.5 de la Ley 49/1960 de Propiedad Horizontal** y la **ITC-BT-52**, con botones **"Imprimir / Guardar como PDF"** (mediante hoja de impresión `@media print` dedicada que imprime únicamente la carta formal en A4) y **"Copiar Texto"**.

---

## 5. Decisiones del Builder y Organización del Trabajo con Subagentes

1. **Extracción de datos reales de los 3 enlaces:** Un subagente explorará los configuradores/datos de Renault 5 E-Tech (`conf=...BAHPt/AmnZK2oMuA`), MG4 Electric y BYD Dolphin Surf para incorporar precios de tarifa y promociones vigentes en España, autonomías WLTP, capacidades de batería y dimensiones exactas al milímetro.
2. **Estructura de archivos en `c:\Proyectos\Coche_EV`:**
   - `src/data/vehicles.js`: Dataset enriquecido de los 7 modelos + Opel Astra 2000 (dimensiones, aerodinámica, química, precios, curvas de devaluación y enlaces a configuradores).
   - `src/js/simulators.js`: Motores matemáticos (Arrhenius LFP/NMC, TCO, IRPF/Cambia 360 + devaluación, física de viaje de 300 km, comparador de dimensiones, comparador Cara a Cara y generador legal Art. 17.5 LPH) + motor `SpringAnimator` (`apple-design`).
   - `src/css/styles.css`: Sistema de diseño crema premium (`design-taste-frontend` + `apple-design`) + estilos `@media print` para la carta de la comunidad de vecinos.
   - `index.html` y `Informe_Movilidad_Madrid_2026.html`: Bundle final auto-contenido (y sincronizado) en `c:\Proyectos\Coche_EV\` listo para abrir con doble clic sin servidor. El archivo original `c:\Users\jjime\OneDrive\Desktop\Coche.html` se conserva intacto como referencia inicial.
