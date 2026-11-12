// ============================================================
// Descarga teselas de Marte (Viking MDIM 2.1) para usar el mapa SIN internet.
//
// Cómo usarlo (desde la carpeta ares-path, con Node.js 18 o más nuevo):
//   node scripts/descargar-teselas.js --contar      solo cuenta, no descarga nada
//   node scripts/descargar-teselas.js --prueba      baja ~10 teselas y mide su peso
//   node scripts/descargar-teselas.js --descargar   baja todo (se puede interrumpir y repetir)
//
// Las teselas quedan en data/tiles/{zoom}/{fila}/{columna}.jpg
// ============================================================

const fs = require("fs");
const path = require("path");
const CONFIG = require("../js/config.js");

// ---------- QUÉ DESCARGAR ----------
const ZOOM_GLOBAL_MAX = 5;   // planeta completo: zoom 0 a 5
const ZOOM_ZONA_MIN = 6;     // zona alrededor de Jezero: zoom 6 a 7
// CONFIRMADO en prueba (--niveles): trek.nasa.gov responde 404 desde el zoom 8; el último con teselas es el 7
const ZOOM_ZONA_MAX = 7;
const MARGEN_GRADOS = 5;     // la zona va de (centro - 5°) a (centro + 5°)

// ---------- CORTESÍA CON EL SERVIDOR ----------
// NO CONFIRMADO: la NASA no publica un límite para descargas masivas de teselas.
// Por eso vamos despacio: pocas descargas a la vez y con pausas.
const CONCURRENCIA = 2;      // descargas al mismo tiempo (no subir de 2)
const PAUSA_MS = 250;        // pausa entre una tesela y la siguiente, por trabajador
const REINTENTOS = 3;

const CARPETA = path.join(__dirname, "..", "data", "tiles");
const AGENTE = "ARES-PATH-proyecto-estudiantil-SpaceApps";

// ---------- MATEMÁTICA DE TESELAS ----------
// En el zoom z hay 2^(z+1) columnas y 2^z filas; cada tesela cubre 180/2^z grados.
// La fila 0 es la de arriba (norte), igual que en Leaflet.
function rango(z, latSur, lonOeste, latNorte, lonEste) {
    const columnas = Math.pow(2, z + 1);
    const filas = Math.pow(2, z);
    const grados = 180 / Math.pow(2, z);
    return {
        x0: Math.max(0, Math.floor((lonOeste + 180) / grados)),
        x1: Math.min(columnas - 1, Math.floor((lonEste + 180) / grados)),
        y0: Math.max(0, Math.floor((90 - latNorte) / grados)),
        y1: Math.min(filas - 1, Math.floor((90 - latSur) / grados))
    };
}

function agregar(lista, z, r) {
    for (let y = r.y0; y <= r.y1; y++) {
        for (let x = r.x0; x <= r.x1; x++) {
            lista.push({ z: z, y: y, x: x });
        }
    }
}

function listaTeselas() {
    const lista = [];
    for (let z = 0; z <= ZOOM_GLOBAL_MAX; z++) {
        agregar(lista, z, rango(z, -90, -180, 90, 180));
    }
    const lat = CONFIG.mapa.centro[0];
    const lon = CONFIG.mapa.centro[1];
    for (let z = ZOOM_ZONA_MIN; z <= ZOOM_ZONA_MAX; z++) {
        agregar(lista, z, rango(z, lat - MARGEN_GRADOS, lon - MARGEN_GRADOS,
            lat + MARGEN_GRADOS, lon + MARGEN_GRADOS));
    }
    return lista;
}

// Unas pocas teselas para medir el peso: zoom 0 completo y 2x2 alrededor de Jezero en zoom 5 y 8
function listaPrueba() {
    const lista = [];
    agregar(lista, 0, rango(0, -90, -180, 90, 180));
    [5, 7].forEach(function (z) {
        const r = rango(z, CONFIG.mapa.centro[0], CONFIG.mapa.centro[1],
            CONFIG.mapa.centro[0], CONFIG.mapa.centro[1]);
        agregar(lista, z, { x0: r.x0, x1: r.x0 + 1, y0: r.y0, y1: r.y0 + 1 });
    });
    return lista;
}

// ---------- UTILIDADES ----------
function dormir(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }

function llenar(plantilla, t) {
    return plantilla.replace("{z}", t.z).replace("{y}", t.y).replace("{x}", t.x);
}

function resumen(lista) {
    const porNivel = {};
    lista.forEach(function (t) { porNivel[t.z] = (porNivel[t.z] || 0) + 1; });
    console.log("Zoom  Teselas");
    Object.keys(porNivel).forEach(function (z) {
        console.log("  " + z + "   " + porNivel[z]);
    });
    console.log("TOTAL: " + lista.length + " teselas");
    const minutos = Math.ceil((lista.length * PAUSA_MS) / CONCURRENCIA / 60000);
    console.log("Tiempo mínimo por las pausas: ~" + minutos + " min (más el tiempo de red)");
}

// Prueba la tesela 0/0/0 en cada fuente y se queda con la primera que responde una imagen
async function elegirFuente() {
    const forzada = process.argv.find(function (a) { return a.startsWith("--fuente="); });
    if (forzada) return forzada.slice("--fuente=".length);

    const candidatas = [CONFIG.capaBase.urlRemota, CONFIG.capaBase.urlRespaldo];
    for (const plantilla of candidatas) {
        const host = plantilla.split("/")[2];
        try {
            const r = await fetch(llenar(plantilla, { z: 0, y: 0, x: 0 }), { headers: { "User-Agent": AGENTE } });
            const tipo = r.headers.get("content-type") || "";
            if (r.ok && tipo.includes("image")) {
                console.log("✔ Fuente que funciona: " + host);
                return plantilla;
            }
            console.log("✖ " + host + " respondió " + r.status + " (" + tipo + ")");
        } catch (e) {
            console.log("✖ " + host + " no respondió: " + e.message);
        }
    }
    return null;
}

// ---------- DESCARGA ----------
async function bajar(t, plantilla) {
    const archivo = path.join(CARPETA, String(t.z), String(t.y), t.x + ".jpg");
    if (fs.existsSync(archivo)) {
        return { estado: "ya", bytes: fs.statSync(archivo).size };   // ya estaba: así se puede reanudar
    }
    for (let intento = 1; intento <= REINTENTOS; intento++) {
        try {
            const r = await fetch(llenar(plantilla, t), { headers: { "User-Agent": AGENTE } });
            if (r.status === 429 || r.status === 403) return { estado: "bloqueo", codigo: r.status };
            if (r.status === 404) return { estado: "sincobertura" };
            if (!r.ok) throw new Error("HTTP " + r.status);
            const datos = Buffer.from(await r.arrayBuffer());
            fs.mkdirSync(path.dirname(archivo), { recursive: true });
            fs.writeFileSync(archivo, datos);
            return { estado: "ok", bytes: datos.length };
        } catch (e) {
            await dormir(1000 * intento);   // espera más en cada reintento
        }
    }
    return { estado: "error" };
}

async function procesar(lista, plantilla) {
    const cuenta = { ok: 0, ya: 0, sincobertura: 0, error: 0 };
    const bytesPorNivel = {};
    let siguiente = 0;
    let detener = false;

    async function trabajador() {
        while (!detener) {
            const i = siguiente++;
            if (i >= lista.length) return;
            const t = lista[i];
            const res = await bajar(t, plantilla);
            if (res.estado === "bloqueo") {
                if (!detener) {   // avisar una sola vez aunque haya dos trabajadores
                    detener = true;
                    console.log("\n⛔ El servidor respondió " + res.codigo + " (límite o bloqueo). Me detengo para no empeorarlo.");
                    console.log("   Espera 60 minutos y vuelve a correr el comando: continúa donde se quedó.");
                }
                return;
            }
            cuenta[res.estado]++;
            if (res.bytes) {
                bytesPorNivel[t.z] = bytesPorNivel[t.z] || [];
                bytesPorNivel[t.z].push(res.bytes);
            }
            const hechas = cuenta.ok + cuenta.ya + cuenta.sincobertura + cuenta.error;
            if (hechas % 50 === 0) console.log("  " + hechas + " / " + lista.length);
            if (res.estado !== "ya") await dormir(PAUSA_MS);   // si ya existía no hubo petición, no hace falta pausa
        }
    }

    const trabajadores = [];
    for (let c = 0; c < CONCURRENCIA; c++) trabajadores.push(trabajador());
    await Promise.all(trabajadores);
    return { cuenta: cuenta, bytesPorNivel: bytesPorNivel, detenido: detener };
}

function reporte(res, totalPlaneado) {
    console.log("\nDescargadas: " + res.cuenta.ok + " | Ya existían: " + res.cuenta.ya +
        " | Sin cobertura (404): " + res.cuenta.sincobertura + " | Con error: " + res.cuenta.error);
    let suma = 0, n = 0;
    console.log("\nPeso medio por nivel de zoom:");
    Object.keys(res.bytesPorNivel).forEach(function (z) {
        const lista = res.bytesPorNivel[z];
        const total = lista.reduce(function (a, b) { return a + b; }, 0);
        suma += total; n += lista.length;
        console.log("  zoom " + z + ": " + (total / lista.length / 1024).toFixed(1) + " KB por tesela (" + lista.length + " medidas)");
    });
    if (n > 0) {
        const mediaKB = suma / n / 1024;
        console.log("\nPeso medio general: " + mediaKB.toFixed(1) + " KB");
        console.log("ESTIMACIÓN para " + totalPlaneado + " teselas: ~" + (mediaKB * totalPlaneado / 1024).toFixed(0) +
            " MB (la muestra es pequeña; el real puede variar)");
    }
}

// Pide la tesela que cubre el centro de Jezero en cada zoom (0 a 9) y muestra qué responde el servidor.
// Sirve para saber hasta qué zoom existen teselas de verdad.
async function probarNiveles(plantilla) {
    console.log("\nZoom  Fila  Col   Respuesta");
    for (let z = 0; z <= CONFIG.mapa.zoomMax; z++) {
        const r = rango(z, CONFIG.mapa.centro[0], CONFIG.mapa.centro[1],
            CONFIG.mapa.centro[0], CONFIG.mapa.centro[1]);
        const t = { z: z, y: r.y0, x: r.x0 };
        let texto;
        try {
            const resp = await fetch(llenar(plantilla, t), { headers: { "User-Agent": AGENTE } });
            const bytes = (await resp.arrayBuffer()).byteLength;
            texto = "HTTP " + resp.status + "  " + (resp.headers.get("content-type") || "?") +
                "  " + (bytes / 1024).toFixed(1) + " KB";
        } catch (e) {
            texto = "sin respuesta: " + e.message;
        }
        console.log("  " + z + "   " + t.y + "   " + t.x + "   " + texto);
        await dormir(PAUSA_MS);
    }
}

// Pide la tesela que cubre el centro de Jezero en cada zoom (0 a 9) y muestra qué responde el servidor.
// Sirve para saber hasta qué zoom existen teselas de verdad.
async function probarNiveles(plantilla) {
    console.log("\nZoom  Fila  Col   Respuesta");
    for (let z = 0; z <= CONFIG.mapa.zoomMax; z++) {
        const r = rango(z, CONFIG.mapa.centro[0], CONFIG.mapa.centro[1],
            CONFIG.mapa.centro[0], CONFIG.mapa.centro[1]);
        const t = { z: z, y: r.y0, x: r.x0 };
        let texto;
        try {
            const resp = await fetch(llenar(plantilla, t), { headers: { "User-Agent": AGENTE } });
            const bytes = (await resp.arrayBuffer()).byteLength;
            texto = "HTTP " + resp.status + "  " + (resp.headers.get("content-type") || "?") +
                "  " + (bytes / 1024).toFixed(1) + " KB";
        } catch (e) {
            texto = "sin respuesta: " + e.message;
        }
        console.log("  " + z + "   " + t.y + "   " + t.x + "   " + texto);
        await dormir(PAUSA_MS);
    }
}

async function main() {
    const modo = process.argv[2];
    const lista = listaTeselas();

    if (modo === "--contar") { resumen(lista); return; }

    if (modo !== "--prueba" && modo !== "--descargar" && modo !== "--niveles") {
        console.log("Uso:\n  node scripts/descargar-teselas.js --contar\n" +
            "  node scripts/descargar-teselas.js --niveles\n" +
            "  node scripts/descargar-teselas.js --prueba\n" +
            "  node scripts/descargar-teselas.js --descargar");
        return;
    }
    if (typeof fetch !== "function") {
        console.log("Este script necesita Node.js 18 o más nuevo (revisa con: node --version)");
        return;
    }

    const plantilla = await elegirFuente();
    if (!plantilla) {
        console.log("\nNinguna fuente respondió una imagen. Revisa tu internet o las URLs en js/config.js.");
        return;
    }

    if (modo === "--niveles") { await probarNiveles(plantilla); return; }

    const trabajo = (modo === "--prueba") ? listaPrueba() : lista;
    console.log("\nProcesando " + trabajo.length + " teselas...");
    const res = await procesar(trabajo, plantilla);
    reporte(res, lista.length);
    if (modo === "--descargar" && !res.detenido && res.cuenta.error === 0) {
        console.log("\nListo. Ahora pon  local: { activo: true }  en js/config.js");
    }
}

main();