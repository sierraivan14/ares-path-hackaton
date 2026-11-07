// ============================================================
// CONFIGURACIÓN DEL PROYECTO
// Aquí van TODOS los datos que no están verificados.
// Cuando el Gem entregue la información, solo se cambia este archivo.
// ============================================================
const CONFIG = {

    // --- Vista inicial del mapa ---
    mapa: {
        // NO CONFIRMADO: coordenadas aproximadas del cráter Jezero [lat, lon],
        // escritas de memoria. PENDIENTE: ver respuesta del Gem (fuente USGS/NASA).
        centro: [18.38, 77.58],
        zoom: 5,
        zoomMin: 1,
        zoomMax: 10
    },

    // --- Capa base (imágenes satelitales de Marte) ---
    // Si "url" está vacía, el mapa funciona solo con la cuadrícula.
    capaBase: {
        // PENDIENTE: ver respuesta del Gem (URL exacta del servicio WMTS de Mars Trek)
        url: "",
        // PENDIENTE: ver respuesta del Gem (nombre exacto de la capa)
        nombre: "",
        // PENDIENTE: ver respuesta del Gem (texto de atribución/licencia)
        atribucion: "",
        // PENDIENTE: ver respuesta del Gem (zoom máximo real de la capa)
        zoomMaximo: 7,
        // PENDIENTE: ver respuesta del Gem (si los tiles usan esquema TMS: true/false)
        tms: false
    },

    // --- Lugares marcados en el mapa ---
    lugares: [
        {
            nombre: "Cráter Jezero (aprox.)",
            // PENDIENTE: ver respuesta del Gem (confirmar coordenadas)
            coordenadas: [18.38, 77.58],
            nota: "Sitio de aterrizaje de Perseverance. Coordenadas por confirmar."
        }
    ]
};