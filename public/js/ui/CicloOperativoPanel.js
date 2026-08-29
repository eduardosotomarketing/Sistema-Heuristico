/**
 * SISTEMA HEURÍSTICO EVOLUTIVO
 * UI - Panel de Ciclo Operativo
 * Versión 1.1.0
 *
 * Novedades:
 * - TOP 10 de la predicción activa.
 * - Trazabilidad de configuración/pesos.
 * - Indicador visual del ciclo actual.
 * - Mantiene modo SOLO LECTURA.
 */

export default class CicloOperativoPanel {

    constructor({
        entorno,
        selector = "#panel-ciclo-operativo"
    } = {}) {

        this.version = "1.1.1";
        this.entorno = entorno;
        this.selector = selector;
        this.raiz = null;
        this.estado = null;

    }


    async inicializar() {

        this.raiz =
            document.querySelector(
                this.selector
            );

        if (!this.raiz) {

            throw new Error(
                `No se encontró el contenedor ${this.selector}.`
            );

        }

        this.renderCargando();

        try {

            await this.actualizar();

        } catch (error) {

            console.error(
                "Error inicializando Panel de Ciclo Operativo:",
                error
            );

            this.renderError(
                error
            );

        }

        return this;

    }


    async actualizar() {

        this.validarEntorno();

        const historial =
            Array.isArray(
                this.entorno.datosHistorial
            )
                ? this.entorno.datosHistorial
                : [];

        const totalSemanas =
            historial.length;

        const ultimaSemana =
            totalSemanas > 0
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


        /*
         * Pedimos ranking completo porque ahora mostraremos TOP 10.
         */

        const prediccionPendiente =
            await this.entorno
                .prediccionService
                .obtenerPendientePorSemana(
                    semanaObjetivo,
                    {
                        incluirRanking: true
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


        const evaluaciones =
            Array.isArray(
                this.entorno.evaluacionesPersistidas
            )
                ? this.entorno.evaluacionesPersistidas
                : [];


        const sincronizacion =
            typeof this.entorno
                .verificarSincronizacionPesos ===
                "function"

                ? this.entorno
                    .verificarSincronizacionPesos()

                : {
                    sincronizado:
                        false
                };


        const sumaPesos =
            this.entorno
                .motorManager
                ?.sumarPesos?.() ??
            null;


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


        const rankingCompleto =
            Array.isArray(
                prediccionPendiente
                    ?.rankingCompleto
            )
                ? prediccionPendiente.rankingCompleto
                : [];


        const top10 =
            rankingCompleto
                .slice(0, 10)
                .map(
                    (item, index) => ({
                        orden:
                            Number(
                                item.orden
                            ) ||
                            index + 1,

                        posicion:
                            Number(
                                item.posicion
                            ) ||
                            index + 1,

                        numero:
                            item.numero,

                        score:
                            this.obtenerNumero(
                                item.score ??
                                item.scoreTotal ??
                                item.puntaje
                            ),

                        confianza:
                            this.obtenerNumero(
                                item.confianza
                            ),

                        empate:
                            item.empate === true
                    })
                );


        /*
         * La trazabilidad puede estar en distintas ubicaciones,
         * según la versión de la predicción.
         */

        let trazabilidad =
            prediccionPendiente
                ?.trazabilidad ??
            prediccionPendiente
                ?.metadata
                ?.trazabilidad ??
            null;


        /*
         * Si pruebas.js expone el helper específico,
         * lo usamos como fuente preferida.
         */

        if (
            prediccionPendiente &&
            typeof this.entorno
                .obtenerTrazabilidadPrediccion ===
                "function"
        ) {

            try {

                const trazabilidadResuelta =
                    await this.entorno
                        .obtenerTrazabilidadPrediccion(
                            prediccionPendiente
                        );


                if (
                    trazabilidadResuelta
                ) {

                    trazabilidad =
                        trazabilidadResuelta;

                }

            } catch (error) {

                console.warn(
                    "No se pudo resolver trazabilidad mediante helper:",
                    error
                );

            }

        }


        const pesosSnapshot =
            trazabilidad
                ?.pesos ??
            trazabilidad
                ?.pesosSnapshot ??
            trazabilidad
                ?.configuracion
                ?.pesos ??
            null;


        const configuracionId =
            trazabilidad
                ?.configuracionId ??
            trazabilidad
                ?.idConfiguracion ??
            trazabilidad
                ?.configuracion
                ?.id ??
            null;


        const configuracionVersion =
            trazabilidad
                ?.configuracionVersion ??
            trazabilidad
                ?.versionConfiguracion ??
            trazabilidad
                ?.configuracion
                ?.version ??
            null;


        const origenPesos =
            trazabilidad
                ?.origenPesos ??
            trazabilidad
                ?.origen ??
            trazabilidad
                ?.origenConfiguracion ??
            trazabilidad
                ?.configuracion
                ?.origen ??
            null;


        const optimizacionId =
            trazabilidad
                ?.optimizacionId ??
            trazabilidad
                ?.idOptimizacion ??
            null;


        const evolucionId =
            trazabilidad
                ?.evolucionId ??
            trazabilidad
                ?.idEvolucion ??
            null;


        const sumaTrazabilidad =
            this.obtenerNumero(
                trazabilidad
                    ?.sumaPesos ??
                trazabilidad
                    ?.suma ??
                null
            );


        let proximaAccion =
            "SIN_PREDICCION";

        let mensajeAccion =
            "Generar la predicción de la próxima semana.";


        if (
            prediccionPendiente
        ) {

            proximaAccion =
                "ESPERAR_RESULTADO";

            mensajeAccion =
                `La semana ${semanaObjetivo} tiene una predicción activa. ` +
                "El siguiente paso es cargar el resultado observado cuando esté disponible.";

        }


        if (
            prediccionPendiente
                ?.evaluacion
                ?.realizada === true
        ) {

            proximaAccion =
                "REVISAR_CICLO";

            mensajeAccion =
                "La predicción figura evaluada. Corresponde revisar la generación de la siguiente semana.";

        }


        this.estado = {

            semanaActual:
                ultimaSemana,

            semanaObjetivo,

            totalSemanas,

            totalEvaluaciones:
                evaluaciones.length,

            ciclo: {

                desde:
                    ultimaSemana,

                hacia:
                    semanaObjetivo,

                historialCompleto:
                    totalSemanas === ultimaSemana,

                prediccionPreparada:
                    !!prediccionPendiente,

                resultadoDisponible:
                    prediccionPendiente
                        ?.evaluacion
                        ?.realizada === true

            },

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
                    (
                        prediccionPendiente
                            ? "PENDIENTE"
                            : "SIN_PREDICCION"
                    ),

                activa:
                    prediccionPendiente
                        ? prediccionPendiente
                            .activa !== false
                        : false,

                evaluada:
                    prediccionPendiente
                        ?.evaluacion
                        ?.realizada === true,

                fechaObjetivo:
                    prediccionPendiente
                        ?.fechaObjetivo ??
                    null,

                versionServicio:
                    prediccionPendiente
                        ?.persistencia
                        ?.versionServicio ??
                    null,

                totalRanking:
                    rankingCompleto.length,

                top10

            },

            historicasReemplazadas:
                reemplazadas.length,

            pesos: {

                suma:
                    sumaPesos,

                sincronizados:
                    sincronizacion
                        ?.sincronizado === true

            },

            trazabilidad: {

                disponible:
                    !!trazabilidad,

                schema:
                    trazabilidad
                        ?.esquema ??
                    trazabilidad
                        ?.schema ??
                    trazabilidad
                        ?.schemaVersion ??
                    null,

                configuracionId,

                configuracionVersion,

                origen:
                    origenPesos,

                optimizacionId,

                evolucionId,

                sumaPesos:
                    sumaTrazabilidad,

                versionPruebas:
                    trazabilidad
                        ?.versionPruebas ??
                    null,

                sincronizadoAlGenerar:
                    trazabilidad
                        ?.sincronizadoAlGenerar === true,

                sumaManagerAlGenerar:
                    this.obtenerNumero(
                        trazabilidad
                            ?.sumaManagerAlGenerar
                    ),

                capturadaEn:
                    trazabilidad
                        ?.capturadaEn ??
                    null,

                pesosSnapshot

            },

            proximaAccion,
            mensajeAccion

        };


        this.render();

        return this.estado;

    }


    validarEntorno() {

        if (
            !this.entorno
        ) {

            throw new Error(
                "No se recibió entorno para el panel."
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


    obtenerNumero(
        valor
    ) {

        const numero =
            Number(
                valor
            );

        return Number.isFinite(
            numero
        )
            ? numero
            : null;

    }


    formatearNumero(
        valor,
        decimales = 4
    ) {

        const numero =
            this.obtenerNumero(
                valor
            );

        if (
            numero === null
        ) {

            return "—";

        }

        return numero.toLocaleString(
            "es-AR",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits:
                    decimales
            }
        );

    }


    escapeHTML(
        valor
    ) {

        return String(
            valor ?? ""
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


    badge(
        texto,
        tipo = "neutral"
    ) {

        return `
            <span class="ciclo-badge ciclo-badge--${tipo}">
                ${this.escapeHTML(texto)}
            </span>
        `;

    }


    renderCargando() {

        this.raiz.innerHTML = `
            <section class="ciclo-panel">
                <div class="ciclo-panel__cargando">
                    Cargando estado operativo…
                </div>
            </section>
        `;

    }


    renderError(
        error
    ) {

        this.raiz.innerHTML = `
            <section class="ciclo-panel">
                <div class="ciclo-panel__error">
                    <strong>
                        No se pudo cargar el estado operativo.
                    </strong>
                    <div>
                        ${this.escapeHTML(
                            error?.message ||
                            error
                        )}
                    </div>
                </div>
            </section>
        `;

    }


    renderTop10() {

        const top10 =
            this.estado
                ?.prediccion
                ?.top10 ??
            [];


        if (
            top10.length === 0
        ) {

            return `
                <div class="ciclo-vacio">
                    No hay ranking disponible.
                </div>
            `;

        }


        return `
            <div class="ciclo-ranking">

                <div class="ciclo-ranking__header">

                    <span>Pos.</span>
                    <span>Número</span>
                    <span>Score</span>
                    <span>Confianza</span>

                </div>

                ${
                    top10.map(
                        item => `
                            <div class="ciclo-ranking__fila">

                                <span>
                                    #${item.posicion}
                                </span>

                                <strong class="ciclo-ranking__numero">
                                    ${this.escapeHTML(
                                        item.numero
                                    )}
                                </strong>

                                <span>
                                    ${this.formatearNumero(
                                        item.score,
                                        4
                                    )}
                                </span>

                                <span>
                                    ${
                                        this.formatearNumero(
                                            item.confianza,
                                            2
                                        )
                                    }%
                                </span>

                            </div>
                        `
                    ).join("")
                }

            </div>
        `;

    }


    renderPesosTrazabilidad() {

        const pesos =
            this.estado
                ?.trazabilidad
                ?.pesosSnapshot;


        if (
            !pesos ||
            typeof pesos !==
                "object"
        ) {

            return `
                <div class="ciclo-vacio">
                    Snapshot detallado de pesos no disponible.
                </div>
            `;

        }


        const entradas =
            Object.entries(
                pesos
            );


        if (
            entradas.length === 0
        ) {

            return `
                <div class="ciclo-vacio">
                    Snapshot detallado de pesos vacío.
                </div>
            `;

        }


        return `
            <div class="ciclo-pesos-lista">

                ${
                    entradas.map(
                        ([motor, peso]) => `
                            <div class="ciclo-peso">

                                <span>
                                    ${this.escapeHTML(
                                        motor
                                    )}
                                </span>

                                <strong>
                                    ${this.formatearNumero(
                                        peso,
                                        4
                                    )}
                                </strong>

                            </div>
                        `
                    ).join("")
                }

            </div>
        `;

    }


    render() {

        const e =
            this.estado;


        const tipoPrediccion =
            !e.prediccion.existe
                ? "danger"
                : e.prediccion.evaluada
                    ? "success"
                    : "warning";


        const tipoPesos =
            e.pesos.sincronizados
                ? "success"
                : "danger";


        const accionTipo =
            e.proximaAccion ===
                "ESPERAR_RESULTADO"
                ? "warning"
                : e.proximaAccion ===
                    "SIN_PREDICCION"
                    ? "danger"
                    : "neutral";


        this.raiz.innerHTML = `
            <section class="ciclo-panel">

                <div class="ciclo-panel__header">

                    <div>

                        <div class="ciclo-panel__eyebrow">
                            CONTROL OPERATIVO
                        </div>

                        <h2>
                            Ciclo heurístico
                        </h2>

                        <p>
                            Estado consolidado del historial,
                            la predicción activa, la trazabilidad
                            y la preparación del próximo ciclo.
                        </p>

                    </div>


                    <button
                        type="button"
                        class="ciclo-panel__refresh"
                        data-ciclo-accion="actualizar"
                    >
                        Actualizar
                    </button>

                </div>


                <!-- CICLO VISUAL -->

                <div class="ciclo-flujo">

                    <div class="ciclo-flujo__paso ciclo-flujo__paso--ok">

                        <div class="ciclo-flujo__numero">
                            ${e.ciclo.desde}
                        </div>

                        <div>
                            Semana cargada
                        </div>

                    </div>


                    <div class="ciclo-flujo__flecha">
                        →
                    </div>


                    <div class="ciclo-flujo__paso ${
                        e.ciclo.prediccionPreparada
                            ? "ciclo-flujo__paso--warning"
                            : ""
                    }">

                        <div class="ciclo-flujo__numero">
                            ${e.ciclo.hacia}
                        </div>

                        <div>
                            Predicción activa
                        </div>

                    </div>


                    <div class="ciclo-flujo__flecha">
                        →
                    </div>


                    <div class="ciclo-flujo__paso">

                        <div class="ciclo-flujo__numero">
                            ?
                        </div>

                        <div>
                            Resultado pendiente
                        </div>

                    </div>

                </div>


                <!-- RESUMEN -->

                <div class="ciclo-grid ciclo-grid--principal">

                    <article class="ciclo-card">

                        <div class="ciclo-card__label">
                            Última semana cargada
                        </div>

                        <div class="ciclo-card__valor">
                            ${e.semanaActual}
                        </div>

                        <div class="ciclo-card__detalle">
                            ${e.totalSemanas} semanas en historial
                        </div>

                    </article>


                    <article class="ciclo-card">

                        <div class="ciclo-card__label">
                            Semana objetivo
                        </div>

                        <div class="ciclo-card__valor">
                            ${e.semanaObjetivo}
                        </div>

                        <div class="ciclo-card__detalle">
                            ${
                                e.prediccion.fechaObjetivo
                                    ? this.escapeHTML(
                                        e.prediccion.fechaObjetivo
                                    )
                                    : "Sin fecha registrada"
                            }
                        </div>

                    </article>


                    <article class="ciclo-card">

                        <div class="ciclo-card__label">
                            Evaluaciones
                        </div>

                        <div class="ciclo-card__valor">
                            ${e.totalEvaluaciones}
                        </div>

                        <div class="ciclo-card__detalle">
                            Evaluaciones persistidas
                        </div>

                    </article>


                    <article class="ciclo-card">

                        <div class="ciclo-card__label">
                            Pesos activos
                        </div>

                        <div class="ciclo-card__valor">
                            ${
                                e.pesos.suma ??
                                "—"
                            }
                        </div>

                        <div class="ciclo-card__detalle">
                            ${
                                e.pesos.sincronizados
                                    ? this.badge(
                                        "SINCRONIZADOS",
                                        tipoPesos
                                    )
                                    : this.badge(
                                        "REVISAR",
                                        tipoPesos
                                    )
                            }
                        </div>

                    </article>

                </div>


                <!-- DETALLE OPERATIVO -->

                <div class="ciclo-grid ciclo-grid--detalle">

                    <article class="ciclo-bloque">

                        <div class="ciclo-bloque__titulo">
                            Predicción activa
                        </div>

                        <div class="ciclo-bloque__fila">

                            <span>Estado</span>

                            ${
                                this.badge(
                                    e.prediccion.estado,
                                    tipoPrediccion
                                )
                            }

                        </div>


                        <div class="ciclo-bloque__fila">

                            <span>ID</span>

                            <code>
                                ${
                                    this.escapeHTML(
                                        e.prediccion.id ??
                                        "Sin predicción"
                                    )
                                }
                            </code>

                        </div>


                        <div class="ciclo-bloque__fila">

                            <span>Activa</span>

                            <strong>
                                ${
                                    e.prediccion.activa
                                        ? "Sí"
                                        : "No"
                                }
                            </strong>

                        </div>


                        <div class="ciclo-bloque__fila">

                            <span>Evaluada</span>

                            <strong>
                                ${
                                    e.prediccion.evaluada
                                        ? "Sí"
                                        : "No"
                                }
                            </strong>

                        </div>


                        <div class="ciclo-bloque__fila">

                            <span>Ranking</span>

                            <strong>
                                ${e.prediccion.totalRanking}
                            </strong>

                        </div>


                        <div class="ciclo-bloque__fila">

                            <span>Servicio</span>

                            <strong>
                                ${
                                    this.escapeHTML(
                                        e.prediccion.versionServicio ??
                                        "—"
                                    )
                                }
                            </strong>

                        </div>

                    </article>


                    <article class="ciclo-bloque">

                        <div class="ciclo-bloque__titulo">
                            Control histórico
                        </div>

                        <div class="ciclo-bloque__fila">

                            <span>Semanas cargadas</span>

                            <strong>
                                ${e.totalSemanas}
                            </strong>

                        </div>


                        <div class="ciclo-bloque__fila">

                            <span>Evaluaciones</span>

                            <strong>
                                ${e.totalEvaluaciones}
                            </strong>

                        </div>


                        <div class="ciclo-bloque__fila">

                            <span>
                                Predicciones reemplazadas
                            </span>

                            <strong>
                                ${e.historicasReemplazadas}
                            </strong>

                        </div>


                        <div class="ciclo-bloque__fila">

                            <span>
                                Pesos sincronizados
                            </span>

                            <strong>
                                ${
                                    e.pesos.sincronizados
                                        ? "Sí"
                                        : "No"
                                }
                            </strong>

                        </div>

                    </article>

                </div>


                <!-- TOP 10 -->

                <article class="ciclo-bloque ciclo-bloque--separado">

                    <div class="ciclo-bloque__titulo">
                        TOP 10 · Semana ${e.semanaObjetivo}
                    </div>

                    <div class="ciclo-bloque__subtitulo">
                        Ranking de la predicción activa.
                        Solo lectura.
                    </div>

                    ${this.renderTop10()}

                </article>


                <!-- TRAZABILIDAD -->

                <article class="ciclo-bloque ciclo-bloque--separado">

                    <div class="ciclo-bloque__titulo">
                        Trazabilidad de la predicción
                    </div>

                    <div class="ciclo-grid ciclo-grid--detalle">

                        <div>

                            <div class="ciclo-bloque__fila">

                                <span>Disponible</span>

                                <strong>
                                    ${
                                        e.trazabilidad.disponible
                                            ? "Sí"
                                            : "No"
                                    }
                                </strong>

                            </div>


                            <div class="ciclo-bloque__fila">

                                <span>Configuración</span>

                                <code>
                                    ${
                                        this.escapeHTML(
                                            e.trazabilidad.configuracionId ??
                                            "—"
                                        )
                                    }
                                </code>

                            </div>


                            <div class="ciclo-bloque__fila">

                                <span>Versión</span>

                                <strong>
                                    ${
                                        this.escapeHTML(
                                            e.trazabilidad.configuracionVersion ??
                                            "—"
                                        )
                                    }
                                </strong>

                            </div>


                            <div class="ciclo-bloque__fila">

                                <span>Origen</span>

                                <strong>
                                    ${
                                        this.escapeHTML(
                                            e.trazabilidad.origen ??
                                            "—"
                                        )
                                    }
                                </strong>

                            </div>


                            <div class="ciclo-bloque__fila">

                                <span>Esquema</span>

                                <strong>
                                    ${
                                        this.escapeHTML(
                                            e.trazabilidad.schema ??
                                            "—"
                                        )
                                    }
                                </strong>

                            </div>


                            <div class="ciclo-bloque__fila">

                                <span>pruebas.js</span>

                                <strong>
                                    ${
                                        this.escapeHTML(
                                            e.trazabilidad.versionPruebas ??
                                            "—"
                                        )
                                    }
                                </strong>

                            </div>

                        </div>


                        <div>

                            <div class="ciclo-bloque__fila">

                                <span>Optimización</span>

                                <code>
                                    ${
                                        this.escapeHTML(
                                            e.trazabilidad.optimizacionId ??
                                            "—"
                                        )
                                    }
                                </code>

                            </div>


                            <div class="ciclo-bloque__fila">

                                <span>Evolución</span>

                                <code>
                                    ${
                                        this.escapeHTML(
                                            e.trazabilidad.evolucionId ??
                                            "—"
                                        )
                                    }
                                </code>

                            </div>


                            <div class="ciclo-bloque__fila">

                                <span>Suma trazada</span>

                                <strong>
                                    ${
                                        this.formatearNumero(
                                            e.trazabilidad.sumaPesos,
                                            4
                                        )
                                    }
                                </strong>

                            </div>


                            <div class="ciclo-bloque__fila">

                                <span>Manager al generar</span>

                                <strong>
                                    ${
                                        this.formatearNumero(
                                            e.trazabilidad.sumaManagerAlGenerar,
                                            4
                                        )
                                    }
                                </strong>

                            </div>


                            <div class="ciclo-bloque__fila">

                                <span>Sincronizado al generar</span>

                                <strong>
                                    ${
                                        e.trazabilidad.sincronizadoAlGenerar
                                            ? "Sí"
                                            : "No"
                                    }
                                </strong>

                            </div>

                        </div>

                    </div>


                    <div class="ciclo-bloque__subtitulo ciclo-bloque__subtitulo--pesos">
                        Snapshot de pesos usado para generar esta predicción
                    </div>

                    ${this.renderPesosTrazabilidad()}

                </article>


                <!-- PRÓXIMA ACCIÓN -->

                <article class="ciclo-accion ciclo-accion--${accionTipo}">

                    <div class="ciclo-accion__etiqueta">
                        PRÓXIMA ACCIÓN
                    </div>

                    <div class="ciclo-accion__titulo">
                        ${
                            e.proximaAccion ===
                                "ESPERAR_RESULTADO"
                                ? `Esperar resultado de semana ${e.semanaObjetivo}`
                                : e.proximaAccion ===
                                    "SIN_PREDICCION"
                                    ? `Generar semana ${e.semanaObjetivo}`
                                    : "Revisar continuidad del ciclo"
                        }
                    </div>

                    <p>
                        ${
                            this.escapeHTML(
                                e.mensajeAccion
                            )
                        }
                    </p>

                </article>

            </section>
        `;


        const boton =
            this.raiz.querySelector(
                '[data-ciclo-accion="actualizar"]'
            );


        boton?.addEventListener(
            "click",
            async () => {

                boton.disabled =
                    true;


                try {

                    await this.actualizar();

                } finally {

                    const nuevoBoton =
                        this.raiz.querySelector(
                            '[data-ciclo-accion="actualizar"]'
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

}
