/**
 * SISTEMA HEURÍSTICO EVOLUTIVO
 * UI - Control Operativo de Resultados
 * Versión 1.0.0
 *
 * FASE SEGURA:
 * - Permite cargar 10 números observados.
 * - Valida estructura y contexto operativo.
 * - Previsualiza el resultado.
 * - Validación y preflight: NO escriben en Firestore.
 * - Preparación final: NO escribe en Firestore.
 * - Procesamiento real: solo después de doble confirmación.
 * - Revalida el contexto justo antes de escribir.
 */

export default class ControlOperativoResultados {

    constructor({
        entorno,
        selector = "#control-operativo-resultados",
        panelCiclo = null
    } = {}) {

        this.version = "1.5.0";

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

        this.preflight =
            null;

        this.preparacionReal =
            null;

        this.procesandoReal =
            false;

        /*
         * Modo operativo:
         * - OBSERVADO: flujo real protegido.
         * - SIMULACION: escenario aislado en memoria, 0 escrituras.
         */
        this.modoOperativo =
            "OBSERVADO";

        this.escenarioSimulacion =
            null;

        this.simulacionEjecutando =
            false;

        /*
         * Protección temporal:
         * un resultado OBSERVADO no puede procesarse antes
         * de la fecha objetivo registrada.
         */
        this.bloquearFechaFutura =
            true;

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

        this.preflight =
            null;

        this.preparacionReal =
            null;

        this.procesandoReal =
            false;

        this.escenarioSimulacion =
            null;

        this.simulacionEjecutando =
            false;


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
       PREFLIGHT DE PROCESAMIENTO
       SOLO LECTURA - NO ESCRIBE EN FIRESTORE
    ============================================================ */

    async ejecutarPreflight() {

        if (
            !this.validacion
                ?.valida
        ) {

            throw new Error(
                "Primero debe existir un resultado válido."
            );

        }


        const semana =
            Number(
                this.validacion
                    .semana
            );


        const prediccionEsperada =
            this.validacion
                .prediccionId;


        /*
         * 1. Releer la predicción pendiente desde Firestore.
         */

        const prediccionActual =
            await this.entorno
                .prediccionService
                .obtenerPendientePorSemana(
                    semana,
                    {
                        incluirRanking: false
                    }
                );


        /*
         * 2. Buscar todas las predicciones de la semana.
         */

        const prediccionesSemana =
            await this.entorno
                .prediccionService
                .obtenerPorSemana(
                    semana,
                    {
                        incluirRanking: false
                    }
                );


        /*
         * 3. Verificar que la semana todavía no exista
         *    en la colección semanas.
         */

        let semanaYaGuardada =
            false;


        if (
            this.entorno
                .semanaService &&
            typeof this.entorno
                .semanaService
                .existe ===
                "function"
        ) {

            semanaYaGuardada =
                await this.entorno
                    .semanaService
                    .existe(
                        semana
                    );

        }

        else {

            const historial =
                Array.isArray(
                    this.entorno
                        .datosHistorial
                )
                    ? this.entorno
                        .datosHistorial
                    : [];


            semanaYaGuardada =
                historial.some(
                    item =>
                        Number(
                            item.semana
                        ) === semana
                );

        }


        /*
         * 4. Verificar evaluaciones ya existentes.
         */

        let evaluaciones =
            [];


        /*
         * Preferimos una lectura fresca del servicio.
         * Si no estuviera disponible, usamos la cache del entorno.
         */
        if (
            this.entorno
                .evaluacionService &&
            typeof this.entorno
                .evaluacionService
                .obtenerTodas ===
                "function"
        ) {

            try {

                evaluaciones =
                    await this.entorno
                        .evaluacionService
                        .obtenerTodas();

            }

            catch (
                error
            ) {

                console.warn(
                    "Preflight: no se pudo releer EvaluacionService; se usará cache.",
                    error
                );

            }

        }


        if (
            !Array.isArray(
                evaluaciones
            ) ||
            evaluaciones.length === 0
        ) {

            evaluaciones =
                Array.isArray(
                    this.entorno
                        .evaluacionesPersistidas
                )
                    ? this.entorno
                        .evaluacionesPersistidas
                    : [];

        }


        const evaluacionesSemana =
            evaluaciones.filter(
                item =>
                    Number(
                        item.semana ??
                        item.semanaEvaluada ??
                        item.semanaObjetivo
                    ) === semana ||
                    String(
                        item.prediccionId ??
                        item.idPrediccion ??
                        ""
                    ) === String(
                        prediccionEsperada
                    )
            );


        /*
         * 5. Verificar semana siguiente.
         */

        const semanaSiguiente =
            semana + 1;


        const prediccionesSiguiente =
            await this.entorno
                .prediccionService
                .obtenerPorSemana(
                    semanaSiguiente,
                    {
                        incluirRanking: false
                    }
                );


        const pendienteSiguiente =
            await this.entorno
                .prediccionService
                .obtenerPendientePorSemana(
                    semanaSiguiente,
                    {
                        incluirRanking: false
                    }
                );


        /*
         * 6. Sincronización de pesos.
         */

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


        /*
         * 7. Reglas duras del preflight.
         */

        const controles = [];


        controles.push({

            clave:
                "RESULTADO_VALIDO",

            etiqueta:
                "Resultado estructuralmente válido",

            ok:
                this.validacion
                    .valida === true,

            detalle:
                "10 números únicos, enteros y dentro del rango 0–99."

        });


        controles.push({

            clave:
                "PREDICCION_EXISTE",

            etiqueta:
                "Predicción pendiente disponible",

            ok:
                !!prediccionActual,

            detalle:
                prediccionActual
                    ?.id ??
                "No encontrada"

        });


        controles.push({

            clave:
                "MISMA_PREDICCION",

            etiqueta:
                "La predicción no cambió desde la validación",

            ok:
                !!prediccionActual &&
                String(
                    prediccionActual.id
                ) ===
                String(
                    prediccionEsperada
                ),

            detalle:
                prediccionActual
                    ? `Actual: ${prediccionActual.id}`
                    : "Sin predicción pendiente"

        });


        controles.push({

            clave:
                "PREDICCION_ACTIVA",

            etiqueta:
                "Predicción activa",

            ok:
                prediccionActual
                    ?.activa !== false,

            detalle:
                prediccionActual
                    ?.activa === false
                    ? "La predicción fue desactivada."
                    : "Activa"

        });


        controles.push({

            clave:
                "NO_REEMPLAZADA",

            etiqueta:
                "Predicción no reemplazada",

            ok:
                prediccionActual
                    ?.reemplazada !== true &&
                String(
                    prediccionActual
                        ?.estado ??
                    ""
                ).toUpperCase() !==
                    "REEMPLAZADA",

            detalle:
                prediccionActual
                    ?.reemplazada === true
                    ? "Figura como reemplazada."
                    : "Vigente"

        });


        controles.push({

            clave:
                "NO_EVALUADA",

            etiqueta:
                "Predicción todavía no evaluada",

            ok:
                prediccionActual
                    ?.evaluacion
                    ?.realizada !== true &&
                evaluacionesSemana.length === 0,

            detalle:
                evaluacionesSemana.length > 0
                    ? `Se detectaron ${evaluacionesSemana.length} evaluación(es) relacionadas.`
                    : "Sin evaluación previa detectada"

        });


        controles.push({

            clave:
                "SEMANA_NO_GUARDADA",

            etiqueta:
                `Semana ${semana} todavía no guardada en historial`,

            ok:
                semanaYaGuardada !== true,

            detalle:
                semanaYaGuardada
                    ? "La semana ya existe en la colección semanas."
                    : "Disponible para incorporación futura"

        });


        controles.push({

            clave:
                "SEMANA_SIGUIENTE_LIBRE",

            etiqueta:
                `Semana ${semanaSiguiente} todavía no generada`,

            ok:
                prediccionesSiguiente.length === 0 &&
                !pendienteSiguiente,

            detalle:
                prediccionesSiguiente.length > 0
                    ? `Existen ${prediccionesSiguiente.length} predicción(es).`
                    : "Sin predicciones existentes"

        });


        controles.push({

            clave:
                "PESOS_SINCRONIZADOS",

            etiqueta:
                "Pesos del MotorManager sincronizados",

            ok:
                sincronizacion
                    ?.sincronizado === true,

            detalle:
                `Suma actual: ${
                    sumaPesos ?? "—"
                }`

        });


        const bloqueantes =
            controles.filter(
                control =>
                    control.ok !== true
            );


        /*
         * Plan teórico: lo que haría el procesamiento real.
         * NO se ejecuta nada de esta lista.
         */

        const plan = [

            {
                orden: 1,
                accion:
                    "REVALIDAR_PREDICCION",
                descripcion:
                    `Confirmar nuevamente la predicción ${prediccionEsperada}.`
            },

            {
                orden: 2,
                accion:
                    "GUARDAR_SEMANA",
                descripcion:
                    `Guardar semana ${semana} con los 10 números validados.`
            },

            {
                orden: 3,
                accion:
                    "EVALUAR_PREDICCION",
                descripcion:
                    `Evaluar la predicción activa de la semana ${semana}.`
            },

            {
                orden: 4,
                accion:
                    "ACTUALIZAR_EVOLUCION",
                descripcion:
                    "Incorporar la nueva evaluación al ciclo evolutivo."
            },

            {
                orden: 5,
                accion:
                    "REVISAR_OPTIMIZACION",
                descripcion:
                    "Ejecutar las reglas de optimización sin aplicar cambios fuera de sus condiciones."
            },

            {
                orden: 6,
                accion:
                    "GENERAR_SIGUIENTE",
                descripcion:
                    `Generar la predicción de la semana ${semanaSiguiente} solamente si todo lo anterior finaliza correctamente.`
            }

        ];


        this.preflight = {

            ejecutado:
                true,

            modo:
                "SOLO_LECTURA",

            escrituraFirestore:
                false,

            semana,

            semanaSiguiente,

            prediccionEsperada,

            prediccionActualId:
                prediccionActual
                    ?.id ??
                null,

            fechaObjetivo:
                prediccionActual
                    ?.fechaObjetivo ??
                this.estado
                    ?.prediccion
                    ?.fechaObjetivo ??
                null,

            numeros:
                [
                    ...this.validacion
                        .numeros
                ],

            numerosOrdenados:
                [
                    ...this.validacion
                        .ordenados
                ],

            controles,

            bloqueantes,

            listoParaProcesar:
                bloqueantes.length === 0,

            diagnostico: {

                totalPrediccionesSemana:
                    prediccionesSemana.length,

                evaluacionesRelacionadas:
                    evaluacionesSemana.length,

                semanaYaGuardada,

                prediccionesSemanaSiguiente:
                    prediccionesSiguiente.length,

                pendienteSemanaSiguiente:
                    !!pendienteSiguiente,

                pesosSincronizados:
                    sincronizacion
                        ?.sincronizado === true,

                sumaPesos

            },

            plan

        };


        console.log(
            "PREFLIGHT CONTROL OPERATIVO:",
            this.preflight
        );


        this.renderPreflight(
            this.preflight
        );


        return this.preflight;

    }


    /* ============================================================
       MODO OPERATIVO
    ============================================================ */

    cambiarModoOperativo(
        modo
    ) {

        const normalizado =
            String(
                modo ??
                ""
            )
                .trim()
                .toUpperCase();


        if (
            ![
                "OBSERVADO",
                "SIMULACION"
            ].includes(
                normalizado
            )
        ) {

            throw new Error(
                `Modo operativo no válido: ${modo}`
            );

        }


        this.modoOperativo =
            normalizado;


        /*
         * Cambiar de modo invalida cualquier validación/preflight
         * o preparación previa. Así evitamos reutilizar un resultado
         * validado bajo reglas diferentes.
         */
        this.numeros =
            [];

        this.validacion =
            null;

        this.preflight =
            null;

        this.preparacionReal =
            null;

        this.escenarioSimulacion =
            null;

        this.procesandoReal =
            false;

        this.simulacionEjecutando =
            false;


        this.render();


        return this
            .modoOperativo;

    }


    esModoSimulacion() {

        return this.modoOperativo ===
            "SIMULACION";

    }


    esModoObservado() {

        return this.modoOperativo ===
            "OBSERVADO";

    }


    /* ============================================================
       SIMULACIÓN EN MEMORIA
       0 ESCRITURAS FIRESTORE
    ============================================================ */

    async ejecutarSimulacionEnMemoria() {

        if (
            !this.esModoSimulacion()
        ) {

            throw new Error(
                "La simulación solo puede ejecutarse en modo SIMULACION."
            );

        }


        if (
            !this.validacion
                ?.valida
        ) {

            throw new Error(
                "Primero debe existir un resultado simulado válido."
            );

        }


        if (
            this.simulacionEjecutando ===
                true
        ) {

            throw new Error(
                "Ya existe una simulación en ejecución."
            );

        }


        this.simulacionEjecutando =
            true;


        try {

            /*
             * Reutilizamos el preflight de lectura:
             * confirma que la predicción base sigue vigente y
             * que el contexto real no cambió.
             */
            const preflight =
                await this
                    .ejecutarPreflight();


            if (
                !preflight
                    .listoParaProcesar
            ) {

                throw new Error(
                    `La simulación fue bloqueada por ${preflight.bloqueantes.length} control(es).`
                );

            }


            /*
             * Recuperamos la predicción COMPLETA.
             * Esto es una lectura, no una escritura.
             */
            const prediccion =
                await this.entorno
                    .prediccionService
                    .obtener(
                        preflight
                            .prediccionActualId,
                        {
                            incluirRanking:
                                true
                        }
                    );


            if (
                !prediccion
            ) {

                throw new Error(
                    "No se pudo cargar la predicción base completa."
                );

            }


            const ranking =
                Array.isArray(
                    prediccion
                        .rankingCompleto
                )
                    ? prediccion
                        .rankingCompleto
                    : [];


            if (
                ranking.length !== 100
            ) {

                throw new Error(
                    `La simulación requiere ranking completo de 100 elementos. Se recuperaron ${ranking.length}.`
                );

            }


            const numerosSimulados =
                [
                    ...this.validacion
                        .numeros
                ];


            const conjuntoResultado =
                new Set(
                    numerosSimulados
                );


            const rankingOrdenado =
                [
                    ...ranking
                ].sort(
                    (
                        a,
                        b
                    ) =>
                        Number(
                            a.orden ??
                            a.posicion ??
                            999
                        ) -
                        Number(
                            b.orden ??
                            b.posicion ??
                            999
                        )
                );


            const top10 =
                rankingOrdenado
                    .slice(
                        0,
                        10
                    );


            const top20 =
                rankingOrdenado
                    .slice(
                        0,
                        20
                    );


            const acertadosTop10 =
                top10.filter(
                    item =>
                        conjuntoResultado.has(
                            Number(
                                item.numero
                            )
                        )
                );


            const acertadosTop20 =
                top20.filter(
                    item =>
                        conjuntoResultado.has(
                            Number(
                                item.numero
                            )
                        )
                );


            const posicionesResultado =
                numerosSimulados
                    .map(
                        numero => {

                            const item =
                                rankingOrdenado
                                    .find(
                                        candidato =>
                                            Number(
                                                candidato
                                                    .numero
                                            ) ===
                                            Number(
                                                numero
                                            )
                                    );


                            return {

                                numero:
                                    Number(
                                        numero
                                    ),

                                orden:
                                    item
                                        ?.orden ??
                                    null,

                                posicion:
                                    item
                                        ?.posicion ??
                                    null,

                                score:
                                    Number(
                                        item
                                            ?.score ??
                                        item
                                            ?.scoreTotal ??
                                        item
                                            ?.puntaje ??
                                        0
                                    ),

                                confianza:
                                    Number(
                                        item
                                            ?.confianza ??
                                        0
                                    )

                            };

                        }
                    )
                    .sort(
                        (
                            a,
                            b
                        ) =>
                            Number(
                                a.orden ??
                                999
                            ) -
                            Number(
                                b.orden ??
                                999
                            )
                    );


            const mejorPosicion =
                posicionesResultado
                    .reduce(
                        (
                            mejor,
                            item
                        ) => {

                            if (
                                item.orden == null
                            ) {

                                return mejor;

                            }


                            if (
                                mejor == null ||
                                Number(
                                    item.orden
                                ) <
                                Number(
                                    mejor
                                )
                            ) {

                                return Number(
                                    item.orden
                                );

                            }


                            return mejor;

                        },
                        null
                    );


            const promedioOrden =
                posicionesResultado
                    .filter(
                        item =>
                            item.orden != null
                    )
                    .reduce(
                        (
                            total,
                            item
                        ) =>
                            total +
                            Number(
                                item.orden
                            ),
                        0
                    ) /
                    Math.max(
                        1,
                        posicionesResultado
                            .filter(
                                item =>
                                    item.orden != null
                            )
                            .length
                    );


            const snapshotPesos =
                this.entorno
                    .motorManager
                    ?.obtenerPesos
                    ?.() ??
                null;


            const escenarioId =
                `sim_${Date.now()}_${Math.random()
                    .toString(36)
                    .slice(2, 8)}`;


            /*
             * Todo este objeto vive EXCLUSIVAMENTE en memoria.
             * No llamamos guardar(), create(), update(),
             * procesarSemana() ni ningún servicio de persistencia.
             */
            this.escenarioSimulacion = {

                esquema:
                    "ESCENARIO_SIMULACION_MEMORIA_V1",

                versionControl:
                    this.version,

                escenarioId,

                creadoEn:
                    new Date()
                        .toISOString(),

                modoOperativo:
                    "SIMULACION",

                esSimulacion:
                    true,

                persistenciaFirestore:
                    false,

                escriturasFirestore:
                    0,

                semana:
                    preflight
                        .semana,

                fechaObjetivo:
                    preflight
                        .fechaObjetivo ??
                    this.estado
                        ?.prediccion
                        ?.fechaObjetivo ??
                    null,

                prediccionBase: {

                    id:
                        prediccion.id,

                    estado:
                        prediccion.estado ??
                        null,

                    activa:
                        prediccion.activa !==
                            false,

                    reemplazada:
                        prediccion.reemplazada ===
                            true,

                    rankingTotal:
                        rankingOrdenado.length

                },

                resultadoSimulado:
                    Object.freeze(
                        [
                            ...numerosSimulados
                        ]
                    ),

                metricas: {

                    aciertosTop10:
                        acertadosTop10.length,

                    aciertosTop20:
                        acertadosTop20.length,

                    mejorOrden:
                        mejorPosicion,

                    promedioOrdenResultado:
                        Number(
                            promedioOrden
                                .toFixed(
                                    2
                                )
                        ),

                    coberturaTop10:
                        Number(
                            (
                                acertadosTop10.length /
                                10 *
                                100
                            ).toFixed(
                                2
                            )
                        ),

                    coberturaTop20:
                        Number(
                            (
                                acertadosTop20.length /
                                10 *
                                100
                            ).toFixed(
                                2
                            )
                        )

                },

                aciertos: {

                    top10:
                        acertadosTop10
                            .map(
                                item =>
                                    Number(
                                        item.numero
                                    )
                            ),

                    top20:
                        acertadosTop20
                            .map(
                                item =>
                                    Number(
                                        item.numero
                                    )
                            )

                },

                posicionesResultado,

                snapshot: {

                    totalSemanasReal:
                        Array.isArray(
                            this.entorno
                                .datosHistorial
                        )
                            ? this.entorno
                                .datosHistorial
                                .length
                            : null,

                    totalEvaluacionesReal:
                        Array.isArray(
                            this.entorno
                                .evaluacionesPersistidas
                        )
                            ? this.entorno
                                .evaluacionesPersistidas
                                .length
                            : null,

                    pesosActivos:
                        snapshotPesos
                            ? structuredClone(
                                snapshotPesos
                            )
                            : null,

                    sumaPesos:
                        this.entorno
                            .motorManager
                            ?.sumarPesos
                            ?.() ??
                        null

                },

                evaluacionSimulada:
                    null,

                evolucionSimulada:
                    null,

                optimizacionSimulada:
                    null,

                prediccion23Simulada:
                    null,

                prediccion23Adaptativa:
                    null,

                comparacionPrediccion23:
                    null,

                integridadReal:
                    null,

                siguienteEtapa: {

                    evaluacionSimulada:
                        false,

                    evolucionSimulada:
                        false,

                    optimizacionSimulada:
                        false,

                    prediccion23Simulada:
                        false,

                    observacion:
                        "La v1.4.1 ejecuta evaluación, evolución y optimización exclusivamente sobre motores temporales. La predicción 23 simulada se conectará en la etapa siguiente."

                }

            };


            const MotorEvaluacionTemporal =
                this.entorno.motorEvaluacion?.constructor;

            const MotorEvolucionTemporal =
                this.entorno.motorEvolucion?.constructor;

            const MotorOptimizacionTemporal =
                this.entorno.motorOptimizacion?.constructor;


            if (
                typeof MotorEvaluacionTemporal !== "function" ||
                typeof MotorEvolucionTemporal !== "function" ||
                typeof MotorOptimizacionTemporal !== "function"
            ) {
                throw new Error(
                    "No están disponibles los constructores temporales de Evaluación, Evolución y Optimización."
                );
            }


            const integridadAntes = {
                evaluacionesPersistidas: Array.isArray(this.entorno.evaluacionesPersistidas)
                    ? this.entorno.evaluacionesPersistidas.length
                    : null,
                evaluacionesMotor: this.entorno.motorEvaluacion?.obtenerHistorial?.()?.length ?? null,
                ultimaEvaluacionId: this.entorno.ultimaEvaluacion?.id ?? null,
                ultimaEvolucionId: this.entorno.ultimaEvolucion?.id ?? null,
                ultimaOptimizacionId: this.entorno.ultimaOptimizacion?.id ?? null,
                sumaPesos: this.entorno.motorManager?.sumarPesos?.() ?? null
            };


            let evaluacionesBase = [];

            try {
                if (typeof this.entorno.evaluacionService?.obtenerHistorial === "function") {
                    const frescas = await this.entorno.evaluacionService.obtenerHistorial();
                    if (Array.isArray(frescas)) {
                        evaluacionesBase = structuredClone(frescas);
                    }
                }
            }
            catch (error) {
                console.warn(
                    "Simulación: no se pudo refrescar evaluaciones; se usa snapshot en memoria.",
                    error
                );
            }

            if (!evaluacionesBase.length && Array.isArray(this.entorno.evaluacionesPersistidas)) {
                evaluacionesBase = structuredClone(this.entorno.evaluacionesPersistidas);
            }


            const motorEvaluacionTemporal =
                new MotorEvaluacionTemporal({
                    cantidadNumerosEsperados: 10,
                    minimoSemanasParaOptimizacion: 20
                });

            for (const evaluacion of evaluacionesBase) {
                motorEvaluacionTemporal.agregarEvaluacion(
                    structuredClone(evaluacion)
                );
            }


            const datosSemanaSimulada = {
                semana: this.escenarioSimulacion.semana,
                fecha: this.escenarioSimulacion.fechaObjetivo,
                fechaObjetivo: this.escenarioSimulacion.fechaObjetivo,
                modoOperativo: "SIMULACION",
                esSimulacion: true,
                escenarioId: this.escenarioSimulacion.escenarioId,
                persistenciaFirestore: false
            };


            const evaluacionSimulada =
                motorEvaluacionTemporal.evaluar(
                    structuredClone(prediccion),
                    [...numerosSimulados],
                    datosSemanaSimulada
                );

            const historialEvaluacionSimulado =
                motorEvaluacionTemporal.obtenerHistorial();


            const motorEvolucionTemporal =
                new MotorEvolucionTemporal({
                    minimoEvaluaciones: 20,
                    periodoReciente: 10,
                    cantidadPeriodos: 5,
                    umbralCambio: 5,
                    umbralCambioFuerte: 15,
                    umbralDiscriminacion: 2,
                    minimoIndicePositivo: 1,
                    minimoEvaluacionesTendencia: 3,
                    pendienteMinimaMotor: 0.05
                });

            const evolucionSimulada =
                motorEvolucionTemporal.analizar(
                    structuredClone(historialEvaluacionSimulado),
                    {
                        modoOperativo: "SIMULACION",
                        esSimulacion: true,
                        escenarioId: this.escenarioSimulacion.escenarioId
                    }
                );


            const motorOptimizacionTemporal =
                new MotorOptimizacionTemporal({
                    minimoEvaluaciones: 20,
                    maximoCambioPorCiclo: 2,
                    pesoMinimo: 2,
                    pesoMaximo: 30,
                    sumaObjetivoPesos: 100
                });

            const pesosBaseSimulacion = snapshotPesos
                ? structuredClone(snapshotPesos)
                : {};

            const optimizacionSimulada =
                motorOptimizacionTemporal.optimizar(
                    structuredClone(evolucionSimulada),
                    structuredClone(pesosBaseSimulacion),
                    {
                        modoOperativo: "SIMULACION",
                        esSimulacion: true,
                        escenarioId: this.escenarioSimulacion.escenarioId
                    }
                );


            const historialTemporal =
                Array.isArray(this.entorno.datosHistorial)
                    ? structuredClone(this.entorno.datosHistorial)
                    : [];

            const semanaTemporal22 = {
                id: `sim_semana_${String(this.escenarioSimulacion.semana).padStart(3,"0")}`,
                semana: this.escenarioSimulacion.semana,
                fecha: this.escenarioSimulacion.fechaObjetivo,
                numeros: [...numerosSimulados],
                modoOperativo: "SIMULACION",
                esSimulacion: true,
                escenarioId: this.escenarioSimulacion.escenarioId
            };

            const historial22 = historialTemporal
                .filter(item => Number(item?.semana) !== Number(semanaTemporal22.semana));

            historial22.push(semanaTemporal22);
            historial22.sort((a,b)=>Number(a?.semana??0)-Number(b?.semana??0));

            const estadisticas22 =
                this.construirEstadisticasTemporales(historial22);

            const fecha23 =
                this.calcularFechaSiguiente(
                    this.escenarioSimulacion.fechaObjetivo,
                    7
                );

            const prediccion23Base =
                this.generarPrediccionTemporal({
                    historial: historial22,
                    estadisticas: estadisticas22,
                    pesos: structuredClone(pesosBaseSimulacion),
                    semanaObjetivo: Number(this.escenarioSimulacion.semana)+1,
                    fechaObjetivo: fecha23,
                    variante: "PESOS_ACTIVOS",
                    escenarioId: this.escenarioSimulacion.escenarioId
                });

            const resumenOpt =
                this.obtenerResumenOptimizacionSimulada(optimizacionSimulada);

            let prediccion23Adaptativa = null;

            if (
                resumenOpt.pesosPropuestos &&
                typeof resumenOpt.pesosPropuestos === "object" &&
                Object.keys(resumenOpt.pesosPropuestos).length
            ) {
                prediccion23Adaptativa =
                    this.generarPrediccionTemporal({
                        historial: historial22,
                        estadisticas: estadisticas22,
                        pesos: structuredClone(resumenOpt.pesosPropuestos),
                        semanaObjetivo: Number(this.escenarioSimulacion.semana)+1,
                        fechaObjetivo: fecha23,
                        variante: "PESOS_PROPUESTOS",
                        escenarioId: this.escenarioSimulacion.escenarioId
                    });
            }

            this.escenarioSimulacion.historialTemporal = {
                total: historial22.length,
                semanaInicial: historial22[0]?.semana ?? null,
                semanaFinal: historial22.at(-1)?.semana ?? null,
                incluyeSemana22Simulada: historial22.some(
                    item => Number(item?.semana)===Number(this.escenarioSimulacion.semana) &&
                    item?.esSimulacion===true
                )
            };

            this.escenarioSimulacion.prediccion23Simulada = prediccion23Base;
            this.escenarioSimulacion.prediccion23Adaptativa = prediccion23Adaptativa;
            this.escenarioSimulacion.comparacionPrediccion23 =
                this.compararPrediccionesTemporales(
                    prediccion23Base,
                    prediccion23Adaptativa
                );


            const integridadDespues = {
                evaluacionesPersistidas: Array.isArray(this.entorno.evaluacionesPersistidas)
                    ? this.entorno.evaluacionesPersistidas.length
                    : null,
                evaluacionesMotor: this.entorno.motorEvaluacion?.obtenerHistorial?.()?.length ?? null,
                ultimaEvaluacionId: this.entorno.ultimaEvaluacion?.id ?? null,
                ultimaEvolucionId: this.entorno.ultimaEvolucion?.id ?? null,
                ultimaOptimizacionId: this.entorno.ultimaOptimizacion?.id ?? null,
                sumaPesos: this.entorno.motorManager?.sumarPesos?.() ?? null
            };

            const estadoRealIntacto =
                JSON.stringify(integridadAntes) ===
                JSON.stringify(integridadDespues);


            this.escenarioSimulacion.evaluacionSimulada = evaluacionSimulada;
            this.escenarioSimulacion.evolucionSimulada = evolucionSimulada;
            this.escenarioSimulacion.optimizacionSimulada = optimizacionSimulada;
            this.escenarioSimulacion.integridadReal = {
                intacta: estadoRealIntacto,
                antes: integridadAntes,
                despues: integridadDespues
            };
            this.escenarioSimulacion.siguienteEtapa = {
                evaluacionSimulada: true,
                evolucionSimulada: true,
                optimizacionSimulada: true,
                prediccion23Simulada: true,
                prediccion23Adaptativa: !!prediccion23Adaptativa,
                observacion: prediccion23Adaptativa
                    ? "Ciclo simulado completo hasta semana 23: variante con pesos activos y variante adaptativa con pesos propuestos."
                    : "Ciclo simulado completo hasta semana 23 con pesos activos."
            };


            console.log(
                "SIMULACIÓN EN MEMORIA:",
                this.escenarioSimulacion
            );

            console.log(
                "INTEGRIDAD ESTADO REAL:",
                this.escenarioSimulacion.integridadReal
            );


            this.renderSimulacion(
                this.escenarioSimulacion
            );


            return this
                .escenarioSimulacion;

        }

        finally {

            this.simulacionEjecutando =
                false;

        }

    }



    construirEstadisticasTemporales(historial) {
        const semanas = Array.isArray(historial) ? historial : [];
        return Array.from({length:100},(_,numero)=>{
            const indices=[];
            semanas.forEach((semana,i)=>{
                if (Array.isArray(semana?.numeros) && semana.numeros.map(Number).includes(numero)) indices.push(i);
            });
            const frecuencia=indices.length;
            const ultima=frecuencia ? indices.at(-1) : -1;
            const atraso=ultima>=0 ? semanas.length-1-ultima : semanas.length;
            const ultimas5=semanas.slice(-5).filter(s=>Array.isArray(s?.numeros)&&s.numeros.map(Number).includes(numero)).length;
            const ultimas3=semanas.slice(-3).filter(s=>Array.isArray(s?.numeros)&&s.numeros.map(Number).includes(numero)).length;
            return {
                numero,
                frecuencia,
                frecuenciaTotal:frecuencia,
                frecuencia_total:frecuencia,
                apariciones:frecuencia,
                totalApariciones:frecuencia,
                porcentaje: semanas.length ? frecuencia/semanas.length*100 : 0,
                atraso,
                semanasSinSalir:atraso,
                tendencia:ultimas5,
                frecuenciaUltimas5:ultimas5,
                caliente:ultimas3,
                frecuenciaUltimas3:ultimas3,
                ultimaAparicion: ultima>=0 ? semanas[ultima]?.semana ?? null : null
            };
        });
    }


    calcularFechaSiguiente(fechaISO,dias=7) {
        if (!fechaISO) return null;
        const fecha=new Date(`${fechaISO}T12:00:00`);
        if (Number.isNaN(fecha.getTime())) return null;
        fecha.setDate(fecha.getDate()+Number(dias));
        return fecha.toISOString().slice(0,10);
    }


    generarPrediccionTemporal({historial,estadisticas,pesos,semanaObjetivo,fechaObjetivo,variante,escenarioId}={}) {
        const MotorManagerTemporal=this.entorno.motorManager?.constructor;
        const MotorRankingTemporal=this.entorno.motorRanking?.constructor;

        if (typeof MotorManagerTemporal!=="function" || typeof MotorRankingTemporal!=="function") {
            throw new Error("No están disponibles los constructores temporales de MotorManager y MotorRanking.");
        }

        const manager=new MotorManagerTemporal();
        manager.inicializar({
            historial: structuredClone(historial),
            estadisticas: structuredClone(estadisticas),
            configuracion:{pesos:structuredClone(pesos)}
        });

        const resultados=manager.analizarTodos({});
        const rankingMotor=new MotorRankingTemporal();
        const ranking=rankingMotor.generar(resultados,{});
        const prediccion=rankingMotor.prepararPrediccion(ranking,{
            semanaObjetivo,
            fechaObjetivo,
            modoOperativo:"SIMULACION",
            esSimulacion:true,
            persistenciaFirestore:false,
            escenarioId,
            variantePesos:variante
        });

        return {
            ...prediccion,
            simulacion:{
                esSimulacion:true,
                persistenciaFirestore:false,
                escriturasFirestore:0,
                escenarioId,
                variantePesos:variante,
                sumaPesos:Number(Object.values(pesos??{}).reduce((t,v)=>t+Number(v??0),0).toFixed(6)),
                totalHistorial:Array.isArray(historial)?historial.length:0
            }
        };
    }


    extraerTopPrediccionTemporal(prediccion,cantidad=10) {
        if (!prediccion || typeof prediccion!=="object") return [];
        const lista=[prediccion.top10,prediccion.top20,prediccion.rankingCompleto,prediccion.ranking].find(Array.isArray)??[];
        return [...lista]
            .sort((a,b)=>Number(a?.orden??a?.posicion??999)-Number(b?.orden??b?.posicion??999))
            .slice(0,cantidad)
            .map(item=>({
                numero:Number(item?.numero),
                orden:item?.orden??null,
                posicion:item?.posicion??null,
                score:Number(item?.score??item?.scoreTotal??item?.puntaje??0),
                confianza:Number(item?.confianza??0)
            }));
    }


    compararPrediccionesTemporales(base,adaptativa) {
        const topBase=this.extraerTopPrediccionTemporal(base,10);
        const topAdapt=this.extraerTopPrediccionTemporal(adaptativa,10);
        const nb=topBase.map(x=>x.numero);
        const na=topAdapt.map(x=>x.numero);
        return {
            disponible:!!base,
            adaptativaDisponible:!!adaptativa,
            top10Base:topBase,
            top10Adaptativo:topAdapt,
            coincidenciasTop10:nb.filter(n=>na.includes(n)).length,
            comunes:nb.filter(n=>na.includes(n)),
            entran:na.filter(n=>!nb.includes(n)),
            salen:nb.filter(n=>!na.includes(n)),
            liderBase:topBase[0]?.numero??null,
            liderAdaptativo:topAdapt[0]?.numero??null
        };
    }


    obtenerResumenEvaluacionSimulada(evaluacion) {
        if (!evaluacion || typeof evaluacion !== "object") {
            return { disponible: false };
        }
        return {
            disponible: true,
            id: evaluacion.id ?? null,
            semana: evaluacion.semana ?? evaluacion.datosSemana?.semana ?? null,
            aciertos: evaluacion.aciertos ?? evaluacion.totalAciertos ?? evaluacion.metricas?.aciertos ?? evaluacion.resultado?.aciertos ?? null,
            precision: evaluacion.precision ?? evaluacion.metricas?.precision ?? evaluacion.resultado?.precision ?? null,
            estado: evaluacion.estado ?? evaluacion.clasificacion ?? evaluacion.resultado?.estado ?? null
        };
    }


    obtenerResumenEvolucionSimulada(evolucion) {
        if (!evolucion || typeof evolucion !== "object") {
            return { disponible: false };
        }
        return {
            disponible: true,
            id: evolucion.id ?? null,
            estado: evolucion.estado ?? evolucion.clasificacion ?? evolucion.diagnostico?.estado ?? null,
            cantidadEvaluaciones: evolucion.cantidadEvaluaciones ?? evolucion.totalEvaluaciones ?? evolucion.metricas?.cantidadEvaluaciones ?? null,
            recomendacion: evolucion.recomendacion ?? evolucion.accion ?? evolucion.diagnostico?.recomendacion ?? null
        };
    }


    obtenerResumenOptimizacionSimulada(optimizacion) {
        if (!optimizacion || typeof optimizacion !== "object") {
            return { disponible: false };
        }
        const pesosPropuestos = optimizacion.pesosPropuestos ?? optimizacion.propuesta?.pesos ?? optimizacion.pesosNuevos ?? optimizacion.nuevosPesos ?? null;
        return {
            disponible: true,
            id: optimizacion.id ?? null,
            estado: optimizacion.estado ?? optimizacion.clasificacion ?? optimizacion.resultado?.estado ?? null,
            aplicable: optimizacion.aplicable ?? optimizacion.propuestaAplicable ?? optimizacion.resultado?.aplicable ?? null,
            sumaPropuesta: pesosPropuestos && typeof pesosPropuestos === "object"
                ? Number(Object.values(pesosPropuestos).reduce((t,v)=>t+Number(v??0),0).toFixed(6))
                : null,
            pesosPropuestos
        };
    }


    renderSimulacion(
        escenario
    ) {

        const contenedor =
            this.raiz.querySelector(
                "[data-resultado-simulacion]"
            );


        if (
            !contenedor
        ) {

            return;

        }


        const resumenEvaluacion =
            this.obtenerResumenEvaluacionSimulada(escenario.evaluacionSimulada);

        const resumenEvolucion =
            this.obtenerResumenEvolucionSimulada(escenario.evolucionSimulada);

        const resumenOptimizacion =
            this.obtenerResumenOptimizacionSimulada(escenario.optimizacionSimulada);


        const posicionesHTML =
            escenario
                .posicionesResultado
                .map(
                    item => `
                        <tr>
                            <td>
                                <b>${String(item.numero).padStart(2, "0")}</b>
                            </td>
                            <td>${item.orden ?? "—"}</td>
                            <td>${item.posicion ?? "—"}</td>
                            <td>${Number(item.score ?? 0).toFixed(4)}</td>
                            <td>${Number(item.confianza ?? 0).toFixed(2)}%</td>
                        </tr>
                    `
                )
                .join("");


        const lista =
            numeros =>
                numeros.length
                    ? numeros
                        .map(
                            numero =>
                                String(
                                    numero
                                ).padStart(
                                    2,
                                    "0"
                                )
                        )
                        .join(", ")
                    : "Ninguno";


        contenedor.innerHTML = `
            <div class="resultado-simulacion">

                <div class="resultado-simulacion__cabecera">

                    <div>
                        <div class="resultado-preflight__eyebrow">
                            SIMULACIÓN / BACKTEST
                        </div>

                        <h3>
                            Escenario en memoria · Semana ${escenario.semana}
                        </h3>
                    </div>

                    <span class="resultado-simulacion__badge">
                        0 ESCRITURAS
                    </span>

                </div>


                <div class="resultado-simulacion__alerta">
                    <strong>
                        Este escenario no es un resultado observado.
                    </strong>
                    <div>
                        No se guardó ninguna semana, evaluación,
                        evolución, optimización ni predicción en Firestore.
                    </div>
                </div>


                <div class="resultado-simulacion__metricas">

                    <div>
                        <span>Aciertos TOP10</span>
                        <strong>${escenario.metricas.aciertosTop10} / 10</strong>
                    </div>

                    <div>
                        <span>Aciertos TOP20</span>
                        <strong>${escenario.metricas.aciertosTop20} / 10</strong>
                    </div>

                    <div>
                        <span>Mejor orden</span>
                        <strong>${escenario.metricas.mejorOrden ?? "—"}</strong>
                    </div>

                    <div>
                        <span>Promedio de orden</span>
                        <strong>${escenario.metricas.promedioOrdenResultado}</strong>
                    </div>

                </div>


                <div class="resultado-simulacion__detalle">
                    <p>
                        <b>TOP10 acertados:</b>
                        ${lista(escenario.aciertos.top10)}
                    </p>

                    <p>
                        <b>TOP20 acertados:</b>
                        ${lista(escenario.aciertos.top20)}
                    </p>

                    <p>
                        <b>Predicción base:</b>
                        <code>${this.escapeHTML(escenario.prediccionBase.id)}</code>
                    </p>

                    <p>
                        <b>Escenario:</b>
                        <code>${this.escapeHTML(escenario.escenarioId)}</code>
                    </p>
                </div>


                <div class="resultado-simulacion__tabla-wrap">
                    <table class="resultado-simulacion__tabla">
                        <thead>
                            <tr>
                                <th>Número</th>
                                <th>Orden</th>
                                <th>Posición</th>
                                <th>Score</th>
                                <th>Confianza</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${posicionesHTML}
                        </tbody>
                    </table>
                </div>


                <div class="resultado-simulacion__adaptativo">
                    <div class="resultado-simulacion__adaptativo-titulo">
                        <strong>Ciclo adaptativo simulado</strong>
                        <span>Motores temporales · sin persistencia</span>
                    </div>
                    <div class="resultado-simulacion__adaptativo-grid">
                        <div>
                            <span>Evaluación</span>
                            <strong>${resumenEvaluacion.disponible ? "COMPLETADA" : "NO DISPONIBLE"}</strong>
                            <small>${resumenEvaluacion.aciertos != null ? `Aciertos: ${resumenEvaluacion.aciertos}` : "Objeto de evaluación generado"}</small>
                        </div>
                        <div>
                            <span>Evolución</span>
                            <strong>${this.escapeHTML(String(resumenEvolucion.estado ?? "GENERADA"))}</strong>
                            <small>${resumenEvolucion.cantidadEvaluaciones != null ? `Evaluaciones: ${resumenEvolucion.cantidadEvaluaciones}` : "Analizada con historial temporal"}</small>
                        </div>
                        <div>
                            <span>Optimización</span>
                            <strong>${this.escapeHTML(String(resumenOptimizacion.estado ?? "GENERADA"))}</strong>
                            <small>${resumenOptimizacion.sumaPropuesta != null ? `Suma propuesta: ${resumenOptimizacion.sumaPropuesta}` : "Propuesta calculada, no aplicada"}</small>
                        </div>
                        <div>
                            <span>Integridad real</span>
                            <strong>${escenario.integridadReal?.intacta ? "INTACTA" : "REVISAR"}</strong>
                            <small>Motor activo y caches sin modificación</small>
                        </div>
                    </div>
                    ${resumenEvolucion.recomendacion ? `<p><b>Recomendación evolutiva simulada:</b> ${this.escapeHTML(String(resumenEvolucion.recomendacion))}</p>` : ""}
                </div>


                ${
                    escenario.prediccion23Simulada
                        ? `
                        <div class="resultado-simulacion__pred23">
                            <div class="resultado-simulacion__adaptativo-titulo">
                                <strong>Predicción simulada · Semana 23</strong>
                                <span>Historial temporal: ${escenario.historialTemporal?.total ?? "—"} semanas</span>
                            </div>
                            <div class="resultado-simulacion__pred23-grid">
                                <div>
                                    <span>Pesos activos</span>
                                    <strong>${this.extraerTopPrediccionTemporal(escenario.prediccion23Simulada,10).map(x=>String(x.numero).padStart(2,"0")).join(" · ")}</strong>
                                    <small>Líder: ${String(escenario.comparacionPrediccion23?.liderBase ?? "—").padStart(2,"0")}</small>
                                </div>
                                ${escenario.prediccion23Adaptativa ? `
                                <div>
                                    <span>Pesos propuestos</span>
                                    <strong>${this.extraerTopPrediccionTemporal(escenario.prediccion23Adaptativa,10).map(x=>String(x.numero).padStart(2,"0")).join(" · ")}</strong>
                                    <small>Líder: ${String(escenario.comparacionPrediccion23?.liderAdaptativo ?? "—").padStart(2,"0")}</small>
                                </div>` : ""}
                            </div>
                            ${escenario.prediccion23Adaptativa ? `
                            <div class="resultado-simulacion__comparacion">
                                <b>Comparación TOP10:</b> ${escenario.comparacionPrediccion23?.coincidenciasTop10 ?? 0}/10 coinciden.
                                ${escenario.comparacionPrediccion23?.entran?.length ? `<br><b>Entran:</b> ${escenario.comparacionPrediccion23.entran.map(n=>String(n).padStart(2,"0")).join(", ")}` : ""}
                                ${escenario.comparacionPrediccion23?.salen?.length ? `<br><b>Salen:</b> ${escenario.comparacionPrediccion23.salen.map(n=>String(n).padStart(2,"0")).join(", ")}` : ""}
                            </div>` : ""}
                        </div>`
                        : ""
                }


                <div class="resultado-simulacion__estado-real">
                    <strong>
                        Estado real preservado
                    </strong>

                    <div>
                        Historial real:
                        ${escenario.snapshot.totalSemanasReal ?? "—"} semanas
                        · Evaluaciones reales:
                        ${escenario.snapshot.totalEvaluacionesReal ?? "—"}
                        · Suma pesos:
                        ${escenario.snapshot.sumaPesos ?? "—"}
                    </div>
                </div>


                <div class="resultado-simulacion__proxima">
                    <strong>
                        Próxima etapa
                    </strong>

                    <p>
                        El ciclo de simulación ya alcanza la semana 23.
                        La próxima etapa será auditar la fidelidad del
                        entorno temporal frente al flujo real y comparar
                        escenarios de pesos sin persistirlos.
                    </p>
                </div>

            </div>
        `;

    }


    /* ============================================================
       FECHAS / PROTECCIÓN TEMPORAL
    ============================================================ */

    normalizarFechaISO(
        valor
    ) {

        if (
            !valor
        ) {

            return null;

        }


        const texto =
            String(
                valor
            ).trim();


        const match =
            texto.match(
                /^(\d{4})-(\d{2})-(\d{2})/
            );


        if (
            !match
        ) {

            return null;

        }


        return `${match[1]}-${match[2]}-${match[3]}`;

    }


    fechaObjetivoEsFutura(
        fechaObjetivo
    ) {

        const fechaISO =
            this.normalizarFechaISO(
                fechaObjetivo
            );


        if (
            !fechaISO
        ) {

            return false;

        }


        const ahora =
            new Date();


        const hoyLocal =
            new Date(
                ahora.getFullYear(),
                ahora.getMonth(),
                ahora.getDate()
            );


        const [
            anio,
            mes,
            dia
        ] =
            fechaISO
                .split("-")
                .map(
                    Number
                );


        const objetivo =
            new Date(
                anio,
                mes - 1,
                dia
            );


        return objetivo.getTime() >
            hoyLocal.getTime();

    }


    sumarDiasISO(
        fechaISO,
        dias = 7
    ) {

        const normalizada =
            this.normalizarFechaISO(
                fechaISO
            );


        if (
            !normalizada
        ) {

            return null;

        }


        const [
            anio,
            mes,
            dia
        ] =
            normalizada
                .split("-")
                .map(
                    Number
                );


        const fecha =
            new Date(
                anio,
                mes - 1,
                dia
            );


        fecha.setDate(
            fecha.getDate() +
            Number(
                dias
            )
        );


        const yyyy =
            fecha.getFullYear();


        const mm =
            String(
                fecha.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const dd =
            String(
                fecha.getDate()
            ).padStart(
                2,
                "0"
            );


        return `${yyyy}-${mm}-${dd}`;

    }


    /* ============================================================
       PREPARAR PROCESAMIENTO REAL
       AÚN SIN ESCRITURA
    ============================================================ */

    async prepararProcesamientoReal() {

        if (
            !this.esModoObservado()
        ) {

            throw new Error(
                "El procesamiento real solo está disponible en modo OBSERVADO."
            );

        }


        if (
            !this.validacion
                ?.valida
        ) {

            throw new Error(
                "El resultado dejó de ser válido."
            );

        }


        /*
         * Repetimos TODO el preflight.
         * La preparación nunca confía ciegamente
         * en el preflight anterior.
         */
        const preflightActual =
            await this
                .ejecutarPreflight();


        if (
            !preflightActual
                .listoParaProcesar
        ) {

            throw new Error(
                `El preflight actual tiene ${preflightActual.bloqueantes.length} condición(es) bloqueante(s).`
            );

        }


        const fechaObjetivo =
            this.normalizarFechaISO(
                preflightActual
                    .fechaObjetivo
            );


        const fechaFutura =
            this.fechaObjetivoEsFutura(
                fechaObjetivo
            );


        const fraseConfirmacion =
            `PROCESAR SEMANA ${preflightActual.semana}`;


        this.preparacionReal = {

            preparada:
                true,

            preparadaEn:
                new Date()
                    .toISOString(),

            semana:
                preflightActual
                    .semana,

            semanaSiguiente:
                preflightActual
                    .semanaSiguiente,

            fechaObjetivo,

            siguienteFecha:
                this.sumarDiasISO(
                    fechaObjetivo,
                    7
                ),

            prediccionId:
                preflightActual
                    .prediccionActualId,

            numeros:
                Object.freeze(
                    [
                        ...preflightActual
                            .numeros
                    ]
                ),

            numerosOrdenados:
                Object.freeze(
                    [
                        ...preflightActual
                            .numerosOrdenados
                    ]
                ),

            fraseConfirmacion,

            fechaFutura,

            bloqueoTemporal:
                this.bloquearFechaFutura === true &&
                fechaFutura === true,

            preflightAprobado:
                true,

            escrituraReal:
                true

        };


        console.log(
            "PREPARACIÓN PROCESAMIENTO REAL:",
            this.preparacionReal
        );


        this.renderConfirmacionReal(
            this.preparacionReal
        );


        return this
            .preparacionReal;

    }


    /* ============================================================
       REVALIDACIÓN FINAL
       INMEDIATAMENTE ANTES DE ESCRIBIR
    ============================================================ */

    async revalidarAntesDeEscribir(
        preparacion
    ) {

        const preflightFinal =
            await this
                .ejecutarPreflight();


        const errores =
            [];


        if (
            !preflightFinal
                .listoParaProcesar
        ) {

            errores.push(
                "El preflight final ya no está aprobado."
            );

        }


        if (
            Number(
                preflightFinal
                    .semana
            ) !==
            Number(
                preparacion
                    .semana
            )
        ) {

            errores.push(
                "La semana objetivo cambió desde la preparación."
            );

        }


        if (
            String(
                preflightFinal
                    .prediccionActualId ??
                ""
            ) !==
            String(
                preparacion
                    .prediccionId ??
                ""
            )
        ) {

            errores.push(
                "La predicción activa cambió desde la preparación."
            );

        }


        const numerosActuales =
            [
                ...(
                    this.validacion
                        ?.numeros ??
                    []
                )
            ];


        if (
            JSON.stringify(
                numerosActuales
            ) !==
            JSON.stringify(
                [
                    ...preparacion
                        .numeros
                ]
            )
        ) {

            errores.push(
                "Los números cambiaron después de preparar el procesamiento."
            );

        }


        if (
            preparacion
                .bloqueoTemporal === true
        ) {

            errores.push(
                `La fecha objetivo ${preparacion.fechaObjetivo} todavía es futura.`
            );

        }


        return {

            valida:
                errores.length === 0,

            errores,

            preflight:
                preflightFinal

        };

    }


    /* ============================================================
       PROCESAMIENTO REAL PROTEGIDO
       ESTA FUNCIÓN SÍ PUEDE ESCRIBIR EN FIRESTORE
    ============================================================ */

    async ejecutarProcesamientoReal({

        fraseIngresada,
        confirmacionRiesgo = false

    } = {}) {

        if (
            !this.esModoObservado()
        ) {

            throw new Error(
                "Las escrituras reales están deshabilitadas fuera del modo OBSERVADO."
            );

        }


        if (
            this.procesandoReal === true
        ) {

            throw new Error(
                "Ya existe un procesamiento en curso."
            );

        }


        const preparacion =
            this.preparacionReal;


        if (
            !preparacion
                ?.preparada
        ) {

            throw new Error(
                "Primero debe preparar el procesamiento real."
            );

        }


        if (
            String(
                fraseIngresada ??
                ""
            ).trim() !==
            preparacion
                .fraseConfirmacion
        ) {

            throw new Error(
                `La frase de confirmación debe ser exactamente: ${preparacion.fraseConfirmacion}`
            );

        }


        if (
            confirmacionRiesgo !== true
        ) {

            throw new Error(
                "Debe confirmar explícitamente que comprende que esta operación escribirá en Firestore."
            );

        }


        if (
            typeof this.entorno
                .procesarSemana !==
                "function"
        ) {

            throw new Error(
                "entorno.procesarSemana() no está disponible."
            );

        }


        /*
         * BARRERA FINAL:
         * lectura fresca justo antes de la escritura.
         */
        const revalidacion =
            await this
                .revalidarAntesDeEscribir(
                    preparacion
                );


        if (
            !revalidacion
                .valida
        ) {

            throw new Error(
                "Procesamiento bloqueado por revalidación final: " +
                revalidacion
                    .errores
                    .join(" | ")
            );

        }


        this.procesandoReal =
            true;


        this.renderEstadoProcesando(
            preparacion
        );


        try {

            /*
             * UNA SOLA ENTRADA AL FLUJO REAL.
             *
             * - preserva el modo CONTROLADO actual;
             * - no permite reprocesar;
             * - guarda la semana;
             * - genera y guarda la siguiente predicción;
             * - la propia capa pruebas.js evita duplicados.
             */
            const resultado =
                await this.entorno
                    .procesarSemana({

                        prediccionId:
                            preparacion
                                .prediccionId,

                        numerosReales:
                            [
                                ...preparacion
                                    .numeros
                            ],

                        semana:
                            preparacion
                                .semana,

                        fecha:
                            preparacion
                                .fechaObjetivo,

                        reprocesar:
                            false,

                        guardarSemana:
                            true,

                        generarSiguientePrediccion:
                            true,

                        guardarSiguientePrediccion:
                            true,

                        siguienteSemana:
                            preparacion
                                .semanaSiguiente,

                        siguienteFecha:
                            preparacion
                                .siguienteFecha

                    });


            console.log(
                "PROCESAMIENTO REAL FINALIZADO:",
                resultado
            );


            /*
             * Refrescamos el estado visual usando la base que
             * procesarSemana() ya dejó actualizada.
             */
            try {

                await this.panelCiclo
                    ?.actualizar?.();

            }

            catch (
                errorPanel
            ) {

                console.warn(
                    "El procesamiento terminó, pero no se pudo refrescar el panel de ciclo.",
                    errorPanel
                );

            }


            this.renderResultadoProcesamiento(
                resultado,
                preparacion
            );


            return resultado;

        }

        catch (
            error
        ) {

            console.error(
                "ERROR EN PROCESAMIENTO REAL:",
                error
            );


            this.renderErrorProcesamiento(
                error
            );


            throw error;

        }

        finally {

            this.procesandoReal =
                false;

        }

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
                            ${
                                this.esModoSimulacion()
                                    ? "Simulación de resultado"
                                    : "Resultado observado"
                            }
                            · Semana ${e.semanaObjetivo}
                        </h2>

                        <p>
                            ${
                                this.esModoSimulacion()
                                    ? "Escenario de prueba aislado en memoria. No representa un resultado observado y no escribe en Firestore."
                                    : "Carga y validación previa del resultado observado. El procesamiento real permanece protegido."
                            }
                        </p>

                    </div>

                </div>


                <div class="resultado-modo">

                    <div class="resultado-modo__titulo">
                        <strong>Modo operativo</strong>
                        <span>
                            Seleccionar un modo limpia cualquier validación anterior.
                        </span>
                    </div>

                    <div class="resultado-modo__opciones">

                        <label class="resultado-modo__opcion ${
                            this.esModoObservado()
                                ? "is-active"
                                : ""
                        }">
                            <input
                                type="radio"
                                name="modo-operativo-resultado"
                                value="OBSERVADO"
                                data-resultado-modo
                                ${
                                    this.esModoObservado()
                                        ? "checked"
                                        : ""
                                }
                            >
                            <span>
                                <b>OBSERVADO</b>
                                <small>Resultado real · respeta fecha objetivo</small>
                            </span>
                        </label>

                        <label class="resultado-modo__opcion ${
                            this.esModoSimulacion()
                                ? "is-active"
                                : ""
                        }">
                            <input
                                type="radio"
                                name="modo-operativo-resultado"
                                value="SIMULACION"
                                data-resultado-modo
                                ${
                                    this.esModoSimulacion()
                                        ? "checked"
                                        : ""
                                }
                            >
                            <span>
                                <b>SIMULACIÓN</b>
                                <small>Prueba en memoria · 0 escrituras Firestore</small>
                            </span>
                        </label>

                    </div>

                    ${
                        this.esModoSimulacion()
                            ? `
                                <div class="resultado-modo__banner resultado-modo__banner--simulacion">
                                    MODO SIMULACIÓN ACTIVO · LOS DATOS NO SON RESULTADOS OBSERVADOS
                                </div>
                            `
                            : `
                                <div class="resultado-modo__banner resultado-modo__banner--observado">
                                    MODO OBSERVADO · PROCESAMIENTO REAL SUJETO A BARRERAS DE SEGURIDAD
                                </div>
                            `
                    }

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
                        ${
                            this.esModoSimulacion()
                                ? "Ingresar los 10 números simulados"
                                : "Ingresar los 10 números observados"
                        }
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
                            ${
                                this.esModoSimulacion()
                                    ? "Validar simulación"
                                    : "Validar resultado"
                            }
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
                        ${
                            this.esModoSimulacion()
                                ? "La simulación en memoria no guarda semanas, evaluaciones, evolución, optimizaciones ni predicciones en Firestore."
                                : "Validar un resultado no guarda semanas, no evalúa predicciones, no ejecuta evolución, no aplica optimizaciones y no genera la semana siguiente."
                        }
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
                    ${
                        this.esModoSimulacion()
                            ? "Resultado simulado válido"
                            : "Resultado válido para previsualización"
                    }
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
                        ${
                            this.esModoSimulacion()
                                ? "Todavía no se realizó ninguna escritura. Primero se ejecutará el mismo preflight de seguridad y luego podrá evaluarse el escenario únicamente en memoria."
                                : "Todavía no se realizó ninguna escritura. Ahora puede ejecutarse un preflight de procesamiento completamente en modo lectura."
                        }
                    </p>


                    <button
                        type="button"
                        class="resultado-btn resultado-btn--preflight"
                        data-resultado-accion="preflight"
                    >
                        Ejecutar preflight sin escritura
                    </button>

                </div>

            </div>


            <div
                class="resultado-operativo__preflight"
                data-resultado-preflight
            ></div>

            <div
                class="resultado-operativo__simulacion"
                data-resultado-simulacion
            ></div>
        `;


        const botonPreflight =
            contenedor.querySelector(
                '[data-resultado-accion="preflight"]'
            );


        if (
            botonPreflight
        ) {

            console.log(
                "Preflight: botón enlazado correctamente."
            );

        }


        botonPreflight?.addEventListener(
            "click",
            async () => {

                botonPreflight.disabled =
                    true;


                try {

                    await this
                        .ejecutarPreflight();

                }

                catch (
                    error
                ) {

                    console.error(
                        "Error ejecutando preflight:",
                        error
                    );


                    const preflightContenedor =
                        this.raiz.querySelector(
                            "[data-resultado-preflight]"
                        );


                    if (
                        preflightContenedor
                    ) {

                        preflightContenedor.innerHTML = `
                            <div class="resultado-preflight resultado-preflight--error">

                                <strong>
                                    No se pudo ejecutar el preflight.
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
                        `;

                    }

                }

                finally {

                    const nuevoBoton =
                        this.raiz.querySelector(
                            '[data-resultado-accion="preflight"]'
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


    renderPreflight(
        preflight
    ) {

        const contenedor =
            this.raiz
                .querySelector(
                    "[data-resultado-preflight]"
                );


        if (
            !contenedor
        ) {

            return;

        }


        const controlesHTML =
            preflight
                .controles
                .map(
                    control => `
                        <div class="resultado-preflight__control ${
                            control.ok
                                ? "resultado-preflight__control--ok"
                                : "resultado-preflight__control--error"
                        }">

                            <div class="resultado-preflight__estado">
                                ${
                                    control.ok
                                        ? "✓"
                                        : "✕"
                                }
                            </div>

                            <div>

                                <strong>
                                    ${this.escapeHTML(
                                        control.etiqueta
                                    )}
                                </strong>

                                <div>
                                    ${this.escapeHTML(
                                        control.detalle
                                    )}
                                </div>

                            </div>

                        </div>
                    `
                )
                .join("");


        const planHTML =
            preflight
                .plan
                .map(
                    paso => `
                        <div class="resultado-preflight__paso">

                            <span>
                                ${paso.orden}
                            </span>

                            <div>

                                <strong>
                                    ${this.escapeHTML(
                                        paso.accion
                                    )}
                                </strong>

                                <div>
                                    ${this.escapeHTML(
                                        paso.descripcion
                                    )}
                                </div>

                            </div>

                        </div>
                    `
                )
                .join("");


        contenedor.innerHTML = `
            <div class="resultado-preflight ${
                preflight.listoParaProcesar
                    ? "resultado-preflight--ok"
                    : "resultado-preflight--error"
            }">

                <div class="resultado-preflight__cabecera">

                    <div>

                        <div class="resultado-preflight__eyebrow">
                            PREFLIGHT SIN ESCRITURA
                        </div>

                        <h3>
                            ${
                                preflight.listoParaProcesar
                                    ? "Contexto apto para procesamiento"
                                    : "Procesamiento bloqueado"
                            }
                        </h3>

                    </div>

                    <span class="resultado-preflight__badge">
                        SOLO LECTURA
                    </span>

                </div>


                <div class="resultado-preflight__resumen">

                    <span>
                        Semana:
                        <strong>
                            ${preflight.semana}
                        </strong>
                    </span>

                    <span>
                        Siguiente:
                        <strong>
                            ${preflight.semanaSiguiente}
                        </strong>
                    </span>

                    <span>
                        Bloqueantes:
                        <strong>
                            ${preflight.bloqueantes.length}
                        </strong>
                    </span>

                    <span>
                        Escrituras:
                        <strong>
                            0
                        </strong>
                    </span>

                </div>


                <h4>
                    Controles de seguridad
                </h4>

                <div class="resultado-preflight__controles">
                    ${controlesHTML}
                </div>


                <h4>
                    Plan que ejecutaría la fase real
                </h4>

                <div class="resultado-preflight__plan">
                    ${planHTML}
                </div>


                <div class="resultado-preflight__cierre">

                    ${
                        preflight.listoParaProcesar
                            ? `
                                <strong>
                                    Preflight aprobado.
                                </strong>

                                ${
                                    this.esModoSimulacion()
                                        ? `
                                            <p>
                                                Todos los controles previos están correctos.
                                                Puede ejecutar el escenario aislado en memoria.
                                                Firestore permanecerá sin cambios.
                                            </p>

                                            <button
                                                type="button"
                                                class="resultado-btn resultado-btn--simulacion"
                                                data-resultado-accion="simular-memoria"
                                            >
                                                Ejecutar simulación en memoria
                                            </button>
                                        `
                                        : `
                                            <p>
                                                Todos los controles previos están correctos.
                                                Puede preparar la confirmación final.
                                                Preparar todavía no escribe en Firestore.
                                            </p>

                                            <button
                                                type="button"
                                                class="resultado-btn resultado-btn--preparar"
                                                data-resultado-accion="preparar-real"
                                            >
                                                Preparar procesamiento real
                                            </button>
                                        `
                                }
                            `
                            : `
                                <strong>
                                    Preflight rechazado.
                                </strong>

                                <p>
                                    Existe al menos una condición bloqueante.
                                    No debe habilitarse procesamiento real
                                    hasta resolverla.
                                </p>
                            `
                    }

                </div>

            </div>

            <div
                class="resultado-operativo__confirmacion-real"
                data-resultado-confirmacion-real
            ></div>
        `;


        const botonSimular =
            contenedor.querySelector(
                '[data-resultado-accion="simular-memoria"]'
            );


        botonSimular?.addEventListener(
            "click",
            async () => {

                botonSimular.disabled =
                    true;


                try {

                    await this
                        .ejecutarSimulacionEnMemoria();

                }

                catch (
                    error
                ) {

                    console.error(
                        "Error ejecutando simulación en memoria:",
                        error
                    );


                    const simulacionContenedor =
                        this.raiz.querySelector(
                            "[data-resultado-simulacion]"
                        );


                    if (
                        simulacionContenedor
                    ) {

                        simulacionContenedor.innerHTML = `
                            <div class="resultado-real__mensaje resultado-real__mensaje--error">
                                <strong>
                                    Simulación bloqueada.
                                </strong>
                                <div>
                                    ${this.escapeHTML(error?.message || error)}
                                </div>
                            </div>
                        `;

                    }

                }

                finally {

                    const botonActual =
                        this.raiz.querySelector(
                            '[data-resultado-accion="simular-memoria"]'
                        );


                    if (
                        botonActual
                    ) {

                        botonActual.disabled =
                            false;

                    }

                }

            }
        );


        const botonPreparar =
            contenedor.querySelector(
                '[data-resultado-accion="preparar-real"]'
            );


        botonPreparar?.addEventListener(
            "click",
            async () => {

                botonPreparar.disabled =
                    true;


                try {

                    await this
                        .prepararProcesamientoReal();

                }

                catch (
                    error
                ) {

                    console.error(
                        "No se pudo preparar el procesamiento real:",
                        error
                    );


                    this.renderErrorPreparacion(
                        error
                    );

                }

                finally {

                    const nuevoBoton =
                        this.raiz.querySelector(
                            '[data-resultado-accion="preparar-real"]'
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


    renderConfirmacionReal(
        preparacion
    ) {

        const contenedor =
            this.raiz.querySelector(
                "[data-resultado-confirmacion-real]"
            );


        if (
            !contenedor
        ) {

            return;

        }


        const numerosHTML =
            preparacion
                .numerosOrdenados
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
                .join("");


        contenedor.innerHTML = `
            <div class="resultado-real">

                <div class="resultado-real__cabecera">

                    <div>

                        <div class="resultado-preflight__eyebrow">
                            PROCESAMIENTO REAL PROTEGIDO
                        </div>

                        <h3>
                            Confirmación final · Semana ${preparacion.semana}
                        </h3>

                    </div>

                    <span class="resultado-real__badge">
                        ESCRITURA REAL
                    </span>

                </div>


                <div class="resultado-real__resumen">

                    <div>
                        <span>Semana</span>
                        <strong>${preparacion.semana}</strong>
                    </div>

                    <div>
                        <span>Predicción</span>
                        <code>${this.escapeHTML(preparacion.prediccionId)}</code>
                    </div>

                    <div>
                        <span>Fecha</span>
                        <strong>${this.escapeHTML(preparacion.fechaObjetivo ?? "—")}</strong>
                    </div>

                    <div>
                        <span>Siguiente semana</span>
                        <strong>${preparacion.semanaSiguiente}</strong>
                    </div>

                </div>


                <div class="resultado-numeros">
                    ${numerosHTML}
                </div>


                ${
                    preparacion.bloqueoTemporal
                        ? `
                            <div class="resultado-real__bloqueo">

                                <strong>
                                    Procesamiento real bloqueado por fecha.
                                </strong>

                                <p>
                                    La fecha objetivo
                                    <b>${this.escapeHTML(preparacion.fechaObjetivo)}</b>
                                    todavía es futura respecto del día actual.
                                    Estos números no pueden registrarse como
                                    resultado observado todavía.
                                </p>

                            </div>
                        `
                        : `
                            <div class="resultado-real__advertencia">

                                <strong>
                                    Esta operación sí modifica Firestore.
                                </strong>

                                <p>
                                    Guardará la semana ${preparacion.semana},
                                    evaluará la predicción activa, actualizará
                                    el ciclo evolutivo y, si el flujo finaliza
                                    correctamente, generará la predicción de
                                    la semana ${preparacion.semanaSiguiente}.
                                </p>

                            </div>


                            <label class="resultado-real__check">

                                <input
                                    type="checkbox"
                                    data-resultado-confirmacion-riesgo
                                >

                                <span>
                                    Comprendo que esta acción realizará
                                    escrituras reales y no es una previsualización.
                                </span>

                            </label>


                            <label
                                class="resultado-operativo__label"
                                for="resultado-frase-confirmacion"
                            >
                                Escriba exactamente:
                                <code>${this.escapeHTML(preparacion.fraseConfirmacion)}</code>
                            </label>


                            <input
                                id="resultado-frase-confirmacion"
                                class="resultado-real__input"
                                type="text"
                                autocomplete="off"
                                spellcheck="false"
                                data-resultado-frase-confirmacion
                            >


                            <button
                                type="button"
                                class="resultado-btn resultado-btn--real"
                                data-resultado-accion="procesar-real"
                            >
                                PROCESAR SEMANA ${preparacion.semana}
                            </button>
                        `
                }


                <div
                    class="resultado-real__estado"
                    data-resultado-real-estado
                ></div>

            </div>
        `;


        const botonProcesar =
            contenedor.querySelector(
                '[data-resultado-accion="procesar-real"]'
            );


        botonProcesar?.addEventListener(
            "click",
            async () => {

                const frase =
                    contenedor
                        .querySelector(
                            "[data-resultado-frase-confirmacion]"
                        )
                        ?.value ??
                    "";


                const confirmado =
                    contenedor
                        .querySelector(
                            "[data-resultado-confirmacion-riesgo]"
                        )
                        ?.checked === true;


                botonProcesar.disabled =
                    true;


                try {

                    await this
                        .ejecutarProcesamientoReal({

                            fraseIngresada:
                                frase,

                            confirmacionRiesgo:
                                confirmado

                        });

                }

                catch (
                    error
                ) {

                    const estado =
                        this.raiz.querySelector(
                            "[data-resultado-real-estado]"
                        );


                    if (
                        estado
                    ) {

                        estado.innerHTML = `
                            <div class="resultado-real__mensaje resultado-real__mensaje--error">

                                <strong>
                                    Procesamiento no ejecutado o interrumpido.
                                </strong>

                                <div>
                                    ${this.escapeHTML(
                                        error?.message ||
                                        error
                                    )}
                                </div>

                            </div>
                        `;

                    }

                }

                finally {

                    const botonActual =
                        this.raiz.querySelector(
                            '[data-resultado-accion="procesar-real"]'
                        );


                    if (
                        botonActual &&
                        this.procesandoReal !== true
                    ) {

                        botonActual.disabled =
                            false;

                    }

                }

            }
        );

    }


    renderErrorPreparacion(
        error
    ) {

        const contenedor =
            this.raiz.querySelector(
                "[data-resultado-confirmacion-real]"
            );


        if (
            contenedor
        ) {

            contenedor.innerHTML = `
                <div class="resultado-real__mensaje resultado-real__mensaje--error">

                    <strong>
                        Preparación bloqueada.
                    </strong>

                    <div>
                        ${this.escapeHTML(
                            error?.message ||
                            error
                        )}
                    </div>

                </div>
            `;

        }

    }


    renderEstadoProcesando(
        preparacion
    ) {

        const estado =
            this.raiz.querySelector(
                "[data-resultado-real-estado]"
            );


        if (
            estado
        ) {

            estado.innerHTML = `
                <div class="resultado-real__mensaje resultado-real__mensaje--procesando">

                    <strong>
                        Procesando semana ${preparacion.semana}…
                    </strong>

                    <div>
                        No cierre ni repita la acción mientras finaliza
                        el flujo de evaluación y persistencia.
                    </div>

                </div>
            `;

        }

    }


    renderResultadoProcesamiento(
        resultado,
        preparacion
    ) {

        const estado =
            this.raiz.querySelector(
                "[data-resultado-real-estado]"
            );


        if (
            !estado
        ) {

            return;

        }


        const siguienteId =
            resultado
                ?.siguientePrediccion
                ?.id ??
            null;


        estado.innerHTML = `
            <div class="resultado-real__mensaje resultado-real__mensaje--ok">

                <strong>
                    Semana ${preparacion.semana} procesada.
                </strong>

                <div>
                    Estado del flujo:
                    <b>${this.escapeHTML(resultado?.estado ?? "FINALIZADO")}</b>
                </div>

                <div>
                    Semana siguiente:
                    <b>${preparacion.semanaSiguiente}</b>
                    ${
                        siguienteId
                            ? ` · <code>${this.escapeHTML(siguienteId)}</code>`
                            : ""
                    }
                </div>

                <div>
                    Revise consola y el Panel de Ciclo Operativo
                    antes de realizar cualquier nueva operación.
                </div>

            </div>
        `;

    }


    renderErrorProcesamiento(
        error
    ) {

        const estado =
            this.raiz.querySelector(
                "[data-resultado-real-estado]"
            );


        if (
            estado
        ) {

            estado.innerHTML = `
                <div class="resultado-real__mensaje resultado-real__mensaje--error">

                    <strong>
                        El flujo informó un error.
                    </strong>

                    <div>
                        ${this.escapeHTML(
                            error?.message ||
                            error
                        )}
                    </div>

                    <div>
                        No vuelva a procesar automáticamente.
                        Primero revise Firestore y el estado operativo,
                        porque un flujo de varias etapas podría haber
                        alcanzado una escritura antes del error.
                    </div>

                </div>
            `;

        }

    }


    vincularEventos() {

        const radiosModo =
            this.raiz.querySelectorAll(
                "[data-resultado-modo]"
            );


        radiosModo.forEach(
            radio => {

                radio.addEventListener(
                    "change",
                    () => {

                        if (
                            radio.checked
                        ) {

                            this.cambiarModoOperativo(
                                radio.value
                            );

                        }

                    }
                );

            }
        );


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

                this.preflight =
                    null;

                this.preparacionReal =
                    null;

                this.procesandoReal =
                    false;

                this.escenarioSimulacion =
                    null;

                this.simulacionEjecutando =
                    false;


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
