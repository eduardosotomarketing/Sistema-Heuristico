/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 * Archivo: js/semanas.js
 *
 * Controlador de la página semanas.html
 *
 * Responsabilidades:
 * - Leer formulario
 * - Validar datos
 * - Crear semanas
 * - Editar semanas
 * - Eliminar semanas
 * - Guardar en Firestore mediante SemanaService
 * - Mostrar historial
 * - Limpiar formulario
 **********************************************************************/

import SemanaService from "./services/SemanaService.js";


/*==============================================================
    SERVICIO
==============================================================*/

const semanaService = new SemanaService();


/*==============================================================
    ELEMENTOS HTML
==============================================================*/

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


/*==============================================================
    ESTADO
==============================================================*/

/*
 * null  = modo creación
 * número = modo edición
 */

let semanaEditando = null;


/*==============================================================
    OBTENER NÚMEROS
==============================================================*/

function obtenerNumeros() {

    const numeros = [];

    for (let i = 1; i <= 10; i++) {

        const campo =
            document.getElementById(`n${i}`);


        if (!campo) {

            throw new Error(
                `No se encontró el campo n${i}.`
            );

        }


        const valor =
            campo.value.trim();


        if (valor === "") {

            throw new Error(
                `Debe ingresar el número ${i}.`
            );

        }


        const numero =
            Number(valor);


        if (!Number.isInteger(numero)) {

            throw new Error(
                `El número ${i} no es válido.`
            );

        }


        if (
            numero < 0 ||
            numero > 99
        ) {

            throw new Error(
                `El número ${i} debe estar entre 0 y 99.`
            );

        }


        numeros.push(numero);

    }


    return numeros;
}


/*==============================================================
    VALIDAR NÚMEROS DUPLICADOS
==============================================================*/

function validarDuplicados(numeros) {

    const conjunto =
        new Set(numeros);


    if (
        conjunto.size !== numeros.length
    ) {

        throw new Error(
            "No se permiten números repetidos dentro de una semana."
        );

    }

}


/*==============================================================
    GUARDAR SEMANA
==============================================================*/

async function guardarSemana() {

    try {

        btnGuardar.disabled = true;


        const numeroSemana =
            Number(txtSemana.value);


        const fecha =
            txtFecha.value;


        const numeros =
            obtenerNumeros();


        /*----------------------------------------------------------
            VALIDACIÓN SEMANA
        ----------------------------------------------------------*/

        if (!Number.isInteger(numeroSemana)) {

            throw new Error(
                "Debe ingresar un número de semana válido."
            );

        }


        if (numeroSemana <= 0) {

            throw new Error(
                "La semana debe ser mayor que cero."
            );

        }


        /*----------------------------------------------------------
            VALIDACIÓN FECHA
        ----------------------------------------------------------*/

        if (!fecha) {

            throw new Error(
                "Debe seleccionar una fecha."
            );

        }


        /*----------------------------------------------------------
            VALIDACIÓN DUPLICADOS
        ----------------------------------------------------------*/

        validarDuplicados(numeros);


        /*==========================================================
            MODO EDICIÓN
        ==========================================================*/

        if (semanaEditando !== null) {

            /*
             * Por seguridad, no permitimos cambiar
             * el número de semana durante la edición.
             */

            if (
                numeroSemana !== semanaEditando
            ) {

                throw new Error(
                    "No puede cambiar el número de semana durante la edición."
                );

            }


            await semanaService.actualizar(

                semanaEditando,

                {

                    fecha: fecha,

                    numeros: numeros,

                    cantidad: numeros.length

                }

            );


            console.log(
                "Semana actualizada correctamente:",
                semanaEditando
            );


            alert(
                `La semana ${semanaEditando} fue actualizada correctamente.`
            );


            cancelarEdicion();


            await cargarHistorial();


            return;

        }


        /*==========================================================
            MODO CREACIÓN
        ==========================================================*/

        const semana =
            await semanaService.crear(

                numeroSemana,

                fecha,

                numeros

            );


        console.log(
            "Semana guardada correctamente:",
            semana
        );


        alert(
            `La semana ${numeroSemana} fue guardada correctamente.`
        );


        await cargarHistorial();


        limpiarFormulario();

    }

    catch (error) {

        console.error(
            "Error guardando semana:",
            error
        );


        alert(

            "No fue posible guardar la semana.\n\n" +
            error.message

        );

    }

    finally {

        btnGuardar.disabled = false;

    }

}


/*==============================================================
    LIMPIAR FORMULARIO
==============================================================*/

function limpiarFormulario() {

    txtSemana.value = "";

    txtFecha.value = "";


    for (let i = 1; i <= 10; i++) {

        const campo =
            document.getElementById(`n${i}`);


        if (campo) {

            campo.value = "";

        }

    }


    cancelarEdicion();

    txtSemana.focus();

}


/*==============================================================
    CARGAR SEMANA EN FORMULARIO
==============================================================*/

async function editarSemana(numeroSemana) {

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


        /*----------------------------------------------------------
            CARGAR DATOS
        ----------------------------------------------------------*/

        txtSemana.value =
            semana.semana;


        txtFecha.value =
            semana.fecha || "";


        const numeros =
            Array.isArray(semana.numeros)
                ? semana.numeros
                : [];


        for (let i = 1; i <= 10; i++) {

            const campo =
                document.getElementById(`n${i}`);


            if (campo) {

                campo.value =
                    numeros[i - 1] ?? "";

            }

        }


        /*----------------------------------------------------------
            ACTIVAR MODO EDICIÓN
        ----------------------------------------------------------*/

        semanaEditando =
            Number(numeroSemana);


        btnGuardar.innerHTML = `

            <i class="bi bi-pencil-square"></i>

            Actualizar

        `;


        txtSemana.readOnly = true;


        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });


        txtFecha.focus();


    }

    catch (error) {

        console.error(
            "Error cargando semana para editar:",
            error
        );


        alert(

            "No fue posible cargar la semana.\n\n" +
            error.message

        );

    }

}


/*==============================================================
    CANCELAR EDICIÓN
==============================================================*/

function cancelarEdicion() {

    semanaEditando = null;


    txtSemana.readOnly = false;


    btnGuardar.innerHTML = `

        <i class="bi bi-floppy"></i>

        Guardar

    `;

}


/*==============================================================
    CARGAR HISTORIAL
==============================================================*/

async function cargarHistorial() {

    try {

        const semanas =
            await semanaService.obtenerTodas("desc");


        tablaSemanas.innerHTML = "";


        if (
            !semanas ||
            semanas.length === 0
        ) {

            tablaSemanas.innerHTML = `

                <tr>

                    <td
                        colspan="4"
                        class="text-center text-muted"
                    >

                        No hay semanas registradas.

                    </td>

                </tr>

            `;

            return;

        }


        semanas.forEach(semana => {

            const fila =
                document.createElement("tr");


            /*------------------------------------------------------
                NÚMEROS
            ------------------------------------------------------*/

            const numeros =
                Array.isArray(semana.numeros)

                    ? semana.numeros

                        .map(numero =>
                            String(numero)
                                .padStart(2, "0")
                        )

                        .join(" - ")

                    : "";


            /*------------------------------------------------------
                FILA
            ------------------------------------------------------*/

            fila.innerHTML = `

                <td>
                    ${semana.semana}
                </td>

                <td>
                    ${semana.fecha || "-"}
                </td>

                <td>
                    ${numeros}
                </td>

                <td>

                    <div class="d-flex gap-1">

                        <button
                            type="button"
                            class="btn btn-sm btn-primary btn-editar"
                            data-semana="${semana.semana}"
                        >

                            <i class="bi bi-pencil"></i>

                            Editar

                        </button>


                        <button
                            type="button"
                            class="btn btn-sm btn-danger btn-eliminar"
                            data-semana="${semana.semana}"
                        >

                            <i class="bi bi-trash"></i>

                            Eliminar

                        </button>

                    </div>

                </td>

            `;


            tablaSemanas.appendChild(fila);

        });


        /*==========================================================
            EVENTOS
        ==========================================================*/

        document
            .querySelectorAll(".btn-editar")
            .forEach(boton => {

                boton.addEventListener(

                    "click",

                    () => {

                        editarSemana(

                            Number(
                                boton.dataset.semana
                            )

                        );

                    }

                );

            });


        document
            .querySelectorAll(".btn-eliminar")
            .forEach(boton => {

                boton.addEventListener(

                    "click",

                    eliminarSemana

                );

            });

    }

    catch (error) {

        console.error(
            "Error cargando historial:",
            error
        );


        tablaSemanas.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="text-center text-danger"
                >

                    Error cargando historial.

                </td>

            </tr>

        `;

    }

}


/*==============================================================
    ELIMINAR SEMANA
==============================================================*/

async function eliminarSemana(evento) {

    const numeroSemana =
        Number(
            evento.currentTarget
                .dataset.semana
        );


    const confirmar =
        confirm(

            `¿Está seguro de eliminar ` +
            `la semana ${numeroSemana}?`

        );


    if (!confirmar) {

        return;

    }


    try {

        await semanaService.eliminar(
            numeroSemana
        );


        alert(
            `La semana ${numeroSemana} fue eliminada.`
        );


        /*
         * Si estábamos editando esa misma semana,
         * cancelar el modo edición.
         */

        if (
            semanaEditando === numeroSemana
        ) {

            limpiarFormulario();

        }


        await cargarHistorial();

    }

    catch (error) {

        console.error(
            "Error eliminando semana:",
            error
        );


        alert(

            "No fue posible eliminar la semana.\n\n" +
            error.message

        );

    }

}


/*==============================================================
    EVENTOS
==============================================================*/

btnGuardar.addEventListener(

    "click",

    guardarSemana

);


btnLimpiar.addEventListener(

    "click",

    limpiarFormulario

);


/*==============================================================
    INICIALIZAR
==============================================================*/

document.addEventListener(

    "DOMContentLoaded",

    async () => {

        console.log(
            "Página de semanas inicializada."
        );


        await cargarHistorial();

    }

);