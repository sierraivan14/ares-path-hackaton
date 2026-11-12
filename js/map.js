// Si falta Leaflet o config.js, avisar en pantalla en lugar de fallar en silencio
if (typeof L === "undefined" || typeof CONFIG === "undefined") {
    document.getElementById("estado-capa").textContent =
        "❌ Falta Leaflet (lib/leaflet/leaflet.js) o js/config.js. Revisa la consola (F12).";
    throw new Error("Leaflet o CONFIG no cargaron");
}

const estado = document.getElementById("estado-capa");

// Marte se dibuja como mapa plano de latitud/longitud (EPSG4326 de Leaflet)
const mapa = L.map("mapa", {
    crs: L.CRS.EPSG4326,
    center: CONFIG.mapa.centro,
    zoom: CONFIG.mapa.zoom,
    minZoom: CONFIG.mapa.zoomMin,
    maxZoom: CONFIG.mapa.zoomMax,
    maxBounds: [[-90, -180], [90, 180]],   // no dejar salir del planeta
    maxBoundsViscosity: 1.0
});

// --- 1. Capa base con respaldos ---
// Orden de intento para cada tesela: local (si está activo) -> remota -> respaldo.
// Si una falla, el mapa prueba la siguiente; solo avisa si fallan todas.
const cb = CONFIG.capaBase;
const usaLocal = cb.local && cb.local.activo;
const urls = [];
if (usaLocal) urls.push(cb.local.url);
if (cb.urlRemota) urls.push(cb.urlRemota);
if (cb.urlRespaldo) urls.push(cb.urlRespaldo);

const capasBase = {};
if (urls.length > 0) {
    const base = L.tileLayer(urls[0], {
        attribution: cb.atribucion,
        maxNativeZoom: usaLocal ? cb.local.zoomMaximo : cb.zoomMaximo,
        maxZoom: CONFIG.mapa.zoomMax,
        tms: cb.tms
    });
    base.addTo(mapa);
    capasBase[cb.nombre] = base;

    let fallos = 0;
    base.on("tileerror", function (e) {
        // ¿Queda otra fuente por probar para esta tesela?
        const intento = Number(e.tile.dataset.intento || 0) + 1;
        if (intento < urls.length) {
            e.tile.dataset.intento = intento;
            e.tile.src = L.Util.template(urls[intento], e.coords);
            return;
        }
        fallos++;
        estado.textContent = "⚠ Faltan teselas (sin internet o fuera de la zona descargada). Fallos: " + fallos;
    });
} else {
    estado.textContent = "⚠ Capa base pendiente (ver config.js)";
}

// --- 2. Capas extra (solo las que ya tienen URL) ---
const capasSuperpuestas = {};
CONFIG.capasExtra.forEach(function (cfg) {
    if (cfg.url) {
        capasSuperpuestas[cfg.nombre] = L.tileLayer(cfg.url, {
            attribution: cfg.atribucion || "",
            maxNativeZoom: cfg.zoomMaximo,
            maxZoom: CONFIG.mapa.zoomMax,
            opacity: cfg.opacidad || 1
        });
    }
});

// --- 3. Cuadrícula cada 10 grados ---
const cuadricula = L.layerGroup();
const estiloLinea = { color: "#39ff88", weight: 1, opacity: 0.35 };
for (let lon = -180; lon <= 180; lon += 10) {
    L.polyline([[-90, lon], [90, lon]], estiloLinea).addTo(cuadricula);
}
for (let lat = -90; lat <= 90; lat += 10) {
    L.polyline([[lat, -180], [lat, 180]], estiloLinea).addTo(cuadricula);
}
cuadricula.addTo(mapa);

// --- 4. Lugares (marcador y caja delimitadora) ---
const lugares = L.layerGroup();
CONFIG.lugares.forEach(function (lugar) {
    L.marker(lugar.coordenadas)
        .bindPopup("<b>" + lugar.nombre + "</b><br>" + lugar.nota)
        .addTo(lugares);
    if (lugar.caja) {
        L.rectangle(lugar.caja, { color: "#ffb347", weight: 2, fill: false }).addTo(lugares);
    }
});
lugares.addTo(mapa);

// --- 5. Panel de capas ---
capasSuperpuestas["Cuadrícula"] = cuadricula;
capasSuperpuestas["Lugares"] = lugares;
L.control.layers(capasBase, capasSuperpuestas).addTo(mapa);

// --- 6. Coordenadas del cursor ---
mapa.on("mousemove", function (e) {
    document.getElementById("coordenadas").textContent =
        "Lat " + e.latlng.lat.toFixed(2) + "°  Lon " + e.latlng.lng.toFixed(2) + "°";
});