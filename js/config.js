// ============================================================
// CONFIGURACIÓN DEL PROYECTO
// Todo dato no verificado queda marcado como PENDIENTE o NO CONFIRMADO
// ============================================================
const CONFIG = {

    mapa: {
        // CONFIRMADO: centro de Jezero (Gazetteer USGS, planetocéntrico +Este)
        centro: [18.41, 77.69],
        zoom: 7,
        zoomMin: 1,
        // Se puede acercar hasta 9, pero las teselas reales solo llegan al 7 (ver zoomMaximo abajo):
        // los zooms 8 y 9 son el zoom 7 ampliado (se ve borroso, sin teselas nuevas).
        zoomMax: 9
    },

    // --- Capa base: Viking MDIM 2.1 color ---
    capaBase: {
        nombre: "Viking MDIM 2.1 (color)",

        // FUENTE 1 (la recomienda el Gem): servidor de origen del JPL.
        // NO CONFIRMADO por mí: que sirva teselas sin llave (probar en el navegador).
        urlRemota: "https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg",

        // FUENTE 2 (respaldo): portal api.nasa.gov. ID de capa CONFIRMADO en su XML;
        // NO CONFIRMADO: que no tenga límite de peticiones para teselas.
        urlRespaldo: "https://api.nasa.gov/mars-wmts/catalog/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg",

        // CONFIRMADO por prueba (--niveles, tesela de Jezero): trek.nasa.gov da 200 hasta el zoom 7 y 404 en 8 y 9.
        // OJO: el XML de api.nasa.gov declara niveles 0 a 9; el servidor trek.nasa.gov no los tiene.
        zoomMaximo: 7,

        // TESELAS LOCALES (modo offline). Poner activo: true DESPUÉS de correr
        // scripts/descargar-teselas.js. Si falta una tesela, el mapa la pide a internet.
        local: {
            activo: true,
            url: "data/tiles/{z}/{y}/{x}.jpg",

            // El último nivel con teselas reales es el 7 (ver arriba); Leaflet amplía ese para los zooms 8 y 9.
            zoomMaximo: 7
        },

        // CONFIRMADO: el crédito corto "Courtesy NASA/JPL-Caltech." viene de la política de imágenes del JPL.
        // La frase completa es combinación sugerida por el Gem.
        atribucion: "Courtesy NASA/JPL-Caltech · Data: NASA, JPL, USGS Astrogeology (Viking MDIM 2.1) · Proyecto estudiantil, no avalado por la NASA",
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

// Permite que los scripts de Node (scripts/descargar-teselas.js) lean este archivo.
// En el navegador "module" no existe y esta línea no hace nada.
if (typeof module !== "undefined") { module.exports = CONFIG; }