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

        this.version = "2.9.0";

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

        this.laboratorioEscenarios =
            null;

        this.simulacionEjecutando =
            false;


        /*
         * Laboratorio de escenarios:
         * múltiples simulaciones aisladas, todas en memoria.
         */
        this.laboratorioEscenarios =
            null;

        this.laboratorioEjecutando =
            false;


        /*
         * Banco reproducible de escenarios.
         * Solo memoria. No persistencia.
         */
        this.bancoEscenarios =
            null;

        this.bancoEscenariosEjecutando =
            false;

        this.backtestWalkForward =
            null;

        this.backtestWalkForwardEjecutando =
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

                auditoriaFidelidadTemporal:
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


            this.escenarioSimulacion.auditoriaFidelidadTemporal =
                this.auditarFidelidadTemporal({
                    historialTemporal: historial22,
                    estadisticasTemporales: estadisticas22,
                    prediccionBase: prediccion23Base,
                    prediccionAdaptativa: prediccion23Adaptativa,
                    pesosActivos: pesosBaseSimulacion,
                    pesosPropuestos: resumenOpt.pesosPropuestos ?? null,
                    semanaEsperada: Number(this.escenarioSimulacion.semana) + 1,
                    fechaEsperada: fecha23
                });


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



    auditarFidelidadTemporal({
        historialTemporal,
        estadisticasTemporales,
        prediccionBase,
        prediccionAdaptativa,
        pesosActivos,
        pesosPropuestos,
        semanaEsperada,
        fechaEsperada
    }={}) {

        const controles = [];

        const agregar = (codigo, ok, detalle, valor = null) => {
            controles.push({
                codigo,
                ok: !!ok,
                detalle,
                valor
            });
        };

        const historial = Array.isArray(historialTemporal)
            ? historialTemporal
            : [];

        const semanasNumericas = historial.map(x => Number(x?.semana));
        const semanaFinal = semanasNumericas.at(-1) ?? null;

        agregar(
            "HISTORIAL_22",
            historial.length === 22,
            "El entorno temporal contiene exactamente 22 semanas.",
            historial.length
        );

        agregar(
            "SEMANAS_CONTINUAS",
            semanasNumericas.every((n, i) => n === i + 1),
            "Las semanas temporales forman una secuencia continua 1–22.",
            semanasNumericas
        );

        agregar(
            "SEMANA_22_SIMULADA",
            semanaFinal === 22 &&
            historial.at(-1)?.esSimulacion === true &&
            Array.isArray(historial.at(-1)?.numeros) &&
            historial.at(-1).numeros.length === 10,
            "La última semana es la 22 simulada con 10 números.",
            {
                semana: semanaFinal,
                numeros: historial.at(-1)?.numeros?.length ?? 0
            }
        );

        agregar(
            "ESTADISTICAS_100",
            Array.isArray(estadisticasTemporales) &&
            estadisticasTemporales.length === 100,
            "La base estadística temporal contiene los 100 números.",
            estadisticasTemporales?.length ?? null
        );

        const sumaActivos = Number(
            Object.values(pesosActivos ?? {})
                .reduce((t,v)=>t+Number(v??0),0)
                .toFixed(6)
        );

        agregar(
            "PESOS_ACTIVOS_100",
            Math.abs(sumaActivos - 100) < 0.01,
            "Los pesos activos usados por la variante base suman 100.",
            sumaActivos
        );

        const rankingBase =
            Array.isArray(prediccionBase?.rankingCompleto)
                ? prediccionBase.rankingCompleto
                : Array.isArray(prediccionBase?.ranking)
                    ? prediccionBase.ranking
                    : [];

        agregar(
            "RANKING_BASE_100",
            rankingBase.length === 100,
            "La predicción temporal base contiene ranking completo de 100 números.",
            rankingBase.length
        );

        const numerosRanking = rankingBase.map(x => Number(x?.numero));

        agregar(
            "RANKING_BASE_UNICO",
            rankingBase.length === 100 &&
            new Set(numerosRanking).size === 100,
            "Los 100 números del ranking base son únicos.",
            new Set(numerosRanking).size
        );

        const ordenes = rankingBase.map(x => Number(x?.orden));
        agregar(
            "ORDEN_BASE_SECUENCIAL",
            rankingBase.length === 100 &&
            ordenes.every((orden, i) => orden === i + 1),
            "El campo orden del ranking base es secuencial 1–100.",
            ordenes.slice(0,10)
        );

        agregar(
            "SEMANA_OBJETIVO_23",
            Number(
                prediccionBase?.semanaObjetivo ??
                prediccionBase?.semana?.numero ??
                prediccionBase?.semana
            ) === Number(semanaEsperada),
            "La predicción temporal apunta a la semana 23.",
            prediccionBase?.semanaObjetivo ??
            prediccionBase?.semana?.numero ??
            prediccionBase?.semana ??
            null
        );

        agregar(
            "FECHA_OBJETIVO",
            String(
                prediccionBase?.fechaObjetivo ??
                prediccionBase?.semana?.fecha ??
                ""
            ) === String(fechaEsperada ?? ""),
            "La fecha objetivo temporal coincide con semana 23.",
            prediccionBase?.fechaObjetivo ??
            prediccionBase?.semana?.fecha ??
            null
        );

        agregar(
            "SIN_PERSISTENCIA_BASE",
            prediccionBase?.simulacion?.persistenciaFirestore === false &&
            Number(prediccionBase?.simulacion?.escriturasFirestore) === 0,
            "La predicción base declara cero persistencia.",
            prediccionBase?.simulacion ?? null
        );

        if (prediccionAdaptativa) {
            const sumaPropuestos = Number(
                Object.values(pesosPropuestos ?? {})
                    .reduce((t,v)=>t+Number(v??0),0)
                    .toFixed(6)
            );

            agregar(
                "PESOS_PROPUESTOS_100",
                Math.abs(sumaPropuestos - 100) < 0.01,
                "Los pesos propuestos de la variante adaptativa suman 100.",
                sumaPropuestos
            );

            const rankingAdapt =
                Array.isArray(prediccionAdaptativa?.rankingCompleto)
                    ? prediccionAdaptativa.rankingCompleto
                    : Array.isArray(prediccionAdaptativa?.ranking)
                        ? prediccionAdaptativa.ranking
                        : [];

            agregar(
                "RANKING_ADAPTATIVO_100",
                rankingAdapt.length === 100,
                "La variante adaptativa contiene ranking completo de 100 números.",
                rankingAdapt.length
            );

            agregar(
                "SIN_PERSISTENCIA_ADAPTATIVA",
                prediccionAdaptativa?.simulacion?.persistenciaFirestore === false &&
                Number(prediccionAdaptativa?.simulacion?.escriturasFirestore) === 0,
                "La predicción adaptativa declara cero persistencia.",
                prediccionAdaptativa?.simulacion ?? null
            );
        }

        const fallidos = controles.filter(x => !x.ok);

        return {
            esquema: "AUDITORIA_FIDELIDAD_TEMPORAL_V1",
            versionControl: this.version,
            ejecutadaEn: new Date().toISOString(),
            totalControles: controles.length,
            aprobados: controles.length - fallidos.length,
            fallidos: fallidos.length,
            valida: fallidos.length === 0,
            controles
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



    generarEscenariosLaboratorio(
        prediccion,
        numerosActuales
    ) {

        const ranking =
            Array.isArray(prediccion?.rankingCompleto)
                ? [...prediccion.rankingCompleto]
                : [];

        const ordenado =
            ranking.sort(
                (a,b) =>
                    Number(a?.orden ?? a?.posicion ?? 999) -
                    Number(b?.orden ?? b?.posicion ?? 999)
            );

        const actuales =
            [...new Set((numerosActuales ?? []).map(Number))]
                .slice(0,10);

        const top =
            ordenado.map(x => Number(x?.numero));

        const completar = (
            base,
            candidatos
        ) => {
            const salida = [...new Set(base.map(Number))];
            for (const numero of candidatos) {
                if (
                    salida.length < 10 &&
                    Number.isInteger(Number(numero)) &&
                    Number(numero) >= 0 &&
                    Number(numero) <= 99 &&
                    !salida.includes(Number(numero))
                ) {
                    salida.push(Number(numero));
                }
            }
            return salida.slice(0,10);
        };

        const topNoActual =
            top.filter(n => !actuales.includes(n));

        const suave =
            completar(
                actuales.slice(0,8),
                topNoActual
            );

        const media =
            completar(
                actuales.slice(0,5),
                topNoActual
            );

        const top10Prediccion =
            top.slice(0,10);

        const contraste =
            [...top].reverse().slice(0,10);

        return [
            {
                id: "ACTUAL",
                nombre: "Escenario actual",
                descripcion: "Los 10 números simulados cargados por el usuario.",
                numeros: actuales
            },
            {
                id: "SUAVE",
                nombre: "Perturbación suave",
                descripcion: "Conserva 8 números del escenario actual y reemplaza 2 por candidatos mejor rankeados.",
                numeros: suave
            },
            {
                id: "MEDIA",
                nombre: "Perturbación media",
                descripcion: "Conserva 5 números actuales y reemplaza 5 por candidatos mejor rankeados.",
                numeros: media
            },
            {
                id: "TOP10",
                nombre: "TOP10 predicción 22",
                descripcion: "Usa los 10 primeros números de la predicción base de semana 22.",
                numeros: top10Prediccion
            },
            {
                id: "CONTRASTE",
                nombre: "Contraste extremo",
                descripcion: "Usa los 10 últimos números del ranking de semana 22 para medir sensibilidad.",
                numeros: contraste
            }
        ];
    }


    calcularCambioPesos(
        activos,
        propuestos
    ) {

        const claves =
            [...new Set([
                ...Object.keys(activos ?? {}),
                ...Object.keys(propuestos ?? {})
            ])];

        const detalle =
            claves.map(clave => {
                const antes = Number(activos?.[clave] ?? 0);
                const despues = Number(propuestos?.[clave] ?? antes);
                const delta = despues - antes;

                return {
                    motor: clave,
                    antes,
                    despues,
                    delta,
                    absoluto: Math.abs(delta)
                };
            });

        const l1 =
            detalle.reduce(
                (total,item) => total + item.absoluto,
                0
            );

        const maximo =
            detalle.reduce(
                (max,item) =>
                    item.absoluto > (max?.absoluto ?? -1)
                        ? item
                        : max,
                null
            );

        return {
            l1: Number(l1.toFixed(6)),
            maximo,
            detalle
        };
    }


    async simularEscenarioLaboratorio({
        definicion,
        prediccion,
        evaluacionesBase,
        pesosActivos
    }={}) {

        const numeros =
            [...new Set(
                (definicion?.numeros ?? []).map(Number)
            )];

        if (numeros.length !== 10) {
            throw new Error(
                `El escenario ${definicion?.id ?? "?"} no contiene 10 números únicos.`
            );
        }

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
                "No están disponibles los constructores temporales del ciclo adaptativo."
            );
        }

        const idEscenarioNormalizado =
            String(
                definicion?.id ?? "escenario"
            )
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9_-]+/g, "_");

        const escenarioId =
            `lab_${idEscenarioNormalizado || "escenario"}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;

        const motorEvaluacion =
            new MotorEvaluacionTemporal({
                cantidadNumerosEsperados: 10,
                minimoSemanasParaOptimizacion: 20
            });

        for (const evaluacion of (evaluacionesBase ?? [])) {
            motorEvaluacion.agregarEvaluacion(
                structuredClone(evaluacion)
            );
        }

        const datosSemana = {
            semana: this.escenarioSimulacion.semana,
            fecha: this.escenarioSimulacion.fechaObjetivo,
            fechaObjetivo: this.escenarioSimulacion.fechaObjetivo,
            modoOperativo: "SIMULACION",
            esSimulacion: true,
            laboratorio: true,
            escenarioId,
            persistenciaFirestore: false
        };

        const evaluacion =
            motorEvaluacion.evaluar(
                structuredClone(prediccion),
                [...numeros],
                datosSemana
            );

        const historialEvaluaciones =
            motorEvaluacion.obtenerHistorial();

        const motorEvolucion =
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

        const evolucion =
            motorEvolucion.analizar(
                structuredClone(historialEvaluaciones),
                {
                    modoOperativo: "SIMULACION",
                    esSimulacion: true,
                    laboratorio: true,
                    escenarioId
                }
            );

        const motorOptimizacion =
            new MotorOptimizacionTemporal({
                minimoEvaluaciones: 20,
                maximoCambioPorCiclo: 2,
                pesoMinimo: 2,
                pesoMaximo: 30,
                sumaObjetivoPesos: 100
            });

        const optimizacion =
            motorOptimizacion.optimizar(
                structuredClone(evolucion),
                structuredClone(pesosActivos),
                {
                    modoOperativo: "SIMULACION",
                    esSimulacion: true,
                    laboratorio: true,
                    escenarioId
                }
            );

        const resumenOpt =
            this.obtenerResumenOptimizacionSimulada(
                optimizacion
            );

        const historial =
            Array.isArray(this.entorno.datosHistorial)
                ? structuredClone(this.entorno.datosHistorial)
                : [];

        const semanaTemporal = {
            id: `lab_semana_${String(this.escenarioSimulacion.semana).padStart(3,"0")}`,
            semana: this.escenarioSimulacion.semana,
            fecha: this.escenarioSimulacion.fechaObjetivo,
            numeros: [...numeros],
            esSimulacion: true,
            laboratorio: true,
            escenarioId
        };

        const historial22 =
            historial.filter(
                x =>
                    Number(x?.semana) !==
                    Number(semanaTemporal.semana)
            );

        historial22.push(semanaTemporal);
        historial22.sort(
            (a,b) =>
                Number(a?.semana ?? 0) -
                Number(b?.semana ?? 0)
        );

        const estadisticas =
            this.construirEstadisticasTemporales(
                historial22
            );

        const semana23 =
            Number(this.escenarioSimulacion.semana) + 1;

        const fecha23 =
            this.calcularFechaSiguiente(
                this.escenarioSimulacion.fechaObjetivo,
                7
            );

        const pred23Base =
            this.generarPrediccionTemporal({
                historial: historial22,
                estadisticas,
                pesos: structuredClone(pesosActivos),
                semanaObjetivo: semana23,
                fechaObjetivo: fecha23,
                variante: "LAB_PESOS_ACTIVOS",
                escenarioId
            });

        const pesosPropuestos =
            resumenOpt.pesosPropuestos &&
            typeof resumenOpt.pesosPropuestos === "object"
                ? structuredClone(resumenOpt.pesosPropuestos)
                : null;

        const pred23Adaptativa =
            pesosPropuestos
                ? this.generarPrediccionTemporal({
                    historial: historial22,
                    estadisticas,
                    pesos: pesosPropuestos,
                    semanaObjetivo: semana23,
                    fechaObjetivo: fecha23,
                    variante: "LAB_PESOS_PROPUESTOS",
                    escenarioId
                })
                : null;

        const comparacion =
            this.compararPrediccionesTemporales(
                pred23Base,
                pred23Adaptativa
            );

        const ranking22 =
            Array.isArray(prediccion?.rankingCompleto)
                ? [...prediccion.rankingCompleto]
                    .sort(
                        (a,b) =>
                            Number(a?.orden ?? a?.posicion ?? 999) -
                            Number(b?.orden ?? b?.posicion ?? 999)
                    )
                : [];

        const conjunto =
            new Set(numeros);

        const aciertosTop10 =
            ranking22.slice(0,10)
                .filter(x => conjunto.has(Number(x?.numero)))
                .length;

        const aciertosTop20 =
            ranking22.slice(0,20)
                .filter(x => conjunto.has(Number(x?.numero)))
                .length;

        const cambioPesos =
            this.calcularCambioPesos(
                pesosActivos,
                pesosPropuestos ?? pesosActivos
            );

        const auditoria =
            this.auditarFidelidadTemporal({
                historialTemporal: historial22,
                estadisticasTemporales: estadisticas,
                prediccionBase: pred23Base,
                prediccionAdaptativa: pred23Adaptativa,
                pesosActivos,
                pesosPropuestos,
                semanaEsperada: semana23,
                fechaEsperada: fecha23
            });

        return {
            id: definicion.id,
            nombre: definicion.nombre,
            descripcion: definicion.descripcion,
            escenarioId,
            numeros,
            aciertosTop10,
            aciertosTop20,
            evaluacion,
            evolucion,
            optimizacion,
            estadoOptimizacion: resumenOpt.estado,
            pesosPropuestos,
            cambioPesos,
            prediccion23Base: pred23Base,
            prediccion23Adaptativa: pred23Adaptativa,
            comparacion,
            auditoria,
            top10Base: this.extraerTopPrediccionTemporal(pred23Base,10),
            top10Adaptativo: this.extraerTopPrediccionTemporal(pred23Adaptativa,10),
            liderBase: comparacion.liderBase,
            liderAdaptativo: comparacion.liderAdaptativo,
            cambiosTop10Adaptativos:
                pred23Adaptativa
                    ? 10 - comparacion.coincidenciasTop10
                    : 0
        };
    }


    resumirLaboratorio(
        escenarios
    ) {

        const lista =
            Array.isArray(escenarios)
                ? escenarios
                : [];

        const topAdaptativos =
            lista
                .map(
                    e =>
                        (e.top10Adaptativo?.length
                            ? e.top10Adaptativo
                            : e.top10Base
                        ).map(x => Number(x.numero))
                )
                .filter(x => x.length === 10);

        let nucleoEstable = [];

        if (topAdaptativos.length) {
            nucleoEstable =
                topAdaptativos[0].filter(
                    numero =>
                        topAdaptativos.every(
                            top => top.includes(numero)
                        )
                );
        }

        const frecuencia = {};

        for (const top of topAdaptativos) {
            for (const numero of top) {
                frecuencia[numero] =
                    (frecuencia[numero] ?? 0) + 1;
            }
        }

        const frecuenciaOrdenada =
            Object.entries(frecuencia)
                .map(([numero,cantidad]) => ({
                    numero: Number(numero),
                    cantidad,
                    porcentaje: lista.length
                        ? Number((cantidad/lista.length*100).toFixed(2))
                        : 0
                }))
                .sort(
                    (a,b) =>
                        b.cantidad - a.cantidad ||
                        a.numero - b.numero
                );

        const lideres = {};

        for (const escenario of lista) {
            const lider =
                escenario.liderAdaptativo ??
                escenario.liderBase;

            if (lider != null) {
                lideres[lider] =
                    (lideres[lider] ?? 0) + 1;
            }
        }

        const liderOrdenado =
            Object.entries(lideres)
                .map(([numero,cantidad]) => ({
                    numero: Number(numero),
                    cantidad
                }))
                .sort(
                    (a,b) =>
                        b.cantidad - a.cantidad ||
                        a.numero - b.numero
                );

        const sensibilidadPromedio =
            lista.length
                ? lista.reduce(
                    (t,e) =>
                        t + Number(e.cambiosTop10Adaptativos ?? 0),
                    0
                ) / lista.length
                : 0;

        const volatilidadPromedio =
            lista.length
                ? lista.reduce(
                    (t,e) =>
                        t + Number(e.cambioPesos?.l1 ?? 0),
                    0
                ) / lista.length
                : 0;

        const maxCambioPeso =
            lista.reduce(
                (max,e) => {
                    const actual =
                        e.cambioPesos?.maximo;

                    if (
                        actual &&
                        actual.absoluto >
                        (max?.absoluto ?? -1)
                    ) {
                        return {
                            ...actual,
                            escenario: e.id
                        };
                    }

                    return max;
                },
                null
            );

        const auditoriasValidas =
            lista.filter(
                e => e.auditoria?.valida === true
            ).length;

        return {
            totalEscenarios: lista.length,
            auditoriasValidas,
            nucleoEstable,
            estabilidadNucleoPct:
                Number((nucleoEstable.length/10*100).toFixed(2)),
            frecuenciaTop10: frecuenciaOrdenada,
            lideres: liderOrdenado,
            liderDominante: liderOrdenado[0] ?? null,
            sensibilidadPromedio:
                Number(sensibilidadPromedio.toFixed(3)),
            volatilidadPesosPromedioL1:
                Number(volatilidadPromedio.toFixed(6)),
            maxCambioPeso,
            todosValidos:
                auditoriasValidas === lista.length
        };
    }


    async ejecutarLaboratorioEscenarios() {

        if (!this.esModoSimulacion()) {
            throw new Error(
                "El laboratorio solo está disponible en modo SIMULACION."
            );
        }

        if (!this.escenarioSimulacion) {
            throw new Error(
                "Primero ejecute una simulación individual válida."
            );
        }

        if (this.laboratorioEjecutando) {
            throw new Error(
                "Ya existe un laboratorio en ejecución."
            );
        }

        this.laboratorioEjecutando = true;

        try {
            const prediccionId =
                this.escenarioSimulacion.prediccionBase?.id;

            const prediccion =
                await this.entorno.prediccionService.obtener(
                    prediccionId,
                    { incluirRanking: true }
                );

            if (
                !prediccion ||
                !Array.isArray(prediccion.rankingCompleto) ||
                prediccion.rankingCompleto.length !== 100
            ) {
                throw new Error(
                    "El laboratorio requiere la predicción base completa de 100 números."
                );
            }

            let evaluacionesBase = [];

            try {
                const frescas =
                    await this.entorno.evaluacionService?.obtenerHistorial?.();

                if (Array.isArray(frescas)) {
                    evaluacionesBase =
                        structuredClone(frescas);
                }
            }
            catch (error) {
                console.warn(
                    "Laboratorio: se usará el snapshot de evaluaciones en memoria.",
                    error
                );
            }

            if (
                !evaluacionesBase.length &&
                Array.isArray(this.entorno.evaluacionesPersistidas)
            ) {
                evaluacionesBase =
                    structuredClone(this.entorno.evaluacionesPersistidas);
            }

            const pesosActivos =
                structuredClone(
                    this.entorno.motorManager?.obtenerPesos?.() ?? {}
                );

            const integridadAntes = {
                historial:
                    Array.isArray(this.entorno.datosHistorial)
                        ? this.entorno.datosHistorial.length
                        : null,
                evaluacionesPersistidas:
                    Array.isArray(this.entorno.evaluacionesPersistidas)
                        ? this.entorno.evaluacionesPersistidas.length
                        : null,
                evaluacionesMotor:
                    this.entorno.motorEvaluacion?.obtenerHistorial?.()?.length ?? null,
                ultimaEvaluacionId:
                    this.entorno.ultimaEvaluacion?.id ?? null,
                ultimaEvolucionId:
                    this.entorno.ultimaEvolucion?.id ?? null,
                ultimaOptimizacionId:
                    this.entorno.ultimaOptimizacion?.id ?? null,
                sumaPesos:
                    this.entorno.motorManager?.sumarPesos?.() ?? null
            };

            const definiciones =
                this.generarEscenariosLaboratorio(
                    prediccion,
                    this.escenarioSimulacion.resultadoSimulado
                );

            const resultados = [];

            for (const definicion of definiciones) {
                resultados.push(
                    await this.simularEscenarioLaboratorio({
                        definicion,
                        prediccion,
                        evaluacionesBase,
                        pesosActivos
                    })
                );
            }

            const integridadDespues = {
                historial:
                    Array.isArray(this.entorno.datosHistorial)
                        ? this.entorno.datosHistorial.length
                        : null,
                evaluacionesPersistidas:
                    Array.isArray(this.entorno.evaluacionesPersistidas)
                        ? this.entorno.evaluacionesPersistidas.length
                        : null,
                evaluacionesMotor:
                    this.entorno.motorEvaluacion?.obtenerHistorial?.()?.length ?? null,
                ultimaEvaluacionId:
                    this.entorno.ultimaEvaluacion?.id ?? null,
                ultimaEvolucionId:
                    this.entorno.ultimaEvolucion?.id ?? null,
                ultimaOptimizacionId:
                    this.entorno.ultimaOptimizacion?.id ?? null,
                sumaPesos:
                    this.entorno.motorManager?.sumarPesos?.() ?? null
            };

            const integridadIntacta =
                JSON.stringify(integridadAntes) ===
                JSON.stringify(integridadDespues);

            const resumen =
                this.resumirLaboratorio(resultados);

            const auditoriaCuantitativa =
                this.calcularAuditoriaCuantitativaRobustez(
                    resultados
                );

            this.laboratorioEscenarios = {
                esquema: "LABORATORIO_ESCENARIOS_V2",
                versionControl: this.version,
                creadoEn: new Date().toISOString(),
                persistenciaFirestore: false,
                escriturasFirestore: 0,
                semanaSimulada:
                    this.escenarioSimulacion.semana,
                semanaPrediccion:
                    Number(this.escenarioSimulacion.semana) + 1,
                cantidadEscenarios:
                    resultados.length,
                escenarios: resultados,
                resumen,
                auditoriaCuantitativa,
                integridadReal: {
                    intacta: integridadIntacta,
                    antes: integridadAntes,
                    despues: integridadDespues
                }
            };

            console.log(
                "LABORATORIO DE ESCENARIOS:",
                this.laboratorioEscenarios
            );

            this.renderLaboratorioEscenarios(
                this.laboratorioEscenarios
            );

            return this.laboratorioEscenarios;
        }
        finally {
            this.laboratorioEjecutando = false;
        }
    }



    calcularJaccardTop10(
        topA,
        topB
    ) {

        const a =
            new Set(
                (topA ?? []).map(
                    x => Number(x?.numero ?? x)
                )
            );

        const b =
            new Set(
                (topB ?? []).map(
                    x => Number(x?.numero ?? x)
                )
            );

        const union =
            new Set([
                ...a,
                ...b
            ]);

        if (!union.size) {
            return 0;
        }

        let interseccion = 0;

        for (const numero of a) {
            if (b.has(numero)) {
                interseccion++;
            }
        }

        return Number(
            (interseccion / union.size).toFixed(4)
        );
    }


    calcularAuditoriaCuantitativaRobustez(
        escenarios
    ) {

        const lista =
            Array.isArray(escenarios)
                ? escenarios
                : [];

        const tops =
            lista.map(
                e =>
                    (e.top10Adaptativo?.length
                        ? e.top10Adaptativo
                        : e.top10Base
                    )
                        .slice(0,10)
                        .map(
                            (x,indice) => ({
                                numero: Number(x?.numero),
                                orden: indice + 1
                            })
                        )
            );

        const etiquetas =
            lista.map(e => e.id);

        const matrizJaccard = [];

        for (let i = 0; i < tops.length; i++) {

            const fila = [];

            for (let j = 0; j < tops.length; j++) {
                fila.push(
                    this.calcularJaccardTop10(
                        tops[i],
                        tops[j]
                    )
                );
            }

            matrizJaccard.push(fila);
        }

        const pares = [];

        for (let i = 0; i < tops.length; i++) {
            for (let j = i + 1; j < tops.length; j++) {
                pares.push({
                    a: etiquetas[i],
                    b: etiquetas[j],
                    jaccard: matrizJaccard[i][j]
                });
            }
        }

        const similitudPromedio =
            pares.length
                ? pares.reduce(
                    (t,p) => t + p.jaccard,
                    0
                ) / pares.length
                : 0;

        const parMasSimilar =
            [...pares].sort(
                (a,b) => b.jaccard - a.jaccard
            )[0] ?? null;

        const parMenosSimilar =
            [...pares].sort(
                (a,b) => a.jaccard - b.jaccard
            )[0] ?? null;

        const estabilidadPosicional = [];

        for (let posicion = 0; posicion < 10; posicion++) {

            const frecuencias = {};

            for (const top of tops) {
                const numero =
                    top[posicion]?.numero;

                if (numero == null) {
                    continue;
                }

                frecuencias[numero] =
                    (frecuencias[numero] ?? 0) + 1;
            }

            const dominante =
                Object.entries(frecuencias)
                    .map(([numero,cantidad]) => ({
                        numero: Number(numero),
                        cantidad
                    }))
                    .sort(
                        (a,b) =>
                            b.cantidad - a.cantidad ||
                            a.numero - b.numero
                    )[0] ?? null;

            estabilidadPosicional.push({
                posicion: posicion + 1,
                numeroDominante:
                    dominante?.numero ?? null,
                repeticiones:
                    dominante?.cantidad ?? 0,
                porcentaje:
                    lista.length
                        ? Number(
                            (
                                (dominante?.cantidad ?? 0) /
                                lista.length *
                                100
                            ).toFixed(2)
                        )
                        : 0
            });
        }

        const lideres = {};

        for (const top of tops) {
            const lider = top[0]?.numero;
            if (lider == null) continue;
            lideres[lider] =
                (lideres[lider] ?? 0) + 1;
        }

        const totalLideres =
            Object.values(lideres)
                .reduce((a,b)=>a+b,0);

        let entropiaLider = 0;

        if (totalLideres > 0) {
            for (const cantidad of Object.values(lideres)) {
                const p = cantidad / totalLideres;
                entropiaLider -= p * Math.log2(p);
            }
        }

        const cantidadLideres =
            Object.keys(lideres).length;

        const maxEntropia =
            cantidadLideres > 1
                ? Math.log2(cantidadLideres)
                : 0;

        const entropiaNormalizada =
            maxEntropia > 0
                ? entropiaLider / maxEntropia
                : 0;

        const posicionesPorNumero = {};

        for (const top of tops) {
            for (let i = 0; i < top.length; i++) {
                const numero = top[i].numero;
                posicionesPorNumero[numero] ??= [];
                posicionesPorNumero[numero].push(i + 1);
            }
        }

        const dispersionRanking =
            Object.entries(posicionesPorNumero)
                .map(([numero,posiciones]) => {

                    const promedio =
                        posiciones.reduce((a,b)=>a+b,0) /
                        posiciones.length;

                    const varianza =
                        posiciones.reduce(
                            (t,p) =>
                                t + Math.pow(p - promedio, 2),
                            0
                        ) /
                        posiciones.length;

                    return {
                        numero: Number(numero),
                        apariciones: posiciones.length,
                        posicionPromedio:
                            Number(promedio.toFixed(3)),
                        desviacion:
                            Number(Math.sqrt(varianza).toFixed(3)),
                        minimo: Math.min(...posiciones),
                        maximo: Math.max(...posiciones)
                    };
                })
                .sort(
                    (a,b) =>
                        b.apariciones - a.apariciones ||
                        a.desviacion - b.desviacion ||
                        a.numero - b.numero
                );

        const acumuladoMotores = {};

        for (const escenario of lista) {
            for (const item of (escenario.cambioPesos?.detalle ?? [])) {

                acumuladoMotores[item.motor] ??= {
                    motor: item.motor,
                    sumaAbs: 0,
                    sumaDelta: 0,
                    maxAbs: 0,
                    escenarioMax: null,
                    observaciones: 0
                };

                const acc = acumuladoMotores[item.motor];
                const delta = Number(item.delta ?? 0);
                const abs = Math.abs(delta);

                acc.sumaAbs += abs;
                acc.sumaDelta += delta;
                acc.observaciones++;

                if (abs > acc.maxAbs) {
                    acc.maxAbs = abs;
                    acc.escenarioMax = escenario.id;
                }
            }
        }

        const sensibilidadMotores =
            Object.values(acumuladoMotores)
                .map(acc => ({
                    motor: acc.motor,
                    promedioAbs:
                        Number(
                            (
                                acc.sumaAbs /
                                Math.max(1,acc.observaciones)
                            ).toFixed(6)
                        ),
                    deltaMedio:
                        Number(
                            (
                                acc.sumaDelta /
                                Math.max(1,acc.observaciones)
                            ).toFixed(6)
                        ),
                    maxAbs:
                        Number(acc.maxAbs.toFixed(6)),
                    escenarioMax:
                        acc.escenarioMax
                }))
                .sort(
                    (a,b) =>
                        b.promedioAbs - a.promedioAbs
                );

        const maxFrecuenciaLider =
            lista.length
                ? Object.values(lideres)
                    .reduce((a,b)=>Math.max(a,b),0) /
                  lista.length
                : 0;

        const estabilidadPosicionalMedia =
            estabilidadPosicional.reduce(
                (t,x) => t + x.porcentaje/100,
                0
            ) / 10;

        const robustezIndice =
            Number(
                (
                    (
                        0.45 * similitudPromedio +
                        0.35 * maxFrecuenciaLider +
                        0.20 * estabilidadPosicionalMedia
                    ) * 100
                ).toFixed(2)
            );

        let clasificacion = "BAJA";

        if (robustezIndice >= 75) {
            clasificacion = "ALTA";
        }
        else if (robustezIndice >= 55) {
            clasificacion = "MEDIA";
        }

        return {
            esquema:
                "AUDITORIA_CUANTITATIVA_ROBUSTEZ_V1",
            versionControl:
                this.version,
            totalEscenarios:
                lista.length,
            etiquetas,
            matrizJaccard,
            pares,
            similitudPromedio:
                Number(similitudPromedio.toFixed(4)),
            parMasSimilar,
            parMenosSimilar,
            estabilidadPosicional,
            lideres,
            entropiaLider:
                Number(entropiaLider.toFixed(4)),
            entropiaLiderNormalizada:
                Number(entropiaNormalizada.toFixed(4)),
            dispersionRanking,
            sensibilidadMotores,
            robustezIndice,
            clasificacion
        };
    }



    crearPRNG(
        semilla = 1709
    ) {

        let estado =
            Number(semilla) >>> 0;

        return () => {

            estado +=
                0x6D2B79F5;

            let t =
                estado;

            t =
                Math.imul(
                    t ^ (t >>> 15),
                    t | 1
                );

            t ^=
                t +
                Math.imul(
                    t ^ (t >>> 7),
                    t | 61
                );

            return (
                (
                    t ^ (t >>> 14)
                ) >>> 0
            ) / 4294967296;
        };
    }


    muestrearSinReemplazo(
        fuente,
        cantidad,
        random
    ) {

        const bolsa =
            [...new Set(
                (fuente ?? []).map(Number)
            )];

        const salida = [];

        while (
            salida.length < cantidad &&
            bolsa.length
        ) {
            const indice =
                Math.floor(
                    random() * bolsa.length
                );

            salida.push(
                bolsa.splice(indice,1)[0]
            );
        }

        return salida;
    }


    generarBancoEscenarios({
        prediccion,
        numerosReferencia,
        cantidad = 30,
        semilla = 1709
    }={}) {

        const ranking =
            Array.isArray(prediccion?.rankingCompleto)
                ? [...prediccion.rankingCompleto]
                    .sort(
                        (a,b) =>
                            Number(a?.orden ?? a?.posicion ?? 999) -
                            Number(b?.orden ?? b?.posicion ?? 999)
                    )
                    .map(x => Number(x.numero))
                : [];

        if (ranking.length !== 100) {
            throw new Error(
                "El banco reproducible requiere ranking completo de 100 números."
            );
        }

        const referencia =
            [...new Set(
                (numerosReferencia ?? []).map(Number)
            )].slice(0,10);

        if (referencia.length !== 10) {
            throw new Error(
                "El banco reproducible requiere 10 números de referencia."
            );
        }

        const top10 =
            ranking.slice(0,10);

        const top20 =
            ranking.slice(0,20);

        const top40 =
            ranking.slice(0,40);

        const medio =
            ranking.slice(30,70);

        const bajo =
            ranking.slice(70,100);

        const universo =
            ranking;

        const random =
            this.crearPRNG(semilla);

        const escenarios = [];

        const construir =
            (
                id,
                tipo,
                descripcion,
                partes
            ) => {

                const numeros = [];

                for (const parte of partes) {

                    const candidatos =
                        parte.fuente.filter(
                            n => !numeros.includes(n)
                        );

                    numeros.push(
                        ...this.muestrearSinReemplazo(
                            candidatos,
                            parte.cantidad,
                            random
                        )
                    );
                }

                if (numeros.length < 10) {
                    numeros.push(
                        ...this.muestrearSinReemplazo(
                            universo.filter(
                                n => !numeros.includes(n)
                            ),
                            10 - numeros.length,
                            random
                        )
                    );
                }

                return {
                    id,
                    nombre:
                        `${tipo} ${String(id).padStart(2,"0")}`,
                    descripcion,
                    tipo,
                    numeros:
                        numeros.slice(0,10)
                };
            };

        for (
            let i = 0;
            i < cantidad;
            i++
        ) {

            const bloque =
                i % 6;

            let definicion;

            if (bloque === 0) {
                definicion =
                    construir(
                        i + 1,
                        "REFERENCIA",
                        "Alta conservación del escenario actual.",
                        [
                            {
                                fuente: referencia,
                                cantidad: 8
                            },
                            {
                                fuente: top20,
                                cantidad: 2
                            }
                        ]
                    );
            }
            else if (bloque === 1) {
                definicion =
                    construir(
                        i + 1,
                        "TOP",
                        "Alta concentración en candidatos TOP20.",
                        [
                            {
                                fuente: top10,
                                cantidad: 5
                            },
                            {
                                fuente: top20,
                                cantidad: 5
                            }
                        ]
                    );
            }
            else if (bloque === 2) {
                definicion =
                    construir(
                        i + 1,
                        "MIXTO",
                        "Mezcla equilibrada entre TOP40 y zona media.",
                        [
                            {
                                fuente: top40,
                                cantidad: 5
                            },
                            {
                                fuente: medio,
                                cantidad: 5
                            }
                        ]
                    );
            }
            else if (bloque === 3) {
                definicion =
                    construir(
                        i + 1,
                        "MEDIO",
                        "Concentración en posiciones intermedias.",
                        [
                            {
                                fuente: medio,
                                cantidad: 8
                            },
                            {
                                fuente: universo,
                                cantidad: 2
                            }
                        ]
                    );
            }
            else if (bloque === 4) {
                definicion =
                    construir(
                        i + 1,
                        "CONTRASTE",
                        "Concentración deliberada en el tercio inferior.",
                        [
                            {
                                fuente: bajo,
                                cantidad: 8
                            },
                            {
                                fuente: universo,
                                cantidad: 2
                            }
                        ]
                    );
            }
            else {
                definicion =
                    construir(
                        i + 1,
                        "UNIFORME",
                        "Muestra distribuida sobre el ranking completo.",
                        [
                            {
                                fuente: universo,
                                cantidad: 10
                            }
                        ]
                    );
            }

            escenarios.push(definicion);
        }

        return {
            esquema:
                "BANCO_ESCENARIOS_REPRODUCIBLE_V1",
            semilla:
                Number(semilla),
            cantidad:
                escenarios.length,
            escenarios
        };
    }


    percentil(
        valores,
        p
    ) {

        const lista =
            (valores ?? [])
                .map(Number)
                .filter(Number.isFinite)
                .sort((a,b)=>a-b);

        if (!lista.length) {
            return null;
        }

        const indice =
            (lista.length - 1) * p;

        const base =
            Math.floor(indice);

        const resto =
            indice - base;

        if (
            lista[base + 1] !== undefined
        ) {
            return Number(
                (
                    lista[base] +
                    resto *
                    (
                        lista[base + 1] -
                        lista[base]
                    )
                ).toFixed(6)
            );
        }

        return Number(
            lista[base].toFixed(6)
        );
    }


    resumirBancoEscenarios(
        resultados
    ) {

        const lista =
            Array.isArray(resultados)
                ? resultados
                : [];

        const lideres = {};

        const frecuenciaTop10 = {};

        const jaccards = [];

        const volatilidades = [];

        const cambiosTop10 = [];

        for (const escenario of lista) {

            const top =
                (escenario.top10Adaptativo?.length
                    ? escenario.top10Adaptativo
                    : escenario.top10Base
                ).map(
                    x => Number(x.numero)
                );

            for (const numero of top) {
                frecuenciaTop10[numero] =
                    (frecuenciaTop10[numero] ?? 0) + 1;
            }

            const lider =
                escenario.liderAdaptativo ??
                escenario.liderBase;

            if (lider != null) {
                lideres[lider] =
                    (lideres[lider] ?? 0) + 1;
            }

            if (
                Number.isFinite(
                    Number(
                        escenario.comparacion?.jaccardTop10
                    )
                )
            ) {
                jaccards.push(
                    Number(
                        escenario.comparacion.jaccardTop10
                    )
                );
            }
            else if (
                escenario.prediccion23Adaptativa
            ) {
                jaccards.push(
                    this.calcularJaccardTop10(
                        escenario.top10Base,
                        escenario.top10Adaptativo
                    )
                );
            }

            volatilidades.push(
                Number(
                    escenario.cambioPesos?.l1 ?? 0
                )
            );

            cambiosTop10.push(
                Number(
                    escenario.cambiosTop10Adaptativos ?? 0
                )
            );
        }

        const frecuencia =
            Object.entries(frecuenciaTop10)
                .map(([numero,cantidad]) => ({
                    numero: Number(numero),
                    cantidad,
                    porcentaje:
                        lista.length
                            ? Number(
                                (
                                    cantidad /
                                    lista.length *
                                    100
                                ).toFixed(2)
                            )
                            : 0
                }))
                .sort(
                    (a,b) =>
                        b.cantidad - a.cantidad ||
                        a.numero - b.numero
                );

        const lideresOrdenados =
            Object.entries(lideres)
                .map(([numero,cantidad]) => ({
                    numero: Number(numero),
                    cantidad,
                    porcentaje:
                        lista.length
                            ? Number(
                                (
                                    cantidad /
                                    lista.length *
                                    100
                                ).toFixed(2)
                            )
                            : 0
                }))
                .sort(
                    (a,b) =>
                        b.cantidad - a.cantidad ||
                        a.numero - b.numero
                );

        let nucleo100 =
            frecuencia
                .filter(
                    x =>
                        x.cantidad ===
                        lista.length
                )
                .map(x => x.numero);

        const nucleo80 =
            frecuencia
                .filter(
                    x =>
                        x.porcentaje >= 80
                )
                .map(x => x.numero);

        const promedio =
            arr =>
                arr.length
                    ? arr.reduce((a,b)=>a+b,0)/arr.length
                    : 0;

        const auditoriasValidas =
            lista.filter(
                x => x.auditoria?.valida === true
            ).length;

        return {
            totalEscenarios:
                lista.length,
            auditoriasValidas,
            todosValidos:
                auditoriasValidas === lista.length,
            frecuenciaTop10:
                frecuencia,
            lideres:
                lideresOrdenados,
            liderDominante:
                lideresOrdenados[0] ?? null,
            nucleo100,
            nucleo80,
            jaccardActivoAdaptativo: {
                promedio:
                    Number(promedio(jaccards).toFixed(6)),
                p10:
                    this.percentil(jaccards,0.10),
                mediana:
                    this.percentil(jaccards,0.50),
                p90:
                    this.percentil(jaccards,0.90)
            },
            volatilidadPesosL1: {
                promedio:
                    Number(promedio(volatilidades).toFixed(6)),
                p10:
                    this.percentil(volatilidades,0.10),
                mediana:
                    this.percentil(volatilidades,0.50),
                p90:
                    this.percentil(volatilidades,0.90)
            },
            cambiosTop10: {
                promedio:
                    Number(promedio(cambiosTop10).toFixed(6)),
                p10:
                    this.percentil(cambiosTop10,0.10),
                mediana:
                    this.percentil(cambiosTop10,0.50),
                p90:
                    this.percentil(cambiosTop10,0.90)
            }
        };
    }


    async ejecutarBancoEscenarios({
        cantidad = 30,
        semilla = 1709
    }={}) {

        if (!this.esModoSimulacion()) {
            throw new Error(
                "El banco de escenarios solo está disponible en modo SIMULACION."
            );
        }

        if (!this.escenarioSimulacion) {
            throw new Error(
                "Primero ejecute una simulación individual válida."
            );
        }

        if (this.bancoEscenariosEjecutando) {
            throw new Error(
                "Ya existe un banco de escenarios en ejecución."
            );
        }

        this.bancoEscenariosEjecutando = true;

        try {

            const prediccionId =
                this.escenarioSimulacion.prediccionBase?.id;

            const prediccion =
                await this.entorno.prediccionService.obtener(
                    prediccionId,
                    {
                        incluirRanking: true
                    }
                );

            if (
                !prediccion ||
                !Array.isArray(prediccion.rankingCompleto) ||
                prediccion.rankingCompleto.length !== 100
            ) {
                throw new Error(
                    "El banco requiere ranking completo de 100 números."
                );
            }

            let evaluacionesBase = [];

            try {
                const frescas =
                    await this.entorno.evaluacionService?.obtenerHistorial?.();

                if (Array.isArray(frescas)) {
                    evaluacionesBase =
                        structuredClone(frescas);
                }
            }
            catch (error) {
                console.warn(
                    "Banco de escenarios: se usará snapshot de evaluaciones.",
                    error
                );
            }

            if (
                !evaluacionesBase.length &&
                Array.isArray(
                    this.entorno.evaluacionesPersistidas
                )
            ) {
                evaluacionesBase =
                    structuredClone(
                        this.entorno.evaluacionesPersistidas
                    );
            }

            const pesosActivos =
                structuredClone(
                    this.entorno.motorManager?.obtenerPesos?.() ?? {}
                );

            const integridadAntes = {
                historial:
                    Array.isArray(this.entorno.datosHistorial)
                        ? this.entorno.datosHistorial.length
                        : null,
                evaluacionesPersistidas:
                    Array.isArray(this.entorno.evaluacionesPersistidas)
                        ? this.entorno.evaluacionesPersistidas.length
                        : null,
                evaluacionesMotor:
                    this.entorno.motorEvaluacion?.obtenerHistorial?.()?.length ?? null,
                ultimaEvaluacionId:
                    this.entorno.ultimaEvaluacion?.id ?? null,
                ultimaEvolucionId:
                    this.entorno.ultimaEvolucion?.id ?? null,
                ultimaOptimizacionId:
                    this.entorno.ultimaOptimizacion?.id ?? null,
                sumaPesos:
                    this.entorno.motorManager?.sumarPesos?.() ?? null
            };

            const banco =
                this.generarBancoEscenarios({
                    prediccion,
                    numerosReferencia:
                        this.escenarioSimulacion.resultadoSimulado,
                    cantidad,
                    semilla
                });

            const resultados = [];

            for (
                const definicion of banco.escenarios
            ) {

                resultados.push(
                    await this.simularEscenarioLaboratorio({
                        definicion,
                        prediccion,
                        evaluacionesBase,
                        pesosActivos
                    })
                );
            }

            const integridadDespues = {
                historial:
                    Array.isArray(this.entorno.datosHistorial)
                        ? this.entorno.datosHistorial.length
                        : null,
                evaluacionesPersistidas:
                    Array.isArray(this.entorno.evaluacionesPersistidas)
                        ? this.entorno.evaluacionesPersistidas.length
                        : null,
                evaluacionesMotor:
                    this.entorno.motorEvaluacion?.obtenerHistorial?.()?.length ?? null,
                ultimaEvaluacionId:
                    this.entorno.ultimaEvaluacion?.id ?? null,
                ultimaEvolucionId:
                    this.entorno.ultimaEvolucion?.id ?? null,
                ultimaOptimizacionId:
                    this.entorno.ultimaOptimizacion?.id ?? null,
                sumaPesos:
                    this.entorno.motorManager?.sumarPesos?.() ?? null
            };

            const integridadIntacta =
                JSON.stringify(integridadAntes) ===
                JSON.stringify(integridadDespues);

            const resumen =
                this.resumirBancoEscenarios(
                    resultados
                );

            const auditoriaRobustezCruzada =
                this.auditarRobustezCruzadaBanco(
                    resultados
                );

            const consensoRobustoFamilias =
                this.calcularConsensoRobustoPorFamilias(
                    auditoriaRobustezCruzada
                );

            this.bancoEscenarios = {
                esquema:
                    "BANCO_ESCENARIOS_REPRODUCIBLE_V1",
                versionControl:
                    this.version,
                creadoEn:
                    new Date().toISOString(),
                persistenciaFirestore:
                    false,
                escriturasFirestore:
                    0,
                semilla:
                    banco.semilla,
                cantidadEscenarios:
                    resultados.length,
                resultados,
                resumen,
                auditoriaRobustezCruzada,
                consensoRobustoFamilias,
                integridadReal: {
                    intacta:
                        integridadIntacta,
                    antes:
                        integridadAntes,
                    despues:
                        integridadDespues
                }
            };

            console.log(
                "BANCO DE ESCENARIOS:",
                this.bancoEscenarios
            );

            this.renderBancoEscenarios(
                this.bancoEscenarios
            );

            return this.bancoEscenarios;
        }
        finally {
            this.bancoEscenariosEjecutando =
                false;
        }
    }



    auditarRobustezCruzadaBanco(
        resultados
    ) {

        const lista =
            Array.isArray(resultados)
                ? resultados
                : [];

        const extraerTop =
            escenario =>
                (
                    escenario?.top10Adaptativo?.length
                        ? escenario.top10Adaptativo
                        : escenario?.top10Base ?? []
                )
                    .slice(0,10)
                    .map(
                        x => Number(x?.numero ?? x)
                    );

        const tops =
            lista.map(extraerTop);

        const pares = [];

        for (let i = 0; i < tops.length; i++) {
            for (let j = i + 1; j < tops.length; j++) {

                pares.push({
                    i,
                    j,
                    idA: lista[i]?.id,
                    idB: lista[j]?.id,
                    tipoA: lista[i]?.tipo ?? lista[i]?.nombre ?? null,
                    tipoB: lista[j]?.tipo ?? lista[j]?.nombre ?? null,
                    jaccard:
                        this.calcularJaccardTop10(
                            tops[i],
                            tops[j]
                        )
                });
            }
        }

        const valores =
            pares.map(x => Number(x.jaccard));

        const promedio =
            valores.length
                ? valores.reduce((a,b)=>a+b,0) /
                  valores.length
                : 0;

        const ordenados =
            [...pares].sort(
                (a,b) =>
                    a.jaccard - b.jaccard
            );

        const parMenosSimilar =
            ordenados[0] ?? null;

        const parMasSimilar =
            ordenados.length
                ? ordenados[ordenados.length - 1]
                : null;

        const frecuencia = {};

        for (const top of tops) {
            for (const numero of top) {
                frecuencia[numero] =
                    (frecuencia[numero] ?? 0) + 1;
            }
        }

        const consenso =
            Object.entries(frecuencia)
                .map(([numero,cantidad]) => ({
                    numero: Number(numero),
                    cantidad,
                    porcentaje:
                        lista.length
                            ? Number(
                                (
                                    cantidad /
                                    lista.length *
                                    100
                                ).toFixed(2)
                            )
                            : 0
                }))
                .sort(
                    (a,b) =>
                        b.cantidad - a.cantidad ||
                        a.numero - b.numero
                );

        const lideres = {};

        for (const top of tops) {
            const lider = top[0];

            if (lider == null) {
                continue;
            }

            lideres[lider] =
                (lideres[lider] ?? 0) + 1;
        }

        const totalLideres =
            Object.values(lideres)
                .reduce((a,b)=>a+b,0);

        let entropia = 0;

        if (totalLideres) {
            for (const cantidad of Object.values(lideres)) {
                const p =
                    cantidad / totalLideres;

                entropia -=
                    p * Math.log2(p);
            }
        }

        const maxEntropia =
            Object.keys(lideres).length > 1
                ? Math.log2(
                    Object.keys(lideres).length
                )
                : 0;

        const entropiaNormalizada =
            maxEntropia > 0
                ? entropia / maxEntropia
                : 0;

        const porTipoMap = {};

        for (let i = 0; i < lista.length; i++) {

            const tipoRaw =
                String(
                    lista[i]?.tipo ??
                    lista[i]?.nombre ??
                    "SIN_TIPO"
                )
                    .trim()
                    .toUpperCase();

            const tipo =
                tipoRaw
                    .replace(/\s+\d+$/,"")
                    .trim() ||
                "SIN_TIPO";

            porTipoMap[tipo] ??= {
                tipo,
                cantidad: 0,
                frecuencia: {},
                lideres: {}
            };

            const grupo =
                porTipoMap[tipo];

            grupo.cantidad++;

            for (const numero of tops[i]) {
                grupo.frecuencia[numero] =
                    (grupo.frecuencia[numero] ?? 0) + 1;
            }

            const lider =
                tops[i][0];

            if (lider != null) {
                grupo.lideres[lider] =
                    (grupo.lideres[lider] ?? 0) + 1;
            }
        }

        const porTipo =
            Object.values(porTipoMap)
                .map(grupo => {

                    const topFrecuencia =
                        Object.entries(grupo.frecuencia)
                            .map(([numero,cantidad]) => ({
                                numero: Number(numero),
                                cantidad,
                                porcentaje:
                                    Number(
                                        (
                                            cantidad /
                                            grupo.cantidad *
                                            100
                                        ).toFixed(2)
                                    )
                            }))
                            .sort(
                                (a,b) =>
                                    b.cantidad - a.cantidad ||
                                    a.numero - b.numero
                            )
                            .slice(0,10);

                    const lideresGrupo =
                        Object.entries(grupo.lideres)
                            .map(([numero,cantidad]) => ({
                                numero: Number(numero),
                                cantidad,
                                porcentaje:
                                    Number(
                                        (
                                            cantidad /
                                            grupo.cantidad *
                                            100
                                        ).toFixed(2)
                                    )
                            }))
                            .sort(
                                (a,b) =>
                                    b.cantidad - a.cantidad ||
                                    a.numero - b.numero
                            );

                    const indicesGrupo =
                        lista
                            .map((escenario,indice)=>({
                                indice,
                                tipo:
                                    String(
                                        escenario?.tipo ??
                                        escenario?.nombre ??
                                        "SIN_TIPO"
                                    )
                                        .trim()
                                        .toUpperCase()
                                        .replace(/\s+\d+$/,"")
                                        .trim()
                            }))
                            .filter(x=>x.tipo === grupo.tipo)
                            .map(x=>x.indice);

                    const jaccardsGrupo = [];

                    for (let a = 0; a < indicesGrupo.length; a++) {
                        for (let b = a + 1; b < indicesGrupo.length; b++) {
                            jaccardsGrupo.push(
                                this.calcularJaccardTop10(
                                    tops[indicesGrupo[a]],
                                    tops[indicesGrupo[b]]
                                )
                            );
                        }
                    }

                    const promedioJaccardGrupo =
                        jaccardsGrupo.length
                            ? jaccardsGrupo.reduce((x,y)=>x+y,0) /
                              jaccardsGrupo.length
                            : 1;

                    const nucleo100Grupo =
                        topFrecuencia
                            .filter(x=>x.porcentaje === 100)
                            .map(x=>x.numero);

                    const nucleo80Grupo =
                        topFrecuencia
                            .filter(x=>x.porcentaje >= 80)
                            .map(x=>x.numero);

                    return {
                        tipo: grupo.tipo,
                        cantidad: grupo.cantidad,
                        topFrecuencia,
                        liderDominante:
                            lideresGrupo[0] ?? null,
                        jaccardInternoPromedio:
                            Number(promedioJaccardGrupo.toFixed(6)),
                        nucleo100:
                            nucleo100Grupo,
                        nucleo80:
                            nucleo80Grupo
                    };
                })
                .sort(
                    (a,b) =>
                        String(a.tipo)
                            .localeCompare(
                                String(b.tipo)
                            )
                );

        /*
         * Índice cruzado:
         * 60% similitud media entre escenarios
         * 25% estabilidad del líder
         * 15% tamaño relativo del núcleo >=80%
         */
        const liderDominanteCantidad =
            Object.values(lideres)
                .reduce(
                    (max,v) =>
                        Math.max(max,v),
                    0
                );

        const estabilidadLider =
            lista.length
                ? liderDominanteCantidad /
                  lista.length
                : 0;

        const nucleo80 =
            consenso.filter(
                x => x.porcentaje >= 80
            );

        const nucleo80Ratio =
            Math.min(
                1,
                nucleo80.length / 10
            );

        const indice =
            Number(
                (
                    (
                        0.60 * promedio +
                        0.25 * estabilidadLider +
                        0.15 * nucleo80Ratio
                    ) *
                    100
                ).toFixed(2)
            );

        let clasificacion = "BAJA";

        if (indice >= 75) {
            clasificacion = "ALTA";
        }
        else if (indice >= 55) {
            clasificacion = "MEDIA";
        }

        return {
            esquema:
                "AUDITORIA_ROBUSTEZ_CRUZADA_BANCO_V1",
            versionControl:
                this.version,
            totalEscenarios:
                lista.length,
            totalComparaciones:
                pares.length,
            jaccardEntreEscenarios: {
                promedio:
                    Number(promedio.toFixed(6)),
                p10:
                    this.percentil(valores,0.10),
                mediana:
                    this.percentil(valores,0.50),
                p90:
                    this.percentil(valores,0.90),
                minimo:
                    valores.length
                        ? Math.min(...valores)
                        : null,
                maximo:
                    valores.length
                        ? Math.max(...valores)
                        : null
            },
            parMasSimilar,
            parMenosSimilar,
            consenso,
            nucleo80:
                nucleo80.map(x=>x.numero),
            lideres,
            entropiaLider:
                Number(entropia.toFixed(6)),
            entropiaLiderNormalizada:
                Number(entropiaNormalizada.toFixed(6)),
            estabilidadLider:
                Number(
                    (
                        estabilidadLider *
                        100
                    ).toFixed(2)
                ),
            porTipo,
            indiceRobustezCruzada:
                indice,
            clasificacion
        };
    }



    calcularConsensoRobustoPorFamilias(
        auditoriaCruzada
    ) {

        const grupos =
            Array.isArray(auditoriaCruzada?.porTipo)
                ? auditoriaCruzada.porTipo
                : [];

        if (!grupos.length) {
            return {
                esquema:
                    "CONSENSO_ROBUSTO_FAMILIAS_V1",
                versionControl:
                    this.version,
                familias: 0,
                ranking: [],
                nucleoRobusto: [],
                nucleoMuyRobusto: []
            };
        }

        const pesosFamilia = {};

        for (const grupo of grupos) {

            /*
             * La familia con mayor coherencia interna pesa más,
             * pero se mantiene un piso para evitar anular familias sensibles.
             */
            const coherencia =
                Number(
                    grupo.jaccardInternoPromedio ?? 0
                );

            pesosFamilia[grupo.tipo] =
                0.50 + 0.50 * coherencia;
        }

        const numeros =
            new Map();

        for (const grupo of grupos) {

            const pesoFamilia =
                pesosFamilia[grupo.tipo] ?? 1;

            for (
                const item of
                (grupo.topFrecuencia ?? [])
            ) {

                const numero =
                    Number(item.numero);

                if (!numeros.has(numero)) {
                    numeros.set(numero, {
                        numero,
                        sumaPonderada: 0,
                        sumaPesos: 0,
                        familiasPresente: 0,
                        familias80: 0,
                        familias100: 0,
                        detalle: []
                    });
                }

                const registro =
                    numeros.get(numero);

                const presencia =
                    Number(item.porcentaje ?? 0) / 100;

                registro.sumaPonderada +=
                    presencia * pesoFamilia;

                registro.sumaPesos +=
                    pesoFamilia;

                if (presencia > 0) {
                    registro.familiasPresente++;
                }

                if (presencia >= 0.80) {
                    registro.familias80++;
                }

                if (presencia >= 1) {
                    registro.familias100++;
                }

                registro.detalle.push({
                    familia:
                        grupo.tipo,
                    porcentaje:
                        Number(item.porcentaje ?? 0),
                    pesoFamilia:
                        Number(
                            pesoFamilia.toFixed(6)
                        ),
                    contribucion:
                        Number(
                            (
                                presencia *
                                pesoFamilia
                            ).toFixed(6)
                        )
                });
            }
        }

        const totalFamilias =
            grupos.length;

        const ranking =
            [...numeros.values()]
                .map(registro => {

                    const score =
                        registro.sumaPesos > 0
                            ? (
                                registro.sumaPonderada /
                                registro.sumaPesos
                              ) * 100
                            : 0;

                    /*
                     * Cobertura familiar:
                     * 1.0 únicamente si el número aparece
                     * en las seis familias.
                     */
                    const cobertura =
                        registro.familiasPresente /
                        totalFamilias;

                    /*
                     * Estabilidad interna:
                     * combina cuántas familias alcanzan
                     * >=80% y cuántas alcanzan 100%.
                     */
                    const estabilidad80 =
                        registro.familias80 /
                        totalFamilias;

                    const estabilidad100 =
                        registro.familias100 /
                        totalFamilias;

                    /*
                     * Score robusto v2:
                     *
                     * - 70% presencia ponderada
                     * - 20% cobertura entre familias
                     * - 7% estabilidad >=80%
                     * - 3% estabilidad 100%
                     *
                     * La cobertura actúa además como factor
                     * multiplicativo suave. Así un candidato
                     * ausente en una familia ya no puede
                     * saturar artificialmente en 100.
                     */
                    const scoreCombinado =
                        (
                            score * 0.70
                        ) +
                        (
                            cobertura * 100 * 0.20
                        ) +
                        (
                            estabilidad80 * 100 * 0.07
                        ) +
                        (
                            estabilidad100 * 100 * 0.03
                        );

                    const factorCobertura =
                        0.80 +
                        0.20 * cobertura;

                    const scoreRobusto =
                        Math.max(
                            0,
                            Math.min(
                                100,
                                scoreCombinado *
                                factorCobertura
                            )
                        );

                    let nivelRobustez =
                        "BAJO";

                    if (
                        cobertura === 1 &&
                        estabilidad80 >= (5 / 6) &&
                        scoreRobusto >= 90
                    ) {
                        nivelRobustez =
                            "MUY_ROBUSTO";
                    }
                    else if (
                        cobertura === 1 &&
                        estabilidad80 >= (4 / 6) &&
                        scoreRobusto >= 80
                    ) {
                        nivelRobustez =
                            "ROBUSTO";
                    }
                    else if (
                        cobertura >= (5 / 6) &&
                        scoreRobusto >= 75
                    ) {
                        nivelRobustez =
                            "ESTABLE";
                    }
                    else if (
                        cobertura >= (4 / 6) &&
                        scoreRobusto >= 65
                    ) {
                        nivelRobustez =
                            "MODERADO";
                    }

                    return {
                        numero:
                            registro.numero,
                        scoreBase:
                            Number(score.toFixed(4)),
                        scoreRobusto:
                            Number(scoreRobusto.toFixed(4)),
                        nivelRobustez,
                        familiasPresente:
                            registro.familiasPresente,
                        familias80:
                            registro.familias80,
                        familias100:
                            registro.familias100,
                        coberturaPct:
                            Number(
                                (
                                    cobertura *
                                    100
                                ).toFixed(2)
                            ),
                        detalle:
                            registro.detalle
                    };
                })
                .sort(
                    (a,b) =>
                        b.scoreRobusto - a.scoreRobusto ||
                        b.familias100 - a.familias100 ||
                        b.familias80 - a.familias80 ||
                        a.numero - b.numero
                )
                .map((x,indice)=>({
                    ...x,
                    orden:
                        indice + 1
                }));

        const nucleoMuyRobusto =
            ranking
                .filter(
                    x =>
                        x.nivelRobustez ===
                        "MUY_ROBUSTO"
                )
                .map(x=>x.numero);

        const nucleoRobusto =
            ranking
                .filter(
                    x =>
                        x.nivelRobustez ===
                            "MUY_ROBUSTO" ||
                        x.nivelRobustez ===
                            "ROBUSTO"
                )
                .map(x=>x.numero);

        const familiaMasEstable =
            [...grupos]
                .sort(
                    (a,b) =>
                        Number(b.jaccardInternoPromedio ?? 0) -
                        Number(a.jaccardInternoPromedio ?? 0)
                )[0] ?? null;

        const familiaMasSensible =
            [...grupos]
                .sort(
                    (a,b) =>
                        Number(a.jaccardInternoPromedio ?? 0) -
                        Number(b.jaccardInternoPromedio ?? 0)
                )[0] ?? null;

        return {
            esquema:
                "CONSENSO_ROBUSTO_FAMILIAS_V1",
            versionControl:
                this.version,
            familias:
                totalFamilias,
            pesosFamilia,
            ranking,
            top10:
                ranking.slice(0,10),
            nucleoRobusto,
            nucleoMuyRobusto,
            niveles: {
                muyRobusto:
                    ranking.filter(
                        x => x.nivelRobustez ===
                            "MUY_ROBUSTO"
                    ).length,
                robusto:
                    ranking.filter(
                        x => x.nivelRobustez ===
                            "ROBUSTO"
                    ).length,
                estable:
                    ranking.filter(
                        x => x.nivelRobustez ===
                            "ESTABLE"
                    ).length,
                moderado:
                    ranking.filter(
                        x => x.nivelRobustez ===
                            "MODERADO"
                    ).length,
                bajo:
                    ranking.filter(
                        x => x.nivelRobustez ===
                            "BAJO"
                    ).length
            },
            familiaMasEstable:
                familiaMasEstable
                    ? {
                        tipo:
                            familiaMasEstable.tipo,
                        jaccard:
                            familiaMasEstable.jaccardInternoPromedio
                    }
                    : null,
            familiaMasSensible:
                familiaMasSensible
                    ? {
                        tipo:
                            familiaMasSensible.tipo,
                        jaccard:
                            familiaMasSensible.jaccardInternoPromedio
                    }
                    : null
        };
    }



    obtenerPesosBaseWalkForward() {

        const originales = {
            frecuencia: 15,
            atraso: 10,
            tendencia: 20,
            repeticion: 10,
            historico: 15,
            paridad: 5,
            rangos: 5,
            distribucion: 5,
            asociaciones: 10,
            ciclos: 15
        };

        const suma =
            Object.values(originales)
                .reduce((t,v)=>t+Number(v),0);

        return Object.fromEntries(
            Object.entries(originales)
                .map(([motor,peso])=>[
                    motor,
                    Number(
                        (
                            Number(peso) /
                            suma *
                            100
                        ).toFixed(6)
                    )
                ])
        );
    }


    evaluarPrediccionWalkForward(
        prediccion,
        numerosReales
    ) {

        const ranking =
            [
                prediccion?.rankingCompleto,
                prediccion?.ranking,
                prediccion?.top100
            ].find(Array.isArray) ?? [];

        const ordenado =
            [...ranking]
                .sort(
                    (a,b)=>
                        Number(a?.orden ?? a?.posicion ?? 999) -
                        Number(b?.orden ?? b?.posicion ?? 999)
                );

        const mapa =
            new Map(
                ordenado.map((item,indice)=>[
                    Number(item?.numero),
                    Number(
                        item?.orden ??
                        indice + 1
                    )
                ])
            );

        const reales =
            [...new Set(
                (numerosReales ?? [])
                    .map(Number)
            )];

        const posiciones =
            reales
                .map(numero=>({
                    numero,
                    orden:
                        mapa.get(numero) ?? null
                }))
                .filter(x=>x.orden != null);

        const top10 =
            posiciones.filter(
                x=>x.orden <= 10
            );

        const top20 =
            posiciones.filter(
                x=>x.orden <= 20
            );

        const ordenes =
            posiciones.map(x=>x.orden);

        return {
            totalReales:
                reales.length,
            encontrados:
                posiciones.length,
            aciertosTop10:
                top10.length,
            aciertosTop20:
                top20.length,
            top10:
                top10.map(x=>x.numero),
            top20:
                top20.map(x=>x.numero),
            mejorOrden:
                ordenes.length
                    ? Math.min(...ordenes)
                    : null,
            promedioOrden:
                ordenes.length
                    ? Number(
                        (
                            ordenes.reduce((a,b)=>a+b,0) /
                            ordenes.length
                        ).toFixed(4)
                    )
                    : null,
            posicionesReales:
                posiciones
                    .map(x=>({
                        numero:
                            Number(x.numero),
                        orden:
                            Number(x.orden)
                    }))
        };
    }



    combinacionFloat(
        n,
        k
    ) {

        const nn =
            Number(n);

        let kk =
            Number(k);

        if (
            !Number.isInteger(nn) ||
            !Number.isInteger(kk) ||
            kk < 0 ||
            nn < 0 ||
            kk > nn
        ) {
            return 0;
        }

        kk =
            Math.min(
                kk,
                nn - kk
            );

        let resultado = 1;

        for (
            let i = 1;
            i <= kk;
            i++
        ) {
            resultado *=
                (
                    nn - kk + i
                ) / i;
        }

        return resultado;
    }


    pmfHipergeometrica(
        N,
        K,
        n
    ) {

        const poblacion =
            Number(N);

        const exitosPoblacion =
            Number(K);

        const muestra =
            Number(n);

        const minimo =
            Math.max(
                0,
                muestra -
                (
                    poblacion -
                    exitosPoblacion
                )
            );

        const maximo =
            Math.min(
                muestra,
                exitosPoblacion
            );

        const denominador =
            this.combinacionFloat(
                poblacion,
                muestra
            );

        const pmf = [];

        for (
            let x = minimo;
            x <= maximo;
            x++
        ) {

            const probabilidad =
                (
                    this.combinacionFloat(
                        exitosPoblacion,
                        x
                    ) *
                    this.combinacionFloat(
                        poblacion -
                            exitosPoblacion,
                        muestra - x
                    )
                ) /
                denominador;

            pmf[x] =
                probabilidad;
        }

        for (
            let x = 0;
            x <= muestra;
            x++
        ) {
            if (!Number.isFinite(pmf[x])) {
                pmf[x] = 0;
            }
        }

        return pmf;
    }


    convolucionDistribuciones(
        a,
        b
    ) {

        const salida =
            new Array(
                a.length +
                b.length -
                1
            )
                .fill(0);

        for (
            let i = 0;
            i < a.length;
            i++
        ) {
            for (
                let j = 0;
                j < b.length;
                j++
            ) {
                salida[i+j] +=
                    Number(a[i] ?? 0) *
                    Number(b[j] ?? 0);
            }
        }

        return salida;
    }


    distribuirSumaHipergeometrica({
        poblacion = 100,
        topK,
        numerosReales = 10,
        ventanas
    }) {

        const individual =
            this.pmfHipergeometrica(
                poblacion,
                topK,
                numerosReales
            );

        let acumulada = [1];

        for (
            let i = 0;
            i < Number(ventanas);
            i++
        ) {
            acumulada =
                this.convolucionDistribuciones(
                    acumulada,
                    individual
                );
        }

        return acumulada;
    }


    percentilDistribucionDiscreta(
        pmf,
        p
    ) {

        const objetivo =
            Math.max(
                0,
                Math.min(
                    1,
                    Number(p)
                )
            );

        let acumulado = 0;

        for (
            let i = 0;
            i < pmf.length;
            i++
        ) {

            acumulado +=
                Number(pmf[i] ?? 0);

            if (
                acumulado >=
                objetivo
            ) {
                return i;
            }
        }

        return pmf.length - 1;
    }


    auditarAzarWalkForward(
        resumen,
        {
            topK,
            ventanas
        }
    ) {

        const observado =
            topK === 10
                ? Number(
                    resumen?.aciertosTop10Total ?? 0
                )
                : Number(
                    resumen?.aciertosTop20Total ?? 0
                );

        const distribucion =
            this.distribuirSumaHipergeometrica({
                poblacion: 100,
                topK,
                numerosReales: 10,
                ventanas
            });

        const esperado =
            Number(ventanas) *
            10 *
            (
                Number(topK) /
                100
            );

        const probMenorIgual =
            distribucion
                .slice(
                    0,
                    observado + 1
                )
                .reduce(
                    (t,v)=>t+Number(v ?? 0),
                    0
                );

        const probMayorIgual =
            distribucion
                .slice(observado)
                .reduce(
                    (t,v)=>t+Number(v ?? 0),
                    0
                );

        const intervalo95 = {
            inferior:
                this.percentilDistribucionDiscreta(
                    distribucion,
                    0.025
                ),
            superior:
                this.percentilDistribucionDiscreta(
                    distribucion,
                    0.975
                )
        };

        const diferencia =
            observado -
            esperado;

        const ratio =
            esperado > 0
                ? observado /
                    esperado
                : null;

        let lectura =
            "COMPATIBLE_CON_AZAR";

        if (
            observado <
                intervalo95.inferior
        ) {
            lectura =
                "INFERIOR_A_AZAR";
        }
        else if (
            observado >
                intervalo95.superior
        ) {
            lectura =
                "SUPERIOR_A_AZAR";
        }

        return {
            topK:
                Number(topK),
            ventanas:
                Number(ventanas),
            observado,
            esperado:
                Number(
                    esperado.toFixed(4)
                ),
            diferencia:
                Number(
                    diferencia.toFixed(4)
                ),
            ratioEsperado:
                ratio == null
                    ? null
                    : Number(
                        ratio.toFixed(6)
                    ),
            intervaloCentral95:
                intervalo95,
            probabilidadMenorIgual:
                Number(
                    probMenorIgual.toFixed(8)
                ),
            probabilidadMayorIgual:
                Number(
                    probMayorIgual.toFixed(8)
                ),
            lectura,
            modelo:
                `Suma de ${ventanas} variables hipergeométricas H(100, ${topK}, 10)`
        };
    }







    calcularAUCDiscriminacion(
        vectorScores = []
    ) {

        const positivos =
            (vectorScores ?? [])
                .filter(x=>x?.real);

        const negativos =
            (vectorScores ?? [])
                .filter(x=>!x?.real);

        if (
            positivos.length === 0 ||
            negativos.length === 0
        ) {
            return null;
        }

        let favorables = 0;
        let empates = 0;
        let total = 0;

        for (
            const p
            of positivos
        ) {
            for (
                const n
                of negativos
            ) {

                const sp =
                    Number(p?.score ?? 0);

                const sn =
                    Number(n?.score ?? 0);

                if (sp > sn) {
                    favorables++;
                }
                else if (sp === sn) {
                    empates++;
                }

                total++;
            }
        }

        const auc =
            (
                favorables +
                0.5 * empates
            ) /
            total;

        return Number(
            auc.toFixed(6)
        );
    }


    correlacionSpearmanDesdeVectores(
        vectorA = [],
        vectorB = []
    ) {

        const mapaA =
            new Map(
                (vectorA ?? [])
                    .map(x=>[
                        Number(x?.numero),
                        Number(x?.score ?? 0)
                    ])
            );

        const comunes =
            (vectorB ?? [])
                .map(x=>Number(x?.numero))
                .filter(n=>mapaA.has(n));

        if (comunes.length < 3) {
            return null;
        }

        const rankear =
            valores => {

                const ordenados =
                    [...valores]
                        .sort(
                            (a,b)=>
                                b.valor -
                                a.valor ||
                                a.numero -
                                b.numero
                        );

                const ranks =
                    new Map();

                let i = 0;

                while (
                    i <
                    ordenados.length
                ) {

                    let j = i + 1;

                    while (
                        j <
                        ordenados.length &&
                        ordenados[j].valor ===
                        ordenados[i].valor
                    ) {
                        j++;
                    }

                    const rankMedio =
                        (
                            (i + 1) +
                            j
                        ) / 2;

                    for (
                        let k=i;
                        k<j;
                        k++
                    ) {
                        ranks.set(
                            ordenados[k].numero,
                            rankMedio
                        );
                    }

                    i = j;
                }

                return ranks;
            };

        const ranksA =
            rankear(
                comunes.map(
                    numero=>({
                        numero,
                        valor:
                            Number(
                                mapaA.get(numero)
                            )
                    })
                )
            );

        const mapaB =
            new Map(
                (vectorB ?? [])
                    .map(x=>[
                        Number(x?.numero),
                        Number(x?.score ?? 0)
                    ])
            );

        const ranksB =
            rankear(
                comunes.map(
                    numero=>({
                        numero,
                        valor:
                            Number(
                                mapaB.get(numero)
                            )
                    })
                )
            );

        const xs =
            comunes.map(
                n=>ranksA.get(n)
            );

        const ys =
            comunes.map(
                n=>ranksB.get(n)
            );

        return this.correlacionPearson(
            xs,
            ys
        );
    }


    auditarDiscriminacionDireccional(
        filas
    ) {

        const motoresObjetivo = [
            "frecuencia",
            "tendencia",
            "historico"
        ];

        const porMotor =
            motoresObjetivo.map(
                motor => {

                    const aucs =
                        (filas ?? [])
                            .map(
                                fila => {

                                    const diag =
                                        (
                                            fila
                                                ?.diagnosticoMotoresBase ??
                                            []
                                        )
                                            .find(
                                                x =>
                                                    String(x?.motor) ===
                                                    motor
                                            );

                                    const auc =
                                        this.calcularAUCDiscriminacion(
                                            diag?.vectorScores ?? []
                                        );

                                    return {
                                        semana:
                                            Number(fila?.semana),
                                        auc
                                    };
                                })
                            .filter(
                                x =>
                                    Number.isFinite(
                                        Number(x.auc)
                                    )
                            );

                    const promedio =
                        aucs.length
                            ? aucs.reduce(
                                (t,x)=>
                                    t +
                                    Number(x.auc),
                                0
                            ) /
                            aucs.length
                            : null;

                    const debajo =
                        aucs.filter(
                            x =>
                                Number(x.auc) <
                                0.5
                        ).length;

                    const encima =
                        aucs.filter(
                            x =>
                                Number(x.auc) >
                                0.5
                        ).length;

                    const igual =
                        aucs.length -
                        debajo -
                        encima;

                    const aucInvertida =
                        promedio == null
                            ? null
                            : 1 -
                                promedio;

                    let lectura =
                        "NEUTRO_O_INCIERTO";

                    if (
                        promedio != null &&
                        promedio <= 0.40 &&
                        debajo >=
                            Math.ceil(
                                aucs.length *
                                0.70
                            )
                    ) {
                        lectura =
                            "ORIENTACION_INVERSA_PERSISTENTE";
                    }
                    else if (
                        promedio != null &&
                        promedio < 0.48
                    ) {
                        lectura =
                            "TENDENCIA_INVERSA";
                    }
                    else if (
                        promedio != null &&
                        promedio >= 0.52
                    ) {
                        lectura =
                            "ORIENTACION_FAVORABLE";
                    }

                    return {
                        motor,
                        ventanas:
                            aucs.length,
                        aucPromedio:
                            promedio == null
                                ? null
                                : Number(
                                    promedio.toFixed(6)
                                ),
                        aucInvertidaTeorica:
                            aucInvertida == null
                                ? null
                                : Number(
                                    aucInvertida.toFixed(6)
                                ),
                        semanasDebajo05:
                            debajo,
                        semanasEncima05:
                            encima,
                        semanasIgual05:
                            igual,
                        lectura,
                        detalleSemanal:
                            aucs
                    };
                });

        const pares = [
            ["frecuencia","tendencia"],
            ["frecuencia","historico"],
            ["tendencia","historico"]
        ];

        const correlacionesRanking =
            pares.map(
                ([a,b]) => {

                    const valores =
                        (filas ?? [])
                            .map(
                                fila => {

                                    const lista =
                                        fila
                                            ?.diagnosticoMotoresBase ??
                                        [];

                                    const va =
                                        lista.find(
                                            x =>
                                                String(x?.motor) ===
                                                a
                                        )
                                            ?.vectorScores ??
                                        [];

                                    const vb =
                                        lista.find(
                                            x =>
                                                String(x?.motor) ===
                                                b
                                        )
                                            ?.vectorScores ??
                                        [];

                                    return {
                                        semana:
                                            Number(fila?.semana),
                                        rho:
                                            this
                                                .correlacionSpearmanDesdeVectores(
                                                    va,
                                                    vb
                                                )
                                    };
                                })
                            .filter(
                                x =>
                                    Number.isFinite(
                                        Number(x.rho)
                                    )
                            );

                    const promedio =
                        valores.length
                            ? valores.reduce(
                                (t,x)=>
                                    t +
                                    Number(x.rho),
                                0
                            ) /
                            valores.length
                            : null;

                    return {
                        motorA:
                            a,
                        motorB:
                            b,
                        spearmanPromedio:
                            promedio == null
                                ? null
                                : Number(
                                    promedio.toFixed(6)
                                ),
                        detalleSemanal:
                            valores
                    };
                });

        return {
            esquema:
                "DISCRIMINACION_DIRECCIONAL_WALK_FORWARD_V1",
            versionControl:
                this.version,
            naturaleza:
                "DIAGNOSTICO_INTERNO",
            validacionPredictiva:
                false,
            referenciaAUC:
                0.5,
            motores:
                porMotor,
            correlacionesRanking,
            nota:
                "AUC representa la probabilidad de que un número observado reciba mayor score que uno no observado. AUC < 0.5 implica ordenamiento inverso. La AUC invertida es solo una referencia matemática, no una validación de una transformación aplicada."
        };
    }


    correlacionPearson(
        xs = [],
        ys = []
    ) {

        const n =
            Math.min(
                xs?.length ?? 0,
                ys?.length ?? 0
            );

        if (n < 2) {
            return null;
        }

        const a =
            xs
                .slice(0,n)
                .map(Number);

        const b =
            ys
                .slice(0,n)
                .map(Number);

        const mediaA =
            a.reduce(
                (t,v)=>t+v,
                0
            ) / n;

        const mediaB =
            b.reduce(
                (t,v)=>t+v,
                0
            ) / n;

        let cov = 0;
        let varA = 0;
        let varB = 0;

        for (
            let i=0;
            i<n;
            i++
        ) {

            const da =
                a[i] -
                mediaA;

            const db =
                b[i] -
                mediaB;

            cov += da * db;
            varA += da * da;
            varB += db * db;
        }

        if (
            varA <= 0 ||
            varB <= 0
        ) {
            return 0;
        }

        return Number(
            (
                cov /
                Math.sqrt(
                    varA *
                    varB
                )
            ).toFixed(6)
        );
    }


    extraerSerieMotorWalkForward(
        diagnosticoMotoresBase,
        motor
    ) {

        return (
            diagnosticoMotoresBase ?? []
        )
            .find(
                x =>
                    String(x?.motor) ===
                    String(motor)
            ) ?? null;
    }


    analizarBloqueHistoricoWalkForward(
        filas
    ) {

        const motoresObjetivo = [
            "frecuencia",
            "tendencia",
            "historico"
        ];

        const pares = [
            ["frecuencia","tendencia"],
            ["frecuencia","historico"],
            ["tendencia","historico"]
        ];

        const seriesDeltaScore = {};

        for (
            const motor
            of motoresObjetivo
        ) {
            seriesDeltaScore[motor] =
                (filas ?? [])
                    .map(
                        fila =>
                            this
                                .extraerSerieMotorWalkForward(
                                    fila?.diagnosticoMotoresBase,
                                    motor
                                )
                                ?.deltaScore
                    )
                    .map(Number);
        }

        const correlaciones =
            pares.map(
                ([a,b])=>({
                    motorA:
                        a,
                    motorB:
                        b,
                    correlacionDeltaScore:
                        this.correlacionPearson(
                            seriesDeltaScore[a],
                            seriesDeltaScore[b]
                        )
                })
            );

        const coincidenciaSemanal =
            (filas ?? [])
                .map(
                    fila => {

                        const valores = {};

                        for (
                            const motor
                            of motoresObjetivo
                        ) {

                            const x =
                                this
                                    .extraerSerieMotorWalkForward(
                                        fila?.diagnosticoMotoresBase,
                                        motor
                                    );

                            valores[motor] = {
                                deltaScore:
                                    Number(
                                        x?.deltaScore ?? 0
                                    ),
                                penaliza:
                                    Number(
                                        x?.deltaScore ?? 0
                                    ) < 0
                            };
                        }

                        const cantidadPenalizan =
                            motoresObjetivo
                                .filter(
                                    m =>
                                        valores[m]
                                            .penaliza
                                )
                                .length;

                        return {
                            semana:
                                Number(fila?.semana),
                            valores,
                            cantidadPenalizan,
                            losTresPenalizan:
                                cantidadPenalizan === 3
                        };
                    });

        const totalVentanas =
            coincidenciaSemanal.length;

        const resumenMotores =
            motoresObjetivo.map(
                motor => {

                    const lista =
                        (filas ?? [])
                            .map(
                                fila =>
                                    this
                                        .extraerSerieMotorWalkForward(
                                            fila?.diagnosticoMotoresBase,
                                            motor
                                        )
                            )
                            .filter(Boolean);

                    const promedio =
                        campo =>
                            lista.length
                                ? lista.reduce(
                                    (t,x)=>
                                        t +
                                        Number(
                                            x?.[campo] ?? 0
                                        ),
                                    0
                                ) /
                                lista.length
                                : 0;

                    return {
                        motor,
                        deltaScorePromedio:
                            Number(
                                promedio(
                                    "deltaScore"
                                ).toFixed(6)
                            ),
                        deltaAportePromedio:
                            Number(
                                promedio(
                                    "deltaAporte"
                                ).toFixed(6)
                            ),
                        ordenMedioObservados:
                            Number(
                                promedio(
                                    "ordenMedioReal"
                                ).toFixed(4)
                            ),
                        semanasPenaliza:
                            lista.filter(
                                x =>
                                    Number(
                                        x?.deltaScore ?? 0
                                    ) < 0
                            ).length,
                        semanasFavorece:
                            lista.filter(
                                x =>
                                    Number(
                                        x?.deltaScore ?? 0
                                    ) > 0
                            ).length
                    };
                });

        const tresPenalizan =
            coincidenciaSemanal
                .filter(
                    x =>
                        x.losTresPenalizan
                ).length;

        const alMenosDos =
            coincidenciaSemanal
                .filter(
                    x =>
                        x.cantidadPenalizan >= 2
                ).length;

        const correlacionMediaAbsoluta =
            correlaciones.length
                ? correlaciones.reduce(
                    (t,x)=>
                        t +
                        Math.abs(
                            Number(
                                x.correlacionDeltaScore ?? 0
                            )
                        ),
                    0
                ) /
                correlaciones.length
                : 0;

        let lecturaRedundancia =
            "BAJA_O_INCIERTA";

        if (
            correlacionMediaAbsoluta >=
            0.75
        ) {
            lecturaRedundancia =
                "ALTA";
        }
        else if (
            correlacionMediaAbsoluta >=
            0.50
        ) {
            lecturaRedundancia =
                "MEDIA";
        }

        let lecturaDireccion =
            "MIXTA";

        if (
            tresPenalizan >=
            Math.ceil(
                totalVentanas *
                0.70
            )
        ) {
            lecturaDireccion =
                "PENALIZACION_CONJUNTA_PERSISTENTE";
        }
        else if (
            alMenosDos >=
            Math.ceil(
                totalVentanas *
                0.70
            )
        ) {
            lecturaDireccion =
                "PENALIZACION_MAYORITARIA_PERSISTENTE";
        }

        return {
            esquema:
                "DISECCION_BLOQUE_HISTORICO_WALK_FORWARD_V1",
            versionControl:
                this.version,
            naturaleza:
                "DIAGNOSTICO_INTERNO",
            validacionPredictiva:
                false,
            motores:
                resumenMotores,
            correlaciones,
            coincidenciaSemanal,
            resumen: {
                ventanas:
                    totalVentanas,
                semanasTresPenalizan:
                    tresPenalizan,
                semanasAlMenosDosPenalizan:
                    alMenosDos,
                correlacionMediaAbsoluta:
                    Number(
                        correlacionMediaAbsoluta
                            .toFixed(6)
                    ),
                lecturaRedundancia,
                lecturaDireccion
            },
            interpretacion:
                "La correlación se calcula sobre el deltaScore semanal de cada motor para observados vs. resto. No demuestra causalidad externa; sirve para detectar redundancia y dirección interna."
        };
    }


    construirPesosAblacion(
        pesosBase,
        motoresExcluir = []
    ) {

        const excluir =
            new Set(
                (motoresExcluir ?? [])
                    .map(String)
            );

        const salida = {};

        for (
            const [clave,valor]
            of Object.entries(
                pesosBase ?? {}
            )
        ) {
            salida[clave] =
                excluir.has(String(clave))
                    ? 0
                    : Number(valor ?? 0);
        }

        const suma =
            Object.values(salida)
                .reduce(
                    (t,v)=>t+Number(v ?? 0),
                    0
                );

        if (suma <= 0) {
            throw new Error(
                "La ablación dejó una suma de pesos inválida."
            );
        }

        for (
            const clave
            of Object.keys(salida)
        ) {
            salida[clave] =
                Number(
                    (
                        salida[clave] /
                        suma *
                        100
                    ).toFixed(6)
                );
        }

        const claves =
            Object.keys(salida);

        const sumaRedondeada =
            claves.reduce(
                (t,k)=>t+salida[k],
                0
            );

        if (claves.length) {
            const ultima =
                claves.at(-1);

            salida[ultima] =
                Number(
                    (
                        salida[ultima] +
                        (
                            100 -
                            sumaRedondeada
                        )
                    ).toFixed(6)
                );
        }

        return salida;
    }


    obtenerVariantesAblacionWalkForward(
        pesosBase
    ) {

        const definiciones = [
            {
                id:
                    "SIN_TENDENCIA",
                excluye:
                    ["tendencia"]
            },
            {
                id:
                    "SIN_FRECUENCIA",
                excluye:
                    ["frecuencia"]
            },
            {
                id:
                    "SIN_HISTORICO",
                excluye:
                    ["historico"]
            },
            {
                id:
                    "SIN_TENDENCIA_FRECUENCIA",
                excluye:
                    [
                        "tendencia",
                        "frecuencia"
                    ]
            },
            {
                id:
                    "SIN_TENDENCIA_FRECUENCIA_HISTORICO",
                excluye:
                    [
                        "tendencia",
                        "frecuencia",
                        "historico"
                    ]
            }
        ];

        return definiciones.map(
            d=>({
                ...d,
                pesos:
                    this.construirPesosAblacion(
                        pesosBase,
                        d.excluye
                    )
            })
        );
    }


    resumirAblacionWalkForward(
        filas,
        variantes,
        resumenBase
    ) {

        const resultados =
            (variantes ?? [])
                .map(variante => {

                    const metricas =
                        (filas ?? [])
                            .map(
                                f =>
                                    f?.ablaciones
                                        ?.[variante.id]
                            )
                            .filter(Boolean);

                    const pseudoFilas =
                        metricas.map(
                            metrica=>({
                                variante:
                                    metrica
                            })
                        );

                    const resumen =
                        this.resumirBacktestWalkForward(
                            pseudoFilas,
                            "variante"
                        );

                    return {
                        id:
                            variante.id,
                        excluye:
                            [...variante.excluye],
                        sumaPesos:
                            Number(
                                Object.values(
                                    variante.pesos
                                )
                                    .reduce(
                                        (t,v)=>
                                            t +
                                            Number(v ?? 0),
                                        0
                                    )
                                    .toFixed(6)
                            ),
                        ...resumen,
                        deltaTop10VsBase:
                            Number(
                                (
                                    resumen
                                        .promedioAciertosTop10 -
                                    resumenBase
                                        .promedioAciertosTop10
                                ).toFixed(4)
                            ),
                        deltaTop20VsBase:
                            Number(
                                (
                                    resumen
                                        .promedioAciertosTop20 -
                                    resumenBase
                                        .promedioAciertosTop20
                                ).toFixed(4)
                            ),
                        promedioOrdenReal:
                            resumen.promedioOrdenGlobal,
                        deltaOrdenVsBase:
                            Number(
                                (
                                    resumenBase
                                        .promedioOrdenGlobal -
                                    resumen
                                        .promedioOrdenGlobal
                                ).toFixed(4)
                            )
                    };
                })
                .sort(
                    (a,b) =>
                        Number(
                            b.deltaOrdenVsBase
                        ) -
                        Number(
                            a.deltaOrdenVsBase
                        )
                );

        return {
            esquema:
                "ABLACION_CONTRAFACTUAL_WALK_FORWARD_V1",
            versionControl:
                this.version,
            naturaleza:
                "DIAGNOSTICO_EXPLORATORIO",
            validacionPredictiva:
                false,
            advertencia:
                "Las exclusiones fueron elegidas después de observar la auditoría de estos mismos 13 folds. Sirven para diagnosticar causalidad interna del ranking, no para afirmar mejora fuera de muestra.",
            referencia:
                "BASE_ORIGINAL",
            variantes:
                resultados
        };
    }


    analizarMotoresTemporalesWalkForward({
        historial,
        estadisticas,
        pesos,
        numerosReales
    }={}) {

        const MotorManagerTemporal =
            this.entorno?.motorManager?.constructor;

        if (
            typeof MotorManagerTemporal !==
            "function"
        ) {
            throw new Error(
                "No está disponible el constructor temporal de MotorManager."
            );
        }

        const manager =
            new MotorManagerTemporal();

        manager.inicializar({
            historial:
                structuredClone(historial ?? []),
            estadisticas:
                structuredClone(estadisticas ?? []),
            configuracion: {
                pesos:
                    structuredClone(pesos ?? {})
            }
        });

        const resultados =
            manager.analizarTodos({});

        const reales =
            new Set(
                (numerosReales ?? [])
                    .map(Number)
            );

        const clavesMotores =
            [
                ...new Set(
                    resultados.flatMap(
                        r =>
                            Object.keys(
                                r?.resultados ?? {}
                            )
                    )
                )
            ];

        const salida = [];

        for (
            const motor of clavesMotores
        ) {

            const filasMotor =
                resultados
                    .map(r => {

                        const numero =
                            Number(r?.numero);

                        const resultadoMotor =
                            r?.resultados?.[motor];

                        const detalle =
                            (
                                r?.detallePesos ?? []
                            )
                                .find(
                                    d =>
                                        String(d?.clave) ===
                                        String(motor)
                                );

                        return {
                            numero,
                            real:
                                reales.has(numero),
                            score:
                                Number(
                                    resultadoMotor?.score ?? 0
                                ),
                            confianza:
                                Number(
                                    resultadoMotor?.confianza ?? 0
                                ),
                            aporte:
                                Number(
                                    detalle?.aporte ?? 0
                                ),
                            pesoEfectivo:
                                Number(
                                    detalle?.pesoEfectivo ?? 0
                                )
                        };
                    })
                    .filter(
                        x =>
                            Number.isFinite(x.numero) &&
                            Number.isFinite(x.score)
                    );

            const observados =
                filasMotor.filter(x=>x.real);

            const noObservados =
                filasMotor.filter(x=>!x.real);

            const promedio =
                (lista,campo) =>
                    lista.length
                        ? lista.reduce(
                            (t,x)=>
                                t +
                                Number(x?.[campo] ?? 0),
                            0
                        ) /
                        lista.length
                        : 0;

            const ordenadosMotor =
                [...filasMotor]
                    .sort(
                        (a,b) =>
                            Number(b.score) -
                            Number(a.score) ||
                            Number(a.numero) -
                            Number(b.numero)
                    );

            const mapaOrden =
                new Map(
                    ordenadosMotor.map(
                        (x,indice)=>[
                            x.numero,
                            indice + 1
                        ]
                    )
                );

            const ordenesReales =
                observados
                    .map(
                        x =>
                            Number(
                                mapaOrden.get(
                                    x.numero
                                )
                            )
                    )
                    .filter(Number.isFinite);

            const scoreReal =
                promedio(
                    observados,
                    "score"
                );

            const scoreResto =
                promedio(
                    noObservados,
                    "score"
                );

            const aporteReal =
                promedio(
                    observados,
                    "aporte"
                );

            const aporteResto =
                promedio(
                    noObservados,
                    "aporte"
                );

            const ordenMedioReal =
                ordenesReales.length
                    ? ordenesReales.reduce(
                        (a,b)=>a+b,
                        0
                    ) /
                    ordenesReales.length
                    : null;

            salida.push({
                motor,
                vectorScores:
                    filasMotor.map(x=>({
                        numero:
                            Number(x.numero),
                        real:
                            Boolean(x.real),
                        score:
                            Number(x.score)
                    })),
                scoreReal:
                    Number(
                        scoreReal.toFixed(6)
                    ),
                scoreResto:
                    Number(
                        scoreResto.toFixed(6)
                    ),
                deltaScore:
                    Number(
                        (
                            scoreReal -
                            scoreResto
                        ).toFixed(6)
                    ),
                aporteReal:
                    Number(
                        aporteReal.toFixed(6)
                    ),
                aporteResto:
                    Number(
                        aporteResto.toFixed(6)
                    ),
                deltaAporte:
                    Number(
                        (
                            aporteReal -
                            aporteResto
                        ).toFixed(6)
                    ),
                ordenMedioReal:
                    ordenMedioReal == null
                        ? null
                        : Number(
                            ordenMedioReal
                                .toFixed(4)
                        ),
                top10Motor:
                    ordenesReales.filter(
                        x=>x<=10
                    ).length,
                top20Motor:
                    ordenesReales.filter(
                        x=>x<=20
                    ).length
            });
        }

        return salida;
    }


    resumirAuditoriaMotoresWalkForward(
        filas
    ) {

        const registros =
            (filas ?? [])
                .flatMap(
                    fila =>
                        (
                            fila
                                ?.diagnosticoMotoresBase ??
                            []
                        )
                            .map(x=>({
                                semana:
                                    Number(fila?.semana),
                                ...x
                            }))
                );

        const porMotor =
            new Map();

        for (
            const item of registros
        ) {

            if (
                !porMotor.has(item.motor)
            ) {
                porMotor.set(
                    item.motor,
                    []
                );
            }

            porMotor
                .get(item.motor)
                .push(item);
        }

        const promedio =
            (lista,campo) =>
                lista.length
                    ? lista.reduce(
                        (t,x)=>
                            t +
                            Number(x?.[campo] ?? 0),
                        0
                    ) /
                    lista.length
                    : 0;

        const resumen =
            [...porMotor.entries()]
                .map(([motor,lista]) => {

                    const deltaScore =
                        promedio(
                            lista,
                            "deltaScore"
                        );

                    const deltaAporte =
                        promedio(
                            lista,
                            "deltaAporte"
                        );

                    const ordenMedio =
                        promedio(
                            lista.filter(
                                x =>
                                    Number.isFinite(
                                        Number(
                                            x?.ordenMedioReal
                                        )
                                    )
                            ),
                            "ordenMedioReal"
                        );

                    const semanasFavorables =
                        lista.filter(
                            x =>
                                Number(x.deltaScore) > 0
                        ).length;

                    const semanasDesfavorables =
                        lista.filter(
                            x =>
                                Number(x.deltaScore) < 0
                        ).length;

                    let lectura =
                        "NEUTRO_O_MIXTO";

                    if (
                        deltaScore > 0 &&
                        ordenMedio < 50.5
                    ) {
                        lectura =
                            "FAVORECE_OBSERVADOS";
                    }
                    else if (
                        deltaScore < 0 &&
                        ordenMedio > 50.5
                    ) {
                        lectura =
                            "PENALIZA_OBSERVADOS";
                    }

                    return {
                        motor,
                        ventanas:
                            lista.length,
                        deltaScorePromedio:
                            Number(
                                deltaScore.toFixed(6)
                            ),
                        deltaAportePromedio:
                            Number(
                                deltaAporte.toFixed(6)
                            ),
                        ordenMedioObservados:
                            Number(
                                ordenMedio.toFixed(4)
                            ),
                        top10MotorTotal:
                            lista.reduce(
                                (t,x)=>
                                    t +
                                    Number(
                                        x?.top10Motor ?? 0
                                    ),
                                0
                            ),
                        top20MotorTotal:
                            lista.reduce(
                                (t,x)=>
                                    t +
                                    Number(
                                        x?.top20Motor ?? 0
                                    ),
                                0
                            ),
                        semanasFavorables,
                        semanasDesfavorables,
                        lectura
                    };
                })
                .sort(
                    (a,b) =>
                        Number(
                            a.ordenMedioObservados
                        ) -
                        Number(
                            b.ordenMedioObservados
                        )
                );

        return {
            esquema:
                "AUDITORIA_MOTORES_WALK_FORWARD_V1",
            versionControl:
                this.version,
            ventanas:
                filas?.length ?? 0,
            referenciaOrdenAleatorio:
                50.5,
            criterio:
                "Compara score y aporte medio de los 10 números observados contra los otros 90 en cada ventana, usando solo historial anterior.",
            motores:
                resumen,
            masFavorables:
                resumen
                    .filter(
                        x =>
                            x.lectura ===
                            "FAVORECE_OBSERVADOS"
                    ),
            masPerjudiciales:
                resumen
                    .filter(
                        x =>
                            x.lectura ===
                            "PENALIZA_OBSERVADOS"
                    )
                    .sort(
                        (a,b) =>
                            Number(
                                b.ordenMedioObservados
                            ) -
                            Number(
                                a.ordenMedioObservados
                            )
                    )
        };
    }


    calcularPerfilProfundidadRanking(
        filas,
        clave = "base"
    ) {

        const lista =
            Array.isArray(filas)
                ? filas
                : [];

        const posiciones =
            lista
                .flatMap(
                    fila =>
                        (
                            fila?.[clave]
                                ?.posicionesReales ??
                            []
                        )
                            .map(x=>({
                                semana:
                                    Number(fila?.semana),
                                numero:
                                    Number(x?.numero),
                                orden:
                                    Number(x?.orden)
                            }))
                )
                .filter(
                    x =>
                        Number.isFinite(x.orden) &&
                        x.orden >= 1 &&
                        x.orden <= 100
                );

        const ventanas =
            lista.length;

        const acumulados = [];

        for (
            let k = 10;
            k <= 90;
            k += 10
        ) {

            const observado =
                posiciones.filter(
                    x => x.orden <= k
                ).length;

            const resumenArtificial = {
                aciertosTop10Total:
                    observado,
                aciertosTop20Total:
                    observado
            };

            const auditoria =
                this.auditarAzarWalkForward(
                    resumenArtificial,
                    {
                        topK:
                            k,
                        ventanas
                    }
                );

            acumulados.push({
                limite:
                    k,
                observado,
                esperado:
                    auditoria.esperado,
                diferencia:
                    auditoria.diferencia,
                ratioEsperado:
                    auditoria.ratioEsperado,
                intervaloCentral95:
                    auditoria.intervaloCentral95,
                probabilidadMenorIgual:
                    auditoria.probabilidadMenorIgual,
                probabilidadMayorIgual:
                    auditoria.probabilidadMayorIgual,
                lectura:
                    auditoria.lectura
            });
        }

        const deciles = [];

        for (
            let inicio = 1;
            inicio <= 91;
            inicio += 10
        ) {

            const fin =
                Math.min(
                    100,
                    inicio + 9
                );

            const observado =
                posiciones.filter(
                    x =>
                        x.orden >= inicio &&
                        x.orden <= fin
                ).length;

            const esperado =
                ventanas;

            deciles.push({
                rango:
                    `${inicio}-${fin}`,
                inicio,
                fin,
                observado,
                esperado,
                diferencia:
                    observado -
                    esperado,
                ratioEsperado:
                    esperado > 0
                        ? Number(
                            (
                                observado /
                                esperado
                            ).toFixed(6)
                        )
                        : null
            });
        }

        const ordenes =
            posiciones
                .map(x=>x.orden)
                .sort((a,b)=>a-b);

        const mediana =
            ordenes.length
                ? (
                    ordenes.length % 2
                        ? ordenes[
                            Math.floor(
                                ordenes.length / 2
                            )
                        ]
                        : (
                            ordenes[
                                ordenes.length / 2 - 1
                            ] +
                            ordenes[
                                ordenes.length / 2
                            ]
                        ) / 2
                )
                : null;

        const primer50 =
            posiciones.filter(
                x=>x.orden <= 50
            ).length;

        const segundo50 =
            posiciones.length -
            primer50;

        const cruces = [];

        for (
            let k = 10;
            k <= 90;
            k += 10
        ) {
            const fila =
                acumulados.find(
                    x=>x.limite===k
                );

            if (
                fila &&
                fila.lectura ===
                    "COMPATIBLE_CON_AZAR"
            ) {
                cruces.push(k);
            }
        }

        return {
            esquema:
                "PERFIL_PROFUNDIDAD_RANKING_V1",
            versionControl:
                this.version,
            variante:
                clave,
            ventanas,
            totalObservaciones:
                posiciones.length,
            promedioOrden:
                posiciones.length
                    ? Number(
                        (
                            posiciones.reduce(
                                (t,x)=>t+x.orden,
                                0
                            ) /
                            posiciones.length
                        ).toFixed(4)
                    )
                    : null,
            medianaOrden:
                mediana,
            mitadRanking: {
                top50:
                    primer50,
                bottom50:
                    segundo50,
                esperadoCadaMitad:
                    posiciones.length / 2
            },
            acumulados,
            deciles,
            primerLimiteCompatibleConAzar:
                cruces.length
                    ? cruces[0]
                    : null,
            posiciones
        };
    }


    calcularAuditoriaEstadisticaWalkForward(
        resumenBase,
        resumenActual,
        ventanas
    ) {

        const baseTop10 =
            this.auditarAzarWalkForward(
                resumenBase,
                {
                    topK: 10,
                    ventanas
                }
            );

        const baseTop20 =
            this.auditarAzarWalkForward(
                resumenBase,
                {
                    topK: 20,
                    ventanas
                }
            );

        const actualTop10 =
            this.auditarAzarWalkForward(
                resumenActual,
                {
                    topK: 10,
                    ventanas
                }
            );

        const actualTop20 =
            this.auditarAzarWalkForward(
                resumenActual,
                {
                    topK: 20,
                    ventanas
                }
            );

        return {
            esquema:
                "AUDITORIA_ESTADISTICA_WALK_FORWARD_V1",
            versionControl:
                this.version,
            tecnica:
                "Hipergeométrica exacta por ventana + convolución discreta",
            supuestos: {
                poblacion:
                    100,
                numerosRealesPorSemana:
                    10,
                independenciaVentanas:
                    "Referencia teórica; el historial puede presentar dependencia temporal.",
                dataset:
                    "Sintético/de prueba",
                precisionPredictivaReal:
                    false
            },
            base: {
                top10:
                    baseTop10,
                top20:
                    baseTop20,
                lecturaGlobal:
                    (
                        baseTop10.lectura ===
                            "SUPERIOR_A_AZAR" &&
                        baseTop20.lectura ===
                            "SUPERIOR_A_AZAR"
                    )
                        ? "SEÑAL_POSITIVA_CONJUNTA"
                        : (
                            baseTop10.lectura ===
                                "INFERIOR_A_AZAR" ||
                            baseTop20.lectura ===
                                "INFERIOR_A_AZAR"
                        )
                            ? "SIN_VENTAJA_Y_CON_SEÑAL_NEGATIVA"
                            : "SIN_EVIDENCIA_DE_VENTAJA"
            },
            actualLookahead: {
                top10:
                    actualTop10,
                top20:
                    actualTop20,
                diagnosticoSolamente:
                    true
            }
        };
    }


    resumirBacktestWalkForward(
        filas,
        clave
    ) {

        const lista =
            Array.isArray(filas)
                ? filas
                : [];

        const metricas =
            lista
                .map(x=>x?.[clave])
                .filter(Boolean);

        const total =
            metricas.length;

        const sumar =
            campo =>
                metricas.reduce(
                    (t,m)=>t+Number(m?.[campo] ?? 0),
                    0
                );

        const promediar =
            campo =>
                total
                    ? sumar(campo) / total
                    : 0;

        const promediosOrden =
            metricas
                .map(x=>Number(x.promedioOrden))
                .filter(Number.isFinite);

        const mejoresOrdenes =
            metricas
                .map(x=>Number(x.mejorOrden))
                .filter(Number.isFinite);

        return {
            ventanas:
                total,
            aciertosTop10Total:
                sumar("aciertosTop10"),
            aciertosTop20Total:
                sumar("aciertosTop20"),
            promedioAciertosTop10:
                Number(
                    promediar("aciertosTop10")
                        .toFixed(4)
                ),
            promedioAciertosTop20:
                Number(
                    promediar("aciertosTop20")
                        .toFixed(4)
                ),
            semanasConTop10:
                metricas.filter(
                    x=>Number(x.aciertosTop10)>0
                ).length,
            semanasConTop20:
                metricas.filter(
                    x=>Number(x.aciertosTop20)>0
                ).length,
            promedioOrdenGlobal:
                promediosOrden.length
                    ? Number(
                        (
                            promediosOrden
                                .reduce((a,b)=>a+b,0) /
                            promediosOrden.length
                        ).toFixed(4)
                    )
                    : null,
            mejorOrdenGlobal:
                mejoresOrdenes.length
                    ? Math.min(...mejoresOrdenes)
                    : null,
            referenciaAleatoriaTeorica: {
                top10:
                    1,
                top20:
                    2
            }
        };
    }


    async ejecutarBacktestWalkForward({
        minimoHistorial = 8
    }={}) {

        if (this.backtestWalkForwardEjecutando) {
            return this.backtestWalkForward;
        }

        this.backtestWalkForwardEjecutando =
            true;

        try {

            const historial =
                Array.isArray(this.entorno?.datosHistorial)
                    ? structuredClone(
                        this.entorno.datosHistorial
                    )
                    : [];

            historial.sort(
                (a,b)=>
                    Number(a?.semana ?? 0) -
                    Number(b?.semana ?? 0)
            );

            if (
                historial.length <=
                Number(minimoHistorial)
            ) {
                throw new Error(
                    "No hay suficientes semanas para ejecutar walk-forward."
                );
            }

            const snapshotAntes = {
                totalSemanas:
                    this.entorno?.datosHistorial?.length ?? 0,
                evaluacionesPersistidas:
                    this.entorno?.evaluacionesPersistidas?.length ?? 0,
                evaluacionesMotor:
                    this.entorno?.motorEvaluacion
                        ?.obtenerHistorial?.()
                        ?.length ?? 0,
                sumaPesos:
                    Number(
                        Object.values(
                            this.entorno?.motorManager
                                ?.obtenerPesos?.() ?? {}
                        )
                            .reduce(
                                (t,v)=>t+Number(v ?? 0),
                                0
                            )
                            .toFixed(6)
                    )
            };

            const pesosBase =
                this.obtenerPesosBaseWalkForward();

            const pesosActuales =
                structuredClone(
                    this.entorno?.motorManager
                        ?.obtenerPesos?.() ?? {}
                );

            const variantesAblacion =
                this.obtenerVariantesAblacionWalkForward(
                    pesosBase
                );

            const filas = [];

            for (
                let indice =
                    Number(minimoHistorial);
                indice < historial.length;
                indice++
            ) {

                const objetivo =
                    historial[indice];

                const pasado =
                    historial.slice(0,indice);

                /*
                 * Control anti-look-ahead:
                 * toda semana del pasado debe ser estrictamente
                 * anterior a la semana objetivo.
                 */
                const semanaObjetivo =
                    Number(objetivo?.semana);

                const contaminada =
                    pasado.some(
                        x =>
                            Number(x?.semana) >=
                            semanaObjetivo
                    );

                if (contaminada) {
                    throw new Error(
                        `Contaminación temporal detectada en semana ${semanaObjetivo}.`
                    );
                }

                const estadisticas =
                    this.construirEstadisticasTemporales(
                        pasado
                    );

                const diagnosticoMotoresBase =
                    this.analizarMotoresTemporalesWalkForward({
                        historial:
                            pasado,
                        estadisticas,
                        pesos:
                            pesosBase,
                        numerosReales:
                            objetivo?.numeros
                    });

                const predBase =
                    this.generarPrediccionTemporal({
                        historial:
                            pasado,
                        estadisticas,
                        pesos:
                            pesosBase,
                        semanaObjetivo,
                        fechaObjetivo:
                            objetivo?.fecha ?? null,
                        variante:
                            "WALK_FORWARD_BASE_ORIGINAL",
                        escenarioId:
                            `wf_base_${semanaObjetivo}`
                    });

                const metricaBase =
                    this.evaluarPrediccionWalkForward(
                        predBase,
                        objetivo?.numeros
                    );

                const ablaciones = {};

                for (
                    const varianteAblacion
                    of variantesAblacion
                ) {

                    const predAblacion =
                        this.generarPrediccionTemporal({
                            historial:
                                pasado,
                            estadisticas,
                            pesos:
                                varianteAblacion.pesos,
                            semanaObjetivo,
                            fechaObjetivo:
                                objetivo?.fecha ?? null,
                            variante:
                                `WALK_FORWARD_ABLACION_${varianteAblacion.id}`,
                            escenarioId:
                                `wf_abl_${varianteAblacion.id}_${semanaObjetivo}`
                        });

                    ablaciones[
                        varianteAblacion.id
                    ] =
                        this.evaluarPrediccionWalkForward(
                            predAblacion,
                            objetivo?.numeros
                        );
                }

                /*
                 * Variante diagnóstica:
                 * usa pesos activos actuales, que fueron aprendidos
                 * con información posterior. NO es out-of-sample puro.
                 */
                const predActual =
                    Object.keys(pesosActuales).length
                        ? this.generarPrediccionTemporal({
                            historial:
                                pasado,
                            estadisticas,
                            pesos:
                                pesosActuales,
                            semanaObjetivo,
                            fechaObjetivo:
                                objetivo?.fecha ?? null,
                            variante:
                                "WALK_FORWARD_PESOS_ACTUALES_LOOKAHEAD",
                            escenarioId:
                                `wf_actual_${semanaObjetivo}`
                        })
                        : null;

                const metricaActual =
                    predActual
                        ? this.evaluarPrediccionWalkForward(
                            predActual,
                            objetivo?.numeros
                        )
                        : null;

                filas.push({
                    semana:
                        semanaObjetivo,
                    fecha:
                        objetivo?.fecha ?? null,
                    historialUsado:
                        pasado.length,
                    numerosReales:
                        [...(objetivo?.numeros ?? [])]
                            .map(Number),
                    base:
                        metricaBase,
                    diagnosticoMotoresBase,
                    ablaciones,
                    actualLookahead:
                        metricaActual,
                    controles: {
                        soloPasado:
                            true,
                        ultimaSemanaUsada:
                            Number(
                                pasado.at(-1)?.semana ?? 0
                            ),
                        semanaObjetivo,
                        contaminacionTemporal:
                            false
                    }
                });

                if (filas.length % 3 === 0) {
                    await new Promise(
                        resolve=>setTimeout(resolve,0)
                    );
                }
            }

            const resumenBase =
                this.resumirBacktestWalkForward(
                    filas,
                    "base"
                );

            const resumenActual =
                this.resumirBacktestWalkForward(
                    filas,
                    "actualLookahead"
                );

            const auditoriaAblacion =
                this.resumirAblacionWalkForward(
                    filas,
                    variantesAblacion,
                    resumenBase
                );

            const auditoriaEstadistica =
                this.calcularAuditoriaEstadisticaWalkForward(
                    resumenBase,
                    resumenActual,
                    filas.length
                );

            const perfilProfundidadBase =
                this.calcularPerfilProfundidadRanking(
                    filas,
                    "base"
                );

            const perfilProfundidadActual =
                this.calcularPerfilProfundidadRanking(
                    filas,
                    "actualLookahead"
                );

            const auditoriaMotores =
                this.resumirAuditoriaMotoresWalkForward(
                    filas
                );

            const diseccionBloqueHistorico =
                this.analizarBloqueHistoricoWalkForward(
                    filas
                );

            const discriminacionDireccional =
                this.auditarDiscriminacionDireccional(
                    filas
                );

            const snapshotDespues = {
                totalSemanas:
                    this.entorno?.datosHistorial?.length ?? 0,
                evaluacionesPersistidas:
                    this.entorno?.evaluacionesPersistidas?.length ?? 0,
                evaluacionesMotor:
                    this.entorno?.motorEvaluacion
                        ?.obtenerHistorial?.()
                        ?.length ?? 0,
                sumaPesos:
                    Number(
                        Object.values(
                            this.entorno?.motorManager
                                ?.obtenerPesos?.() ?? {}
                        )
                            .reduce(
                                (t,v)=>t+Number(v ?? 0),
                                0
                            )
                            .toFixed(6)
                    )
            };

            const integridadReal =
                JSON.stringify(snapshotAntes) ===
                JSON.stringify(snapshotDespues);

            this.backtestWalkForward = {
                esquema:
                    "BACKTEST_WALK_FORWARD_TECNICO_V1",
                versionControl:
                    this.version,
                creadoEn:
                    new Date().toISOString(),
                persistenciaFirestore:
                    false,
                escriturasFirestore:
                    0,
                minimoHistorial:
                    Number(minimoHistorial),
                totalSemanasFuente:
                    historial.length,
                totalVentanas:
                    filas.length,
                primeraSemanaObjetivo:
                    filas[0]?.semana ?? null,
                ultimaSemanaObjetivo:
                    filas.at(-1)?.semana ?? null,
                metodologia: {
                    base:
                        "Pesos originales normalizados a 100. Cada predicción usa exclusivamente semanas anteriores al objetivo.",
                    actualLookahead:
                        "Diagnóstico solamente. Usa los pesos activos actuales, aprendidos con información posterior; no constituye out-of-sample puro.",
                    fuente:
                        "Historial técnico/sintético disponible en memoria.",
                    precisionPredictivaReal:
                        false
                },
                pesosBase,
                pesosActualesDiagnostico:
                    pesosActuales,
                filas,
                resumenBase,
                resumenActualLookahead:
                    resumenActual,
                auditoriaAblacion,
                auditoriaEstadistica,
                perfilProfundidad: {
                    base:
                        perfilProfundidadBase,
                    actualLookahead:
                        perfilProfundidadActual
                },
                auditoriaMotores,
                diseccionBloqueHistorico,
                discriminacionDireccional,
                auditoriaTemporal: {
                    totalControles:
                        filas.length,
                    aprobados:
                        filas.filter(
                            x =>
                                x.controles?.soloPasado === true &&
                                x.controles?.contaminacionTemporal === false &&
                                Number(
                                    x.controles?.ultimaSemanaUsada
                                ) <
                                Number(
                                    x.controles?.semanaObjetivo
                                )
                        ).length,
                    valida:
                        filas.every(
                            x =>
                                x.controles?.soloPasado === true &&
                                x.controles?.contaminacionTemporal === false &&
                                Number(
                                    x.controles?.ultimaSemanaUsada
                                ) <
                                Number(
                                    x.controles?.semanaObjetivo
                                )
                        )
                },
                integridadReal: {
                    intacta:
                        integridadReal,
                    antes:
                        snapshotAntes,
                    despues:
                        snapshotDespues
                }
            };

            console.log(
                "BACKTEST WALK-FORWARD:",
                this.backtestWalkForward
            );

            this.renderBacktestWalkForward(
                this.backtestWalkForward
            );

            return this.backtestWalkForward;
        }
        finally {
            this.backtestWalkForwardEjecutando =
                false;
        }
    }


    renderBacktestWalkForward(
        backtest
    ) {

        const contenedor =
            this.raiz?.querySelector(
                "[data-backtest-walk-forward-resultados]"
            );

        if (!contenedor) {
            return;
        }

        const base =
            backtest?.resumenBase ?? {};

        const actual =
            backtest?.resumenActualLookahead ?? {};

        const filas =
            backtest?.filas ?? [];

        contenedor.innerHTML = `
            <div class="walk-forward">
                <div class="walk-forward__cabecera">
                    <div>
                        <span>BACKTEST TÉCNICO / WALK-FORWARD</span>
                        <h3>
                            Semanas ${backtest.primeraSemanaObjetivo ?? "—"}
                            → ${backtest.ultimaSemanaObjetivo ?? "—"}
                        </h3>
                    </div>

                    <strong>
                        ${backtest.escriturasFirestore} ESCRITURAS
                    </strong>
                </div>

                <div class="walk-forward__alerta">
                    <strong>Validación técnica, no predictiva real.</strong>
                    <div>
                        El historial disponible es sintético/de prueba.
                        La variante BASE evita look-ahead; la variante
                        PESOS ACTUALES se muestra solo como diagnóstico.
                    </div>
                </div>

                <div class="walk-forward__metricas">
                    <div>
                        <span>Ventanas</span>
                        <strong>${backtest.totalVentanas}</strong>
                    </div>
                    <div>
                        <span>Auditoría temporal</span>
                        <strong>
                            ${
                                backtest.auditoriaTemporal?.valida
                                    ? "VÁLIDA"
                                    : "FALLÓ"
                            }
                            · ${backtest.auditoriaTemporal?.aprobados}/${backtest.auditoriaTemporal?.totalControles}
                        </strong>
                    </div>
                    <div>
                        <span>Integridad real</span>
                        <strong>
                            ${
                                backtest.integridadReal?.intacta
                                    ? "INTACTA"
                                    : "ALTERADA"
                            }
                        </strong>
                    </div>
                    <div>
                        <span>Historial mínimo</span>
                        <strong>${backtest.minimoHistorial}</strong>
                    </div>
                </div>

                <div class="walk-forward__discriminacion">
                    <div class="walk-forward__estadistica-cabecera">
                        <strong>Discriminación direccional del bloque histórico</strong>
                        <span>AUC 0.5 = referencia sin discriminación</span>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Motor</th>
                                <th>AUC media</th>
                                <th>AUC invertida*</th>
                                <th>Sem. &lt; 0.5</th>
                                <th>Sem. &gt; 0.5</th>
                                <th>Lectura</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${
                                (
                                    backtest
                                        ?.discriminacionDireccional
                                        ?.motores ??
                                    []
                                )
                                    .map(x=>`
                                        <tr>
                                            <td>${this.escapeHTML(x.motor)}</td>
                                            <td>${x.aucPromedio}</td>
                                            <td>${x.aucInvertidaTeorica}</td>
                                            <td>${x.semanasDebajo05}</td>
                                            <td>${x.semanasEncima05}</td>
                                            <td>${this.escapeHTML(x.lectura)}</td>
                                        </tr>
                                    `)
                                    .join("")
                            }
                        </tbody>
                    </table>

                    <div class="walk-forward__correlaciones">
                        <strong>Correlación Spearman entre rankings de motores</strong>
                        <table>
                            <thead>
                                <tr>
                                    <th>Motor A</th>
                                    <th>Motor B</th>
                                    <th>ρ medio</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${
                                    (
                                        backtest
                                            ?.discriminacionDireccional
                                            ?.correlacionesRanking ??
                                        []
                                    )
                                        .map(x=>`
                                            <tr>
                                                <td>${this.escapeHTML(x.motorA)}</td>
                                                <td>${this.escapeHTML(x.motorB)}</td>
                                                <td>${x.spearmanPromedio}</td>
                                            </tr>
                                        `)
                                        .join("")
                                }
                            </tbody>
                        </table>
                    </div>

                    <small>
                        * AUC invertida = 1 − AUC y se muestra únicamente
                        como diagnóstico de orientación. No se ha invertido
                        ningún motor ni se han cambiado pesos reales.
                    </small>
                </div>

                <div class="walk-forward__bloque-historico">
                    <div class="walk-forward__estadistica-cabecera">
                        <strong>Disección del bloque histórico</strong>
                        <span>
                            frecuencia · tendencia · histórico
                        </span>
                    </div>

                    <div class="walk-forward__profundidad-resumen">
                        <div>
                            <span>Los 3 penalizan</span>
                            <strong>
                                ${
                                    backtest
                                        ?.diseccionBloqueHistorico
                                        ?.resumen
                                        ?.semanasTresPenalizan
                                    ?? "—"
                                }
                                /
                                ${
                                    backtest
                                        ?.diseccionBloqueHistorico
                                        ?.resumen
                                        ?.ventanas
                                    ?? "—"
                                }
                            </strong>
                        </div>
                        <div>
                            <span>Al menos 2 penalizan</span>
                            <strong>
                                ${
                                    backtest
                                        ?.diseccionBloqueHistorico
                                        ?.resumen
                                        ?.semanasAlMenosDosPenalizan
                                    ?? "—"
                                }
                                /
                                ${
                                    backtest
                                        ?.diseccionBloqueHistorico
                                        ?.resumen
                                        ?.ventanas
                                    ?? "—"
                                }
                            </strong>
                        </div>
                        <div>
                            <span>Correlación |r| media</span>
                            <strong>
                                ${
                                    backtest
                                        ?.diseccionBloqueHistorico
                                        ?.resumen
                                        ?.correlacionMediaAbsoluta
                                    ?? "—"
                                }
                            </strong>
                        </div>
                        <div>
                            <span>Lectura</span>
                            <strong>
                                ${
                                    this.escapeHTML(
                                        backtest
                                            ?.diseccionBloqueHistorico
                                            ?.resumen
                                            ?.lecturaDireccion
                                        ?? "—"
                                    )
                                }
                            </strong>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Motor</th>
                                <th>Δ score prom.</th>
                                <th>Δ aporte prom.</th>
                                <th>Orden observado</th>
                                <th>Sem. penaliza</th>
                                <th>Sem. favorece</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${
                                (
                                    backtest
                                        ?.diseccionBloqueHistorico
                                        ?.motores ??
                                    []
                                )
                                    .map(x=>`
                                        <tr>
                                            <td>${this.escapeHTML(x.motor)}</td>
                                            <td>${x.deltaScorePromedio}</td>
                                            <td>${x.deltaAportePromedio}</td>
                                            <td>${x.ordenMedioObservados}</td>
                                            <td>${x.semanasPenaliza}</td>
                                            <td>${x.semanasFavorece}</td>
                                        </tr>
                                    `)
                                    .join("")
                            }
                        </tbody>
                    </table>

                    <div class="walk-forward__correlaciones">
                        <strong>Correlación de Δ score semanal</strong>
                        <table>
                            <thead>
                                <tr>
                                    <th>Motor A</th>
                                    <th>Motor B</th>
                                    <th>Pearson r</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${
                                    (
                                        backtest
                                            ?.diseccionBloqueHistorico
                                            ?.correlaciones ??
                                        []
                                    )
                                        .map(x=>`
                                            <tr>
                                                <td>${this.escapeHTML(x.motorA)}</td>
                                                <td>${this.escapeHTML(x.motorB)}</td>
                                                <td>${x.correlacionDeltaScore}</td>
                                            </tr>
                                        `)
                                        .join("")
                                }
                            </tbody>
                        </table>
                    </div>

                    <small>
                        Esta disección mide si frecuencia, tendencia e histórico
                        tienden a penalizar simultáneamente a los números que
                        luego aparecen y si sus señales semanales son redundantes.
                        Es diagnóstico interno sobre los mismos folds; no constituye
                        validación predictiva independiente.
                    </small>
                </div>

                <div class="walk-forward__ablacion">
                    <div class="walk-forward__estadistica-cabecera">
                        <strong>Ablación contrafactual · diagnóstico exploratorio</strong>
                        <span>Sin persistencia · pesos renormalizados a 100</span>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Variante</th>
                                <th>Excluye</th>
                                <th>T10 prom.</th>
                                <th>Δ T10</th>
                                <th>T20 prom.</th>
                                <th>Δ T20</th>
                                <th>Orden prom.</th>
                                <th>Mejora orden</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${
                                (
                                    backtest
                                        ?.auditoriaAblacion
                                        ?.variantes ??
                                    []
                                )
                                    .map(x=>`
                                        <tr>
                                            <td>${this.escapeHTML(x.id)}</td>
                                            <td>${this.escapeHTML(x.excluye.join(", "))}</td>
                                            <td>${x.promedioAciertosTop10}</td>
                                            <td>${x.deltaTop10VsBase}</td>
                                            <td>${x.promedioAciertosTop20}</td>
                                            <td>${x.deltaTop20VsBase}</td>
                                            <td>${x.promedioOrdenGlobal}</td>
                                            <td>${x.deltaOrdenVsBase}</td>
                                        </tr>
                                    `)
                                    .join("")
                            }
                        </tbody>
                    </table>

                    <small>
                        Esta prueba elimina motores y redistribuye proporcionalmente
                        sus pesos entre los restantes. Como las exclusiones se
                        eligieron después de observar estos mismos 13 folds,
                        cualquier mejora es evidencia diagnóstica interna y no
                        una validación predictiva independiente.
                    </small>
                </div>

                <div class="walk-forward__motores">
                    <div class="walk-forward__estadistica-cabecera">
                        <strong>Auditoría por motor · BASE sin look-ahead</strong>
                        <span>
                            Orden aleatorio de referencia: 50.5
                        </span>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Motor</th>
                                <th>Δ score observado</th>
                                <th>Δ aporte</th>
                                <th>Orden medio observado</th>
                                <th>T10 motor</th>
                                <th>T20 motor</th>
                                <th>Sem. + / -</th>
                                <th>Lectura</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${
                                (
                                    backtest
                                        ?.auditoriaMotores
                                        ?.motores ??
                                    []
                                )
                                    .map(x=>`
                                        <tr>
                                            <td>${this.escapeHTML(x.motor)}</td>
                                            <td>${x.deltaScorePromedio}</td>
                                            <td>${x.deltaAportePromedio}</td>
                                            <td>${x.ordenMedioObservados}</td>
                                            <td>${x.top10MotorTotal}</td>
                                            <td>${x.top20MotorTotal}</td>
                                            <td>
                                                ${x.semanasFavorables}
                                                /
                                                ${x.semanasDesfavorables}
                                            </td>
                                            <td>${this.escapeHTML(x.lectura)}</td>
                                        </tr>
                                    `)
                                    .join("")
                            }
                        </tbody>
                    </table>

                    <small>
                        Δ score = score medio del motor para números observados
                        menos score medio para los otros 90. Un orden medio
                        superior a 50.5 indica que ese motor tiende a colocar
                        los observados por debajo de la mitad esperada.
                    </small>
                </div>

                <div class="walk-forward__profundidad">
                    <div class="walk-forward__estadistica-cabecera">
                        <strong>Perfil de profundidad del ranking · BASE</strong>
                        <span>
                            Primer límite compatible con azar:
                            TOP${backtest.perfilProfundidad?.base?.primerLimiteCompatibleConAzar ?? "—"}
                        </span>
                    </div>

                    <div class="walk-forward__profundidad-resumen">
                        <div>
                            <span>Observaciones</span>
                            <strong>
                                ${backtest.perfilProfundidad?.base?.totalObservaciones ?? "—"}
                            </strong>
                        </div>
                        <div>
                            <span>Promedio de orden</span>
                            <strong>
                                ${backtest.perfilProfundidad?.base?.promedioOrden ?? "—"}
                            </strong>
                        </div>
                        <div>
                            <span>Mediana de orden</span>
                            <strong>
                                ${backtest.perfilProfundidad?.base?.medianaOrden ?? "—"}
                            </strong>
                        </div>
                        <div>
                            <span>TOP50 / BOTTOM50</span>
                            <strong>
                                ${
                                    backtest.perfilProfundidad?.base?.mitadRanking
                                        ? `${backtest.perfilProfundidad.base.mitadRanking.top50} / ${backtest.perfilProfundidad.base.mitadRanking.bottom50}`
                                        : "—"
                                }
                            </strong>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Límite</th>
                                <th>Observado</th>
                                <th>Esperado</th>
                                <th>Diferencia</th>
                                <th>IC95%</th>
                                <th>P(X≤obs.)</th>
                                <th>Lectura</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${
                                (backtest.perfilProfundidad?.base?.acumulados ?? [])
                                    .map(x=>`
                                        <tr>
                                            <td>TOP${x.limite}</td>
                                            <td>${x.observado}</td>
                                            <td>${x.esperado}</td>
                                            <td>${x.diferencia}</td>
                                            <td>
                                                ${x.intervaloCentral95?.inferior ?? "—"}–${x.intervaloCentral95?.superior ?? "—"}
                                            </td>
                                            <td>${x.probabilidadMenorIgual}</td>
                                            <td>${this.escapeHTML(x.lectura)}</td>
                                        </tr>
                                    `)
                                    .join("")
                            }
                        </tbody>
                    </table>

                    <div class="walk-forward__deciles">
                        <strong>Distribución por deciles</strong>
                        <table>
                            <thead>
                                <tr>
                                    <th>Rango</th>
                                    <th>Observado</th>
                                    <th>Esperado</th>
                                    <th>Diferencia</th>
                                    <th>Ratio</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${
                                    (backtest.perfilProfundidad?.base?.deciles ?? [])
                                        .map(x=>`
                                            <tr>
                                                <td>${x.rango}</td>
                                                <td>${x.observado}</td>
                                                <td>${x.esperado}</td>
                                                <td>${x.diferencia}</td>
                                                <td>${x.ratioEsperado}</td>
                                            </tr>
                                        `)
                                        .join("")
                                }
                            </tbody>
                        </table>
                    </div>

                    <small>
                        El perfil acumulado permite localizar hasta qué profundidad
                        del ranking persiste la desviación respecto del azar. Los
                        deciles son descriptivos; la lectura exacta se aplica a
                        los acumulados TOPK.
                    </small>
                </div>

                <div class="walk-forward__estadistica">
                    <div class="walk-forward__estadistica-cabecera">
                        <strong>Auditoría estadística contra azar</strong>
                        <span>
                            ${this.escapeHTML(
                                backtest.auditoriaEstadistica
                                    ?.base
                                    ?.lecturaGlobal ??
                                "—"
                            )}
                        </span>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Control</th>
                                <th>Observado</th>
                                <th>Esperado</th>
                                <th>IC central 95%</th>
                                <th>P(X ≤ observado)</th>
                                <th>Lectura</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${
                                [
                                    [
                                        "BASE TOP10",
                                        backtest.auditoriaEstadistica?.base?.top10
                                    ],
                                    [
                                        "BASE TOP20",
                                        backtest.auditoriaEstadistica?.base?.top20
                                    ],
                                    [
                                        "ACTUAL* TOP10",
                                        backtest.auditoriaEstadistica?.actualLookahead?.top10
                                    ],
                                    [
                                        "ACTUAL* TOP20",
                                        backtest.auditoriaEstadistica?.actualLookahead?.top20
                                    ]
                                ]
                                    .map(([nombre,d])=>`
                                        <tr>
                                            <td>${nombre}</td>
                                            <td>${d?.observado ?? "—"}</td>
                                            <td>${d?.esperado ?? "—"}</td>
                                            <td>
                                                ${
                                                    d?.intervaloCentral95
                                                        ? `${d.intervaloCentral95.inferior}–${d.intervaloCentral95.superior}`
                                                        : "—"
                                                }
                                            </td>
                                            <td>${d?.probabilidadMenorIgual ?? "—"}</td>
                                            <td>${this.escapeHTML(d?.lectura ?? "—")}</td>
                                        </tr>
                                    `)
                                    .join("")
                            }
                        </tbody>
                    </table>

                    <small>
                        Referencia exacta bajo selección aleatoria sin reemplazo.
                        Las ventanas se tratan como independientes solo para esta
                        referencia teórica; no implica validación predictiva real.
                    </small>
                </div>

                <div class="walk-forward__comparacion">
                    <table>
                        <thead>
                            <tr>
                                <th>Métrica</th>
                                <th>Base original</th>
                                <th>Pesos actuales*</th>
                                <th>Ref. aleatoria</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Promedio aciertos TOP10</td>
                                <td>${base.promedioAciertosTop10 ?? "—"}</td>
                                <td>${actual.promedioAciertosTop10 ?? "—"}</td>
                                <td>1</td>
                            </tr>
                            <tr>
                                <td>Promedio aciertos TOP20</td>
                                <td>${base.promedioAciertosTop20 ?? "—"}</td>
                                <td>${actual.promedioAciertosTop20 ?? "—"}</td>
                                <td>2</td>
                            </tr>
                            <tr>
                                <td>Semanas con ≥1 acierto TOP10</td>
                                <td>${base.semanasConTop10 ?? "—"}/${base.ventanas ?? "—"}</td>
                                <td>${actual.semanasConTop10 ?? "—"}/${actual.ventanas ?? "—"}</td>
                                <td>—</td>
                            </tr>
                            <tr>
                                <td>Promedio de orden real</td>
                                <td>${base.promedioOrdenGlobal ?? "—"}</td>
                                <td>${actual.promedioOrdenGlobal ?? "—"}</td>
                                <td>50.5</td>
                            </tr>
                            <tr>
                                <td>Mejor orden global</td>
                                <td>${base.mejorOrdenGlobal ?? "—"}</td>
                                <td>${actual.mejorOrdenGlobal ?? "—"}</td>
                                <td>—</td>
                            </tr>
                        </tbody>
                    </table>
                    <small>
                        * Pesos actuales: comparación diagnóstica con look-ahead;
                        no debe interpretarse como rendimiento fuera de muestra.
                    </small>
                </div>

                <div class="walk-forward__tabla-wrap">
                    <table class="walk-forward__tabla">
                        <thead>
                            <tr>
                                <th>Semana</th>
                                <th>Historial</th>
                                <th>Base T10</th>
                                <th>Base T20</th>
                                <th>Base prom. orden</th>
                                <th>Actual* T10</th>
                                <th>Actual* T20</th>
                                <th>Actual* prom. orden</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${
                                filas.map(f=>`
                                    <tr>
                                        <td>${f.semana}</td>
                                        <td>${f.historialUsado}</td>
                                        <td>${f.base?.aciertosTop10 ?? "—"}</td>
                                        <td>${f.base?.aciertosTop20 ?? "—"}</td>
                                        <td>${f.base?.promedioOrden ?? "—"}</td>
                                        <td>${f.actualLookahead?.aciertosTop10 ?? "—"}</td>
                                        <td>${f.actualLookahead?.aciertosTop20 ?? "—"}</td>
                                        <td>${f.actualLookahead?.promedioOrden ?? "—"}</td>
                                    </tr>
                                `).join("")
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }


    renderBancoEscenarios(
        banco
    ) {

        const contenedor =
            this.raiz.querySelector(
                "[data-banco-escenarios-resultados]"
            );

        if (!contenedor) {
            return;
        }

        const resumen =
            banco.resumen;

        const topFrecuencia =
            resumen.frecuenciaTop10
                .slice(0,20)
                .map(
                    x => `
                        <span>
                            <b>${String(x.numero).padStart(2,"0")}</b>
                            ${x.porcentaje}%
                        </span>
                    `
                )
                .join("");

        const lideres =
            resumen.lideres
                .slice(0,10)
                .map(
                    x => `
                        <span>
                            <b>${String(x.numero).padStart(2,"0")}</b>
                            ${x.cantidad}/${resumen.totalEscenarios}
                            · ${x.porcentaje}%
                        </span>
                    `
                )
                .join("");

        contenedor.innerHTML = `
            <div class="banco-escenarios__resultado">
                <div class="banco-escenarios__cabecera">
                    <div>
                        <div class="resultado-preflight__eyebrow">
                            BANCO REPRODUCIBLE / MULTIMUESTRA
                        </div>
                        <h3>
                            Robustez ampliada · ${banco.cantidadEscenarios} escenarios
                        </h3>
                    </div>
                    <span class="resultado-simulacion__badge">
                        0 ESCRITURAS
                    </span>
                </div>

                <div class="banco-escenarios__metricas">
                    <div>
                        <span>Semilla</span>
                        <strong>${banco.semilla}</strong>
                    </div>
                    <div>
                        <span>Escenarios</span>
                        <strong>${banco.cantidadEscenarios}</strong>
                    </div>
                    <div>
                        <span>Auditorías válidas</span>
                        <strong>${resumen.auditoriasValidas}/${resumen.totalEscenarios}</strong>
                    </div>
                    <div>
                        <span>Integridad real</span>
                        <strong>${banco.integridadReal?.intacta ? "INTACTA" : "REVISAR"}</strong>
                    </div>
                    <div>
                        <span>Núcleo 100%</span>
                        <strong>${resumen.nucleo100.length}/10</strong>
                    </div>
                    <div>
                        <span>Núcleo ≥80%</span>
                        <strong>${resumen.nucleo80.length}</strong>
                    </div>
                    <div>
                        <span>Líder dominante</span>
                        <strong>
                            ${
                                resumen.liderDominante
                                    ? `${String(resumen.liderDominante.numero).padStart(2,"0")} · ${resumen.liderDominante.porcentaje}%`
                                    : "—"
                            }
                        </strong>
                    </div>
                    <div>
                        <span>Jaccard activo/adaptativo</span>
                        <strong>${resumen.jaccardActivoAdaptativo.promedio}</strong>
                    </div>
                </div>

                <div class="banco-escenarios__percentiles">
                    <div>
                        <strong>Jaccard activo/adaptativo</strong>
                        <span>P10 ${resumen.jaccardActivoAdaptativo.p10}</span>
                        <span>Mediana ${resumen.jaccardActivoAdaptativo.mediana}</span>
                        <span>P90 ${resumen.jaccardActivoAdaptativo.p90}</span>
                    </div>
                    <div>
                        <strong>Volatilidad de pesos L1</strong>
                        <span>P10 ${resumen.volatilidadPesosL1.p10}</span>
                        <span>Mediana ${resumen.volatilidadPesosL1.mediana}</span>
                        <span>P90 ${resumen.volatilidadPesosL1.p90}</span>
                    </div>
                    <div>
                        <strong>Cambios TOP10</strong>
                        <span>P10 ${resumen.cambiosTop10.p10}</span>
                        <span>Mediana ${resumen.cambiosTop10.mediana}</span>
                        <span>P90 ${resumen.cambiosTop10.p90}</span>
                    </div>
                </div>

                <div class="banco-robustez-cruzada">
                    <div class="banco-robustez-cruzada__cabecera">
                        <div>
                            <strong>
                                Auditoría de robustez cruzada
                            </strong>
                            <small>
                                Compara los TOP10 adaptativos entre los 30 escenarios.
                            </small>
                        </div>
                        <span>
                            ${banco.auditoriaRobustezCruzada?.clasificacion ?? "—"}
                            · ${banco.auditoriaRobustezCruzada?.indiceRobustezCruzada ?? "—"}/100
                        </span>
                    </div>

                    <div class="banco-robustez-cruzada__metricas">
                        <div>
                            <span>Comparaciones</span>
                            <strong>${banco.auditoriaRobustezCruzada?.totalComparaciones ?? "—"}</strong>
                        </div>
                        <div>
                            <span>Jaccard cruzado medio</span>
                            <strong>${banco.auditoriaRobustezCruzada?.jaccardEntreEscenarios?.promedio ?? "—"}</strong>
                        </div>
                        <div>
                            <span>Mediana</span>
                            <strong>${banco.auditoriaRobustezCruzada?.jaccardEntreEscenarios?.mediana ?? "—"}</strong>
                        </div>
                        <div>
                            <span>P10 / P90</span>
                            <strong>
                                ${banco.auditoriaRobustezCruzada?.jaccardEntreEscenarios?.p10 ?? "—"}
                                /
                                ${banco.auditoriaRobustezCruzada?.jaccardEntreEscenarios?.p90 ?? "—"}
                            </strong>
                        </div>
                        <div>
                            <span>Estabilidad líder</span>
                            <strong>${banco.auditoriaRobustezCruzada?.estabilidadLider ?? "—"}%</strong>
                        </div>
                        <div>
                            <span>Entropía líder</span>
                            <strong>${banco.auditoriaRobustezCruzada?.entropiaLiderNormalizada ?? "—"}</strong>
                        </div>
                    </div>

                    <div class="banco-robustez-cruzada__pares">
                        <div>
                            <strong>Par más similar:</strong>
                            ${
                                banco.auditoriaRobustezCruzada?.parMasSimilar
                                    ? `${this.escapeHTML(String(banco.auditoriaRobustezCruzada.parMasSimilar.idA))} / ${this.escapeHTML(String(banco.auditoriaRobustezCruzada.parMasSimilar.idB))} · ${banco.auditoriaRobustezCruzada.parMasSimilar.jaccard}`
                                    : "—"
                            }
                        </div>
                        <div>
                            <strong>Par menos similar:</strong>
                            ${
                                banco.auditoriaRobustezCruzada?.parMenosSimilar
                                    ? `${this.escapeHTML(String(banco.auditoriaRobustezCruzada.parMenosSimilar.idA))} / ${this.escapeHTML(String(banco.auditoriaRobustezCruzada.parMenosSimilar.idB))} · ${banco.auditoriaRobustezCruzada.parMenosSimilar.jaccard}`
                                    : "—"
                            }
                        </div>
                    </div>

                    <div class="banco-robustez-cruzada__tipos">
                        <strong>Resumen por tipo de escenario</strong>
                        <div class="banco-robustez-cruzada__tabla-wrap">
                            <table class="banco-robustez-cruzada__tabla">
                                <thead>
                                    <tr>
                                        <th>Tipo</th>
                                        <th>N</th>
                                        <th>Jaccard interno</th>
                                        <th>Núcleo 100%</th>
                                        <th>Líder dominante</th>
                                        <th>TOP frecuencia</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${
                                        (banco.auditoriaRobustezCruzada?.porTipo ?? [])
                                            .map(grupo=>`
                                                <tr>
                                                    <td>${this.escapeHTML(String(grupo.tipo))}</td>
                                                    <td>${grupo.cantidad}</td>
                                                    <td>${grupo.jaccardInternoPromedio}</td>
                                                    <td>
                                                        ${
                                                            grupo.nucleo100?.length
                                                                ? grupo.nucleo100
                                                                    .map(n=>String(n).padStart(2,"0"))
                                                                    .join(" · ")
                                                                : "—"
                                                        }
                                                    </td>
                                                    <td>
                                                        ${
                                                            grupo.liderDominante
                                                                ? `${String(grupo.liderDominante.numero).padStart(2,"0")} · ${grupo.liderDominante.porcentaje}%`
                                                                : "—"
                                                        }
                                                    </td>
                                                    <td>
                                                        ${
                                                            grupo.topFrecuencia
                                                                .slice(0,5)
                                                                .map(x=>`${String(x.numero).padStart(2,"0")} (${x.porcentaje}%)`)
                                                                .join(" · ")
                                                        }
                                                    </td>
                                                </tr>
                                            `)
                                            .join("")
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>


                <div class="consenso-robusto">
                    <div class="consenso-robusto__cabecera">
                        <div>
                            <strong>Consenso robusto ponderado por familias</strong>
                            <small>
                                Pondera presencia, cobertura entre familias y coherencia interna de cada familia.
                            </small>
                        </div>
                        <span>
                            ${
                                banco.consensoRobustoFamilias?.top10?.length
                                    ? `${banco.consensoRobustoFamilias.top10.length} candidatos`
                                    : "—"
                            }
                        </span>
                    </div>

                    <div class="consenso-robusto__metricas">
                        <div>
                            <span>Núcleo muy robusto</span>
                            <strong>
                                ${
                                    banco.consensoRobustoFamilias?.nucleoMuyRobusto?.length
                                        ? banco.consensoRobustoFamilias.nucleoMuyRobusto
                                            .map(n=>String(n).padStart(2,"0"))
                                            .join(" · ")
                                        : "—"
                                }
                            </strong>
                        </div>
                        <div>
                            <span>Núcleo robusto</span>
                            <strong>
                                ${
                                    banco.consensoRobustoFamilias?.nucleoRobusto?.length
                                        ? banco.consensoRobustoFamilias.nucleoRobusto
                                            .map(n=>String(n).padStart(2,"0"))
                                            .join(" · ")
                                        : "—"
                                }
                            </strong>
                        </div>
                        <div>
                            <span>Familia más estable</span>
                            <strong>
                                ${
                                    banco.consensoRobustoFamilias?.familiaMasEstable
                                        ? `${this.escapeHTML(banco.consensoRobustoFamilias.familiaMasEstable.tipo)} · ${banco.consensoRobustoFamilias.familiaMasEstable.jaccard}`
                                        : "—"
                                }
                            </strong>
                        </div>
                        <div>
                            <span>Familia más sensible</span>
                            <strong>
                                ${
                                    banco.consensoRobustoFamilias?.familiaMasSensible
                                        ? `${this.escapeHTML(banco.consensoRobustoFamilias.familiaMasSensible.tipo)} · ${banco.consensoRobustoFamilias.familiaMasSensible.jaccard}`
                                        : "—"
                                }
                            </strong>
                        </div>
                    </div>

                    <div class="consenso-robusto__tabla-wrap">
                        <table class="consenso-robusto__tabla">
                            <thead>
                                <tr>
                                    <th>Orden</th>
                                    <th>Número</th>
                                    <th>Score robusto</th>
                                    <th>Nivel</th>
                                    <th>Score base</th>
                                    <th>Cobertura</th>
                                    <th>Familias ≥80%</th>
                                    <th>Familias 100%</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${
                                    (banco.consensoRobustoFamilias?.top10 ?? [])
                                        .map(x=>`
                                            <tr>
                                                <td>${x.orden}</td>
                                                <td>${String(x.numero).padStart(2,"0")}</td>
                                                <td>${x.scoreRobusto}</td>
                                                <td>${this.escapeHTML(x.nivelRobustez)}</td>
                                                <td>${x.scoreBase}</td>
                                                <td>${x.coberturaPct}%</td>
                                                <td>${x.familias80}/${banco.consensoRobustoFamilias.familias}</td>
                                                <td>${x.familias100}/${banco.consensoRobustoFamilias.familias}</td>
                                            </tr>
                                        `)
                                        .join("")
                                }
                            </tbody>
                        </table>
                    </div>

                    <div class="consenso-robusto__nota">
                        Score robusto v2: presencia ponderada 70%,
                        cobertura familiar 20%, estabilidad ≥80% 7%
                        y estabilidad 100% 3%, con penalización
                        multiplicativa por cobertura incompleta.
                    </div>
                </div>


                <div class="banco-escenarios__bloque">
                    <strong>Núcleo 100%:</strong>
                    ${
                        resumen.nucleo100.length
                            ? resumen.nucleo100
                                .map(n=>String(n).padStart(2,"0"))
                                .join(" · ")
                            : "Ningún número aparece en el TOP10 de todos los escenarios."
                    }
                </div>

                <div class="banco-escenarios__bloque">
                    <strong>Núcleo ≥80%:</strong>
                    ${
                        resumen.nucleo80.length
                            ? resumen.nucleo80
                                .map(n=>String(n).padStart(2,"0"))
                                .join(" · ")
                            : "Ningún número alcanza 80% de presencia."
                    }
                </div>

                <div class="banco-escenarios__bloque">
                    <strong>Frecuencia TOP10:</strong>
                    <div class="banco-escenarios__chips">
                        ${topFrecuencia}
                    </div>
                </div>

                <div class="banco-escenarios__bloque">
                    <strong>Distribución de líderes:</strong>
                    <div class="banco-escenarios__chips">
                        ${lideres}
                    </div>
                </div>

                <div class="banco-escenarios__cierre">
                    <strong>
                        ${
                            resumen.todosValidos &&
                            banco.integridadReal?.intacta
                                ? "Banco válido y estado real preservado."
                                : "El banco requiere revisión."
                        }
                    </strong>
                    <div>
                        La semilla fija permite repetir exactamente
                        la misma muestra para comparar futuras versiones
                        del motor.
                    </div>
                </div>
            </div>
        `;
    }


    renderLaboratorioEscenarios(
        laboratorio
    ) {

        const contenedor =
            this.raiz.querySelector(
                "[data-laboratorio-resultados]"
            );

        if (!contenedor) {
            return;
        }

        const resumen =
            laboratorio.resumen;

        const filas =
            laboratorio.escenarios
                .map(escenario => {
                    const top =
                        (escenario.top10Adaptativo?.length
                            ? escenario.top10Adaptativo
                            : escenario.top10Base
                        )
                            .map(
                                x =>
                                    String(x.numero).padStart(2,"0")
                            )
                            .join(" · ");

                    const lider =
                        escenario.liderAdaptativo ??
                        escenario.liderBase;

                    return `
                        <tr>
                            <td>
                                <strong>${this.escapeHTML(escenario.nombre)}</strong>
                                <small>${escenario.numeros.map(n=>String(n).padStart(2,"0")).join(" ")}</small>
                            </td>
                            <td>${escenario.aciertosTop10}/10</td>
                            <td>${escenario.aciertosTop20}/10</td>
                            <td>${String(lider ?? "—").padStart(2,"0")}</td>
                            <td>${escenario.comparacion?.coincidenciasTop10 ?? "—"}/10</td>
                            <td>${Number(escenario.cambioPesos?.l1 ?? 0).toFixed(3)}</td>
                            <td>${escenario.auditoria?.valida ? "✓" : "✕"}</td>
                            <td><small>${top}</small></td>
                        </tr>
                    `;
                })
                .join("");

        const frecuencia =
            resumen.frecuenciaTop10
                .slice(0,15)
                .map(
                    item => `
                        <span>
                            <b>${String(item.numero).padStart(2,"0")}</b>
                            ${item.cantidad}/${resumen.totalEscenarios}
                        </span>
                    `
                )
                .join("");

        contenedor.innerHTML = `
            <div class="laboratorio-escenarios__resultado">
                <div class="laboratorio-escenarios__cabecera">
                    <div>
                        <div class="resultado-preflight__eyebrow">
                            LABORATORIO / MULTIESCENARIO
                        </div>
                        <h3>
                            Robustez y sensibilidad · Semana 22 → 23
                        </h3>
                    </div>
                    <span class="resultado-simulacion__badge">
                        0 ESCRITURAS
                    </span>
                </div>

                <div class="laboratorio-escenarios__metricas">
                    <div>
                        <span>Escenarios</span>
                        <strong>${resumen.totalEscenarios}</strong>
                    </div>
                    <div>
                        <span>Núcleo TOP10 estable</span>
                        <strong>${resumen.nucleoEstable.length}/10</strong>
                    </div>
                    <div>
                        <span>Estabilidad núcleo</span>
                        <strong>${resumen.estabilidadNucleoPct}%</strong>
                    </div>
                    <div>
                        <span>Líder dominante</span>
                        <strong>${resumen.liderDominante ? String(resumen.liderDominante.numero).padStart(2,"0") : "—"}</strong>
                    </div>
                    <div>
                        <span>Sensibilidad adaptativa</span>
                        <strong>${resumen.sensibilidadPromedio}</strong>
                        <small>cambios TOP10 promedio</small>
                    </div>
                    <div>
                        <span>Volatilidad pesos L1</span>
                        <strong>${resumen.volatilidadPesosPromedioL1}</strong>
                    </div>
                    <div>
                        <span>Auditorías válidas</span>
                        <strong>${resumen.auditoriasValidas}/${resumen.totalEscenarios}</strong>
                    </div>
                    <div>
                        <span>Integridad real</span>
                        <strong>${laboratorio.integridadReal?.intacta ? "INTACTA" : "REVISAR"}</strong>
                    </div>
                </div>

                <div class="laboratorio-robustez">
                    <div class="laboratorio-robustez__cabecera">
                        <div>
                            <strong>Auditoría cuantitativa de robustez</strong>
                            <small>
                                Similaridad TOP10, estabilidad posicional,
                                líderes y sensibilidad de pesos.
                            </small>
                        </div>
                        <span>
                            ${laboratorio.auditoriaCuantitativa?.clasificacion ?? "—"}
                            · ${laboratorio.auditoriaCuantitativa?.robustezIndice ?? "—"}/100
                        </span>
                    </div>

                    <div class="laboratorio-robustez__metricas">
                        <div>
                            <span>Jaccard promedio</span>
                            <strong>${laboratorio.auditoriaCuantitativa?.similitudPromedio ?? "—"}</strong>
                        </div>
                        <div>
                            <span>Entropía líder</span>
                            <strong>${laboratorio.auditoriaCuantitativa?.entropiaLider ?? "—"}</strong>
                        </div>
                        <div>
                            <span>Entropía normalizada</span>
                            <strong>${laboratorio.auditoriaCuantitativa?.entropiaLiderNormalizada ?? "—"}</strong>
                        </div>
                        <div>
                            <span>Par más similar</span>
                            <strong>
                                ${
                                    laboratorio.auditoriaCuantitativa?.parMasSimilar
                                        ? `${laboratorio.auditoriaCuantitativa.parMasSimilar.a}/${laboratorio.auditoriaCuantitativa.parMasSimilar.b} · ${laboratorio.auditoriaCuantitativa.parMasSimilar.jaccard}`
                                        : "—"
                                }
                            </strong>
                        </div>
                        <div>
                            <span>Par menos similar</span>
                            <strong>
                                ${
                                    laboratorio.auditoriaCuantitativa?.parMenosSimilar
                                        ? `${laboratorio.auditoriaCuantitativa.parMenosSimilar.a}/${laboratorio.auditoriaCuantitativa.parMenosSimilar.b} · ${laboratorio.auditoriaCuantitativa.parMenosSimilar.jaccard}`
                                        : "—"
                                }
                            </strong>
                        </div>
                    </div>

                    <div class="laboratorio-robustez__subtitulo">
                        Matriz de similitud TOP10 (Jaccard)
                    </div>

                    <div class="laboratorio-robustez__matriz-wrap">
                        <table class="laboratorio-robustez__matriz">
                            <thead>
                                <tr>
                                    <th>Escenario</th>
                                    ${
                                        (laboratorio.auditoriaCuantitativa?.etiquetas ?? [])
                                            .map(x=>`<th>${this.escapeHTML(x)}</th>`)
                                            .join("")
                                    }
                                </tr>
                            </thead>
                            <tbody>
                                ${
                                    (laboratorio.auditoriaCuantitativa?.matrizJaccard ?? [])
                                        .map((fila,i)=>`
                                            <tr>
                                                <th>${this.escapeHTML(laboratorio.auditoriaCuantitativa.etiquetas[i])}</th>
                                                ${fila.map(v=>`<td>${v}</td>`).join("")}
                                            </tr>
                                        `)
                                        .join("")
                                }
                            </tbody>
                        </table>
                    </div>

                    <div class="laboratorio-robustez__dos-columnas">
                        <div>
                            <div class="laboratorio-robustez__subtitulo">
                                Estabilidad por posición
                            </div>
                            <table class="laboratorio-robustez__tabla">
                                <thead>
                                    <tr>
                                        <th>Pos.</th>
                                        <th>Número dominante</th>
                                        <th>Repite</th>
                                        <th>Estabilidad</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${
                                        (laboratorio.auditoriaCuantitativa?.estabilidadPosicional ?? [])
                                            .map(x=>`
                                                <tr>
                                                    <td>${x.posicion}</td>
                                                    <td>${x.numeroDominante == null ? "—" : String(x.numeroDominante).padStart(2,"0")}</td>
                                                    <td>${x.repeticiones}/${laboratorio.cantidadEscenarios}</td>
                                                    <td>${x.porcentaje}%</td>
                                                </tr>
                                            `)
                                            .join("")
                                    }
                                </tbody>
                            </table>
                        </div>

                        <div>
                            <div class="laboratorio-robustez__subtitulo">
                                Sensibilidad promedio por motor
                            </div>
                            <table class="laboratorio-robustez__tabla">
                                <thead>
                                    <tr>
                                        <th>Motor</th>
                                        <th>|Δ| medio</th>
                                        <th>Δ medio</th>
                                        <th>Máx.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${
                                        (laboratorio.auditoriaCuantitativa?.sensibilidadMotores ?? [])
                                            .map(x=>`
                                                <tr>
                                                    <td>${this.escapeHTML(x.motor)}</td>
                                                    <td>${x.promedioAbs}</td>
                                                    <td>${x.deltaMedio}</td>
                                                    <td>${x.maxAbs} · ${this.escapeHTML(x.escenarioMax ?? "—")}</td>
                                                </tr>
                                            `)
                                            .join("")
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>


                <div class="laboratorio-escenarios__nucleo">
                    <strong>Núcleo estable:</strong>
                    ${
                        resumen.nucleoEstable.length
                            ? resumen.nucleoEstable
                                .map(n=>String(n).padStart(2,"0"))
                                .join(" · ")
                            : "Ningún número aparece en el TOP10 de todos los escenarios."
                    }
                </div>

                <div class="laboratorio-escenarios__frecuencia">
                    <strong>Frecuencia en TOP10:</strong>
                    <div>${frecuencia}</div>
                </div>

                <div class="laboratorio-escenarios__tabla-wrap">
                    <table class="laboratorio-escenarios__tabla">
                        <thead>
                            <tr>
                                <th>Escenario</th>
                                <th>Aciertos T10</th>
                                <th>Aciertos T20</th>
                                <th>Líder 23</th>
                                <th>Coinc. activo/adapt.</th>
                                <th>Δ pesos L1</th>
                                <th>Audit.</th>
                                <th>TOP10 semana 23</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filas}
                        </tbody>
                    </table>
                </div>

                <div class="laboratorio-escenarios__cierre">
                    <strong>
                        ${resumen.todosValidos && laboratorio.integridadReal?.intacta
                            ? "Laboratorio válido y estado real preservado."
                            : "El laboratorio requiere revisión."}
                    </strong>
                    <div>
                        Mayor variación individual de peso:
                        ${
                            resumen.maxCambioPeso
                                ? `${this.escapeHTML(resumen.maxCambioPeso.motor)} · ${Number(resumen.maxCambioPeso.absoluto).toFixed(4)} · escenario ${this.escapeHTML(resumen.maxCambioPeso.escenario)}`
                                : "—"
                        }
                    </div>
                </div>
            </div>
        `;
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


                ${
                    escenario.auditoriaFidelidadTemporal
                        ? `
                        <div class="resultado-simulacion__auditoria">
                            <div class="resultado-simulacion__adaptativo-titulo">
                                <strong>Auditoría de fidelidad temporal</strong>
                                <span>${escenario.auditoriaFidelidadTemporal.valida ? "APROBADA" : "REVISAR"}</span>
                            </div>

                            <div class="resultado-simulacion__auditoria-resumen">
                                <div>
                                    <span>Controles</span>
                                    <strong>${escenario.auditoriaFidelidadTemporal.totalControles}</strong>
                                </div>
                                <div>
                                    <span>Aprobados</span>
                                    <strong>${escenario.auditoriaFidelidadTemporal.aprobados}</strong>
                                </div>
                                <div>
                                    <span>Fallidos</span>
                                    <strong>${escenario.auditoriaFidelidadTemporal.fallidos}</strong>
                                </div>
                                <div>
                                    <span>Resultado</span>
                                    <strong>${escenario.auditoriaFidelidadTemporal.valida ? "VÁLIDA" : "REVISAR"}</strong>
                                </div>
                            </div>

                            <div class="resultado-simulacion__auditoria-lista">
                                ${escenario.auditoriaFidelidadTemporal.controles.map(control => `
                                    <div class="${control.ok ? "ok" : "error"}">
                                        <span>${control.ok ? "✓" : "✕"}</span>
                                        <div>
                                            <strong>${this.escapeHTML(control.codigo)}</strong>
                                            <small>${this.escapeHTML(control.detalle)}</small>
                                        </div>
                                    </div>
                                `).join("")}
                            </div>
                        </div>`
                        : ""
                }


                <div class="laboratorio-escenarios">
                    <div class="laboratorio-escenarios__intro">
                        <div>
                            <strong>
                                Laboratorio de Escenarios · v2.9.0
                            </strong>
                            <p>
                                Ejecuta 5 escenarios temporales y compara estabilidad,
                                sensibilidad del TOP10 y volatilidad de pesos.
                                Todo permanece en memoria.
                            </p>
                        </div>

                        <button
                            type="button"
                            class="resultado-btn resultado-btn--simulacion"
                            data-resultado-accion="ejecutar-laboratorio"
                        >
                            Ejecutar laboratorio de 5 escenarios
                        </button>
                    </div>

                    <div data-laboratorio-resultados></div>

                    <div class="banco-escenarios">
                        <div class="banco-escenarios__intro">
                            <div>
                                <strong>
                                    Banco de Escenarios Reproducible · v2.9.0
                                </strong>
                                <p>
                                    Ejecuta 30 escenarios deterministas con semilla fija,
                                    distribuidos entre referencia, TOP, mixtos, medios,
                                    contraste y uniformes. Todo permanece en memoria.
                                </p>
                            </div>

                            <button
                                type="button"
                                class="resultado-btn resultado-btn--simulacion"
                                data-resultado-accion="ejecutar-banco-escenarios"
                            >
                                Ejecutar banco de 30 escenarios
                            </button>
                        </div>

                        <div data-banco-escenarios-resultados></div>
                    </div>

                    <div class="walk-forward-panel">
                        <div class="walk-forward-panel__intro">
                            <div>
                                <strong>
                                    Backtest Técnico Walk-Forward · v2.9.0
                                </strong>
                                <p>
                                    Reconstruye cada predicción usando únicamente
                                    las semanas anteriores al objetivo. No escribe
                                    en Firestore.
                                </p>
                            </div>

                            <button
                                type="button"
                                class="resultado-btn resultado-btn--simulacion"
                                data-resultado-accion="ejecutar-walk-forward"
                            >
                                Ejecutar walk-forward
                            </button>
                        </div>

                        <div data-backtest-walk-forward-resultados></div>
                    </div>
                </div>


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
                        El ciclo simulado y el banco de robustez ya están
                        auditados. El siguiente control recomendado es el
                        backtest técnico walk-forward, que reconstruye cada
                        semana usando únicamente información anterior.
                    </p>
                </div>

            </div>
        `;


        const botonLaboratorio =
            contenedor.querySelector(
                '[data-resultado-accion="ejecutar-laboratorio"]'
            );


        botonLaboratorio?.addEventListener(
            "click",
            async () => {

                if (this.laboratorioEjecutando) {
                    return;
                }

                botonLaboratorio.disabled = true;
                botonLaboratorio.textContent =
                    "Ejecutando laboratorio...";

                try {
                    await this.ejecutarLaboratorioEscenarios();
                }
                catch (error) {
                    console.error(
                        "Error ejecutando Laboratorio de Escenarios:",
                        error
                    );

                    const salida =
                        this.raiz.querySelector(
                            "[data-laboratorio-resultados]"
                        );

                    if (salida) {
                        salida.innerHTML = `
                            <div class="resultado-real__mensaje resultado-real__mensaje--error">
                                <strong>Laboratorio bloqueado.</strong>
                                <div>${this.escapeHTML(error?.message || error)}</div>
                            </div>
                        `;
                    }
                }
                finally {
                    botonLaboratorio.disabled = false;
                    botonLaboratorio.textContent =
                        "Ejecutar laboratorio de 5 escenarios";
                }
            }
        );


        const botonBanco =
            contenedor.querySelector(
                '[data-resultado-accion="ejecutar-banco-escenarios"]'
            );


        botonBanco?.addEventListener(
            "click",
            async () => {

                if (this.bancoEscenariosEjecutando) {
                    return;
                }

                botonBanco.disabled = true;
                botonBanco.textContent =
                    "Ejecutando 30 escenarios...";

                try {
                    await this.ejecutarBancoEscenarios({
                        cantidad: 30,
                        semilla: 1709
                    });
                }
                catch (error) {
                    console.error(
                        "Error ejecutando Banco de Escenarios:",
                        error
                    );

                    const salida =
                        this.raiz.querySelector(
                            "[data-banco-escenarios-resultados]"
                        );

                    if (salida) {
                        salida.innerHTML = `
                            <div class="resultado-real__mensaje resultado-real__mensaje--error">
                                <strong>Banco bloqueado.</strong>
                                <div>${this.escapeHTML(error?.message || error)}</div>
                            </div>
                        `;
                    }
                }
                finally {
                    botonBanco.disabled = false;
                    botonBanco.textContent =
                        "Ejecutar banco de 30 escenarios";
                }
            }
        );


        const botonWalkForward =
            contenedor.querySelector(
                '[data-resultado-accion="ejecutar-walk-forward"]'
            );

        botonWalkForward?.addEventListener(
            "click",
            async () => {

                if (this.backtestWalkForwardEjecutando) {
                    return;
                }

                botonWalkForward.disabled = true;
                botonWalkForward.textContent =
                    "Ejecutando walk-forward...";

                try {
                    await this.ejecutarBacktestWalkForward({
                        minimoHistorial: 8
                    });
                }
                catch (error) {
                    console.error(
                        "Error ejecutando walk-forward:",
                        error
                    );

                    const salida =
                        this.raiz.querySelector(
                            "[data-backtest-walk-forward-resultados]"
                        );

                    if (salida) {
                        salida.innerHTML = `
                            <div class="resultado-real__mensaje resultado-real__mensaje--error">
                                <strong>Walk-forward bloqueado.</strong>
                                <div>${this.escapeHTML(error?.message || error)}</div>
                            </div>
                        `;
                    }
                }
                finally {
                    botonWalkForward.disabled = false;
                    botonWalkForward.textContent =
                        "Ejecutar walk-forward";
                }
            }
        );

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
