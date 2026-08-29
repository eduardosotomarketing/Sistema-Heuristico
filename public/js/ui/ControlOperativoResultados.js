/**
 * SISTEMA HEURÍSTICO EVOLUTIVO
 * UI - Control Operativo de Resultados
 * Versión 1.0.0
 *
 * FASE SEGURA:
 * - Permite cargar 10 números observados.
 * - Valida estructura y contexto operativo.
 * - Previsualiza el resultado.
 * - NO escribe en Firestore.
 * - NO evalúa la predicción.
 * - NO genera la semana siguiente.
 */

export default class ControlOperativoResultados {

    constructor({
        entorno,
        selector = "#control-operativo-resultados",
        panelCiclo = null
    } = {}) {

        this.version = "1.0.0";

        this.entorno =
            entorno;

        this.selector =
            selector;

        this.panelCiclo =
            panelCiclo;

        this.raiz =
            null;

        this.estado =
            null;

        this.numeros =
            [];

        this.validacion =
            null;

    }


    async inicializar() {

        this.raiz =
            document.querySelector(
                this.selector
            );


        if (
            !this.raiz
        ) {

            throw new Error(
                `No se encontró el contenedor ${this.selector}.`
            );

        }


        this.renderCargando();


        try {

            await this.actualizarContexto();

        }

        catch (
            error
        ) {

            console.error(
                "Error inicializando Control Operativo de Resultados:",
                error
            );


            this.renderError(
                error
            );

        }


        return this;

    }


    /* ============================================================
       CONTEXTO OPERATIVO
    ============================================================ */

    async actualizarContexto() {

        this.validarEntorno();


        const historial =
            Array.isArray(
                this.entorno.datosHistorial
            )
                ? this.entorno.datosHistorial
                : [];


        const ultimaSemana =
            historial.length > 0
                ? Math.max(
                    ...historial.map(
                        item =>
                            Number(
                                item.semana
                            ) || 0
                    )
                )
                : 0;


        const semanaObjetivo =
            ultimaSemana + 1;


        const prediccionPendiente =
            await this.entorno
                .prediccionService
                .obtenerPendientePorSemana(
                    semanaObjetivo,
                    {
                        incluirRanking: false
                    }
                );


        const prediccionesSemana =
            await this.entorno
                .prediccionService
                .obtenerPorSemana(
                    semanaObjetivo,
                    {
                        incluirRanking: false
                    }
                );


        const reemplazadas =
            prediccionesSemana.filter(
                item =>
                    item.reemplazada === true ||
                    item.activa === false ||
                    String(
                        item.estado ||
                        ""
                    ).toUpperCase() ===
                        "REEMPLAZADA"
            );


        const yaEvaluada =
            prediccionPendiente
                ?.evaluacion
                ?.realizada === true;


        this.estado = {

            ultimaSemana,

            semanaObjetivo,

            prediccion: {

                existe:
                    !!prediccionPendiente,

                id:
                    prediccionPendiente
                        ?.id ??
                    null,

                estado:
                    prediccionPendiente
                        ?.estado ??
                    null,

                activa:
                    prediccionPendiente
                        ? prediccionPendiente
                            .activa !== false
                        : false,

                reemplazada:
                    prediccionPendiente
                        ?.reemplazada === true,

                evaluada:
                    yaEvaluada,

                fechaObjetivo:
                    prediccionPendiente
                        ?.fechaObjetivo ??
                    null

            },

            reemplazadas:
                reemplazadas.length,

            habilitado:
                !!prediccionPendiente &&
                prediccionPendiente
                    .activa !== false &&
                prediccionPendiente
                    .reemplazada !== true &&
                yaEvaluada !== true

        };


        this.numeros =
            [];

        this.validacion =
            null;


        this.render();

        return this.estado;

    }


    validarEntorno() {

        if (
            !this.entorno
        ) {

            throw new Error(
                "No se recibió entorno operativo."
            );

        }


        if (
            !this.entorno
                .prediccionService
        ) {

            throw new Error(
                "PrediccionService no está disponible."
            );

        }

    }


    /* ============================================================
       PARSEO
    ============================================================ */

    parsearEntrada(
        valor
    ) {

        const texto =
            String(
                valor ??
                ""
            )
                .trim();


        if (
            !texto
        ) {

            return [];

        }


        /*
         * Permite:
         *
         * 1, 2, 3
         * 1 2 3
         * 1-2-3
         * saltos de línea
         * punto y coma
         */

        const partes =
            texto
                .split(
                    /[\s,;|\-]+/
                )
                .map(
                    item =>
                        item.trim()
                )
                .filter(
                    Boolean
                );


        return partes.map(
            item =>
                Number(
                    item
                )
        );

    }


    /* ============================================================
       VALIDACIÓN
    ============================================================ */

    validarResultado(
        valor
    ) {

        const numeros =
            Array.isArray(
                valor
            )
                ? valor
                : this.parsearEntrada(
                    valor
                );


        const errores =
            [];


        const advertencias =
            [];


        /*
         * 1. Deben existir exactamente 10 valores.
         */

        if (
            numeros.length !== 10
        ) {

            errores.push(
                `Se requieren exactamente 10 números. Se detectaron ${numeros.length}.`
            );

        }


        /*
         * 2. Todos deben ser enteros.
         */

        const noEnteros =
            numeros.filter(
                numero =>
                    !Number.isInteger(
                        numero
                    )
            );


        if (
            noEnteros.length > 0
        ) {

            errores.push(
                "Todos los valores deben ser números enteros."
            );

        }


        /*
         * 3. Rango permitido 0–99.
         */

        const fueraDeRango =
            numeros.filter(
                numero =>
                    !Number.isInteger(
                        numero
                    ) ||
                    numero < 0 ||
                    numero > 99
            );


        if (
            fueraDeRango.length > 0
        ) {

            errores.push(
                "Todos los números deben estar dentro del rango 0–99."
            );

        }


        /*
         * 4. Sin duplicados.
         */

        const unicos =
            new Set(
                numeros
            );


        if (
            unicos.size !==
                numeros.length
        ) {

            errores.push(
                "No se permiten números repetidos."
            );

        }


        /*
         * 5. Debe existir predicción pendiente.
         */

        if (
            !this.estado
                ?.prediccion
                ?.existe
        ) {

            errores.push(
                "No existe una predicción pendiente para la semana objetivo."
            );

        }


        /*
         * 6. Debe ser la predicción activa.
         */

        if (
            this.estado
                ?.prediccion
                ?.activa !== true
        ) {

            errores.push(
                "La predicción disponible no está activa."
            );

        }


        /*
         * 7. No puede estar reemplazada.
         */

        if (
            this.estado
                ?.prediccion
                ?.reemplazada === true
        ) {

            errores.push(
                "La predicción activa figura como reemplazada."
            );

        }


        /*
         * 8. No puede estar ya evaluada.
         */

        if (
            this.estado
                ?.prediccion
                ?.evaluada === true
        ) {

            errores.push(
                "La predicción ya fue evaluada anteriormente."
            );

        }


        /*
         * Advertencia temporal:
         *
         * No bloqueamos por fecha porque el dataset actual
         * puede utilizarse en escenarios de simulación/backtesting.
         *
         * Pero la interfaz deja claro que esta fase NO procesa nada.
         */

        if (
            this.estado
                ?.prediccion
                ?.fechaObjetivo
        ) {

            advertencias.push(
                `Fecha objetivo registrada: ${this.estado.prediccion.fechaObjetivo}.`
            );

        }


        const ordenados =
            [...numeros]
                .filter(
                    numero =>
                        Number.isInteger(
                            numero
                        )
                )
                .sort(
                    (
                        a,
                        b
                    ) =>
                        a - b
                );


        this.numeros =
            numeros;


        this.validacion = {

            valida:
                errores.length === 0,

            errores,

            advertencias,

            numeros,

            ordenados,

            semana:
                this.estado
                    ?.semanaObjetivo ??
                null,

            prediccionId:
                this.estado
                    ?.prediccion
                    ?.id ??
                null,

            puedeProcesarse:
                errores.length === 0 &&
                this.estado
                    ?.habilitado === true

        };


        return this.validacion;

    }


    /* ============================================================
       VISTA
    ============================================================ */

    renderCargando() {

        this.raiz.innerHTML = `
            <section class="resultado-operativo">
                <div class="resultado-operativo__estado">
                    Cargando control operativo de resultados…
                </div>
            </section>
        `;

    }


    renderError(
        error
    ) {

        this.raiz.innerHTML = `
            <section class="resultado-operativo">

                <div class="resultado-operativo__error">

                    <strong>
                        No se pudo cargar el control de resultados.
                    </strong>

                    <div>
                        ${
                            this.escapeHTML(
                                error?.message ||
                                error
                            )
                        }
                    </div>

                </div>

            </section>
        `;

    }


    render() {

        const e =
            this.estado;


        const habilitado =
            e.habilitado === true;


        this.raiz.innerHTML = `
            <section class="resultado-operativo">

                <div class="resultado-operativo__header">

                    <div>

                        <div class="resultado-operativo__eyebrow">
                            CONTROL OPERATIVO DE RESULTADOS
                        </div>

                        <h2>
                            Resultado observado · Semana ${e.semanaObjetivo}
                        </h2>

                        <p>
                            Carga y validación previa del resultado.
                            Esta fase no modifica Firestore.
                        </p>

                    </div>

                </div>


                <div class="resultado-operativo__contexto">

                    <div class="resultado-contexto-card">

                        <span>
                            Semana
                        </span>

                        <strong>
                            ${e.semanaObjetivo}
                        </strong>

                    </div>


                    <div class="resultado-contexto-card">

                        <span>
                            Predicción
                        </span>

                        <strong>
                            ${
                                e.prediccion.existe
                                    ? "Disponible"
                                    : "No disponible"
                            }
                        </strong>

                    </div>


                    <div class="resultado-contexto-card">

                        <span>
                            Estado
                        </span>

                        <strong>
                            ${
                                this.escapeHTML(
                                    e.prediccion.estado ??
                                    "—"
                                )
                            }
                        </strong>

                    </div>


                    <div class="resultado-contexto-card">

                        <span>
                            Puede validar
                        </span>

                        <strong>
                            ${
                                habilitado
                                    ? "Sí"
                                    : "No"
                            }
                        </strong>

                    </div>

                </div>


                <div class="resultado-operativo__panel">

                    <label
                        class="resultado-operativo__label"
                        for="resultado-semana-numeros"
                    >
                        Ingresar los 10 números observados
                    </label>


                    <textarea
                        id="resultado-semana-numeros"
                        class="resultado-operativo__textarea"
                        rows="4"
                        placeholder="Ejemplo: 2, 5, 10, 18, 27, 35, 44, 63, 81, 97"
                        ${
                            habilitado
                                ? ""
                                : "disabled"
                        }
                    ></textarea>


                    <div class="resultado-operativo__ayuda">

                        Se aceptan números separados por coma,
                        espacio, guion, punto y coma o salto de línea.

                    </div>


                    <div class="resultado-operativo__acciones">

                        <button
                            type="button"
                            class="resultado-btn resultado-btn--principal"
                            data-resultado-accion="validar"
                            ${
                                habilitado
                                    ? ""
                                    : "disabled"
                            }
                        >
                            Validar resultado
                        </button>


                        <button
                            type="button"
                            class="resultado-btn resultado-btn--secundario"
                            data-resultado-accion="limpiar"
                        >
                            Limpiar
                        </button>


                        <button
                            type="button"
                            class="resultado-btn resultado-btn--secundario"
                            data-resultado-accion="actualizar"
                        >
                            Actualizar contexto
                        </button>

                    </div>

                </div>


                <div
                    class="resultado-operativo__validacion"
                    data-resultado-validacion
                >
                    ${
                        this.renderEstadoInicial()
                    }
                </div>


                <div class="resultado-operativo__seguridad">

                    <strong>
                        Modo seguro activo
                    </strong>

                    <p>
                        Validar un resultado no guarda semanas,
                        no evalúa predicciones,
                        no ejecuta evolución,
                        no aplica optimizaciones y
                        no genera la semana siguiente.
                    </p>

                </div>

            </section>
        `;


        this.vincularEventos();

    }


    renderEstadoInicial() {

        if (
            !this.estado
                ?.habilitado
        ) {

            return `
                <div class="resultado-validacion resultado-validacion--error">

                    <strong>
                        Carga bloqueada
                    </strong>

                    <p>
                        El contexto operativo actual no permite
                        validar un nuevo resultado.
                    </p>

                </div>
            `;

        }


        return `
            <div class="resultado-validacion resultado-validacion--neutral">

                <strong>
                    Pendiente de validación
                </strong>

                <p>
                    Ingresá los 10 números y presioná
                    “Validar resultado”.
                </p>

            </div>
        `;

    }


    renderValidacion(
        validacion
    ) {

        const contenedor =
            this.raiz
                .querySelector(
                    "[data-resultado-validacion]"
                );


        if (
            !contenedor
        ) {

            return;

        }


        if (
            !validacion.valida
        ) {

            contenedor.innerHTML = `
                <div class="resultado-validacion resultado-validacion--error">

                    <strong>
                        Resultado inválido
                    </strong>

                    <ul>
                        ${
                            validacion.errores
                                .map(
                                    error => `
                                        <li>
                                            ${this.escapeHTML(error)}
                                        </li>
                                    `
                                )
                                .join("")
                        }
                    </ul>

                </div>
            `;


            return;

        }


        contenedor.innerHTML = `
            <div class="resultado-validacion resultado-validacion--ok">

                <strong>
                    Resultado válido para previsualización
                </strong>

                <div class="resultado-validacion__meta">

                    <span>
                        Semana:
                        <b>
                            ${validacion.semana}
                        </b>
                    </span>

                    <span>
                        Predicción:
                        <code>
                            ${
                                this.escapeHTML(
                                    validacion.prediccionId
                                )
                            }
                        </code>
                    </span>

                </div>


                <div class="resultado-numeros">

                    ${
                        validacion.ordenados
                            .map(
                                numero => `
                                    <span class="resultado-numero">
                                        ${
                                            String(
                                                numero
                                            ).padStart(
                                                2,
                                                "0"
                                            )
                                        }
                                    </span>
                                `
                            )
                            .join("")
                    }

                </div>


                ${
                    validacion.advertencias.length > 0
                        ? `
                            <div class="resultado-validacion__advertencias">

                                ${
                                    validacion.advertencias
                                        .map(
                                            aviso => `
                                                <div>
                                                    ${this.escapeHTML(aviso)}
                                                </div>
                                            `
                                        )
                                        .join("")
                                }

                            </div>
                        `
                        : ""
                }


                <div class="resultado-validacion__siguiente">

                    <strong>
                        Previsualización aprobada.
                    </strong>

                    <p>
                        Todavía no se realizó ninguna escritura.
                        La siguiente fase será la confirmación
                        explícita del procesamiento.
                    </p>

                </div>

            </div>
        `;

    }


    vincularEventos() {

        const textarea =
            this.raiz.querySelector(
                "#resultado-semana-numeros"
            );


        const botonValidar =
            this.raiz.querySelector(
                '[data-resultado-accion="validar"]'
            );


        const botonLimpiar =
            this.raiz.querySelector(
                '[data-resultado-accion="limpiar"]'
            );


        const botonActualizar =
            this.raiz.querySelector(
                '[data-resultado-accion="actualizar"]'
            );


        botonValidar?.addEventListener(
            "click",
            () => {

                const validacion =
                    this.validarResultado(
                        textarea?.value
                    );


                this.renderValidacion(
                    validacion
                );

            }
        );


        botonLimpiar?.addEventListener(
            "click",
            () => {

                if (
                    textarea
                ) {

                    textarea.value =
                        "";

                }


                this.numeros =
                    [];

                this.validacion =
                    null;


                const contenedor =
                    this.raiz.querySelector(
                        "[data-resultado-validacion]"
                    );


                if (
                    contenedor
                ) {

                    contenedor.innerHTML =
                        this.renderEstadoInicial();

                }

            }
        );


        botonActualizar?.addEventListener(
            "click",
            async () => {

                botonActualizar.disabled =
                    true;


                try {

                    await this.actualizarContexto();

                }

                finally {

                    const nuevoBoton =
                        this.raiz.querySelector(
                            '[data-resultado-accion="actualizar"]'
                        );


                    if (
                        nuevoBoton
                    ) {

                        nuevoBoton.disabled =
                            false;

                    }

                }

            }
        );

    }


    escapeHTML(
        valor
    ) {

        return String(
            valor ??
            ""
        )
            .replaceAll(
                "&",
                "&amp;"
            )
            .replaceAll(
                "<",
                "&lt;"
            )
            .replaceAll(
                ">",
                "&gt;"
            )
            .replaceAll(
                '"',
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );

    }

}
