/* =========================================================
   PRECIOS — lee la Google Sheet publicada como CSV y arma
   el acordeón "Ver abonos" con 3 tarjetas (Abonos, Packs,
   Extras) para la solapa de actividad activa.
========================================================= */

// ⚠️ Link de la Sheet publicada (Archivo → Compartir → Publicar en la web → CSV).
const PRECIOS_CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSVHmonk9GqekWezBD4HwMvTLE0lmxI2nMTGqVhDKaPsEcyMqebjyfrZMHSh4JJL_5qJnGB7S594s16/pub?output=csv";

const NOMBRE_ACTIVIDAD = {
    pilates: "Pilates",
    calistenia: "Calistenia",
    yoga: "Yoga",
    stretching: "Stretching"
};

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

let PRECIOS_DATOS = null;
let ACORDEON_ABIERTO = false;


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


function esFilaAbono(frecuencia) {
    return /vez por semana|veces por semana/i.test(frecuencia);
}


function esFilaExtra(frecuencia) {
    return /clase de prueba|clase suelta/i.test(frecuencia);
}


/**
 * Devuelve las filas válidas (con precio cargado) de una actividad,
 * ya resueltas a texto listo para mostrar ("Sin cargo" o "$X/mes").
 */
function obtenerFilas(nombreActividad, datos, filtroTipo) {

    return datos
        .filter(d => d.actividad === nombreActividad)
        .filter(d => {
            if (filtroTipo === "abono") return esFilaAbono(d.frecuencia);
            if (filtroTipo === "extra") return esFilaExtra(d.frecuencia);
            return true; // packs: todas las filas de esa actividad-pack
        })
        .map(item => {

            if (item.precio === "") return null;

            const precioNumero = Number(item.precio);
            if (Number.isNaN(precioNumero)) return null;

            const sinCargo = precioNumero === 0;
            const sufijo = filtroTipo === "abono" ? "/mes" : "";

            return {
                frecuencia: item.frecuencia,
                valor: sinCargo ? "Sin cargo" : formatearPrecio(precioNumero) + sufijo,
                sinCargo,
                nota: item.nota
            };

        })
        .filter(item => item !== null);

}


function armarFilasHTML(items) {

    return items
        .map(item => `
            <div class="price-row${item.sinCargo ? " sin-cargo" : ""}">
                <span>${item.frecuencia}</span>
                <span>${item.valor}</span>
            </div>
        `)
        .join("");

}


function primeraNota(items) {
    const conNota = items.find(i => i.nota !== "");
    return conNota ? conNota.nota : "";
}


/**
 * Tarjeta 1: abonos principales (1x/2x/3x) de la actividad.
 */
function armarTarjetaAbonos(nombre, datos) {

    const items = obtenerFilas(nombre, datos, "abono");
    if (items.length === 0) return "";

    return `
        <div class="price-card">
            <h4>Abonos ${nombre}</h4>
            ${armarFilasHTML(items)}
        </div>
    `;

}


/**
 * Tarjeta 2: packs asociados a la actividad (si tiene).
 */
function armarTarjetaPacks(filtro, datos) {

    const grupos = PACKS_POR_ACTIVIDAD[filtro] || [];

    const bloques = grupos
        .map(grupo => {

            const items = obtenerFilas(grupo.actividad, datos, "todas");
            if (items.length === 0) return "";

            return `
                <div class="price-pack-bloque">
                    <p class="price-pack-titulo">${grupo.titulo}</p>
                    ${armarFilasHTML(items)}
                </div>
            `;

        })
        .filter(html => html !== "")
        .join("");

    if (bloques === "") return "";

    return `<div class="price-card">${bloques}</div>`;

}


/**
 * Tarjeta 3: extras (clase de prueba / clase suelta) + descuento en efectivo.
 */
function armarTarjetaExtras(nombre, datos) {

    const items = obtenerFilas(nombre, datos, "extra");
    const filasHTML = armarFilasHTML(items);
    const nota = primeraNota(items);
    const leyenda = armarLeyendaDescuento(datos);

    if (filasHTML === "" && leyenda === "") return "";

    return `
        <div class="price-card">
            <h4>Extras</h4>
            ${filasHTML}
            ${nota ? `<p class="price-note">${nota}</p>` : ""}
            ${leyenda}
        </div>
    `;

}


function armarLeyendaDescuento(datos) {

    const fila = datos.find(
        d => d.actividad === "General" && d.frecuencia === "Descuento en efectivo"
    );

    if (!fila || fila.precio === "") return "";

    const porcentaje = Number(fila.precio);
    if (Number.isNaN(porcentaje) || porcentaje === 0) return "";

    return `<p class="price-legend">${porcentaje}% OFF en efectivo</p>`;

}


function armarTresTarjetas(filtro, datos) {

    const nombre = NOMBRE_ACTIVIDAD[filtro];

    const tarjetaAbonos = armarTarjetaAbonos(nombre, datos);

    // Sin abonos cargados para esta actividad, no mostramos el acordeón
    // (aunque exista descuento general, mostrar solo eso sería confuso).
    if (tarjetaAbonos === "") return "";

    const tarjetas = [
        tarjetaAbonos,
        armarTarjetaPacks(filtro, datos),
        armarTarjetaExtras(nombre, datos)
    ].filter(html => html !== "");

    return tarjetas.join("");

}


function actualizarPanelPrecios(filtro) {

    const panel = document.getElementById("pricePanel");
    const boton = document.getElementById("verAbonosBtn");
    const cards = document.getElementById("priceCards");

    if (!panel || !boton || !cards) return;

    // "Todas" no muestra nada
    if (filtro === "all" || !PRECIOS_DATOS) {
        panel.classList.add("hidden");
        return;
    }

    const tarjetasHTML = armarTresTarjetas(filtro, PRECIOS_DATOS);

    if (tarjetasHTML === "") {
        panel.classList.add("hidden");
        return;
    }

    panel.classList.remove("hidden");
    cards.innerHTML = tarjetasHTML;

    // al cambiar de solapa, el acordeón vuelve a su estado cerrado
    ACORDEON_ABIERTO = false;
    cards.classList.add("hidden");
    boton.innerHTML = '<span class="accordion-arrow">↓</span> Ver abonos';

}


function alternarAcordeon() {

    const cards = document.getElementById("priceCards");
    const boton = document.getElementById("verAbonosBtn");
    if (!cards || !boton) return;

    ACORDEON_ABIERTO = !ACORDEON_ABIERTO;

    cards.classList.toggle("hidden", !ACORDEON_ABIERTO);
    boton.innerHTML = ACORDEON_ABIERTO
        ? '<span class="accordion-arrow">↑</span> Ver abonos'
        : '<span class="accordion-arrow">↓</span> Ver abonos';

}


async function cargarPrecios() {

    const panel = document.getElementById("pricePanel");
    if (!panel) return;

    try {

        const respuesta = await fetch(PRECIOS_CSV_URL);
        if (!respuesta.ok) throw new Error("No se pudo obtener la planilla de precios");

        const texto = await respuesta.text();
        PRECIOS_DATOS = filasAObjetos(parsearCSV(texto));

        const botonActivo = document.querySelector(".filter-btn.active");
        const filtroActivo = botonActivo ? botonActivo.dataset.filter : "all";
        actualizarPanelPrecios(filtroActivo);

    } catch (error) {

        console.error("Error al cargar precios:", error);
        panel.classList.remove("hidden");
        const cards = document.getElementById("priceCards");
        if (cards) {
            cards.classList.remove("hidden");
            cards.innerHTML = '<p class="price-error">No pudimos cargar los precios. Escribinos por WhatsApp para consultar valores.</p>';
        }

    }

}


document.addEventListener("DOMContentLoaded", () => {

    cargarPrecios();

    // Escucha los clicks de las solapas DIRECTO acá, sin depender de script.js.
    // Así el panel de precios nunca puede quedar "pegado" en una actividad vieja.
    document.querySelectorAll(".filter-btn").forEach(boton => {
        boton.addEventListener("click", () => {
            actualizarPanelPrecios(boton.dataset.filter);
        });
    });

    const verAbonosBtn = document.getElementById("verAbonosBtn");
    if (verAbonosBtn) {
        verAbonosBtn.addEventListener("click", alternarAcordeon);
    }

});