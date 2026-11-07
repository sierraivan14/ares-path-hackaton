// Crea el mapa de Marte con Leaflet.
// Marte se ve como un mapa "plano" de latitud/longitud (proyección EPSG:4326).

const mapa = L.map("mapa", {
    crs: L.CRS.EPSG4326,          // latitud/longitud sin deformar
    center: CONFIG.mapa.centro,
    zoom: CONFIG.mapa.zoom,
    minZoom: CONFIG.mapa.zoomMin,
    maxZoom: CONFIG.mapa.zoomMax
});

// --- 1. Capa base (solo si ya hay URL en config.js) ---
const estado = document.getElementById("estado-capa");
if (CONFIG.capaBase.url) {
    L.tileLayer(CONFIG.capaBase.url, {
        attribution: CONFIG.capaBase.atribucion,
        maxZoom: CONFIG.capaBase.zoomMaximo,
        tms: CONFIG.capaBase.tms
    }).addTo(mapa);
    estado.textContent = "";
} else {
    estado.textContent = "⚠ Capa base pendiente (ver config.js)";
}

// --- 2. Cuadrícula de latitud/longitud cada 10 grados ---
const cuadricula = L.layerGroup();
const estiloLinea = { color: "#39ff88", weight: 1, opacity: 0.25 };
for (let lon = -180; lon <= 180; lon += 10) {
    L.polyline([[-90, lon], [90, lon]], estiloLinea).addTo(cuadricula);
}
for (let lat = -90; lat <= 90; lat += 10) {
    L.polyline([[lat, -180], [lat, 180]], estiloLinea).addTo(cuadricula);
}
cuadricula.addTo(mapa);

// --- 3. Lugares (desde config.js) ---
const lugares = L.layerGroup();
CONFIG.lugares.forEach(function (lugar) {
    L.marker(lugar.coordenadas)
        .bindPopup("<b>" + lugar.nombre + "</b><br>" + lugar.nota)
        .addTo(lugares);
});
lugares.addTo(mapa);

// --- 4. Botones para prender/apagar capas (aquí se sumarán más después) ---
L.control.layers(null, {
    "Cuadrícula": cuadricula,
    "Lugares": lugares
}).addTo(mapa);

// --- 5. Mostrar coordenadas del cursor ---
mapa.on("mousemove", function (e) {
    document.getElementById("coordenadas").textContent =
        "Lat " + e.latlng.lat.toFixed(2) + "°  Lon " + e.latlng.lng.toFixed(2) + "°";
});