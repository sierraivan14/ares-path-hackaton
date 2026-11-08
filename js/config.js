// ============================================================
// CONFIGURACIÓN DEL PROYECTO
// Todo dato que no esté verificado queda marcado como PENDIENTE
// ============================================================
const CONFIG = {

    mapa: {
        // CONFIRMADO: centro de Jezero (Gazetteer USGS, planetocéntrico +Este)
        // https://planetarynames.wr.usgs.gov/Feature/14300
        centro: [18.41, 77.69],
        zoom: 7,
        zoomMin: 1,
        zoomMax: 9   // CONFIRMADO: la capa Viking tiene niveles 0 a 9 (XML de capacidades)
    },

    // --- Capa base: Viking MDIM 2.1 color, 232 m/px ---
    capaBase: {
        nombre: "Viking MDIM 2.1 (color)",
        // ID, estilo (default), matriz (default028mm) y formato (jpg): CONFIRMADOS en el XML oficial.
        // NO CONFIRMADO: que esta URL funcione sin api_key y sin límites (probar en el navegador).
        // PENDIENTE: ver respuesta del Gem (mensaje 2: acceso, llaves y límites)
        url: "https://api.nasa.gov/mars-wmts/catalog/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg",
        // Alternativa NO CONFIRMADA (de un sitio de terceros), probar solo si la anterior falla:
        // "https://trek.nasa.gov/tiles/Mars/EQ/Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg"
        // PENDIENTE: confirmar texto exacto del crédito (el Gem sugiere "NASA/JPL-Caltech" y USGS)
        atribucion: "Imágenes: NASA/JPL-Caltech · USGS Astrogeology (Viking MDIM 2.1). Proyecto no avalado por la NASA.",
        zoomMaximo: 9,
        tms: false    // CONFIRMADO: el origen de filas WMTS (arriba-izquierda) coincide con Leaflet
    },

    // --- Capas superpuestas (se activan solo si "url" no está vacía) ---
    capasExtra: [
        {
            nombre: "Elevación MOLA",
            // PENDIENTE: ver respuesta del Gem (ID exacto de la capa MOLA coloreada y su formato)
            url: "",
            atribucion: "MOLA · NASA/GSFC",
            zoomMaximo: 5,   // PENDIENTE: confirmar
            opacidad: 0.6
        }
    ],

    lugares: [
        {
            nombre: "Cráter Jezero",
            coordenadas: [18.41, 77.69],                    // CONFIRMADO (USGS)
            caja: [[18.01, 77.27], [18.81, 78.11]],         // CONFIRMADO (USGS): [[sur, oeste], [norte, este]]
            nota: "Diámetro 47.52 km. Centro y caja: Gazetteer of Planetary Nomenclature (USGS)."
        }
    ]
};