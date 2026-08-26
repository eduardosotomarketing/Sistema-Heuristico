/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * public/js/pruebas.js
 *
 * Entorno centralizado de pruebas.
 *
 * Componentes integrados:
 *
 *   - HistorialService
 *   - EstadisticasService
 *
 *   - BaseMotor
 *   - MotorFrecuencia
 *   - MotorAtraso
 *   - MotorTendencia
 *   - MotorRepeticion
 *   - MotorHistorico
 *   - MotorParidad
 *   - MotorRangos
 *   - MotorDistribucion
 *   - MotorAsociaciones
 *   - MotorCiclos
 *
 *   - MotorManager
 *   - MotorRanking
 *   - MotorEvaluacion
 *   - MotorEvolucion
 *
 **********************************************************************/


/*====================================================================
    IMPORTS
====================================================================*/

import HistorialService
    from "./services/HistorialService.js";

import EstadisticasService
    from "./services/EstadisticasService.js";


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


/*====================================================================
    CLASE ENTORNO PRUEBAS
====================================================================*/

class EntornoPruebas {


    constructor() {

        /*==========================================================
            ESTADO GENERAL
        ==========================================================*/

        this.inicializado = false;


        /*==========================================================
            SERVICIOS
        ==========================================================*/

        this.historialService = null;

        this.estadisticasService = null;


        /*==========================================================
            DATOS
        ==========================================================*/

        this.datosHistorial = [];

        this.datosEstadisticas = null;


        /*==========================================================
            MOTORES
        ==========================================================*/

        this.baseMotor = null;

        this.motorFrecuencia = null;

        this.motorAtraso = null;

        this.motorTendencia = null;

        this.motorRepeticion = null;

        this.motorHistorico = null;

        this.motorParidad = null;

        this.motorRangos = null;

        this.motorDistribucion = null;

        this.motorAsociaciones = null;

        this.motorCiclos = null;


        /*==========================================================
            ORQUESTADORES
        ==========================================================*/

        this.motorManager = null;

        this.motorRanking = null;

        this.motorEvaluacion = null;

        this.motorEvolucion = null;


        /*==========================================================
            RESULTADOS TEMPORALES
        ==========================================================*/

        this.ultimoRanking = null;

        this.ultimaPrediccion = null;

        this.ultimaEvaluacion = null;

        this.ultimaEvolucion = null;

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

                this.datosHistorial = [];

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
                MOTOR FRECUENCIA
            ========================================================*/

            this.motorFrecuencia =
                new MotorFrecuencia();


            this.inicializarMotor(
                this.motorFrecuencia
            );


            console.log(
                "MotorFrecuencia inicializado."
            );


            /*========================================================
                MOTOR ATRASO
            ========================================================*/

            this.motorAtraso =
                new MotorAtraso();


            this.inicializarMotor(
                this.motorAtraso
            );


            console.log(
                "MotorAtraso inicializado."
            );


            /*========================================================
                MOTOR TENDENCIA
            ========================================================*/

            this.motorTendencia =
                new MotorTendencia();


            this.inicializarMotor(
                this.motorTendencia
            );


            console.log(
                "MotorTendencia inicializado."
            );


            /*========================================================
                MOTOR REPETICIÓN
            ========================================================*/

            this.motorRepeticion =
                new MotorRepeticion();


            this.inicializarMotor(
                this.motorRepeticion
            );


            console.log(
                "MotorRepeticion inicializado."
            );


            /*========================================================
                MOTOR HISTÓRICO
            ========================================================*/

            this.motorHistorico =
                new MotorHistorico();


            this.inicializarMotor(
                this.motorHistorico
            );


            console.log(
                "MotorHistorico inicializado."
            );


            /*========================================================
                MOTOR PARIDAD
            ========================================================*/

            this.motorParidad =
                new MotorParidad();


            this.inicializarMotor(
                this.motorParidad
            );


            console.log(
                "MotorParidad inicializado."
            );


            /*========================================================
                MOTOR RANGOS
            ========================================================*/

            this.motorRangos =
                new MotorRangos();


            this.inicializarMotor(
                this.motorRangos
            );


            console.log(
                "MotorRangos inicializado."
            );


            /*========================================================
                MOTOR DISTRIBUCIÓN
            ========================================================*/

            this.motorDistribucion =
                new MotorDistribucion();


            this.inicializarMotor(
                this.motorDistribucion
            );


            console.log(
                "MotorDistribucion inicializado."
            );


            /*========================================================
                MOTOR ASOCIACIONES
            ========================================================*/

            this.motorAsociaciones =
                new MotorAsociaciones();


            this.inicializarMotor(
                this.motorAsociaciones
            );


            console.log(
                "MotorAsociaciones inicializado."
            );


            /*========================================================
                MOTOR CICLOS
            ========================================================*/

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

                configuracion: {}

            });


            console.log(
                "MotorManager inicializado."
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

                    toleranciaEstabilidad:
                        1

                });


            console.log(
                "MotorEvolucion inicializado."
            );


            /*========================================================
                FINAL
            ========================================================*/

            this.inicializado = true;


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

            this.inicializado = false;


            console.error(
                "ERROR AL INICIALIZAR ENTORNO DE PRUEBAS:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        INICIALIZAR MOTOR INDIVIDUAL
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
        ARRAY ESTADÍSTICAS
    ================================================================*/

    obtenerArrayEstadisticas() {

        if (!this.datosEstadisticas) {

            return [];

        }


        if (
            Array.isArray(
                this.datosEstadisticas
                    .estadisticas
            )
        ) {

            return this.datosEstadisticas
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

            return this.datosEstadisticas;

        }


        return [];

    }


    /*================================================================
        VERIFICAR INICIALIZACIÓN
    ================================================================*/

    verificarInicializacion() {

        if (!this.inicializado) {

            throw new Error(
                "El entorno de pruebas no está inicializado."
            );

        }

    }


    /*================================================================
        HISTORIAL
    ================================================================*/

    historial() {

        this.verificarInicializacion();

        return this.datosHistorial;

    }


    /*================================================================
        ESTADÍSTICAS
    ================================================================*/

    estadisticas() {

        this.verificarInicializacion();

        return this.datosEstadisticas;

    }


    /*================================================================
        CONTEXTO
    ================================================================*/

    crearContexto(
        configuracionAdicional = {}
    ) {

        this.verificarInicializacion();


        return {

            historial:
                this.datosHistorial,

            semanas:
                this.datosHistorial,

            estadisticas:
                this.obtenerArrayEstadisticas(),

            ...configuracionAdicional

        };

    }


    /*================================================================
        MOTORES INDIVIDUALES
    ================================================================*/

    frecuencia(
        numero,
        configuracion = {}
    ) {

        this.verificarInicializacion();


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

        this.verificarInicializacion();


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

        this.verificarInicializacion();


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

        this.verificarInicializacion();


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

        this.verificarInicializacion();


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

        this.verificarInicializacion();


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

        this.verificarInicializacion();


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

        this.verificarInicializacion();


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

        this.verificarInicializacion();


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

        this.verificarInicializacion();


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

        this.verificarInicializacion();


        return this.motorManager
            .obtenerTop(

                cantidad,

                configuracion

            );

    }


    /*================================================================
        MOTOR RANKING
    ================================================================*/

    generarRanking(
        opciones = {},
        configuracionManager = {}
    ) {

        this.verificarInicializacion();


        const resultadosManager =
            this.managerTodos(
                configuracionManager
            );


        const ranking =
            this.motorRanking
                .generar(

                    resultadosManager,

                    opciones

                );


        this.ultimoRanking =
            ranking;


        return ranking;

    }


    ranking() {

        this.verificarInicializacion();


        if (!this.ultimoRanking) {

            return this.generarRanking();

        }


        return this.ultimoRanking;

    }


    top10() {

        return this.ranking()
            .top10;

    }


    top20() {

        return this.ranking()
            .top20;

    }


    titulares() {

        return this.ranking()
            .equipoTitular;

    }


    suplentes() {

        return this.ranking()
            .equipoSuplente;

    }


    /*================================================================
        PREDICCIÓN
    ================================================================*/

    prepararPrediccion(
        datosSemana = {}
    ) {

        this.verificarInicializacion();


        const ranking =
            this.ranking();


        const prediccion =
            this.motorRanking
                .prepararPrediccion(

                    ranking,

                    datosSemana

                );


        this.ultimaPrediccion =
            prediccion;


        return prediccion;

    }


    prediccion() {

        this.verificarInicializacion();

        return this.ultimaPrediccion;

    }


    /*================================================================
        MOTOR EVALUACIÓN
    ================================================================*/

    evaluar(
        numerosReales,
        datosSemana = {},
        prediccion = null
    ) {

        this.verificarInicializacion();


        let prediccionEvaluar =
            prediccion ||
            this.ultimaPrediccion;


        if (!prediccionEvaluar) {

            prediccionEvaluar =
                this.prepararPrediccion(
                    datosSemana
                );

        }


        const evaluacion =
            this.motorEvaluacion
                .evaluar(

                    prediccionEvaluar,

                    numerosReales,

                    datosSemana

                );


        this.ultimaEvaluacion =
            evaluacion;


        /*
         * Cada nueva evaluación invalida
         * el último análisis evolutivo,
         * porque ahora existe nueva evidencia.
         */

        this.ultimaEvolucion =
            null;


        return evaluacion;

    }


    evaluacion() {

        this.verificarInicializacion();

        return this.ultimaEvaluacion;

    }


    evaluaciones() {

        this.verificarInicializacion();


        return this.motorEvaluacion
            .obtenerHistorial();

    }


    resumenEvaluaciones(
        evaluaciones = null
    ) {

        this.verificarInicializacion();


        return this.motorEvaluacion
            .generarResumenAcumulado(
                evaluaciones
            );

    }


    hayDatosParaOptimizar(
        cantidadSemanas = null
    ) {

        this.verificarInicializacion();


        return this.motorEvaluacion
            .hayDatosParaOptimizar(
                cantidadSemanas
            );

    }


    /*================================================================
        MOTOR EVOLUCIÓN
    ================================================================*/

    evolucion(
        evaluaciones = null,
        opciones = {}
    ) {

        this.verificarInicializacion();


        const lista =

            Array.isArray(
                evaluaciones
            )

                ? evaluaciones

                : this.motorEvaluacion
                    .obtenerHistorial();


        const resultado =
            this.motorEvolucion
                .analizar(

                    lista,

                    opciones

                );


        this.ultimaEvolucion =
            resultado;


        return resultado;

    }


    /*================================================================
        ÚLTIMA EVOLUCIÓN
    ================================================================*/

    obtenerEvolucion() {

        this.verificarInicializacion();


        if (!this.ultimaEvolucion) {

            return this.evolucion();

        }


        return this.ultimaEvolucion;

    }


    /*================================================================
        ESTADO MOTOR EVOLUCIÓN
    ================================================================*/

    estadoEvolucion() {

        this.verificarInicializacion();


        const cantidadEvaluaciones =
            this.motorEvaluacion
                .obtenerHistorial()
                .length;


        return this.motorEvolucion
            .obtenerEstado(
                cantidadEvaluaciones
            );

    }


    /*================================================================
        RANKING EVOLUTIVO DE MOTORES
    ================================================================*/

    rankingMotoresEvolucion() {

        const resultado =
            this.obtenerEvolucion();


        return resultado
            .rankingMotores ||
            [];

    }


    /*================================================================
        MEJOR MOTOR HISTÓRICO
    ================================================================*/

    mejorMotorHistorico() {

        const resultado =
            this.obtenerEvolucion();


        return resultado
            .mejorMotorHistorico;

    }


    /*================================================================
        MEJOR MOTOR RECIENTE
    ================================================================*/

    mejorMotorReciente() {

        const resultado =
            this.obtenerEvolucion();


        return resultado
            .mejorMotorReciente;

    }


    /*================================================================
        MOTORES CONSISTENTES
    ================================================================*/

    motoresConsistentes() {

        const resultado =
            this.obtenerEvolucion();


        return resultado
            .motoresConsistentes ||
            [];

    }


    /*================================================================
        MOTORES EN MEJORA
    ================================================================*/

    motoresEnMejora() {

        const resultado =
            this.obtenerEvolucion();


        return resultado
            .motoresEnMejora ||
            [];

    }


    /*================================================================
        MOTORES EN DETERIORO
    ================================================================*/

    motoresEnDeterioro() {

        const resultado =
            this.obtenerEvolucion();


        return resultado
            .motoresEnDeterioro ||
            [];

    }


    /*================================================================
        SEÑALES EVOLUCIÓN
    ================================================================*/

    señalesEvolucion() {

        const resultado =
            this.obtenerEvolucion();


        return resultado
            .señalesOptimizacion ||
            [];

    }


    /*================================================================
        ANALIZAR NÚMERO COMPLETO
    ================================================================*/

    analizarNumero(
        numero
    ) {

        this.verificarInicializacion();


        return {

            numero:
                Number(numero),

            frecuencia:
                this.frecuencia(numero),

            atraso:
                this.atraso(numero),

            tendencia:
                this.tendencia(numero),

            repeticion:
                this.repeticion(numero),

            historico:
                this.historico(numero),

            paridad:
                this.paridad(numero),

            rangos:
                this.rangos(numero),

            distribucion:
                this.distribucion(numero),

            asociaciones:
                this.asociaciones(numero),

            ciclos:
                this.ciclos(numero),

            manager:
                this.manager(numero)

        };

    }


    /*================================================================
        INFORMACIÓN GENERAL
    ================================================================*/

    informacion() {

        const cantidadEvaluaciones =
            this.motorEvaluacion
                ? this.motorEvaluacion
                    .obtenerHistorial()
                    .length
                : 0;


        return {

            inicializado:
                this.inicializado,

            semanas:
                this.datosHistorial.length,

            numerosAnalizados:
                this.calcularNumerosAnalizados(),

            estadisticasDisponibles:
                this.obtenerArrayEstadisticas()
                    .length,


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
                    ? this.motorManager
                        .obtenerInformacion()
                    : null,


            motorRanking:
                this.motorRanking
                    ? this.motorRanking
                        .obtenerEstado()
                    : null,


            motorEvaluacion:
                this.motorEvaluacion
                    ? this.motorEvaluacion
                        .obtenerEstado()
                    : null,


            motorEvolucion:
                this.motorEvolucion
                    ? this.motorEvolucion
                        .obtenerEstado(
                            cantidadEvaluaciones
                        )
                    : null,


            rankingGenerado:
                this.ultimoRanking !==
                null,


            prediccionGenerada:
                this.ultimaPrediccion !==
                null,


            evaluacionGenerada:
                this.ultimaEvaluacion !==
                null,


            evolucionGenerada:
                this.ultimaEvolucion !==
                null

        };

    }


    /*================================================================
        INFORMACIÓN MOTOR
    ================================================================*/

    obtenerInformacionMotor(
        motor
    ) {

        if (!motor) {

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


    /*================================================================
        NÚMEROS ANALIZADOS
    ================================================================*/

    calcularNumerosAnalizados() {

        const numeros =
            new Set();


        for (
            const semana
            of this.datosHistorial
        ) {

            if (
                !semana ||
                !Array.isArray(
                    semana.numeros
                )
            ) {

                continue;

            }


            for (
                const numero
                of semana.numeros
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
        RECARGAR ENTORNO
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


        this.ultimaEvaluacion =
            null;


        this.ultimaEvolucion =
            null;


        return await this.inicializar();

    }


    /*================================================================
        TABLA MANAGER
    ================================================================*/

    tablaManager(
        numero
    ) {

        const resultado =
            this.manager(
                numero
            );


        console.table(
            resultado.detallePesos
        );


        return resultado;

    }


    /*================================================================
        TABLA TOP MANAGER
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


    /*================================================================
        TABLA RANKING
    ================================================================*/

    tablaRanking(
        cantidad = 100
    ) {

        const ranking =
            this.ranking();


        const limite =
            Math.max(

                1,

                Math.min(

                    Number(cantidad) ||
                    100,

                    ranking.ranking
                        .length

                )

            );


        const tabla =
            ranking.ranking

                .slice(
                    0,
                    limite
                )

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
                            item.empate,

                        diferenciaPromedio:
                            item.diferenciaPromedio,

                        motores:
                            item.cantidadMotores

                    })

                );


        console.table(
            tabla
        );


        return tabla;

    }


    /*================================================================
        TABLA TOP 10
    ================================================================*/

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


    /*================================================================
        TABLA TOP 20
    ================================================================*/

    tablaTop20() {

        const tabla =
            this.top20()
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


    /*================================================================
        TABLA EMPATES
    ================================================================*/

    tablaEmpates() {

        const ranking =
            this.ranking();


        const tabla =
            ranking.ranking

                .filter(
                    item =>
                        item.empate
                )

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
                            item.confianza

                    })

                );


        console.table(
            tabla
        );


        return tabla;

    }


    /*================================================================
        TABLA ESTADÍSTICAS RANKING
    ================================================================*/

    tablaEstadisticasRanking() {

        const resultado =
            this.ranking()
                .estadisticas;


        console.table(
            resultado
        );


        return resultado;

    }


    /*================================================================
        TABLA DISTRIBUCIÓN RANKING
    ================================================================*/

    tablaDistribucionRanking() {

        const ranking =
            this.ranking();


        const tabla =
            Object.entries(
                ranking.distribucion
            ).map(

                (
                    [
                        rango,
                        datos
                    ]
                ) => ({

                    rango,

                    cantidad:
                        datos.cantidad,

                    scorePromedio:
                        datos.scorePromedio,

                    confianzaPromedio:
                        datos.confianzaPromedio,

                    mejorPosicion:
                        datos.mejorPosicion

                })

            );


        console.table(
            tabla
        );


        return tabla;

    }


    /*================================================================
        DETALLE RANKING
    ================================================================*/

    detalleRanking(
        numero
    ) {

        const ranking =
            this.ranking();


        const valor =
            Number(
                numero
            );


        const item =
            ranking.ranking.find(

                candidato =>
                    candidato.numero ===
                    valor

            );


        if (!item) {

            console.warn(
                "Número no encontrado:",
                numero
            );

            return null;

        }


        console.log(
            item
        );


        console.table(

            Object.entries(

                item.resumenMotores ||
                {}

            ).map(

                (
                    [
                        clave,
                        datos
                    ]
                ) => ({

                    motor:
                        clave,

                    score:
                        datos.score,

                    confianza:
                        datos.confianza,

                    peso:
                        datos.peso,

                    evidencia:
                        datos.evidencia

                })

            )

        );


        return item;

    }


    /*================================================================
        TABLA GRUPOS EVALUACIÓN
    ================================================================*/

    tablaGruposEvaluacion(
        evaluacion = null
    ) {

        const resultado =
            evaluacion ||
            this.ultimaEvaluacion;


        if (!resultado) {

            return [];

        }


        const grupos =
            resultado.grupos ||
            {};


        const tabla =
            Object.entries(
                grupos
            ).map(

                (
                    [
                        nombre,
                        datos
                    ]
                ) => ({

                    grupo:
                        nombre,

                    predichos:
                        datos.cantidadPredicha,

                    reales:
                        datos.cantidadReales,

                    aciertos:
                        datos.aciertos,

                    porcentaje:
                        datos.porcentajeAcierto,

                    numeros:
                        Array.isArray(
                            datos.numerosAcertados
                        )

                            ? datos
                                .numerosAcertados
                                .join(" - ")

                            : ""

                })

            );


        console.table(
            tabla
        );


        return tabla;

    }


    /*================================================================
        TABLA ACIERTOS
    ================================================================*/

    tablaAciertos(
        evaluacion = null
    ) {

        const resultado =
            evaluacion ||
            this.ultimaEvaluacion;


        if (!resultado) {

            return [];

        }


        const tabla =
            (
                resultado
                    .aciertosDetallados ||
                []
            ).map(

                item => ({

                    numero:
                        item.numero,

                    posicion:
                        item.posicion,

                    score:
                        item.score,

                    confianza:
                        item.confianza,

                    calidadPosicion:
                        item.calidadPosicion,

                    motores:
                        item.cantidadMotores

                })

            );


        console.table(
            tabla
        );


        return tabla;

    }


    /*================================================================
        TABLA COMPORTAMIENTO RANKING
    ================================================================*/

    tablaComportamientoRanking(
        evaluacion = null
    ) {

        const resultado =
            evaluacion ||
            this.ultimaEvaluacion;


        if (!resultado) {

            return null;

        }


        console.table(
            resultado
                .comportamientoRanking
        );


        return resultado
            .comportamientoRanking;

    }


    /*================================================================
        TABLA RENDIMIENTO MOTORES
    ================================================================*/

    tablaRendimientoMotores(
        evaluacion = null
    ) {

        const resultado =
            evaluacion ||
            this.ultimaEvaluacion;


        if (
            !resultado ||
            !resultado.rendimientoMotores
        ) {

            return [];

        }


        const lista =
            resultado
                .rendimientoMotores
                .rankingMotores ||
            [];


        const tabla =
            lista.map(

                (
                    motor,
                    indice
                ) => ({

                    posicion:
                        indice + 1,

                    motor:
                        motor.motor,

                    apariciones:
                        motor.apariciones,

                    aciertos:
                        motor.aciertos,

                    tasaAcierto:
                        motor.tasaAcierto,

                    promedioScore:
                        motor.promedioScore,

                    promedioScoreAciertos:
                        motor.promedioScoreAciertos,

                    ventajaScore:
                        motor.ventajaScore,

                    promedioConfianza:
                        motor.promedioConfianza,

                    promedioConfianzaAciertos:
                        motor.promedioConfianzaAciertos,

                    ventajaConfianza:
                        motor.ventajaConfianza,

                    indiceDiscriminacion:
                        motor.indiceDiscriminacion

                })

            );


        console.table(
            tabla
        );


        return tabla;

    }


    /*================================================================
        TABLA SEÑALES EVALUACIÓN
    ================================================================*/

    tablaSeñales(
        evaluacion = null
    ) {

        const resultado =
            evaluacion ||
            this.ultimaEvaluacion;


        if (!resultado) {

            return [];

        }


        const señales =
            resultado
                .señalesOptimizacion ||
            [];


        console.table(
            señales
        );


        return señales;

    }


    /*================================================================
        TABLA RESUMEN EVALUACIONES
    ================================================================*/

    tablaResumenEvaluaciones() {

        const resumen =
            this.resumenEvaluaciones();


        console.table([

            {

                cantidadSemanas:
                    resumen
                        .cantidadSemanas,

                promedioTop10:
                    resumen
                        .promedioAciertosTop10,

                promedioTop20:
                    resumen
                        .promedioAciertosTop20,

                promedioTitulares:
                    resumen
                        .promedioAciertosTitulares,

                promedioSuplentes:
                    resumen
                        .promedioAciertosSuplentes,

                cobertura:
                    resumen
                        .promedioCoberturaRanking

            }

        ]);


        return resumen;

    }


    /*================================================================
        TABLA ESTADO EVOLUCIÓN
    ================================================================*/

    tablaEstadoEvolucion() {

        const estado =
            this.estadoEvolucion();


        console.table(
            estado
        );


        return estado;

    }


    /*================================================================
        TABLA RANKING EVOLUTIVO DE MOTORES
    ================================================================*/

    tablaEvolucionMotores(
        evolucion = null
    ) {

        const resultado =
            evolucion ||
            this.obtenerEvolucion();


        const lista =
            resultado
                .rankingMotores ||
            [];


        const tabla =
            lista.map(

                (
                    motor,
                    indice
                ) => ({

                    posicion:
                        motor
                            .posicionEvolutiva ??
                        indice + 1,

                    motor:
                        motor.motor,

                    evaluaciones:
                        motor
                            .cantidadEvaluaciones,

                    indiceHistorico:
                        motor
                            .promedioIndiceDiscriminacion,

                    indiceReciente:
                        motor
                            .promedioIndiceReciente,

                    indiceAnterior:
                        motor
                            .promedioIndiceAnterior,

                    variacionIndice:
                        motor
                            .variacionIndiceReciente,

                    ventajaScore:
                        motor
                            .promedioVentajaScore,

                    ventajaScoreReciente:
                        motor
                            .promedioVentajaScoreReciente,

                    ventajaConfianza:
                        motor
                            .promedioVentajaConfianza,

                    tendencia:
                        motor
                            .tendenciaIndiceDiscriminacion
                            ?.tendencia ??
                        null,

                    consistencia:
                        motor.consistencia,

                    consistente:
                        motor.consistente,

                    estado:
                        motor.estado

                })

            );


        console.table(
            tabla
        );


        return tabla;

    }


    /*================================================================
        TABLA RESUMEN EVOLUCIÓN
    ================================================================*/

    tablaResumenEvolucion(
        evolucion = null
    ) {

        const resultado =
            evolucion ||
            this.obtenerEvolucion();


        const tabla = [

            {

                evaluaciones:
                    resultado
                        .cantidadEvaluaciones,

                minimo:
                    resultado
                        .minimoEvaluaciones,

                datosSuficientes:
                    resultado
                        .datosSuficientes,

                mejorHistorico:
                    resultado
                        .mejorMotorHistorico,

                mejorReciente:
                    resultado
                        .mejorMotorReciente,

                consistentes:
                    (
                        resultado
                            .motoresConsistentes ||
                        []
                    ).length,

                mejorando:
                    (
                        resultado
                            .motoresEnMejora ||
                        []
                    ).length,

                deteriorando:
                    (
                        resultado
                            .motoresEnDeterioro ||
                        []
                    ).length

            }

        ];


        console.table(
            tabla
        );


        return tabla;

    }


    /*================================================================
        TABLA TENDENCIAS EVOLUCIÓN
    ================================================================*/

    tablaTendenciasEvolucion(
        evolucion = null
    ) {

        const resultado =
            evolucion ||
            this.obtenerEvolucion();


        const tendencias =
            resultado.tendencias ||
            {};


        const tabla =
            Object.entries(
                tendencias
            ).map(

                (
                    [
                        nombre,
                        datos
                    ]
                ) => ({

                    indicador:
                        nombre,

                    cantidad:
                        datos.cantidad,

                    promedio:
                        datos.promedio,

                    minimo:
                        datos.minimo,

                    maximo:
                        datos.maximo,

                    pendiente:
                        datos.pendiente,

                    tendencia:
                        datos.tendencia

                })

            );


        console.table(
            tabla
        );


        return tabla;

    }


    /*================================================================
        TABLA PERIODOS
    ================================================================*/

    tablaPeriodosEvolucion(
        evolucion = null
    ) {

        const resultado =
            evolucion ||
            this.obtenerEvolucion();


        const periodos =
            resultado.periodos ||
            [];


        const tabla =
            periodos.map(

                periodo => ({

                    periodo:
                        periodo.numero,

                    nombre:
                        periodo.nombre,

                    cantidad:
                        periodo.cantidad,

                    top10:
                        periodo.resumen
                            ?.promedioAciertosTop10 ??
                        0,

                    top20:
                        periodo.resumen
                            ?.promedioAciertosTop20 ??
                        0,

                    titulares:
                        periodo.resumen
                            ?.promedioAciertosTitulares ??
                        0,

                    suplentes:
                        periodo.resumen
                            ?.promedioAciertosSuplentes ??
                        0,

                    cobertura:
                        periodo.resumen
                            ?.promedioCobertura ??
                        0

                })

            );


        console.table(
            tabla
        );


        return tabla;

    }


    /*================================================================
        TABLA COMPARACIÓN PERIODOS
    ================================================================*/

    tablaComparacionPeriodos(
        evolucion = null
    ) {

        const resultado =
            evolucion ||
            this.obtenerEvolucion();


        const comparacion =
            resultado
                .comparacionPeriodos;


        if (
            !comparacion ||
            !comparacion.disponible
        ) {

            console.log(
                comparacion
            );

            return comparacion;

        }


        console.table(
            comparacion.variaciones
        );


        console.log(
            "Dirección:",
            comparacion.direccion
        );


        return comparacion;

    }


    /*================================================================
        TABLA CAMBIOS EVOLUCIÓN
    ================================================================*/

    tablaCambiosEvolucion(
        evolucion = null
    ) {

        const resultado =
            evolucion ||
            this.obtenerEvolucion();


        const cambios =
            resultado.cambios ||
            [];


        console.table(
            cambios
        );


        return cambios;

    }


    /*================================================================
        TABLA SEÑALES EVOLUCIÓN
    ================================================================*/

    tablaSeñalesEvolucion(
        evolucion = null
    ) {

        const resultado =
            evolucion ||
            this.obtenerEvolucion();


        const señales =
            resultado
                .señalesOptimizacion ||
            [];


        console.table(
            señales
        );


        return señales;

    }


    /*================================================================
        TABLA MOTOR ESPECÍFICO EN EVOLUCIÓN
    ================================================================*/

    detalleMotorEvolucion(
        claveMotor,
        evolucion = null
    ) {

        const resultado =
            evolucion ||
            this.obtenerEvolucion();


        const motor =
            resultado
                .motores
                ?.[claveMotor];


        if (!motor) {

            console.warn(
                "Motor no encontrado:",
                claveMotor
            );

            return null;

        }


        console.log(
            motor
        );


        console.table(
            motor.historial
        );


        return motor;

    }


    /*================================================================
        TABLA GENERAL DE NÚMERO
    ================================================================*/

    tablaNumero(
        numero
    ) {

        const resultado =
            this.analizarNumero(
                numero
            );


        const tabla = [

            {
                motor:
                    "Frecuencia",

                score:
                    resultado
                        .frecuencia
                        .score,

                confianza:
                    resultado
                        .frecuencia
                        .confianza,

                peso:
                    resultado
                        .frecuencia
                        .peso
            },

            {
                motor:
                    "Atraso",

                score:
                    resultado
                        .atraso
                        .score,

                confianza:
                    resultado
                        .atraso
                        .confianza,

                peso:
                    resultado
                        .atraso
                        .peso
            },

            {
                motor:
                    "Tendencia",

                score:
                    resultado
                        .tendencia
                        .score,

                confianza:
                    resultado
                        .tendencia
                        .confianza,

                peso:
                    resultado
                        .tendencia
                        .peso
            },

            {
                motor:
                    "Repeticion",

                score:
                    resultado
                        .repeticion
                        .score,

                confianza:
                    resultado
                        .repeticion
                        .confianza,

                peso:
                    resultado
                        .repeticion
                        .peso
            },

            {
                motor:
                    "Historico",

                score:
                    resultado
                        .historico
                        .score,

                confianza:
                    resultado
                        .historico
                        .confianza,

                peso:
                    resultado
                        .historico
                        .peso
            },

            {
                motor:
                    "Paridad",

                score:
                    resultado
                        .paridad
                        .score,

                confianza:
                    resultado
                        .paridad
                        .confianza,

                peso:
                    resultado
                        .paridad
                        .peso
            },

            {
                motor:
                    "Rangos",

                score:
                    resultado
                        .rangos
                        .score,

                confianza:
                    resultado
                        .rangos
                        .confianza,

                peso:
                    resultado
                        .rangos
                        .peso
            },

            {
                motor:
                    "Distribucion",

                score:
                    resultado
                        .distribucion
                        .score,

                confianza:
                    resultado
                        .distribucion
                        .confianza,

                peso:
                    resultado
                        .distribucion
                        .peso
            },

            {
                motor:
                    "Asociaciones",

                score:
                    resultado
                        .asociaciones
                        .score,

                confianza:
                    resultado
                        .asociaciones
                        .confianza,

                peso:
                    resultado
                        .asociaciones
                        .peso
            },

            {
                motor:
                    "Ciclos",

                score:
                    resultado
                        .ciclos
                        .score,

                confianza:
                    resultado
                        .ciclos
                        .confianza,

                peso:
                    resultado
                        .ciclos
                        .peso
            },

            {
                motor:
                    "MANAGER",

                score:
                    resultado
                        .manager
                        .score,

                confianza:
                    resultado
                        .manager
                        .confianza,

                peso:
                    resultado
                        .manager
                        .pesoTotal
            }

        ];


        console.table(
            tabla
        );


        return tabla;

    }

}


/*====================================================================
    ENTORNO GLOBAL
====================================================================*/

const entornoPruebas =
    new EntornoPruebas();


window.entornoPruebas =
    entornoPruebas;


window.EntornoPruebas =
    EntornoPruebas;


/*====================================================================
    INICIALIZACIÓN AUTOMÁTICA
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