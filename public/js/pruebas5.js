/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * js/pruebas.js
 *
 * Versión:
 * 3.5.3
 *
 * Propósito:
 *
 * Entorno centralizado de pruebas y orquestación del
 * Sistema Heurístico Evolutivo.
 *
 * NUEVO v3.5.3
 *
 *   - Integración de PrediccionService.guardarSeguro().
 *   - Protección automática contra predicciones pendientes duplicadas.
 *   - Reutilización de predicción pendiente existente por semana.
 *   - Opción forzarNueva para regeneraciones explícitas.
 *   - Integración de SemanaService al flujo automático.
 *   - Recuperación de ciclos parciales mediante estado YA_PROCESADA.
 *   - Recarga de historial, estadísticas y motores después de guardar
 *     una semana real.
 *   - Sincronización automática de pesos con MotorManager.
 *   - Generación segura de la siguiente predicción.
 *
 * Flujo:
 *
 *   Predicción N
 *       ↓
 *   Evaluación
 *       ↓
 *   Evolución
 *       ↓
 *   Optimización
 *       ↓
 *   Guardar semana real
 *       ↓
 *   Recargar base heurística
 *       ↓
 *   Sincronizar pesos
 *       ↓
 *   Generar/Reutilizar predicción N+1
 *
 **********************************************************************/

/*====================================================================
    IMPORTS - SERVICIOS
====================================================================*/

import HistorialService
    from "./services/HistorialService.js";

import EstadisticasService
    from "./services/EstadisticasService.js";

import PrediccionService
    from "./services/PrediccionService.js";

import EvaluacionService
    from "./services/EvaluacionService.js";

import EvolucionService
    from "./services/EvolucionService.js";

import OptimizacionService
    from "./services/OptimizacionService.js";

import ConfiguracionPesosService
    from "./services/ConfiguracionPesosService.js";

import FlujoAutomaticoService
    from "./services/FlujoAutomaticoService.js";

import SemanaService
    from "./services/SemanaService.js";


/*====================================================================
    IMPORTS - MOTORES
====================================================================*/

import BaseMotor
    from "./motores/BaseMotor.js";

import MotorFrecuencia
    from "./motores/MotorFrecuencia.js";

import MotorAtraso
    from "./motores/MotorAtraso.js";

import MotorTendencia
    from "./motores/MotorTendencia.js";

import MotorRepeticion
    from "./motores/MotorRepeticion.js";

import MotorHistorico
    from "./motores/MotorHistorico.js";

import MotorParidad
    from "./motores/MotorParidad.js";

import MotorRangos
    from "./motores/MotorRangos.js";

import MotorDistribucion
    from "./motores/MotorDistribucion.js";

import MotorAsociaciones
    from "./motores/MotorAsociaciones.js";

import MotorCiclos
    from "./motores/MotorCiclos.js";

import MotorManager
    from "./motores/MotorManager.js";

import MotorRanking
    from "./motores/MotorRanking.js";

import MotorEvaluacion
    from "./motores/MotorEvaluacion.js";

import MotorEvolucion
    from "./motores/MotorEvolucion.js";

import MotorOptimizacion
    from "./motores/MotorOptimizacion.js";


/*====================================================================
    CLASE
====================================================================*/

class EntornoPruebas {


    /*================================================================
        CONSTRUCTOR
    ================================================================*/

    constructor() {

        this.version =
            "3.5.3";


        this.inicializado =
            false;


        /*============================================================
            SERVICIOS
        ============================================================*/

        this.historialService =
            null;

        this.estadisticasService =
            null;

        this.prediccionService =
            null;

        this.evaluacionService =
            null;

        this.evolucionService =
            null;

        this.optimizacionService =
            null;

        this.configuracionPesosService =
            null;

        this.flujoAutomaticoService =
            null;

        this.semanaService =
            null;


        /*============================================================
            CONFIGURACIÓN DEL FLUJO
        ============================================================*/

        this.modoFlujoAutomatico =
            "CONTROLADO";


        this.ultimoFlujoAutomatico =
            null;


        /*============================================================
            DATOS BASE
        ============================================================*/

        this.datosHistorial =
            [];

        this.datosEstadisticas =
            null;


        /*============================================================
            MOTORES
        ============================================================*/

        this.baseMotor =
            null;

        this.motorFrecuencia =
            null;

        this.motorAtraso =
            null;

        this.motorTendencia =
            null;

        this.motorRepeticion =
            null;

        this.motorHistorico =
            null;

        this.motorParidad =
            null;

        this.motorRangos =
            null;

        this.motorDistribucion =
            null;

        this.motorAsociaciones =
            null;

        this.motorCiclos =
            null;

        this.motorManager =
            null;

        this.motorRanking =
            null;

        this.motorEvaluacion =
            null;

        this.motorEvolucion =
            null;

        this.motorOptimizacion =
            null;


        /*============================================================
            RESULTADOS TEMPORALES
        ============================================================*/

        this.ultimoRanking =
            null;

        this.ultimaPrediccion =
            null;

        this.ultimaPrediccionFirestore =
            null;

        this.ultimaEvaluacion =
            null;

        this.ultimaEvaluacionFirestore =
            null;

        this.ultimaEvolucion =
            null;

        this.ultimaEvolucionFirestore =
            null;

        this.ultimaOptimizacion =
            null;

        this.ultimaOptimizacionFirestore =
            null;


        /*============================================================
            CONFIGURACIÓN PESOS
        ============================================================*/

        this.configuracionPesosActiva =
            null;

        this.historialConfiguracionPesos =
            [];


        this.pesosBase = {

            frecuencia:
                15,

            atraso:
                10,

            tendencia:
                20,

            repeticion:
                10,

            historico:
                15,

            paridad:
                5,

            rangos:
                5,

            distribucion:
                5,

            asociaciones:
                10,

            ciclos:
                15

        };


        /*============================================================
            CACHE FIRESTORE
        ============================================================*/

        this.prediccionesPersistidas =
            [];

        this.evaluacionesPersistidas =
            [];

        this.evolucionesPersistidas =
            [];

        this.optimizacionesPersistidas =
            [];

    }


    /*================================================================
        INICIALIZAR
    ================================================================*/

    async inicializar() {

        console.log(
            "========================================"
        );

        console.log(
            "INICIALIZANDO ENTORNO DE PRUEBAS"
        );

        console.log(
            "Versión pruebas.js:",
            this.version
        );

        console.log(
            "========================================"
        );


        try {


            /*========================================================
                HISTORIAL
            ========================================================*/

            this.historialService =
                new HistorialService();


            this.datosHistorial =
                await this.historialService
                    .obtenerHistorial();


            if (
                !Array.isArray(
                    this.datosHistorial
                )
            ) {

                this.datosHistorial =
                    [];

            }


            console.log(
                "Historial cargado:",
                this.datosHistorial.length,
                "semana(s)"
            );


            /*========================================================
                ESTADÍSTICAS
            ========================================================*/

            this.estadisticasService =
                new EstadisticasService();


            this.datosEstadisticas =
                await this.estadisticasService
                    .calcular();


            console.log(
                "Estadísticas calculadas correctamente."
            );


            console.log(
                "Estadísticas disponibles:",
                this.obtenerArrayEstadisticas()
                    .length
            );


            /*========================================================
                SERVICIOS
            ========================================================*/

            this.prediccionService =
                new PrediccionService();


            console.log(
                "PrediccionService inicializado."
            );


            this.evaluacionService =
                new EvaluacionService();


            console.log(
                "EvaluacionService inicializado."
            );


            this.evolucionService =
                new EvolucionService();


            console.log(
                "EvolucionService inicializado."
            );


            this.optimizacionService =
                new OptimizacionService();


            console.log(
                "OptimizacionService inicializado."
            );


            this.configuracionPesosService =
                new ConfiguracionPesosService();


            console.log(
                "ConfiguracionPesosService inicializado."
            );

            this.semanaService =
                new SemanaService();


            console.log(
                "SemanaService inicializado."
            );


            /*========================================================
                FLUJO AUTOMÁTICO
            ========================================================*/

            this.flujoAutomaticoService =
                new FlujoAutomaticoService({

                    modo:
                        this.modoFlujoAutomatico,

                    evitarDuplicados:
                        true

                });


            console.log(
                "FlujoAutomaticoService inicializado."
            );


            console.log(
                "Modo flujo automático:",
                this.modoFlujoAutomatico
            );


            /*========================================================
                PESOS
            ========================================================*/

            await this
                .cargarConfiguracionPesos();


            console.log(
                "Pesos activos cargados:",
                this.sumaPesosBase()
            );


            /*========================================================
                BASE MOTOR
            ========================================================*/

            this.baseMotor =
                new BaseMotor(
                    "Motor de Prueba"
                );


            this.baseMotor.inicializar({

                historial:
                    this.datosHistorial,

                estadisticas:
                    this.obtenerArrayEstadisticas()

            });


            console.log(
                "BaseMotor inicializado."
            );


            /*========================================================
                MOTORES INDIVIDUALES
            ========================================================*/

            this.motorFrecuencia =
                new MotorFrecuencia();

            this.inicializarMotor(
                this.motorFrecuencia
            );

            console.log(
                "MotorFrecuencia inicializado."
            );


            this.motorAtraso =
                new MotorAtraso();

            this.inicializarMotor(
                this.motorAtraso
            );

            console.log(
                "MotorAtraso inicializado."
            );


            this.motorTendencia =
                new MotorTendencia();

            this.inicializarMotor(
                this.motorTendencia
            );

            console.log(
                "MotorTendencia inicializado."
            );


            this.motorRepeticion =
                new MotorRepeticion();

            this.inicializarMotor(
                this.motorRepeticion
            );

            console.log(
                "MotorRepeticion inicializado."
            );


            this.motorHistorico =
                new MotorHistorico();

            this.inicializarMotor(
                this.motorHistorico
            );

            console.log(
                "MotorHistorico inicializado."
            );


            this.motorParidad =
                new MotorParidad();

            this.inicializarMotor(
                this.motorParidad
            );

            console.log(
                "MotorParidad inicializado."
            );


            this.motorRangos =
                new MotorRangos();

            this.inicializarMotor(
                this.motorRangos
            );

            console.log(
                "MotorRangos inicializado."
            );


            this.motorDistribucion =
                new MotorDistribucion();

            this.inicializarMotor(
                this.motorDistribucion
            );

            console.log(
                "MotorDistribucion inicializado."
            );


            this.motorAsociaciones =
                new MotorAsociaciones();

            this.inicializarMotor(
                this.motorAsociaciones
            );

            console.log(
                "MotorAsociaciones inicializado."
            );


            this.motorCiclos =
                new MotorCiclos();

            this.inicializarMotor(
                this.motorCiclos
            );

            console.log(
                "MotorCiclos inicializado."
            );


            /*========================================================
                MOTOR MANAGER
            ========================================================*/

            this.motorManager =
                new MotorManager();


            this.motorManager.inicializar({

                historial:
                    this.datosHistorial,

                estadisticas:
                    this.obtenerArrayEstadisticas(),

                configuracion: {

                    pesos:
                        this.obtenerPesosActivos()

                }

            });


            console.log(
                "MotorManager inicializado."
            );


            console.log(
                "MotorManager pesos activos:",
                this.motorManager
                    .sumarPesos()
            );


            /*========================================================
                MOTOR RANKING
            ========================================================*/

            this.motorRanking =
                new MotorRanking();


            console.log(
                "MotorRanking inicializado."
            );


            /*========================================================
                MOTOR EVALUACIÓN
            ========================================================*/

            this.motorEvaluacion =
                new MotorEvaluacion({

                    cantidadNumerosEsperados:
                        10,

                    minimoSemanasParaOptimizacion:
                        20

                });


            console.log(
                "MotorEvaluacion inicializado."
            );


            /*========================================================
                MOTOR EVOLUCIÓN
            ========================================================*/

            this.motorEvolucion =
                new MotorEvolucion({

                    minimoEvaluaciones:
                        20,

                    periodoReciente:
                        10,

                    cantidadPeriodos:
                        5,

                    umbralCambio:
                        5,

                    umbralCambioFuerte:
                        15,

                    umbralDiscriminacion:
                        2,

                    minimoIndicePositivo:
                        1,

                    minimoEvaluacionesTendencia:
                        3,

                    pendienteMinimaMotor:
                        0.05

                });


            console.log(
                "MotorEvolucion inicializado."
            );


            /*========================================================
                MOTOR OPTIMIZACIÓN
            ========================================================*/

            this.motorOptimizacion =
                new MotorOptimizacion({

                    minimoEvaluaciones:
                        20,

                    maximoCambioPorCiclo:
                        2,

                    pesoMinimo:
                        2,

                    pesoMaximo:
                        30,

                    sumaObjetivoPesos:
                        100

                });


            console.log(
                "MotorOptimizacion inicializado."
            );


            /*========================================================
                PERSISTENCIA
            ========================================================*/

            await this
                .cargarPersistenciaInicial();


            this.inicializado =
                true;


            console.log(
                "========================================"
            );

            console.log(
                "ENTORNO DE PRUEBAS LISTO"
            );

            console.log(
                "========================================"
            );


            return this;

        }

        catch (error) {

            this.inicializado =
                false;


            console.error(
                "ERROR AL INICIALIZAR ENTORNO:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        CONFIGURAR MODO FLUJO
    ================================================================*/

    configurarModoFlujo(
        modo = "CONTROLADO"
    ) {

        const modoNormalizado =
            String(
                modo
            ).toUpperCase();


        if (
            modoNormalizado !==
                "CONTROLADO" &&
            modoNormalizado !==
                "COMPLETO"
        ) {

            throw new Error(
                `Modo de flujo inválido: ${modo}`
            );

        }


        this.modoFlujoAutomatico =
            modoNormalizado;


        /*
         * Reconstruimos únicamente el orquestador.
         */

        this.flujoAutomaticoService =
            new FlujoAutomaticoService({

                modo:
                    this.modoFlujoAutomatico,

                evitarDuplicados:
                    true

            });


        console.log(
            "Modo flujo automático:",
            this.modoFlujoAutomatico
        );


        return this
            .flujoAutomaticoService
            .obtenerEstado();

    }


    /*================================================================
        OBTENER ESTADO FLUJO
    ================================================================*/

    estadoFlujoAutomatico() {

        if (
            !this.flujoAutomaticoService
        ) {

            return null;

        }


        return this.flujoAutomaticoService
            .obtenerEstado();

    }


    /*================================================================
        RESOLVER SIGUIENTE SEMANA
    ================================================================*/

    resolverSiguienteSemana({

        semana,

        fecha,

        siguienteSemana = null,

        siguienteFecha = null

    } = {}) {

        let numeroSiguiente =
            Number(
                siguienteSemana
            );


        if (
            !Number.isInteger(
                numeroSiguiente
            )
        ) {

            const actual =
                Number(
                    semana
                );


            numeroSiguiente =
                Number.isInteger(
                    actual
                )

                    ? actual + 1

                    : null;

        }


        let fechaSiguiente =
            siguienteFecha;


        /*
         * Si no se proporciona fecha,
         * intentamos sumar 7 días.
         */

        if (
            !fechaSiguiente &&
            fecha
        ) {

            const fechaBase =
                new Date(
                    `${fecha}T12:00:00`
                );


            if (
                !Number.isNaN(
                    fechaBase.getTime()
                )
            ) {

                fechaBase.setDate(
                    fechaBase.getDate() +
                    7
                );


                fechaSiguiente =
                    fechaBase
                        .toISOString()
                        .slice(
                            0,
                            10
                        );

            }

        }


        return {

            semana:
                numeroSiguiente,

            fecha:
                fechaSiguiente ??
                null

        };

    }


    /*================================================================
        ACTUALIZAR CACHES DESPUÉS DEL FLUJO
    ================================================================*/

    async actualizarCachesDespuesFlujo() {

        await Promise.all([

            this
                .cargarPrediccionesFirestore(),

            this
                .cargarEvaluacionesFirestore(),

            this
                .cargarEvolucionesFirestore(),

            this
                .cargarOptimizacionesFirestore()

        ]);


        return {

            predicciones:
                this.prediccionesPersistidas
                    .length,

            evaluaciones:
                this.evaluacionesPersistidas
                    .length,

            evoluciones:
                this.evolucionesPersistidas
                    .length,

            optimizaciones:
                this.optimizacionesPersistidas
                    .length

        };

    }


    /*================================================================
        CARGAR CONFIGURACIÓN PESOS
    ================================================================*/

    async cargarConfiguracionPesos() {

        if (
            !this.configuracionPesosService
        ) {

            throw new Error(
                "ConfiguracionPesosService no está inicializado."
            );

        }


        this.configuracionPesosActiva =
            await this.configuracionPesosService
                .obtenerConfiguracionActiva();


        if (
            this.configuracionPesosActiva
                ?.pesos
        ) {

            this.pesosBase = {

                ...this
                    .configuracionPesosActiva
                    .pesos

            };

        }


        this.historialConfiguracionPesos =
            await this.configuracionPesosService
                .obtenerHistorial();


        return this
            .configuracionPesosActiva;

    }


    /*================================================================
        RECARGAR PESOS
    ================================================================*/

    async recargarPesosActivos() {

        const configuracion =
            await this
                .cargarConfiguracionPesos();


        if (
            this.motorManager &&
            typeof this.motorManager
                .establecerPesos ===
                "function"
        ) {

            this.motorManager
                .establecerPesos(

                    this.obtenerPesosActivos()

                );

        }


        this.invalidarResultadosPorCambioPesos();


        console.log(
            "Pesos activos recargados:",
            configuracion?.sumaPesos
        );


        if (
            this.motorManager
        ) {

            console.log(
                "MotorManager sincronizado:",
                this.motorManager
                    .sumarPesos()
            );

        }


        return configuracion;

    }


    /*================================================================
        INVALIDAR RESULTADOS
    ================================================================*/

    invalidarResultadosPorCambioPesos() {

        this.ultimoRanking =
            null;


        this.ultimaPrediccion =
            null;


        return true;

    }


    /*================================================================
        PERSISTENCIA INICIAL
    ================================================================*/

    async cargarPersistenciaInicial() {

        try {

            this.prediccionesPersistidas =
                await this.prediccionService
                    .obtenerTodas(
                        "desc"
                    );


            console.log(
                "Predicciones Firestore:",
                this.prediccionesPersistidas
                    .length
            );

        }

        catch (error) {

            this.prediccionesPersistidas =
                [];

            console.warn(
                "No se pudieron cargar predicciones:",
                error
            );

        }


        try {

            this.evaluacionesPersistidas =
                await this.evaluacionService
                    .obtenerHistorial();


            console.log(
                "Evaluaciones Firestore:",
                this.evaluacionesPersistidas
                    .length
            );


            this.motorEvaluacion
                .limpiarHistorial();


            for (
                const evaluacion
                of this.evaluacionesPersistidas
            ) {

                this.motorEvaluacion
                    .agregarEvaluacion(
                        evaluacion
                    );

            }

        }

        catch (error) {

            this.evaluacionesPersistidas =
                [];

            console.warn(
                "No se pudieron cargar evaluaciones:",
                error
            );

        }


        try {

            this.evolucionesPersistidas =
                await this.evolucionService
                    .obtenerTodas(
                        "desc"
                    );


            console.log(
                "Evoluciones Firestore:",
                this.evolucionesPersistidas
                    .length
            );


            if (
                this.evolucionesPersistidas
                    .length > 0
            ) {

                this.ultimaEvolucionFirestore =
                    this.evolucionesPersistidas[0];

            }

        }

        catch (error) {

            this.evolucionesPersistidas =
                [];

            console.warn(
                "No se pudieron cargar evoluciones:",
                error
            );

        }


        try {

            this.optimizacionesPersistidas =
                await this.optimizacionService
                    .obtenerTodas(
                        "desc"
                    );


            console.log(
                "Optimizaciones Firestore:",
                this.optimizacionesPersistidas
                    .length
            );


            if (
                this.optimizacionesPersistidas
                    .length > 0
            ) {

                this.ultimaOptimizacionFirestore =
                    this.optimizacionesPersistidas[0];

            }

        }

        catch (error) {

            this.optimizacionesPersistidas =
                [];

            console.warn(
                "No se pudieron cargar optimizaciones:",
                error
            );

        }

    }


    /*================================================================
        INICIALIZAR MOTOR
    ================================================================*/

    inicializarMotor(
        motor
    ) {

        if (
            !motor ||
            typeof motor.inicializar !==
                "function"
        ) {

            return;

        }


        motor.inicializar({

            historial:
                this.datosHistorial,

            estadisticas:
                this.obtenerArrayEstadisticas()

        });

    }


    /*================================================================
        VERIFICAR INICIALIZACIÓN
    ================================================================*/

    verificarInicializacion() {

        if (
            !this.inicializado
        ) {

            throw new Error(
                "El entorno de pruebas no está inicializado."
            );

        }

    }


    /*================================================================
        ARRAY ESTADÍSTICAS
    ================================================================*/

    obtenerArrayEstadisticas() {

        if (
            !this.datosEstadisticas
        ) {

            return [];

        }


        if (
            Array.isArray(
                this.datosEstadisticas
                    .estadisticas
            )
        ) {

            return this
                .datosEstadisticas
                .estadisticas;

        }


        if (
            this.datosEstadisticas
                .estadisticas &&
            typeof this.datosEstadisticas
                .estadisticas ===
                "object"
        ) {

            return Object.values(
                this.datosEstadisticas
                    .estadisticas
            );

        }


        if (
            Array.isArray(
                this.datosEstadisticas
            )
        ) {

            return this
                .datosEstadisticas;

        }


        return [];

    }


    /*================================================================
        CONTEXTO
    ================================================================*/

    crearContexto(
        configuracion = {}
    ) {

        return {

            historial:
                this.datosHistorial,

            semanas:
                this.datosHistorial,

            estadisticas:
                this.obtenerArrayEstadisticas(),

            ...configuracion

        };

    }


    historial() {

        return this
            .datosHistorial;

    }


    estadisticas() {

        return this
            .datosEstadisticas;

    }


    /*================================================================
        PESOS
    ================================================================*/

    obtenerPesosBase() {

        return {

            ...this.pesosBase

        };

    }


    obtenerPesosActivos() {

        return {

            ...this.pesosBase

        };

    }


    obtenerConfiguracionPesosActiva() {

        if (
            !this.configuracionPesosActiva
        ) {

            return null;

        }


        return {

            ...this.configuracionPesosActiva,

            pesos: {

                ...this
                    .configuracionPesosActiva
                    .pesos

            }

        };

    }


    establecerPesosBase(
        nuevosPesos
    ) {

        if (
            !nuevosPesos ||
            typeof nuevosPesos !==
                "object"
        ) {

            throw new Error(
                "Los pesos recibidos no son válidos."
            );

        }


        this.pesosBase = {

            ...nuevosPesos

        };


        if (
            this.motorManager &&
            typeof this.motorManager
                .establecerPesos ===
                "function"
        ) {

            this.motorManager
                .establecerPesos(
                    this.pesosBase
                );

        }


        this.invalidarResultadosPorCambioPesos();


        return this
            .obtenerPesosBase();

    }


    sumaPesosBase() {

        return this.redondearNumero(

            Object.values(
                this.pesosBase
            )
            .reduce(

                (
                    suma,
                    valor
                ) =>

                    suma +
                    Number(
                        valor || 0
                    ),

                0

            ),

            6

        );

    }


    async cargarHistorialPesos() {

        this.historialConfiguracionPesos =
            await this.configuracionPesosService
                .obtenerHistorial();


        return this
            .historialConfiguracionPesos;

    }


    async obtenerVersionPesos(
        versionId
    ) {

        return await this.configuracionPesosService
            .obtenerVersion(
                versionId
            );

    }


    async restaurarConfiguracionPesos(
        versionId,
        motivo = null
    ) {

        this.verificarInicializacion();


        const restaurada =
            await this.configuracionPesosService
                .restaurarVersion(

                    versionId,

                    motivo

                );


        await this
            .recargarPesosActivos();


        const sincronizacion =
            this.verificarSincronizacionPesos();


        if (
            !sincronizacion
                .sincronizado
        ) {

            throw new Error(
                "La restauración terminó pero MotorManager no quedó sincronizado."
            );

        }


        return restaurada;

    }


    verificarSincronizacionPesos() {

        const pesosConfiguracion =
            this.obtenerPesosActivos();


        const pesosManager =

            this.motorManager &&
            typeof this.motorManager
                .obtenerPesos ===
                "function"

                ? this.motorManager
                    .obtenerPesos()

                : null;


        if (
            !pesosManager
        ) {

            return {

                sincronizado:
                    false,

                motivo:
                    "MotorManager no está disponible.",

                pesosConfiguracion,

                pesosManager:
                    null,

                diferencias:
                    null

            };

        }


        const diferencias =
            {};


        let sincronizado =
            true;


        for (
            const motor
            of Object.keys(
                pesosConfiguracion
            )
        ) {

            const configuracion =
                Number(
                    pesosConfiguracion[
                        motor
                    ]
                );


            const manager =
                Number(
                    pesosManager[
                        motor
                    ]
                );


            const diferencia =
                this.redondearNumero(

                    manager -
                    configuracion,

                    6

                );


            const coincide =

                Math.abs(
                    diferencia
                ) <= 0.000001;


            diferencias[
                motor
            ] = {

                configuracion,

                manager,

                diferencia,

                coincide

            };


            if (
                !coincide
            ) {

                sincronizado =
                    false;

            }

        }


        return {

            sincronizado,

            sumaConfiguracion:
                this.sumaPesosBase(),

            sumaManager:
                this.motorManager
                    .sumarPesos(),

            pesosConfiguracion,

            pesosManager,

            diferencias

        };

    }


    /*================================================================
        MOTORES INDIVIDUALES
    ================================================================*/

    frecuencia(
        numero,
        configuracion = {}
    ) {

        return this.motorFrecuencia
            .calcular(
                numero,
                this.crearContexto(
                    configuracion
                )
            );

    }


    atraso(
        numero,
        configuracion = {}
    ) {

        return this.motorAtraso
            .calcular(
                numero,
                this.crearContexto(
                    configuracion
                )
            );

    }


    tendencia(
        numero,
        configuracion = {}
    ) {

        return this.motorTendencia
            .calcular(
                numero,
                this.crearContexto(
                    configuracion
                )
            );

    }


    repeticion(
        numero,
        configuracion = {}
    ) {

        return this.motorRepeticion
            .calcular(
                numero,
                this.crearContexto(
                    configuracion
                )
            );

    }


    historico(
        numero,
        configuracion = {}
    ) {

        return this.motorHistorico
            .calcular(
                numero,
                this.crearContexto(
                    configuracion
                )
            );

    }


    paridad(
        numero,
        configuracion = {}
    ) {

        return this.motorParidad
            .calcular(
                numero,
                this.crearContexto(
                    configuracion
                )
            );

    }


    rangos(
        numero,
        configuracion = {}
    ) {

        return this.motorRangos
            .calcular(
                numero,
                this.crearContexto(
                    configuracion
                )
            );

    }


    distribucion(
        numero,
        configuracion = {}
    ) {

        return this.motorDistribucion
            .calcular(
                numero,
                this.crearContexto(
                    configuracion
                )
            );

    }


    asociaciones(
        numero,
        configuracion = {}
    ) {

        return this.motorAsociaciones
            .calcular(
                numero,
                this.crearContexto(
                    configuracion
                )
            );

    }


    ciclos(
        numero,
        configuracion = {}
    ) {

        return this.motorCiclos
            .calcular(
                numero,
                this.crearContexto(
                    configuracion
                )
            );

    }


    /*================================================================
        MOTOR MANAGER
    ================================================================*/

    manager(
        numero,
        configuracion = {}
    ) {

        this.verificarInicializacion();


        return this.motorManager
            .analizarNumero(
                numero,
                configuracion
            );

    }


    managerTodos(
        configuracion = {}
    ) {

        this.verificarInicializacion();


        return this.motorManager
            .analizarTodos(
                configuracion
            );

    }


    topManager(
        cantidad = 20,
        configuracion = {}
    ) {

        return this.motorManager
            .obtenerTop(
                cantidad,
                configuracion
            );

    }


    /*================================================================
        RANKING
    ================================================================*/

    generarRanking(
        opciones = {},
        configuracionManager = {}
    ) {

        const resultados =
            this.managerTodos(
                configuracionManager
            );


        this.ultimoRanking =
            this.motorRanking
                .generar(
                    resultados,
                    opciones
                );


        return this
            .ultimoRanking;

    }


    ranking() {

        if (
            !this.ultimoRanking
        ) {

            return this
                .generarRanking();

        }


        return this
            .ultimoRanking;

    }


    top10() {

        return this
            .ranking()
            .top10;

    }


    top20() {

        return this
            .ranking()
            .top20;

    }


    titulares() {

        return this
            .ranking()
            .equipoTitular;

    }


    suplentes() {

        return this
            .ranking()
            .equipoSuplente;

    }


    /*================================================================
        PREDICCIÓN
    ================================================================*/

    prepararPrediccion(
        datosSemana = {}
    ) {

        const ranking =
            this.ranking();


        this.ultimaPrediccion =
            this.motorRanking
                .prepararPrediccion(
                    ranking,
                    datosSemana
                );


        return this
            .ultimaPrediccion;

    }


    async guardarPrediccion(
        prediccion = null
    ) {

        const objetivo =

            prediccion ||
            this.ultimaPrediccion;


        if (
            !objetivo
        ) {

            throw new Error(
                "No existe una predicción para guardar."
            );

        }


        const guardada =
            await this.prediccionService
                .guardar(
                    objetivo
                );


        this.ultimaPrediccion =
            guardada;


        this.ultimaPrediccionFirestore =
            guardada;


        await this
            .cargarPrediccionesFirestore();


        return guardada;

    }

    /*================================================================
    GUARDAR PREDICCIÓN SEGURA
    v3.5.3
================================================================*/

async guardarPrediccionSegura(

    prediccion = null,

    {

        forzarNueva = false,

        incluirRankingExistente = true

    } = {}

) {

    this.verificarInicializacion();


    const objetivo =

        prediccion ||
        this.ultimaPrediccion;


    if (
        !objetivo
    ) {

        throw new Error(
            "No existe una predicción para guardar."
        );

    }


    if (
        !this.prediccionService ||
        typeof this.prediccionService
            .guardarSeguro !==
            "function"
    ) {

        throw new Error(
            "PrediccionService.guardarSeguro() no está disponible."
        );

    }


    const resultado =
        await this.prediccionService
            .guardarSeguro(

                objetivo,

                {

                    forzarNueva,

                    incluirRankingExistente

                }

            );


    if (
        !resultado ||
        !resultado.prediccion
    ) {

        throw new Error(
            "guardarSeguro() no devolvió una predicción válida."
        );

    }


    const prediccionFinal =
        resultado.prediccion;


    /*
     * Actualizamos referencias internas,
     * independientemente de si fue creada
     * o reutilizada.
     */

    this.ultimaPrediccion =
        prediccionFinal;


    this.ultimaPrediccionFirestore =
        prediccionFinal;


    await this
        .cargarPrediccionesFirestore();


    console.log(
        "Resultado guardado seguro:",
        resultado.accion
    );


    console.log(
        "Predicción:",
        prediccionFinal.id
    );


    return {

        accion:
            resultado.accion,

        creada:
            resultado.creada,

        reutilizada:
            resultado.reutilizada,

        prediccion:
            prediccionFinal

    };

}



    async prepararYGuardarPrediccion(
        datosSemana = {}
    ) {

        const prediccion =
            this.prepararPrediccion(
                datosSemana
            );


        return await this
            .guardarPrediccion(
                prediccion
            );

    }

    /*================================================================
    PREPARAR Y GUARDAR PREDICCIÓN SEGURA
    v3.5.3
================================================================*/

async prepararYGuardarPrediccionSegura(

    datosSemana = {},

    {

        forzarNueva = false,

        incluirRankingExistente = true

    } = {}

) {

    this.verificarInicializacion();


    const semanaObjetivo =
        Number(
            datosSemana
                .semanaObjetivo
        );


    if (
        !Number.isInteger(
            semanaObjetivo
        ) ||
        semanaObjetivo <= 0
    ) {

        throw new Error(
            `Semana objetivo inválida: ${datosSemana?.semanaObjetivo}`
        );

    }


    /*
     * OPTIMIZACIÓN IMPORTANTE:
     *
     * Antes de recalcular todo el ranking,
     * comprobamos si ya existe una predicción
     * pendiente para esa semana.
     */

    if (
        forzarNueva !== true
    ) {

        const existente =
            await this.prediccionService
                .obtenerPendientePorSemana(

                    semanaObjetivo,

                    {

                        incluirRanking:
                            incluirRankingExistente

                    }

                );


        if (
            existente
        ) {

            console.warn(
                `Ya existe una predicción pendiente para la semana ${semanaObjetivo}: ${existente.id}`
            );


            this.ultimaPrediccion =
                existente;


            this.ultimaPrediccionFirestore =
                existente;


            return {

                accion:
                    "REUTILIZADA",

                creada:
                    false,

                reutilizada:
                    true,

                prediccion:
                    existente

            };

        }

    }


    /*
     * No existe pendiente.
     *
     * Generamos ranking + predicción.
     */

    const prediccion =
        this.prepararPrediccion(
            datosSemana
        );


    return await this
        .guardarPrediccionSegura(

            prediccion,

            {

                forzarNueva,

                incluirRankingExistente

            }

        );

}

    async cargarPrediccion(
        id,
        completa = true
    ) {

        const prediccion =
            await this.prediccionService
                .obtener(

                    id,

                    {
                        incluirRanking:
                            completa
                    }

                );


        if (
            prediccion
        ) {

            this.ultimaPrediccionFirestore =
                prediccion;


            if (
                completa
            ) {

                this.ultimaPrediccion =
                    prediccion;

            }

        }


        return prediccion;

    }


    async cargarUltimaPrediccion(
        completa = true
    ) {

        const prediccion =
            await this.prediccionService
                .obtenerUltima(
                    completa
                );


        if (
            prediccion
        ) {

            this.ultimaPrediccionFirestore =
                prediccion;


            if (
                completa
            ) {

                this.ultimaPrediccion =
                    prediccion;

            }

        }


        return prediccion;

    }


    async cargarPrediccionesFirestore() {

        this.prediccionesPersistidas =
            await this.prediccionService
                .obtenerTodas(
                    "desc"
                );


        return this
            .prediccionesPersistidas;

    }


    /*================================================================
        PREDICCIONES POR SEMANA
        v3.5.3
    ================================================================*/

    async prediccionesSemana(

        semana,

        incluirRanking = false

    ) {

        this.verificarInicializacion();


        return await this.prediccionService
            .obtenerPorSemana(

                semana,

                {
                    incluirRanking
                }

            );

    }


    /*================================================================
        TABLA PREDICCIONES POR SEMANA
        v3.5.3
    ================================================================*/

    async tablaPrediccionesSemana(
        semana
    ) {

        const lista =
            await this
                .prediccionesSemana(
                    semana,
                    false
                );


        const tabla =
            lista.map(

                item => ({

                    id:
                        item.id,

                    semana:
                        item.semanaObjetivo,

                    fechaObjetivo:
                        item.fechaObjetivo,

                    fechaPrediccion:
                        item.fechaPrediccion,

                    evaluada:
                        item.evaluacion
                            ?.realizada ===
                            true,

                    pendiente:
                        item.evaluacion
                            ?.realizada !==
                            true,

                    evaluacionId:
                        item.evaluacion
                            ?.evaluacionId ??
                        null,

                    ranking:
                        item.totalRanking ??
                        0

                })

            );


        console.table(
            tabla
        );


        return tabla;

    }


    /*================================================================
        EVALUACIÓN
    ================================================================*/

    evaluar(
        numerosReales,
        datosSemana = {},
        prediccion = null
    ) {

        let objetivo =

            prediccion ||
            this.ultimaPrediccion;


        if (
            !objetivo
        ) {

            objetivo =
                this.prepararPrediccion(
                    datosSemana
                );

        }


        this.ultimaEvaluacion =
            this.motorEvaluacion
                .evaluar(
                    objetivo,
                    numerosReales,
                    datosSemana
                );


        this.ultimaEvolucion =
            null;


        this.ultimaOptimizacion =
            null;


        return this
            .ultimaEvaluacion;

    }


    async guardarEvaluacion(
        evaluacion = null
    ) {

        const objetivo =

            evaluacion ||
            this.ultimaEvaluacion;


        if (
            !objetivo
        ) {

            throw new Error(
                "No existe una evaluación para guardar."
            );

        }


        const guardada =
            await this.evaluacionService
                .guardar(
                    objetivo
                );


        this.ultimaEvaluacion =
            guardada;


        this.ultimaEvaluacionFirestore =
            guardada;


        await this
            .cargarEvaluacionesFirestore();


        return guardada;

    }


    async cargarEvaluacionesFirestore() {

        this.evaluacionesPersistidas =
            await this.evaluacionService
                .obtenerHistorial();


        if (
            this.motorEvaluacion
        ) {

            this.motorEvaluacion
                .limpiarHistorial();


            for (
                const evaluacion
                of this.evaluacionesPersistidas
            ) {

                this.motorEvaluacion
                    .agregarEvaluacion(
                        evaluacion
                    );

            }

        }


        return this
            .evaluacionesPersistidas;

    }


    evaluaciones() {

        return this.motorEvaluacion
            .obtenerHistorial();

    }


    /*================================================================
        EVOLUCIÓN
    ================================================================*/

    evolucion(
        evaluaciones = null,
        opciones = {}
    ) {

        const lista =

            Array.isArray(
                evaluaciones
            )

                ? evaluaciones

                : this.motorEvaluacion
                    .obtenerHistorial();


        this.ultimaEvolucion =
            this.motorEvolucion
                .analizar(
                    lista,
                    opciones
                );


        this.ultimaOptimizacion =
            null;


        return this
            .ultimaEvolucion;

    }


    async evolucionDesdeFirestore(
        opciones = {}
    ) {

        const evaluaciones =
            await this
                .cargarEvaluacionesFirestore();


        this.ultimaEvolucion =
            this.motorEvolucion
                .analizar(
                    evaluaciones,
                    opciones
                );


        this.ultimaOptimizacion =
            null;


        return this
            .ultimaEvolucion;

    }


    async guardarEvolucion(
        evolucion = null
    ) {

        const objetivo =

            evolucion ||
            this.ultimaEvolucion;


        if (
            !objetivo
        ) {

            throw new Error(
                "No existe una evolución para guardar."
            );

        }


        const guardada =
            await this.evolucionService
                .guardar(
                    objetivo
                );


        this.ultimaEvolucion =
            guardada;


        this.ultimaEvolucionFirestore =
            guardada;


        await this
            .cargarEvolucionesFirestore();


        return guardada;

    }


    async evolucionYGuardar(
        opciones = {}
    ) {

        const evolucion =
            await this
                .evolucionDesdeFirestore(
                    opciones
                );


        const guardada =
            await this
                .guardarEvolucion(
                    evolucion
                );


        return guardada;

    }


    async cargarEvolucion(
        id,
        completa = true
    ) {

        const evolucion =
            await this.evolucionService
                .obtener(

                    id,

                    {
                        incluirMotores:
                            completa
                    }

                );


        if (
            evolucion
        ) {

            this.ultimaEvolucionFirestore =
                evolucion;


            if (
                completa
            ) {

                this.ultimaEvolucion =
                    evolucion;

            }

        }


        return evolucion;

    }


    async cargarUltimaEvolucion(
        completa = true
    ) {

        const evolucion =
            await this.evolucionService
                .obtenerUltima(
                    completa
                );


        if (
            evolucion
        ) {

            this.ultimaEvolucionFirestore =
                evolucion;


            if (
                completa
            ) {

                this.ultimaEvolucion =
                    evolucion;

            }

        }


        return evolucion;

    }


    async cargarEvolucionesFirestore() {

        this.evolucionesPersistidas =
            await this.evolucionService
                .obtenerTodas(
                    "desc"
                );


        return this
            .evolucionesPersistidas;

    }


    /*================================================================
        OPTIMIZACIÓN
    ================================================================*/

    generarOptimizacion(
        evolucion = null,
        pesosActuales = null,
        opciones = {}
    ) {

        const evolucionObjetivo =

            evolucion ||
            this.ultimaEvolucion;


        if (
            !evolucionObjetivo
        ) {

            throw new Error(
                "No existe una evolución cargada para optimizar."
            );

        }


        const pesos =

            pesosActuales ||
            this.obtenerPesosActivos();


        this.ultimaOptimizacion =
            this.motorOptimizacion
                .optimizar(
                    evolucionObjetivo,
                    pesos,
                    opciones
                );


        return this
            .ultimaOptimizacion;

    }


    async cargarOptimizacion(
        id,
        completa = true
    ) {

        const optimizacion =
            await this.optimizacionService
                .obtener(

                    id,

                    {
                        incluirMotores:
                            completa
                    }

                );


        if (
            optimizacion
        ) {

            this.ultimaOptimizacionFirestore =
                optimizacion;


            if (
                completa
            ) {

                this.ultimaOptimizacion =
                    optimizacion;

            }

        }


        return optimizacion;

    }


    async cargarUltimaOptimizacion(
        completa = true
    ) {

        const optimizacion =
            await this.optimizacionService
                .obtenerUltima(
                    completa
                );


        if (
            optimizacion
        ) {

            this.ultimaOptimizacionFirestore =
                optimizacion;


            if (
                completa
            ) {

                this.ultimaOptimizacion =
                    optimizacion;

            }

        }


        return optimizacion;

    }


    async cargarOptimizacionesFirestore() {

        this.optimizacionesPersistidas =
            await this.optimizacionService
                .obtenerTodas(
                    "desc"
                );


        return this
            .optimizacionesPersistidas;

    }


    async optimizacionesPorEstado(
        estado
    ) {

        return await this.optimizacionService
            .obtenerPorEstado(
                estado
            );

    }


    async optimizacionesPorEvolucion(
        evolucionId
    ) {

        return await this.optimizacionService
            .obtenerPorEvolucion(
                evolucionId
            );

    }


    async aplicarOptimizacionAPesos(
        optimizacion = null,
        datos = {}
    ) {

        let objetivo =

            optimizacion ||
            this.ultimaOptimizacion;


        if (
            !objetivo
        ) {

            objetivo =
                await this
                    .cargarUltimaOptimizacion(
                        true
                    );

        }


        if (
            !objetivo
        ) {

            throw new Error(
                "No existe una optimización disponible."
            );

        }


        const configuracion =
            await this.configuracionPesosService
                .aplicarOptimizacion(
                    objetivo,
                    datos
                );


        await this
            .recargarPesosActivos();


        return configuracion;

    }


    /*================================================================
        INFORMACIÓN
    ================================================================*/

    informacion() {

        const cantidadEvaluaciones =

            this.motorEvaluacion

                ? this.motorEvaluacion
                    .obtenerHistorial()
                    .length

                : 0;


        return {

            versionPruebas:
                this.version,

            inicializado:
                this.inicializado,

            semanas:
                this.datosHistorial.length,

            numerosAnalizados:
                this.calcularNumerosAnalizados(),

            estadisticasDisponibles:
                this.obtenerArrayEstadisticas()
                    .length,

            prediccionesFirestore:
                this.prediccionesPersistidas
                    .length,

            evaluacionesFirestore:
                this.evaluacionesPersistidas
                    .length,

            evolucionesFirestore:
                this.evolucionesPersistidas
                    .length,

            optimizacionesFirestore:
                this.optimizacionesPersistidas
                    .length,

            configuracionesPesosHistorial:
                this.historialConfiguracionPesos
                    .length,

            pesosActivos:
                this.obtenerPesosActivos(),

            sumaPesosActivos:
                this.sumaPesosBase(),

            sincronizacionPesos:

                this.motorManager

                    ? this
                        .verificarSincronizacionPesos()

                    : null,

            flujoAutomatico:

                this.flujoAutomaticoService

                    ? this
                        .flujoAutomaticoService
                        .obtenerEstado()

                    : null,

            ultimoFlujoAutomatico:

                this.ultimoFlujoAutomatico

                    ? {

                        estado:
                            this.ultimoFlujoAutomatico
                                .estado,

                        modo:
                            this.ultimoFlujoAutomatico
                                .modo,

                        finalizadoEn:
                            this.ultimoFlujoAutomatico
                                .finalizadoEn

                    }

                    : null,

            baseMotor:
                this.obtenerInformacionMotor(
                    this.baseMotor
                ),

            motorFrecuencia:
                this.obtenerInformacionMotor(
                    this.motorFrecuencia
                ),

            motorAtraso:
                this.obtenerInformacionMotor(
                    this.motorAtraso
                ),

            motorTendencia:
                this.obtenerInformacionMotor(
                    this.motorTendencia
                ),

            motorRepeticion:
                this.obtenerInformacionMotor(
                    this.motorRepeticion
                ),

            motorHistorico:
                this.obtenerInformacionMotor(
                    this.motorHistorico
                ),

            motorParidad:
                this.obtenerInformacionMotor(
                    this.motorParidad
                ),

            motorRangos:
                this.obtenerInformacionMotor(
                    this.motorRangos
                ),

            motorDistribucion:
                this.obtenerInformacionMotor(
                    this.motorDistribucion
                ),

            motorAsociaciones:
                this.obtenerInformacionMotor(
                    this.motorAsociaciones
                ),

            motorCiclos:
                this.obtenerInformacionMotor(
                    this.motorCiclos
                ),

            motorManager:

                this.motorManager
                    ?.obtenerInformacion
                    ? this.motorManager
                        .obtenerInformacion()
                    : null,

            motorRanking:

                this.motorRanking
                    ?.obtenerEstado
                    ? this.motorRanking
                        .obtenerEstado()
                    : null,

            motorEvaluacion:

                this.motorEvaluacion

                    ? this.motorEvaluacion
                        .obtenerEstado()

                    : null,
semanaService: {

    activo:
        !!this.semanaService

},
            motorEvolucion:

                this.motorEvolucion

                    ? this.motorEvolucion
                        .obtenerEstado(
                            cantidadEvaluaciones
                        )

                    : null,

            motorOptimizacion:

                this.motorOptimizacion

                    ? this.motorOptimizacion
                        .obtenerEstado(
                            cantidadEvaluaciones
                        )

                    : null

        };

    }


    obtenerInformacionMotor(
        motor
    ) {

        if (
            !motor
        ) {

            return null;

        }


        if (
            typeof motor.obtenerInformacion ===
                "function"
        ) {

            return motor
                .obtenerInformacion();

        }


        return {

            nombre:
                motor.nombre ??
                null,

            version:
                motor.version ??
                null

        };

    }


    calcularNumerosAnalizados() {

        const numeros =
            new Set();


        for (
            const semana
            of this.datosHistorial
        ) {

            const lista =
                semana?.numeros;


            if (
                !Array.isArray(
                    lista
                )
            ) {

                continue;

            }


            for (
                const numero
                of lista
            ) {

                const valor =
                    Number(
                        numero
                    );


                if (
                    Number.isInteger(
                        valor
                    ) &&
                    valor >= 0 &&
                    valor <= 99
                ) {

                    numeros.add(
                        valor
                    );

                }

            }

        }


        return numeros.size;

    }


    /*================================================================
        TABLAS
    ================================================================*/

    tablaTopManager(
        cantidad = 20
    ) {

        const top =
            this.topManager(
                cantidad
            );


        const tabla =
            top.map(

                (
                    item,
                    indice
                ) => ({

                    posicion:
                        indice + 1,

                    numero:
                        item.numeroTexto,

                    score:
                        item.score,

                    confianza:
                        item.confianza,

                    pesoTotal:
                        item.pesoTotal,

                    motores:
                        item.motoresUtilizados

                })

            );


        console.table(
            tabla
        );


        return tabla;

    }


    tablaTop10() {

        const tabla =
            this.top10()
                .map(

                    item => ({

                        orden:
                            item.orden,

                        posicion:
                            item.posicion,

                        numero:
                            item.numeroTexto,

                        score:
                            item.score,

                        confianza:
                            item.confianza,

                        percentil:
                            item.percentil,

                        categoria:
                            item.categoria,

                        empate:
                            item.empate

                    })

                );


        console.table(
            tabla
        );


        return tabla;

    }


    tablaPesosActivos() {

        const tabla =
            Object.entries(
                this.obtenerPesosActivos()
            )
            .map(

                ([motor, peso]) => ({

                    motor,
                    peso

                })

            );


        console.table(
            tabla
        );


        console.log(
            "SUMA PESOS ACTIVOS:",
            this.sumaPesosBase()
        );


        return tabla;

    }


    tablaPesosManager() {

        const tabla =
            Object.entries(
                this.motorManager
                    .obtenerPesos()
            )
            .map(

                ([motor, peso]) => ({

                    motor,
                    peso

                })

            );


        console.table(
            tabla
        );


        console.log(
            "SUMA MOTOR MANAGER:",
            this.motorManager
                .sumarPesos()
        );


        return tabla;

    }


    tablaSincronizacionPesos() {

        const resultado =
            this.verificarSincronizacionPesos();


        const tabla =
            Object.entries(
                resultado.diferencias ||
                {}
            )
            .map(

                ([motor, datos]) => ({

                    motor,

                    configuracion:
                        datos.configuracion,

                    manager:
                        datos.manager,

                    diferencia:
                        datos.diferencia,

                    coincide:
                        datos.coincide

                })

            );


        console.table(
            tabla
        );


        console.log({

            sincronizado:
                resultado.sincronizado,

            sumaConfiguracion:
                resultado.sumaConfiguracion,

            sumaManager:
                resultado.sumaManager

        });


        return tabla;

    }


    tablaAuditoriaManager(
        numero
    ) {

        const resultado =
            this.manager(
                numero
            );


        console.table(

            resultado
                .detallePesos
                .map(

                    item => ({

                        motor:
                            item.clave,

                        score:
                            item.score,

                        confianza:
                            item.confianza,

                        pesoMotorResult:
                            item.pesoMotorResult,

                        pesoConfigurado:
                            item.pesoConfigurado,

                        pesoUsado:
                            item.peso,

                        fuente:
                            item.fuentePeso,

                        factorConfianza:
                            item.factorConfianza,

                        pesoEfectivo:
                            item.pesoEfectivo,

                        aporte:
                            item.aporte

                    })

                )

        );


        console.log({

            numero:
                resultado.numeroTexto,

            score:
                resultado.score,

            confianza:
                resultado.confianza,

            sumaPesos:
                resultado
                    .sumaPesosConfigurados,

            motores:
                resultado
                    .motoresUtilizados

        });


        return resultado;

    }


    async tablaPrediccionesFirestore() {

        const lista =
            await this
                .cargarPrediccionesFirestore();


        const tabla =
            lista.map(

                item => ({

                    id:
                        item.id,

                    fecha:
                        item.fechaPrediccion,

                    semana:
                        item.semanaObjetivo,

                    fechaObjetivo:
                        item.fechaObjetivo,

                    top10:
                        item.top10
                            ?.length ??
                        0,

                    top20:
                        item.top20
                            ?.length ??
                        0,

                    ranking:
                        item.totalRanking ??
                        item.rankingCompleto
                            ?.length ??
                        0,

                    evaluada:
                        item.evaluacion
                            ?.realizada ===
                            true,

                    evaluacionId:
                        item.evaluacion
                            ?.evaluacionId ??
                        null

                })

            );


        console.table(
            tabla
        );


        return tabla;

    }


    async tablaEvaluacionesFirestore() {

        const lista =
            await this
                .cargarEvaluacionesFirestore();


        const tabla =
            lista.map(

                item => ({

                    id:
                        item.id,

                    semana:
                        item.semana
                            ?.numero,

                    fecha:
                        item.semana
                            ?.fecha,

                    prediccionId:
                        item.prediccionId,

                    top10:
                        item.metricas
                            ?.aciertosTop10,

                    top20:
                        item.metricas
                            ?.aciertosTop20,

                    titulares:
                        item.metricas
                            ?.aciertosTitulares,

                    suplentes:
                        item.metricas
                            ?.aciertosSuplentes,

                    cantidadAciertos:
                        item.metricas
                            ?.cantidadAciertos,

                    mejorMotor:
                        item.rendimientoMotores
                            ?.mejorMotor

                })

            );


        console.table(
            tabla
        );


        return tabla;

    }


    async tablaEvolucionesFirestore() {

        const lista =
            await this
                .cargarEvolucionesFirestore();


        const tabla =
            lista.map(

                item => ({

                    id:
                        item.id,

                    generadoEn:
                        item.generadoEn,

                    version:
                        item.version,

                    evaluaciones:
                        item.cantidadEvaluaciones,

                    minimo:
                        item.minimoEvaluaciones,

                    suficientes:
                        item.datosSuficientes,

                    motores:
                        item.cantidadMotores,

                    mejorHistorico:
                        item.mejorMotorHistorico,

                    mejorReciente:
                        item.mejorMotorReciente,

                    mejorando:
                        item.motoresEnMejora
                            ?.length ??
                        0,

                    deteriorando:
                        item.motoresEnDeterioro
                            ?.length ??
                        0

                })

            );


        console.table(
            tabla
        );


        return tabla;

    }


    async tablaOptimizacionesFirestore() {

        const lista =
            await this
                .cargarOptimizacionesFirestore();


        const tabla =
            lista.map(

                item => ({

                    id:
                        item.id,

                    generadoEn:
                        item.generadoEn,

                    version:
                        item.version,

                    evolucionId:
                        item.evolucionId,

                    evaluaciones:
                        item.cantidadEvaluaciones,

                    suficientes:
                        item.datosSuficientes,

                    estado:
                        item.estado,

                    sumaActual:
                        item.sumaPesosActuales,

                    sumaFinal:
                        item.sumaPesosPropuestos

                })

            );


        console.table(
            tabla
        );


        return tabla;

    }


    /*================================================================
        TABLA ÚLTIMO FLUJO
    ================================================================*/

    tablaUltimoFlujo() {

        const resultado =
            this.ultimoFlujoAutomatico;


        if (
            !resultado
        ) {

            console.warn(
                "No existe un flujo procesado."
            );


            return null;

        }


        const flujo =
            resultado.flujo ||
            resultado;


        const tabla = [

            {

                etapa:
                    "Semana",

                id:
                    resultado
                        .semanaProcesada
                        ?.numero ??
                    flujo.semana
                        ?.numero ??
                    null,

                estado:
                    resultado.estado

            },

            {

                etapa:
                    "Predicción",

                id:
                    flujo.prediccion
                        ?.id ??
                    null,

                estado:
                    "PROCESADA"

            },

            {

                etapa:
                    "Evaluación",

                id:
                    flujo.evaluacion
                        ?.id ??
                    null,

                estado:
                    flujo.evaluacion
                        ? "GUARDADA"
                        : "NO_GENERADA"

            },

            {

                etapa:
                    "Evolución",

                id:
                    flujo.evolucion
                        ?.id ??
                    null,

                estado:
                    flujo.evolucion
                        ? "GUARDADA"
                        : "NO_GENERADA"

            },

            {

                etapa:
                    "Optimización",

                id:
                    flujo.optimizacion
                        ?.id ??
                    null,

                estado:
                    flujo.optimizacion
                        ?.estado ??
                    "NO_GENERADA"

            },

            {

                etapa:
                    "Siguiente predicción",

                id:
                    resultado
                        .siguientePrediccion
                        ?.id ??
                    null,

                estado:

                    resultado
                        .siguientePrediccion

                        ? (
                            resultado
                                .siguientePrediccion
                                .accion ||
                            "GENERADA"
                        )

                        : "NO_GENERADA"

            }

        ];


        console.table(
            tabla
        );


        return tabla;

    }


    /*================================================================
        REDONDEAR
    ================================================================*/

    redondearNumero(
        valor,
        decimales = 6
    ) {

        const numero =
            Number(
                valor
            );


        if (
            !Number.isFinite(
                numero
            )
        ) {

            return 0;

        }


        const factor =
            Math.pow(
                10,
                decimales
            );


        return (

            Math.round(
                numero *
                factor
            ) /
            factor

        );

    }

/*================================================================
    GUARDAR SEMANA REAL
    v3.5.3
================================================================*/

async guardarSemanaReal({

    semana,

    fecha,

    numeros

} = {}) {

    this.verificarInicializacion();


    /*------------------------------------------------------------
        1. VALIDAR NÚMERO DE SEMANA
    ------------------------------------------------------------*/

    const numeroSemana =
        Number(
            semana
        );


    if (
        !Number.isInteger(
            numeroSemana
        ) ||
        numeroSemana <= 0
    ) {

        throw new Error(
            `Número de semana inválido: ${semana}`
        );

    }


    /*------------------------------------------------------------
        2. NORMALIZAR NÚMEROS
    ------------------------------------------------------------*/

    const numerosNormalizados =
        this.normalizarNumerosSemana(
            numeros
        );


    if (
        numerosNormalizados.length !== 10
    ) {

        throw new Error(
            `La semana debe contener exactamente 10 números válidos. ` +
            `Se recibieron ${numerosNormalizados.length}.`
        );

    }


    /*------------------------------------------------------------
        3. VALIDAR FECHA
    ------------------------------------------------------------*/

    if (
        !fecha ||
        typeof fecha !==
            "string"
    ) {

        throw new Error(
            "La semana debe contener una fecha válida."
        );

    }


    /*------------------------------------------------------------
        4. COMPROBAR SI YA EXISTE
    ------------------------------------------------------------*/

    const existe =
        await this.semanaService
            .existe(
                numeroSemana
            );


    if (
        existe
    ) {

        const existente =
            await this.semanaService
                .obtener(
                    numeroSemana
                );


        const numerosExistentes =
            this.normalizarNumerosSemana(

                existente?.numeros ||
                []

            );


        const iguales =
            this.listasNumerosIguales(

                numerosExistentes,

                numerosNormalizados

            );


        /*--------------------------------------------------------
            EXISTE Y COINCIDE
        --------------------------------------------------------*/

        if (
            iguales
        ) {

            console.log(
                `Semana ${numeroSemana} ya existente. ` +
                `No se vuelve a guardar.`
            );


            return {

                creada:
                    false,

                existente:
                    true,

                sinCambios:
                    true,

                semana:
                    existente

            };

        }


        /*--------------------------------------------------------
            EXISTE PERO CON OTROS NÚMEROS
        --------------------------------------------------------*/

        throw new Error(

            `La semana ${numeroSemana} ya existe ` +
            `con números diferentes. ` +
            `Se requiere revisión manual.`

        );

    }


    /*------------------------------------------------------------
        5. CREAR SEMANA
    ------------------------------------------------------------*/

    /*
     * IMPORTANTE:
     *
     * SemanaService.crear() recibe:
     *
     *     numeroSemana,
     *     fecha,
     *     numeros
     *
     * NO recibe un objeto.
     */

    const creada =
        await this.semanaService
            .crear(

                numeroSemana,

                fecha,

                numerosNormalizados

            );


    console.log(
        "Semana real guardada:",
        numeroSemana
    );


    console.log(
        "ID semana:",
        creada?.id
    );


    /*------------------------------------------------------------
        6. RESULTADO
    ------------------------------------------------------------*/

    return {

        creada:
            true,

        existente:
            false,

        sinCambios:
            false,

        semana:
            creada

    };

}

/*================================================================
    NORMALIZAR NÚMEROS SEMANA
================================================================*/

normalizarNumerosSemana(
    numeros = []
) {

    if (
        !Array.isArray(
            numeros
        )
    ) {

        return [];

    }


    const unicos =
        new Set();


    for (
        const numero
        of numeros
    ) {

        const valor =
            Number(
                numero
            );


        if (
            Number.isInteger(
                valor
            ) &&
            valor >= 0 &&
            valor <= 99
        ) {

            unicos.add(
                valor
            );

        }

    }


    return [
        ...unicos
    ];

}

/*================================================================
    COMPARAR LISTAS DE NÚMEROS
================================================================*/

listasNumerosIguales(
    listaA = [],
    listaB = []
) {

    const a =
        this.normalizarNumerosSemana(
            listaA
        )
        .sort(
            (
                x,
                y
            ) =>
                x - y
        );


    const b =
        this.normalizarNumerosSemana(
            listaB
        )
        .sort(
            (
                x,
                y
            ) =>
                x - y
        );


    if (
        a.length !==
        b.length
    ) {

        return false;

    }


    return a.every(

        (
            valor,
            indice
        ) =>

            valor ===
            b[indice]

    );

}

/*================================================================
    RECARGAR BASE HEURÍSTICA
    v3.5.1
================================================================*/

async recargarBaseHeuristica() {

    this.verificarInicializacion();


    console.log(
        "========================================"
    );

    console.log(
        "RECARGANDO BASE HEURÍSTICA"
    );

    console.log(
        "========================================"
    );


    /*------------------------------------------------------------
        1. HISTORIAL
    ------------------------------------------------------------*/

    this.datosHistorial =
        await this.historialService
            .obtenerHistorial();


    if (
        !Array.isArray(
            this.datosHistorial
        )
    ) {

        this.datosHistorial =
            [];

    }


    console.log(
        "Historial actualizado:",
        this.datosHistorial.length,
        "semana(s)"
    );


    /*------------------------------------------------------------
        2. ESTADÍSTICAS
    ------------------------------------------------------------*/

    this.datosEstadisticas =
        await this.estadisticasService
            .calcular();


    console.log(
        "Estadísticas recalculadas:",
        this.obtenerArrayEstadisticas()
            .length
    );


    /*------------------------------------------------------------
        3. BASE MOTOR
    ------------------------------------------------------------*/

    this.baseMotor =
        new BaseMotor(
            "Motor de Prueba"
        );


    this.baseMotor.inicializar({

        historial:
            this.datosHistorial,

        estadisticas:
            this.obtenerArrayEstadisticas()

    });


    /*------------------------------------------------------------
        4. MOTORES INDIVIDUALES
    ------------------------------------------------------------*/

    this.motorFrecuencia =
        new MotorFrecuencia();

    this.inicializarMotor(
        this.motorFrecuencia
    );


    this.motorAtraso =
        new MotorAtraso();

    this.inicializarMotor(
        this.motorAtraso
    );


    this.motorTendencia =
        new MotorTendencia();

    this.inicializarMotor(
        this.motorTendencia
    );


    this.motorRepeticion =
        new MotorRepeticion();

    this.inicializarMotor(
        this.motorRepeticion
    );


    this.motorHistorico =
        new MotorHistorico();

    this.inicializarMotor(
        this.motorHistorico
    );


    this.motorParidad =
        new MotorParidad();

    this.inicializarMotor(
        this.motorParidad
    );


    this.motorRangos =
        new MotorRangos();

    this.inicializarMotor(
        this.motorRangos
    );


    this.motorDistribucion =
        new MotorDistribucion();

    this.inicializarMotor(
        this.motorDistribucion
    );


    this.motorAsociaciones =
        new MotorAsociaciones();

    this.inicializarMotor(
        this.motorAsociaciones
    );


    this.motorCiclos =
        new MotorCiclos();

    this.inicializarMotor(
        this.motorCiclos
    );


    /*------------------------------------------------------------
        5. MOTOR MANAGER
    ------------------------------------------------------------*/

    /*
     * Lo reconstruimos.
     *
     * Esto es preferible a mantener el manager anterior
     * porque cambió el historial estadístico completo.
     */

    this.motorManager =
        new MotorManager();


    this.motorManager.inicializar({

        historial:
            this.datosHistorial,

        estadisticas:
            this.obtenerArrayEstadisticas(),

        configuracion: {

            pesos:
                this.obtenerPesosActivos()

        }

    });


    /*------------------------------------------------------------
        6. INVALIDAR RANKING
    ------------------------------------------------------------*/

    this.ultimoRanking =
        null;


    this.ultimaPrediccion =
        null;


    console.log(
        "MotorManager reinicializado."
    );


    console.log(
        "Semanas:",
        this.datosHistorial.length
    );


    console.log(
        "Pesos:",
        this.motorManager
            .sumarPesos()
    );


    console.log(
        "========================================"
    );

    console.log(
        "BASE HEURÍSTICA ACTUALIZADA"
    );

    console.log(
        "========================================"
    );


    return {

        semanas:
            this.datosHistorial.length,

        estadisticas:
            this.obtenerArrayEstadisticas()
                .length,

        numerosAnalizados:
            this.calcularNumerosAnalizados(),

        sumaPesos:
            this.motorManager
                .sumarPesos(),

        sincronizado:
            this.verificarSincronizacionPesos()
                .sincronizado

    };

}

/*================================================================
    PROCESAR SEMANA
    v3.5.3
================================================================*/

async procesarSemana({

    prediccion = null,

    prediccionId = null,

    numerosReales = [],

    semana = null,

    fecha = null,

    modo = null,

    reprocesar = false,

    opcionesEvolucion = {},

    opcionesOptimizacion = {},

    guardarSemana = true,

    generarSiguientePrediccion = true,

    guardarSiguientePrediccion = true,

    siguienteSemana = null,

    siguienteFecha = null

} = {}) {

    this.verificarInicializacion();


    console.log(
        "========================================"
    );

    console.log(
        "PROCESAR SEMANA - FLUJO v3.5.3"
    );

    console.log(
        "========================================"
    );


    /*------------------------------------------------------------
        1. NORMALIZAR NÚMEROS
    ------------------------------------------------------------*/

    const reales =
        this.normalizarNumerosSemana(
            numerosReales
        );


    if (
        reales.length !== 10
    ) {

        throw new Error(
            `Se requieren exactamente 10 números reales. Se recibieron ${reales.length}.`
        );

    }


    /*------------------------------------------------------------
        2. MODO
    ------------------------------------------------------------*/

    if (
        modo
    ) {

        const modoNormalizado =
            String(
                modo
            ).toUpperCase();


        if (
            modoNormalizado !==
            this.modoFlujoAutomatico
        ) {

            this.configurarModoFlujo(
                modoNormalizado
            );

        }

    }


    /*------------------------------------------------------------
        3. PREDICCIÓN A EVALUAR
    ------------------------------------------------------------*/

    let prediccionObjetivo =
        prediccion;


    if (
        !prediccionObjetivo &&
        prediccionId
    ) {

        prediccionObjetivo =
            await this
                .cargarPrediccion(

                    prediccionId,

                    true

                );

    }


    if (
        !prediccionObjetivo
    ) {

        prediccionObjetivo =
            await this
                .cargarUltimaPrediccion(
                    true
                );

    }


    if (
        !prediccionObjetivo
    ) {

        throw new Error(
            "No existe una predicción disponible para procesar."
        );

    }


    /*------------------------------------------------------------
        4. DATOS DE LA SEMANA
    ------------------------------------------------------------*/

    const numeroSemana =

        semana ??
        prediccionObjetivo
            .semanaObjetivo ??
        null;


    const fechaSemana =

        fecha ??
        prediccionObjetivo
            .fechaObjetivo ??
        null;


    const datosSemana = {

        semana:
            numeroSemana,

        fecha:
            fechaSemana

    };


    /*
     * IMPORTANTE
     *
     * En este punto TODAVÍA NO guardamos la semana
     * en el historial.
     *
     * Primero evaluamos la predicción original.
     */


    /*------------------------------------------------------------
        5. EVALUACIÓN → EVOLUCIÓN → OPTIMIZACIÓN
    ------------------------------------------------------------*/

    const resultadoFlujo =
        await this
            .flujoAutomaticoService
            .procesarResultado({

                prediccion:
                    prediccionObjetivo,

                numerosReales:
                    reales,

                datosSemana,

                opcionesEvolucion,

                opcionesOptimizacion,

                reprocesar

            });


/*------------------------------------------------------------
    6. CASO YA PROCESADA
    v3.5.2
------------------------------------------------------------*/

if (
    resultadoFlujo.estado ===
        "YA_PROCESADA"
) {

    let resultadoSemana =
        null;


    let baseHeuristica =
        null;


    /*
     * La predicción ya fue evaluada.
     *
     * Sin embargo puede faltar la incorporación
     * de la semana real al historial.
     */

    if (
        guardarSemana
    ) {

        resultadoSemana =
            await this
                .guardarSemanaReal({

                    semana:
                        numeroSemana,

                    fecha:
                        fechaSemana,

                    numeros:
                        reales

                });


        /*
         * IMPORTANTE:
         *
         * Aunque la semana ya existiera,
         * recargamos la base heurística para
         * garantizar que la memoria coincida
         * con Firestore.
         */

        baseHeuristica =
            await this
                .recargarBaseHeuristica();

    }


    /*
     * Actualizamos caches de las capas
     * Evaluación / Evolución / Optimización.
     */

    await this
        .actualizarCachesDespuesFlujo();


    /*
     * Volvemos a leer pesos activos.
     */

    await this
        .recargarPesosActivos();


    const sincronizacion =
        this.verificarSincronizacionPesos();


    if (
        !sincronizacion
            .sincronizado
    ) {

        throw new Error(
            "MotorManager no quedó sincronizado durante la recuperación de una semana ya procesada."
        );

    }


    const resultado = {

        tipo:
            "PROCESAR_SEMANA",


        versionPruebas:
            this.version,


        modo:
            this.modoFlujoAutomatico,


        estado:
            "YA_PROCESADA",


        semanaProcesada: {

            numero:
                numeroSemana,

            fecha:
                fechaSemana,

            numeros:
                reales.map(

                    numero =>
                        String(
                            numero
                        )
                        .padStart(
                            2,
                            "0"
                        )

                )

        },


        semanaHistorial: {

            creada:
                resultadoSemana
                    ?.creada ??
                false,

            existente:
                resultadoSemana
                    ?.existente ??
                false,

            sinCambios:
                resultadoSemana
                    ?.sinCambios ??
                false

        },


        flujo:
            resultadoFlujo,


        baseHeuristica:

            baseHeuristica

                ? {

                    semanas:
                        baseHeuristica
                            .semanas,

                    estadisticas:
                        baseHeuristica
                            .estadisticas,

                    numerosAnalizados:
                        baseHeuristica
                            .numerosAnalizados

                }

                : null,


        pesos: {

            suma:
                this.sumaPesosBase(),

            sincronizados:
                sincronizacion
                    .sincronizado,

            configuracion:
                this.obtenerPesosActivos()

        },


        siguientePrediccion:
            null,


        finalizadoEn:
            new Date()
                .toISOString()

    };


    this.ultimoFlujoAutomatico =
        resultado;


    console.log(
        "Semana ya procesada recuperada correctamente."
    );


    console.log(
        "Historial actualizado:",
        resultado
            .baseHeuristica
            ?.semanas
    );


    console.log(
        "MotorManager historial:",
        this.motorManager
            .obtenerInformacion()
            .historial
    );


    return resultado;

}



    /*------------------------------------------------------------
        7. ACTUALIZAR CACHE DEL FLUJO
    ------------------------------------------------------------*/

    await this
        .actualizarCachesDespuesFlujo();


    /*------------------------------------------------------------
        8. RECARGAR PESOS
    ------------------------------------------------------------*/

    /*
     * Si el flujo estuvo en modo COMPLETO y aplicó
     * pesos, los recogemos ahora.
     */

    await this
        .recargarPesosActivos();


    /*------------------------------------------------------------
        9. GUARDAR RESULTADO REAL EN HISTORIAL
    ------------------------------------------------------------*/

    let resultadoSemana =
        null;


    if (
        guardarSemana
    ) {

        resultadoSemana =
            await this
                .guardarSemanaReal({

                    semana:
                        numeroSemana,

                    fecha:
                        fechaSemana,

                    numeros:
                        reales

                });

    }


    /*------------------------------------------------------------
        10. RECARGAR BASE HEURÍSTICA
    ------------------------------------------------------------*/

    let baseHeuristica =
        null;


    if (
        guardarSemana
    ) {

        baseHeuristica =
            await this
                .recargarBaseHeuristica();

    }


    /*------------------------------------------------------------
        11. VERIFICAR SINCRONIZACIÓN
    ------------------------------------------------------------*/

    const sincronizacion =
        this.verificarSincronizacionPesos();


    if (
        !sincronizacion
            .sincronizado
    ) {

        throw new Error(
            "MotorManager no quedó sincronizado después de actualizar la semana."
        );

    }


    /*------------------------------------------------------------
        12. SIGUIENTE PREDICCIÓN
    ------------------------------------------------------------*/

    let prediccionSiguiente =
        null;


    let accionPrediccionSiguiente =
        null;


    if (
        generarSiguientePrediccion
    ) {

        const siguiente =
            this.resolverSiguienteSemana({

                semana:
                    numeroSemana,

                fecha:
                    fechaSemana,

                siguienteSemana,

                siguienteFecha

            });


        /*
         * La siguiente predicción debe usar:
         *
         * - historial actualizado;
         * - estadísticas actualizadas;
         * - pesos activos actualizados.
         *
         * Si ya existe una predicción pendiente para esa semana,
         * se reutiliza y no se genera un duplicado.
         */

        if (
            guardarSiguientePrediccion
        ) {

            const resultadoPrediccion =
                await this
                    .prepararYGuardarPrediccionSegura(

                        {

                            semanaObjetivo:
                                siguiente.semana,

                            fechaObjetivo:
                                siguiente.fecha

                        },

                        {

                            forzarNueva:
                                false,

                            incluirRankingExistente:
                                true

                        }

                    );


            prediccionSiguiente =
                resultadoPrediccion
                    .prediccion;


            accionPrediccionSiguiente =
                resultadoPrediccion
                    .accion;


            console.log(
                "Acción siguiente predicción:",
                accionPrediccionSiguiente
            );

        }

        else {

            prediccionSiguiente =
                this.prepararPrediccion({

                    semanaObjetivo:
                        siguiente.semana,

                    fechaObjetivo:
                        siguiente.fecha

                });


            accionPrediccionSiguiente =
                "GENERADA_EN_MEMORIA";

        }


        console.log(
            "Siguiente predicción preparada:",
            prediccionSiguiente.id
        );

    }


    /*------------------------------------------------------------
        13. RESULTADO INTEGRADO
    ------------------------------------------------------------*/

    const resultado = {

        tipo:
            "PROCESAR_SEMANA",


        versionPruebas:
            this.version,


        modo:
            this.modoFlujoAutomatico,


        estado:
            resultadoFlujo.estado,


        semanaProcesada: {

            numero:
                numeroSemana,

            fecha:
                fechaSemana,

            numeros:
                reales.map(

                    numero =>
                        String(
                            numero
                        )
                        .padStart(
                            2,
                            "0"
                        )

                )

        },


        semanaHistorial: {

            creada:
                resultadoSemana
                    ?.creada ??
                false,

            existente:
                resultadoSemana
                    ?.existente ??
                false,

            sinCambios:
                resultadoSemana
                    ?.sinCambios ??
                false

        },


        flujo:
            resultadoFlujo,


        baseHeuristica:

            baseHeuristica

                ? {

                    semanas:
                        baseHeuristica
                            .semanas,

                    estadisticas:
                        baseHeuristica
                            .estadisticas,

                    numerosAnalizados:
                        baseHeuristica
                            .numerosAnalizados

                }

                : null,


        pesos: {

            suma:
                this.sumaPesosBase(),

            sincronizados:
                sincronizacion
                    .sincronizado,

            configuracion:
                this.obtenerPesosActivos()

        },


        siguientePrediccion:

            prediccionSiguiente

                ? {

                    id:
                        prediccionSiguiente.id,

                    accion:
                        accionPrediccionSiguiente,

                    semanaObjetivo:
                        prediccionSiguiente
                            .semanaObjetivo,

                    fechaObjetivo:
                        prediccionSiguiente
                            .fechaObjetivo,

                    top10:
                        prediccionSiguiente
                            .top10
                            ?.length ??
                        0,

                    top20:
                        prediccionSiguiente
                            .top20
                            ?.length ??
                        0,

                    ranking:
                        prediccionSiguiente
                            .rankingCompleto
                            ?.length ??
                        prediccionSiguiente
                            .totalRanking ??
                        0

                }

                : null,


        finalizadoEn:
            new Date()
                .toISOString()

    };


    this.ultimoFlujoAutomatico =
        resultado;


    console.log(
        "========================================"
    );

    console.log(
        "PROCESAR SEMANA FINALIZADO"
    );

    console.log(
        "Semana historial:",
        resultado
            .baseHeuristica
            ?.semanas
    );

    console.log(
        "Estado:",
        resultado.estado
    );

    console.log(
        "Pesos:",
        resultado.pesos.suma
    );

    console.log(
        "Siguiente predicción:",
        resultado
            .siguientePrediccion
            ?.id ??
        "NO GENERADA"
    );

    console.log(
        "========================================"
    );


    return resultado;

}
/*================================================================
    TABLA SEMANAS
    v3.5.3
================================================================*/

async tablaSemanas() {

    const semanas =
        await this.semanaService
            .obtenerTodas(
                "asc"
            );


    const tabla =
        semanas.map(

            item => ({

                id:
                    item.id,

                semana:
                    item.semana,

                fecha:
                    item.fecha,

                cantidad:
                    Array.isArray(
                        item.numeros
                    )
                        ? item.numeros.length
                        : 0,

                numeros:

                    Array.isArray(
                        item.numeros
                    )

                        ? item.numeros
                            .map(
                                numero =>
                                    String(
                                        numero
                                    )
                                    .padStart(
                                        2,
                                        "0"
                                    )
                            )
                            .join(
                                " - "
                            )

                        : ""

            })

        );


    console.table(
        tabla
    );


    return tabla;

}

    /*================================================================
        RECARGAR
    ================================================================*/

    async recargar() {

        console.log(
            "Recargando entorno de pruebas..."
        );


        this.inicializado =
            false;


        this.ultimoRanking =
            null;

        this.ultimaPrediccion =
            null;

        this.ultimaPrediccionFirestore =
            null;

        this.ultimaEvaluacion =
            null;

        this.ultimaEvaluacionFirestore =
            null;

        this.ultimaEvolucion =
            null;

        this.ultimaEvolucionFirestore =
            null;

        this.ultimaOptimizacion =
            null;

        this.ultimaOptimizacionFirestore =
            null;

        this.ultimoFlujoAutomatico =
            null;

        this.configuracionPesosActiva =
            null;

        this.historialConfiguracionPesos =
            [];

        this.prediccionesPersistidas =
            [];

        this.evaluacionesPersistidas =
            [];

        this.evolucionesPersistidas =
            [];

        this.optimizacionesPersistidas =
            [];


        this.pesosBase = {

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


        return await this
            .inicializar();

    }

}


/*====================================================================
    INSTANCIA
====================================================================*/

const entornoPruebas =
    new EntornoPruebas();


/*====================================================================
    EXPONER GLOBAL
====================================================================*/

window.entornoPruebas =
    entornoPruebas;


window.EntornoPruebas =
    EntornoPruebas;


/*====================================================================
    INICIALIZAR
====================================================================*/

await entornoPruebas
    .inicializar();


/*====================================================================
    EXPORTS
====================================================================*/

export {

    EntornoPruebas,

    entornoPruebas

};


export default entornoPruebas;