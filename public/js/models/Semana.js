/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 * Archivo: js/semanas.js
 *
 * Controlador de la pantalla de semanas.
 *
 * Responsabilidades:
 * - Cargar semanas desde Firebase
 * - Crear semanas
 * - Editar semanas
 * - Eliminar semanas
 * - Validar datos del formulario
 * - Mostrar historial
 *
 * Este archivo NO realiza cálculos estadísticos.
 * Los cálculos pertenecen a los Motores.
 * import Semana from "./models/Semana.js";
 **********************************************************************/

import SemanaService from "./services/SemanaService.js";

import { CONFIG } from "./config.js";


/* ==============================================================
   SERVICIO
============================================================== */

const semanaService = new SemanaService();


/* ==============================================================
   ESTADO DE LA PANTALLA
============================================================== */

let semanaEditando = null;


/* ==============================================================
   ELEMENTOS DEL DOM
============================================================== */

const txtSemana =
    document.getElementById("txtSemana");

const txtFecha =
    document.getElementById("txtFecha");

const btnGuardar =
    document.getElementById("btnGuardar");

const btnLimpiar =
    document.getElementById("btnLimpiar");

const tablaSemanas =
    document.getElementById("tablaSemanas");


/* ==============================================================
   INICIO
============================================================== */

document.addEventListener(
    "DOMContentLoaded",
    iniciar
);


async function iniciar() {

    console.log(
        "========================================"
    );

    console.log(
        "SISTEMA HEURÍSTICO EVOLUTIVO"
    );

    console.log(
        "Módulo: Semanas"
    );

    console.log(
        "========================================"
    );


    /* ----------------------------------------------------------
       EVENTOS
    ---------------------------------------------------------- */

    if (btnGuardar) {

        btnGuardar.addEventListener(
            "click",
            guardarSemana
        );

    }


    if (btnLimpiar) {

        btnLimpiar.addEventListener(
            "click",
            limpiarFormulario
        );

    }


    /* ----------------------------------------------------------
       CARGAR HISTORIAL
    ---------------------------------------------------------- */

    await cargarSemanas();

}


/* ==============================================================
   CARGAR SEMANAS
============================================================== */

async function cargarSemanas() {

    try {

        mostrarCargando();


        const semanas =
            await semanaService.obtenerTodas("desc");


        mostrarSemanas(semanas);


        console.log(
            "Semanas cargadas:",
            semanas.length
        );


    }
    catch (error) {

        console.error(
            "Error al cargar semanas:",
            error
        );


        mostrarError(
            "No se pudieron cargar las semanas.\n\n" +
            error.message
        );

    }

}


/* ==============================================================
   GUARDAR
============================================================== */

async function guardarSemana() {

    try {

        const datos =
            obtenerDatosFormulario();


        validarFormulario(
            datos
        );


        /* ------------------------------------------------------
           MODO EDICIÓN
        ------------------------------------------------------ */

        if (semanaEditando !== null) {

            await semanaService.actualizar(

                semanaEditando,

                {

                    fecha: datos.fecha,

                    numeros: datos.numeros,

                    cantidad:
                        datos.numeros.length

                }

            );


            mostrarExito(
                `La semana ${semanaEditando} fue actualizada correctamente.`
            );


        }

        /* ------------------------------------------------------
           MODO CREACIÓN
        ------------------------------------------------------ */

        else {

            await semanaService.crear(

                datos.semana,

                datos.fecha,

                datos.numeros

            );


            mostrarExito(
                `La semana ${datos.semana} fue guardada correctamente.`
            );

        }


        limpiarFormulario();


        await cargarSemanas();


    }
    catch (error) {

        console.error(
            "Error al guardar:",
            error
        );


        mostrarError(
            error.message
        );

    }

}


/* ==============================================================
   OBTENER DATOS DEL FORMULARIO
============================================================== */

function obtenerDatosFormulario() {

    const semana =
        Number(
            txtSemana.value
        );


    const fecha =
        txtFecha.value;


    const numeros = [];


    for (
        let i = 1;
        i <= CONFIG.NUMEROS_POR_SEMANA;
        i++
    ) {

        const elemento =
            document.getElementById(
                `n${i}`
            );


        if (!elemento) {

            throw new Error(
                `No se encontró el campo n${i}.`
            );

        }


        const valor =
            elemento.value.trim();


        if (valor === "") {

            throw new Error(
                `Debe ingresar el número ${i}.`
            );

        }


        const numero =
            Number(valor);


        if (!Number.isInteger(numero)) {

            throw new Error(
                `El número ${i} debe ser un entero.`
            );

        }


        numeros.push(numero);

    }


    return {

        semana,

        fecha,

        numeros

    };

}


/* ==============================================================
   VALIDAR FORMULARIO
============================================================== */

function validarFormulario(datos) {


    /* ----------------------------------------------------------
       SEMANA
    ---------------------------------------------------------- */

    if (
        !Number.isInteger(
            datos.semana
        ) ||
        datos.semana <= 0
    ) {

        throw new Error(
            "Debe ingresar un número de semana válido."
        );

    }


    /* ----------------------------------------------------------
       FECHA
    ---------------------------------------------------------- */

    if (!datos.fecha) {

        throw new Error(
            "Debe ingresar la fecha del sorteo."
        );

    }


    /* ----------------------------------------------------------
       CANTIDAD
    ---------------------------------------------------------- */

    if (
        datos.numeros.length !==
        CONFIG.NUMEROS_POR_SEMANA
    ) {

        throw new Error(

            `Debe ingresar exactamente ` +
            `${CONFIG.NUMEROS_POR_SEMANA} números.`

        );

    }


    /* ----------------------------------------------------------
       RANGO
    ---------------------------------------------------------- */

    datos.numeros.forEach(

        (numero, indice) => {

            if (
                numero < CONFIG.MIN_NUMERO ||
                numero > CONFIG.MAX_NUMERO
            ) {

                throw new Error(

                    `El número ${indice + 1} ` +
                    `debe estar entre ` +
                    `${CONFIG.MIN_NUMERO} y ` +
                    `${CONFIG.MAX_NUMERO}.`

                );

            }

        }

    );


    /* ----------------------------------------------------------
       DUPLICADOS
    ---------------------------------------------------------- */

    const conjunto =
        new Set(
            datos.numeros
        );


    if (
        conjunto.size !==
        datos.numeros.length
    ) {

        throw new Error(
            "No se permiten números repetidos dentro de la misma semana."
        );

    }


    return true;

}


/* ==============================================================
   MOSTRAR SEMANAS
============================================================== */

function mostrarSemanas(semanas) {


    if (!tablaSemanas) {

        console.error(
            "No existe #tablaSemanas en el HTML."
        );

        return;

    }


    tablaSemanas.innerHTML = "";


    /* ----------------------------------------------------------
       SIN DATOS
    ---------------------------------------------------------- */

    if (
        !semanas ||
        semanas.length === 0
    ) {

        tablaSemanas.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="text-center text-muted py-4"
                >

                    <i class="bi bi-database-x fs-3"></i>

                    <br>

                    Todavía no hay semanas cargadas.

                </td>

            </tr>

        `;

        return;

    }


    /* ----------------------------------------------------------
       TABLA
    ---------------------------------------------------------- */

    semanas.forEach(

        semana => {

            const fila =
                document.createElement(
                    "tr"
                );


            const numeros =
                Array.isArray(
                    semana.numeros
                )
                    ? semana.numeros
                    : [];


            const numerosHTML =
                numeros
                    .map(
                        numero =>
                            `<span class="badge bg-primary me-1 mb-1">
                                ${formatearNumero(numero)}
                            </span>`
                    )
                    .join("");


            fila.innerHTML = `

                <td>

                    <strong>
                        ${semana.semana}
                    </strong>

                </td>


                <td>

                    ${formatearFecha(
                        semana.fecha
                    )}

                </td>


                <td>

                    ${numerosHTML}

                </td>


                <td>

                    <div class="d-flex gap-1">

                        <button

                            class="btn btn-sm btn-warning"

                            title="Editar"

                            data-accion="editar"

                            data-semana="${semana.semana}"

                        >

                            <i class="bi bi-pencil"></i>

                        </button>


                        <button

                            class="btn btn-sm btn-danger"

                            title="Eliminar"

                            data-accion="eliminar"

                            data-semana="${semana.semana}"

                        >

                            <i class="bi bi-trash"></i>

                        </button>

                    </div>

                </td>

            `;


            tablaSemanas.appendChild(
                fila
            );

        }

    );


    /* ----------------------------------------------------------
       EVENTOS DE ACCIONES
    ---------------------------------------------------------- */

    tablaSemanas
        .querySelectorAll(
            "[data-accion]"
        )
        .forEach(

            boton => {

                boton.addEventListener(
                    "click",
                    manejarAccion
                );

            }

        );

}


/* ==============================================================
   MANEJAR ACCIONES
============================================================== */

async function manejarAccion(evento) {

    const boton =
        evento.currentTarget;


    const accion =
        boton.dataset.accion;


    const numeroSemana =
        Number(
            boton.dataset.semana
        );


    if (
        accion === "editar"
    ) {

        await editarSemana(
            numeroSemana
        );

    }


    if (
        accion === "eliminar"
    ) {

        await eliminarSemana(
            numeroSemana
        );

    }

}


/* ==============================================================
   EDITAR SEMANA
============================================================== */

async function editarSemana(
    numeroSemana
) {

    try {

        const semana =
            await semanaService.obtener(
                numeroSemana
            );


        if (!semana) {

            throw new Error(
                `No se encontró la semana ${numeroSemana}.`
            );

        }


        /* ------------------------------------------------------
           CARGAR DATOS
        ------------------------------------------------------ */

        txtSemana.value =
            semana.semana;


        txtFecha.value =
            semana.fecha;


        const numeros =
            Array.isArray(
                semana.numeros
            )
                ? semana.numeros
                : [];


        numeros.forEach(

            (numero, indice) => {

                const campo =
                    document.getElementById(
                        `n${indice + 1}`
                    );


                if (campo) {

                    campo.value =
                        numero;

                }

            }

        );


        semanaEditando =
            numeroSemana;


        /* ------------------------------------------------------
           CAMBIAR BOTÓN
        ------------------------------------------------------ */

        if (btnGuardar) {

            btnGuardar.innerHTML = `

                <i class="bi bi-pencil-square"></i>

                Actualizar

            `;

            btnGuardar.classList.remove(
                "btn-success"
            );

            btnGuardar.classList.add(
                "btn-warning"
            );

        }


        /* ------------------------------------------------------
           DESHABILITAR SEMANA
           La semana identifica el documento.
        ------------------------------------------------------ */

        txtSemana.disabled = true;


        /* ------------------------------------------------------
           IR AL FORMULARIO
        ------------------------------------------------------ */

        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });


    }
    catch (error) {

        console.error(
            "Error al editar:",
            error
        );


        mostrarError(
            error.message
        );

    }

}


/* ==============================================================
   ELIMINAR SEMANA
============================================================== */

async function eliminarSemana(
    numeroSemana
) {

    try {

        const confirmar =
            confirm(

                `¿Está seguro de eliminar la semana ${numeroSemana}?\n\n` +

                "Esta acción eliminará el registro del historial " +

                "de Firebase y no podrá recuperarse desde la aplicación."

            );


        if (!confirmar) {

            return;

        }


        await semanaService.eliminar(
            numeroSemana
        );


        mostrarExito(

            `La semana ${numeroSemana} fue eliminada correctamente.`

        );


        /* ------------------------------------------------------
           SI ESTABA EN EDICIÓN
        ------------------------------------------------------ */

        if (
            semanaEditando ===
            numeroSemana
        ) {

            limpiarFormulario();

        }


        await cargarSemanas();

    }
    catch (error) {

        console.error(
            "Error al eliminar:",
            error
        );


        mostrarError(
            error.message
        );

    }

}


/* ==============================================================
   LIMPIAR FORMULARIO
============================================================== */

function limpiarFormulario() {


    if (txtSemana) {

        txtSemana.value = "";

        txtSemana.disabled = false;

    }


    if (txtFecha) {

        txtFecha.value = "";

    }


    for (
        let i = 1;
        i <= CONFIG.NUMEROS_POR_SEMANA;
        i++
    ) {

        const campo =
            document.getElementById(
                `n${i}`
            );


        if (campo) {

            campo.value = "";

        }

    }


    semanaEditando = null;


    /* ----------------------------------------------------------
       RESTAURAR BOTÓN
    ---------------------------------------------------------- */

    if (btnGuardar) {

        btnGuardar.innerHTML = `

            <i class="bi bi-floppy"></i>

            Guardar

        `;

        btnGuardar.classList.remove(
            "btn-warning"
        );

        btnGuardar.classList.add(
            "btn-success"
        );

    }

}


/* ==============================================================
   MOSTRAR CARGANDO
============================================================== */

function mostrarCargando() {

    if (!tablaSemanas) {

        return;

    }


    tablaSemanas.innerHTML = `

        <tr>

            <td
                colspan="4"
                class="text-center py-4"
            >

                <div
                    class="spinner-border text-primary"
                    role="status"
                >

                    <span class="visually-hidden">
                        Cargando...
                    </span>

                </div>

                <div class="mt-2">
                    Cargando historial...
                </div>

            </td>

        </tr>

    `;

}


/* ==============================================================
   FORMATEAR NÚMERO
============================================================== */

function formatearNumero(
    numero
) {

    return String(
        numero
    ).padStart(
        2,
        "0"
    );

}


/* ==============================================================
   FORMATEAR FECHA
============================================================== */

function formatearFecha(
    fecha
) {

    if (!fecha) {

        return "-";

    }


    /*
     * Las fechas provenientes del input
     * tienen formato YYYY-MM-DD.
     */

    const partes =
        String(
            fecha
        ).split("-");


    if (
        partes.length === 3
    ) {

        return (

            partes[2] +
            "/" +
            partes[1] +
            "/" +
            partes[0]

        );

    }


    return fecha;

}


/* ==============================================================
   MENSAJE DE ÉXITO
============================================================== */

function mostrarExito(
    mensaje
) {

    alert(
        "✓ " + mensaje
    );

}


/* ==============================================================
   MENSAJE DE ERROR
============================================================== */

function mostrarError(
    mensaje
) {

    alert(
        "⚠ " + mensaje
    );

}


/* ==============================================================
   EXPORTAR PARA DEPURACIÓN
============================================================== */

window.SemanasApp = {

    cargarSemanas,

    guardarSemana,

    limpiarFormulario,

    editarSemana,

    eliminarSemana

};