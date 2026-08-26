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
 *   - MotorManager
 *   - MotorRanking
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


/*====================================================================
    CLASE ENTORNO DE PRUEBAS
====================================================================*/

class EntornoPruebas {


    constructor() {

        /*==========================================================
            ESTADO
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
            MOTORES INDIVIDUALES
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


        /*==========================================================
            ÚLTIMO RANKING
        ==========================================================*/

        this.ultimoRanking = null;

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
        OBTENER ARRAY DE ESTADÍSTICAS
    ================================================================*/

    obtenerArrayEstadisticas() {

        if (!this.datosEstadisticas) {

            return [];

        }


        if (
            Array.isArray(
                this.datosEstadisticas.estadisticas
            )
        ) {

            return this.datosEstadisticas
                .estadisticas;

        }


        if (
            this.datosEstadisticas.estadisticas &&
            typeof this.datosEstadisticas.estadisticas ===
                "object"
        ) {

            return Object.values(
                this.datosEstadisticas.estadisticas
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
        CONTEXTO ESTÁNDAR
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
        FRECUENCIA
    ================================================================*/

    frecuencia(
        numero,
        configuracion = {}
    ) {

        this.verificarInicializacion();


        return this.motorFrecuencia.calcular(

            numero,

            this.crearContexto(
                configuracion
            )

        );

    }


    /*================================================================
        ATRASO
    ================================================================*/

    atraso(
        numero,
        configuracion = {}
    ) {

        this.verificarInicializacion();


        return this.motorAtraso.calcular(

            numero,

            this.crearContexto(
                configuracion
            )

        );

    }


    /*================================================================
        TENDENCIA
    ================================================================*/

    tendencia(
        numero,
        configuracion = {}
    ) {

        this.verificarInicializacion();


        return this.motorTendencia.calcular(

            numero,

            this.crearContexto(
                configuracion
            )

        );

    }


    /*================================================================
        REPETICIÓN
    ================================================================*/

    repeticion(
        numero,
        configuracion = {}
    ) {

        this.verificarInicializacion();


        return this.motorRepeticion.calcular(

            numero,

            this.crearContexto(
                configuracion
            )

        );

    }


    /*================================================================
        HISTÓRICO
    ================================================================*/

    historico(
        numero,
        configuracion = {}
    ) {

        this.verificarInicializacion();


        return this.motorHistorico.calcular(

            numero,

            this.crearContexto(
                configuracion
            )

        );

    }


    /*================================================================
        PARIDAD
    ================================================================*/

    paridad(
        numero,
        configuracion = {}
    ) {

        this.verificarInicializacion();


        return this.motorParidad.calcular(

            numero,

            this.crearContexto(
                configuracion
            )

        );

    }


    /*================================================================
        RANGOS
    ================================================================*/

    rangos(
        numero,
        configuracion = {}
    ) {

        this.verificarInicializacion();


        return this.motorRangos.calcular(

            numero,

            this.crearContexto(
                configuracion
            )

        );

    }


    /*================================================================
        DISTRIBUCIÓN
    ================================================================*/

    distribucion(
        numero,
        configuracion = {}
    ) {

        this.verificarInicializacion();


        return this.motorDistribucion.calcular(

            numero,

            this.crearContexto(
                configuracion
            )

        );

    }


    /*================================================================
        ASOCIACIONES
    ================================================================*/

    asociaciones(
        numero,
        configuracion = {}
    ) {

        this.verificarInicializacion();


        return this.motorAsociaciones.calcular(

            numero,

            this.crearContexto(
                configuracion
            )

        );

    }


    /*================================================================
        CICLOS
    ================================================================*/

    ciclos(
        numero,
        configuracion = {}
    ) {

        this.verificarInicializacion();


        return this.motorCiclos.calcular(

            numero,

            this.crearContexto(
                configuracion
            )

        );

    }


    /*================================================================
        MANAGER
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


    /*================================================================
        MANAGER - TODOS
    ================================================================*/

    managerTodos(
        configuracion = {}
    ) {

        this.verificarInicializacion();


        return this.motorManager
            .analizarTodos(
                configuracion
            );

    }


    /*================================================================
        MANAGER - TOP PROVISIONAL
    ================================================================*/

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
        GENERAR RANKING FINAL
    ================================================================*/

    generarRanking(
        opciones = {},
        configuracionManager = {}
    ) {

        this.verificarInicializacion();


        /*
         * Primero analizamos los 100 números.
         */

        const resultadosManager =
            this.motorManager
                .analizarTodos(
                    configuracionManager
                );


        /*
         * MotorRanking organiza esos resultados.
         */

        const ranking =
            this.motorRanking.generar(

                resultadosManager,

                opciones

            );


        this.ultimoRanking =
            ranking;


        return ranking;

    }


    /*================================================================
        OBTENER ÚLTIMO RANKING
    ================================================================*/

    ranking() {

        this.verificarInicializacion();


        if (!this.ultimoRanking) {

            return this.generarRanking();

        }


        return this.ultimoRanking;

    }


    /*================================================================
        TOP 10
    ================================================================*/

    top10() {

        const ranking =
            this.ranking();


        return ranking.top10;

    }


    /*================================================================
        TOP 20
    ================================================================*/

    top20() {

        const ranking =
            this.ranking();


        return ranking.top20;

    }


    /*================================================================
        EQUIPO TITULAR
    ================================================================*/

    titulares() {

        const ranking =
            this.ranking();


        return ranking.equipoTitular;

    }


    /*================================================================
        EQUIPO SUPLENTE
    ================================================================*/

    suplentes() {

        const ranking =
            this.ranking();


        return ranking.equipoSuplente;

    }


    /*================================================================
        PREPARAR PREDICCIÓN
    ================================================================*/

    prepararPrediccion(
        datosSemana = {}
    ) {

        const ranking =
            this.ranking();


        return this.motorRanking
            .prepararPrediccion(

                ranking,

                datosSemana

            );

    }


    /*================================================================
        EVALUAR PREDICCIÓN
    ================================================================*/

    evaluarPrediccion(
        prediccion,
        numerosReales
    ) {

        this.verificarInicializacion();


        return this.motorRanking
            .evaluarPrediccion(

                prediccion,

                numerosReales

            );

    }


    /*================================================================
        ANALIZAR NÚMERO COMPLETO
    ================================================================*/

    analizarNumero(numero) {

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
        INFORMACIÓN DEL SISTEMA
    ================================================================*/

    informacion() {

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

            rankingGenerado:
                this.ultimoRanking !==
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
                motor.nombre ?? null,

            version:
                motor.version ?? null

        };

    }


    /*================================================================
        CALCULAR NÚMEROS ANALIZADOS
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
                    Number(numero);


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


        return await this.inicializar();

    }


    /*================================================================
        TABLA MANAGER - UN NÚMERO
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
        TABLA RANKING FINAL
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
                    Number(cantidad) || 100,
                    ranking.ranking.length
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
        TABLA TOP 10 RANKING
    ================================================================*/

    tablaTop10() {

        const top =
            this.top10();


        const tabla =
            top.map(

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
        TABLA TOP 20 RANKING
    ================================================================*/

    tablaTop20() {

        const top =
            this.top20();


        const tabla =
            top.map(

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
        TABLA EQUIPO TITULAR
    ================================================================*/

    tablaTitulares() {

        const lista =
            this.titulares();


        const tabla =
            lista.map(

                item => ({

                    posicion:
                        item.posicion,

                    numero:
                        item.numeroTexto,

                    score:
                        item.score,

                    confianza:
                        item.confianza,

                    categoria:
                        item.categoria

                })

            );


        console.table(
            tabla
        );


        return tabla;

    }


    /*================================================================
        TABLA EQUIPO SUPLENTE
    ================================================================*/

    tablaSuplentes() {

        const lista =
            this.suplentes();


        const tabla =
            lista.map(

                item => ({

                    posicion:
                        item.posicion,

                    numero:
                        item.numeroTexto,

                    score:
                        item.score,

                    confianza:
                        item.confianza,

                    categoria:
                        item.categoria

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

        const ranking =
            this.ranking();


        console.table(
            ranking.estadisticas
        );


        return ranking.estadisticas;

    }


    /*================================================================
        TABLA DISTRIBUCIÓN DEL RANKING
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
        DETALLE DE UN NÚMERO EN EL RANKING
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
                "Número no encontrado en el ranking:",
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
        COMPROBAR EMPATES
    ================================================================*/

    tablaEmpates() {

        const ranking =
            this.ranking();


        const empatados =
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
            empatados
        );


        return empatados;

    }


    /*================================================================
        TABLA GENERAL DE UN NÚMERO
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
                    resultado.frecuencia.score,

                confianza:
                    resultado.frecuencia.confianza,

                peso:
                    resultado.frecuencia.peso
            },

            {
                motor:
                    "Atraso",

                score:
                    resultado.atraso.score,

                confianza:
                    resultado.atraso.confianza,

                peso:
                    resultado.atraso.peso
            },

            {
                motor:
                    "Tendencia",

                score:
                    resultado.tendencia.score,

                confianza:
                    resultado.tendencia.confianza,

                peso:
                    resultado.tendencia.peso
            },

            {
                motor:
                    "Repeticion",

                score:
                    resultado.repeticion.score,

                confianza:
                    resultado.repeticion.confianza,

                peso:
                    resultado.repeticion.peso
            },

            {
                motor:
                    "Historico",

                score:
                    resultado.historico.score,

                confianza:
                    resultado.historico.confianza,

                peso:
                    resultado.historico.peso
            },

            {
                motor:
                    "Paridad",

                score:
                    resultado.paridad.score,

                confianza:
                    resultado.paridad.confianza,

                peso:
                    resultado.paridad.peso
            },

            {
                motor:
                    "Rangos",

                score:
                    resultado.rangos.score,

                confianza:
                    resultado.rangos.confianza,

                peso:
                    resultado.rangos.peso
            },

            {
                motor:
                    "Distribucion",

                score:
                    resultado.distribucion.score,

                confianza:
                    resultado.distribucion.confianza,

                peso:
                    resultado.distribucion.peso
            },

            {
                motor:
                    "Asociaciones",

                score:
                    resultado.asociaciones.score,

                confianza:
                    resultado.asociaciones.confianza,

                peso:
                    resultado.asociaciones.peso
            },

            {
                motor:
                    "Ciclos",

                score:
                    resultado.ciclos.score,

                confianza:
                    resultado.ciclos.confianza,

                peso:
                    resultado.ciclos.peso
            },

            {
                motor:
                    "MANAGER",

                score:
                    resultado.manager.score,

                confianza:
                    resultado.manager.confianza,

                peso:
                    resultado.manager.pesoTotal
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

await entornoPruebas.inicializar();


/*====================================================================
    EXPORTS
====================================================================*/

export {

    EntornoPruebas,

    entornoPruebas

};


export default entornoPruebas;