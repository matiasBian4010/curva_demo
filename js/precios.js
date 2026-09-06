/* =========================================================
   PRECIOS — lee la Google Sheet publicada como CSV y arma
   el panel de precios de la solapa de actividad activa,
   arriba de los horarios. La solapa "Todas" no muestra precios.
========================================================= */

// ⚠️ Link de la Sheet publicada (Archivo → Compartir → Publicar en la web → CSV).
const PRECIOS_CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSVHmonk9GqekWezBD4HwMvTLE0lmxI2nMTGqVhDKaPsEcyMqebjyfrZMHSh4JJL_5qJnGB7S594s16/pub?output=csv";

// Nombre real en la columna "actividad" de la Sheet, por cada filtro de la web.
const NOMBRE_ACTIVIDAD = {
    pilates: "Pilates",
    calistenia: "Calistenia",
    yoga: "Yoga",
    stretching: "Stretching"
};

// Qué packs se muestran en la columna derecha de cada solapa.
// Actividades sin pack (yoga, stretching) quedan con lista vacía.
const PACKS_POR_ACTIVIDAD = {
    pilates: [
        { actividad: "Pack combinado (Pilates + Calistenia)", titulo: "Packs combinados" }
    ],
    calistenia: [
        { actividad: "Pack combinado (Pilates + Calistenia)", titulo: "Packs combinados" },
        { actividad: "Pack solo Calistenia", titulo: "Packs solo Calistenia" }
    ],
    yoga: [],
    stretching: []
};

// Datos ya parseados de la Sheet, disponibles para cualquier solapa
// una vez que termina de cargar (evita pedir el CSV de nuevo en cada click).
let PRECIOS_DATOS = null;


/**
 * Parser de CSV simple, tolera comas dentro de campos entre comillas.
 */
function parsearCSV(texto) {

    const filas = [];
    let fila = [];
    let campo = "";
    let entreComillas = false;

    for (let i = 0; i < texto.length; i++) {

        const char = texto[i];
        const siguiente = texto[i + 1];

        if (entreComillas) {

            if (char === '"' && siguiente === '"') {
                campo += '"';
                i++;
            } else if (char === '"') {
                entreComillas = false;
            } else {
                campo += char;
            }

        } else {

            if (char === '"') {
                entreComillas = true;
            } else if (char === ",") {
                fila.push(campo);
                campo = "";
            } else if (char === "\n" || char === "\r") {
                if (char === "\r" && siguiente === "\n") continue;
                fila.push(campo);
                filas.push(fila);
                fila = [];
                campo = "";
            } else {
                campo += char;
            }

        }

    }

    if (campo.length > 0 || fila.length > 0) {
        fila.push(campo);
        filas.push(fila);
    }

    return filas;

}


function filasAObjetos(filas) {

    if (filas.length === 0) return [];

    const headers = filas[0].map(h => h.trim().toLowerCase());
    const idxActividad = headers.indexOf("actividad");
    const idxFrecuencia = headers.indexOf("frecuencia");
    const idxPrecio = headers.indexOf("precio");
    const idxNota = headers.indexOf("nota");

    const datos = [];

    for (let i = 1; i < filas.length; i++) {

        const fila = filas[i];

        if (!fila || fila.length === 0) continue;

        datos.push({
            actividad: (fila[idxActividad] || "").trim(),
            frecuencia: (fila[idxFrecuencia] || "").trim(),
            precio: (fila[idxPrecio] || "").trim(),
            nota: (fila[idxNota] || "").trim()
        });

    }

    return datos;

}


function formatearPrecio(numero) {

    return "$" + numero.toLocaleString("es-AR", { maximumFractionDigits: 0 });

}


/**
 * Arma las filas de precio de una actividad puntual (sin envolver en tarjeta).
 * - precio vacío  → la fila no se agrega (se oculta)
 * - precio "0"    → "Sin cargo"
 * - precio numérico → formateado en pesos
 */
function armarFilas(nombreActividad, datos) {

    const items = datos.filter(d => d.actividad === nombreActividad);

    return items
        .map(item => {

            if (item.precio === "") return "";

            const precioNumero = Number(item.precio);

            if (Number.isNaN(precioNumero)) return "";

            const valorMostrado =
                precioNumero === 0 ? "Sin cargo" : formatearPrecio(precioNumero) + "/mes";

            const claseExtra = precioNumero === 0 ? " sin-cargo" : "";

            return `
                <div class="price-row${claseExtra}">
                    <span>${item.frecuencia}</span>
                    <span>${valorMostrado}</span>
                </div>
            `;

        })
        .filter(html => html !== "")
        .join("");

}


function buscarNota(nombreActividad, datos) {

    const fila = datos.find(d => d.actividad === nombreActividad && d.nota !== "");
    return fila ? fila.nota : "";

}


/**
 * Columna izquierda: abonos de la actividad seleccionada.
 */
function armarColumnaAbonos(filtro, datos) {

    const nombre = NOMBRE_ACTIVIDAD[filtro];
    const filasHTML = armarFilas(nombre, datos);

    if (filasHTML === "") return "";

    const nota = buscarNota(nombre, datos);

    return `
        <div class="price-col">
            <h3>Abonos ${nombre}</h3>
            ${filasHTML}
            ${nota ? `<p class="price-note">${nota}</p>` : ""}
        </div>
    `;

}


/**
 * Columna derecha: uno o dos bloques de packs, según la actividad.
 * Si la actividad no tiene packs asociados, devuelve "" (no se arma columna).
 */
function armarColumnaPacks(filtro, datos) {

    const grupos = PACKS_POR_ACTIVIDAD[filtro] || [];

    const bloques = grupos
        .map(grupo => {

            const filasHTML = armarFilas(grupo.actividad, datos);
            if (filasHTML === "") return "";

            const nota = buscarNota(grupo.actividad, datos);

            return `
                <div class="price-pack-bloque">
                    <p class="price-pack-titulo">${grupo.titulo}</p>
                    ${filasHTML}
                    ${nota ? `<p class="price-note">${nota}</p>` : ""}
                </div>
            `;

        })
        .filter(html => html !== "")
        .join("");

    if (bloques === "") return "";

    return `<div class="price-col">${bloques}</div>`;

}


/**
 * Leyenda del descuento en efectivo (aplica a cualquier actividad).
 */
function armarLeyendaDescuento(datos) {

    const fila = datos.find(
        d => d.actividad === "General" && d.frecuencia === "Descuento en efectivo"
    );

    if (!fila || fila.precio === "") return "";

    const porcentaje = Number(fila.precio);
    if (Number.isNaN(porcentaje) || porcentaje === 0) return "";

    return `<p class="price-legend">${porcentaje}% OFF pagando en efectivo</p>`;

}


/**
 * Arma y muestra el panel completo para la solapa activa.
 * "all" (Todas) oculta el panel por completo.
 */
function actualizarPanelPrecios(filtro) {

    const panel = document.getElementById("pricePanel");
    if (!panel) return;

    if (filtro === "all" || !PRECIOS_DATOS) {
        panel.innerHTML = "";
        panel.classList.add("hidden");
        return;
    }

    const columnaAbonos = armarColumnaAbonos(filtro, PRECIOS_DATOS);
    const columnaPacks = armarColumnaPacks(filtro, PRECIOS_DATOS);
    const leyenda = armarLeyendaDescuento(PRECIOS_DATOS);

    if (columnaAbonos === "") {
        panel.innerHTML = "";
        panel.classList.add("hidden");
        return;
    }

    panel.classList.remove("hidden");
    panel.classList.toggle("price-panel-doble", columnaPacks !== "");
    panel.classList.toggle("price-panel-simple", columnaPacks === "");

    panel.innerHTML = `
        <div class="price-columns">
            ${columnaAbonos}
            ${columnaPacks}
        </div>
        ${leyenda}
    `;

}


async function cargarPrecios() {

    const panel = document.getElementById("pricePanel");
    if (!panel) return;

    try {

        const respuesta = await fetch(PRECIOS_CSV_URL);

        if (!respuesta.ok) {
            throw new Error("No se pudo obtener la planilla de precios");
        }

        const texto = await respuesta.text();
        const filas = parsearCSV(texto);
        PRECIOS_DATOS = filasAObjetos(filas);

        const botonActivo = document.querySelector(".filter-btn.active");
        const filtroActivo = botonActivo ? botonActivo.dataset.filter : "all";
        actualizarPanelPrecios(filtroActivo);

    } catch (error) {

        console.error("Error al cargar precios:", error);
        panel.innerHTML = '<p class="price-error">No pudimos cargar los precios. Escribinos por WhatsApp para consultar valores.</p>';
        panel.classList.remove("hidden");

    }

}


// Se expone en window para que script.js la llame cuando cambia la solapa activa.
// En script.js, dentro del click de .filter-btn, agregar después de
// button.classList.add("active"):
//
//     if (window.actualizarPanelPrecios) {
//         window.actualizarPanelPrecios(filter);
//     }
window.actualizarPanelPrecios = actualizarPanelPrecios;

document.addEventListener("DOMContentLoaded", cargarPrecios);