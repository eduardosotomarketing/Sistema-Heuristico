/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * js/motores/MotorManager.js
 *
 * Propósito:
 *
 * Coordinar la ejecución de todos los motores heurísticos del sistema.
 *
 * Responsabilidades:
 *
 *   - Inicializar motores
 *   - Ejecutar todos los motores para un número
 *   - Aplicar pesos
 *   - Considerar confianza de cada motor
 *   - Calcular score global
 *   - Analizar los números 00-99
 *   - Generar resultados ordenables para MotorRanking
 *
 * IMPORTANTE:
 *
 * El score resultante es una combinación heurística.
 * NO representa una probabilidad matemática de aparición.
 *
 **********************************************************************/


/*====================================================================
    IMPORTS
====================================================================*/

import MotorFrecuencia
    from "./MotorFrecuencia.js";

import MotorAtraso
    from "./MotorAtraso.js";

import MotorTendencia
    from "./MotorTendencia.js";

import MotorRepeticion
    from "./MotorRepeticion.js";

import MotorHistorico
    from "./MotorHistorico.js";

import MotorParidad
    from "./MotorParidad.js";

import MotorRangos
    from "./MotorRangos.js";

import MotorDistribucion
    from "./MotorDistribucion.js";

import MotorAsociaciones
    from "./MotorAsociaciones.js";

import MotorCiclos
    from "./MotorCiclos.js";


/*====================================================================
    CLASE
====================================================================*/

export default class MotorManager {


    constructor() {

        /*============================================================
            ESTADO
        ============================================================*/

        this.inicializado = false;


        /*============================================================
            DATOS
        ============================================================*/

        this.historial = [];

        this.estadisticas = [];

        this.configuracion = {};


        /*============================================================
            MOTORES
        ============================================================*/

        this.motorFrecuencia =
            new MotorFrecuencia();

        this.motorAtraso =
            new MotorAtraso();

        this.motorTendencia =
            new MotorTendencia();

        this.motorRepeticion =
            new MotorRepeticion();

        this.motorHistorico =
            new MotorHistorico();

        this.motorParidad =
            new MotorParidad();

        this.motorRangos =
            new MotorRangos();

        this.motorDistribucion =
            new MotorDistribucion();

        this.motorAsociaciones =
            new MotorAsociaciones();

        this.motorCiclos =
            new MotorCiclos();


        /*============================================================
            REGISTRO DE MOTORES
        ============================================================*/

        this.motores = [

            {
                clave: "frecuencia",
                instancia: this.motorFrecuencia
            },

            {
                clave: "atraso",
                instancia: this.motorAtraso
            },

            {
                clave: "tendencia",
                instancia: this.motorTendencia
            },

            {
                clave: "repeticion",
                instancia: this.motorRepeticion
            },

            {
                clave: "historico",
                instancia: this.motorHistorico
            },

            {
                clave: "paridad",
                instancia: this.motorParidad
            },

            {
                clave: "rangos",
                instancia: this.motorRangos
            },

            {
                clave: "distribucion",
                instancia: this.motorDistribucion
            },

            {
                clave: "asociaciones",
                instancia: this.motorAsociaciones
            },

            {
                clave: "ciclos",
                instancia: this.motorCiclos
            }

        ];

    }


    /*================================================================
        INICIALIZAR
    ================================================================*/

    inicializar({
        historial = [],
        estadisticas = [],
        configuracion = {}
    } = {}) {

        if (!Array.isArray(historial)) {

            throw new Error(
                "MotorManager: historial debe ser un array."
            );

        }


        if (!Array.isArray(estadisticas)) {

            throw new Error(
                "MotorManager: estadisticas debe ser un array."
            );

        }


        this.historial =
            historial;

        this.estadisticas =
            estadisticas;

        this.configuracion =
            configuracion || {};


        const contextoBase = {

            historial:
                this.historial,

            semanas:
                this.historial,

            estadisticas:
                this.estadisticas,

            configuracion:
                this.configuracion,

            pesos:
                this.obtenerPesos()

        };


        /*
         * Inicializamos cada motor con el mismo
         * contexto base.
         */

        for (
            const item
            of this.motores
        ) {

            if (
                item.instancia &&
                typeof item.instancia.inicializar ===
                    "function"
            ) {

                item.instancia.inicializar(
                    contextoBase
                );

            }

        }


        this.inicializado = true;


        return this;

    }


    /*================================================================
        VERIFICAR INICIALIZACIÓN
    ================================================================*/

    verificarInicializacion() {

        if (!this.inicializado) {

            throw new Error(
                "MotorManager no está inicializado."
            );

        }

    }


    /*================================================================
        OBTENER PESOS
    ================================================================*/

    obtenerPesos() {

        /*
         * Pesos globales provisionales.
         *
         * No es obligatorio que sumen 100 porque
         * posteriormente son normalizados.
         *
         * En MotorEvolucion podrán ser modificados.
         */

        const predeterminados = {

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


        const personalizados =

            this.configuracion &&
            this.configuracion.pesos &&
            typeof this.configuracion.pesos ===
                "object"

                ? this.configuracion.pesos

                : {};


        return {

            ...predeterminados,

            ...personalizados

        };

    }


    /*================================================================
        CREAR CONTEXTO
    ================================================================*/

    crearContexto(
        configuracionAdicional = {}
    ) {

        this.verificarInicializacion();


        return {

            historial:
                this.historial,

            semanas:
                this.historial,

            estadisticas:
                this.estadisticas,

            configuracion:
                this.configuracion,

            pesos:
                this.obtenerPesos(),

            ...configuracionAdicional

        };

    }


    /*================================================================
        VALIDAR NÚMERO
    ================================================================*/

    validarNumero(numero) {

        const valor =
            Number(numero);


        if (
            !Number.isInteger(valor) ||
            valor < 0 ||
            valor > 99
        ) {

            throw new Error(
                `Número inválido: ${numero}. Debe estar entre 00 y 99.`
            );

        }


        return valor;

    }


    /*================================================================
        ANALIZAR NÚMERO
    ================================================================*/

    analizarNumero(
        numero,
        configuracionAdicional = {}
    ) {

        this.verificarInicializacion();


        const numeroValidado =
            this.validarNumero(
                numero
            );


        const contexto =
            this.crearContexto(
                configuracionAdicional
            );


        const resultados = {};


        /*------------------------------------------------------------
            EJECUTAR TODOS LOS MOTORES
        ------------------------------------------------------------*/

        for (
            const item
            of this.motores
        ) {

            try {

                const resultado =
                    item.instancia.calcular(

                        numeroValidado,

                        contexto

                    );


                resultados[
                    item.clave
                ] = resultado;

            }

            catch (error) {

                console.error(
                    `MotorManager: error en ${item.clave} para número ${numeroValidado}`,
                    error
                );


                resultados[
                    item.clave
                ] = null;

            }

        }


        /*------------------------------------------------------------
            SCORE GLOBAL
        ------------------------------------------------------------*/

        const combinacion =
            this.calcularScoreGlobal(
                resultados
            );


        return {

            numero:
                numeroValidado,

            numeroTexto:
                String(
                    numeroValidado
                ).padStart(
                    2,
                    "0"
                ),

            score:
                combinacion.score,

            scoreBruto:
                combinacion.scoreBruto,

            confianza:
                combinacion.confianza,

            pesoTotal:
                combinacion.pesoTotal,

            motoresUtilizados:
                combinacion.motoresUtilizados,

            motoresDisponibles:
                this.motores.length,

            resultados,

            detallePesos:
                combinacion.detallePesos,

            creado:
                new Date()
                    .toISOString()

        };

    }


    /*================================================================
        CALCULAR SCORE GLOBAL
    ================================================================*/

    calcularScoreGlobal(
        resultados
    ) {

        let sumaPonderada = 0;

        let pesoTotal = 0;

        let sumaConfianza = 0;

        let pesoConfianza = 0;

        let motoresUtilizados = 0;


        const detallePesos = [];


        for (
            const item
            of this.motores
        ) {

            const resultado =
                resultados[
                    item.clave
                ];


            if (!resultado) {

                continue;

            }


            const score =
                this.limitar(

                    Number(
                        resultado.score
                    ) || 0,

                    0,

                    100

                );


            const confianza =
                this.limitar(

                    Number(
                        resultado.confianza
                    ) || 0,

                    0,

                    100

                );


            let peso =
                Number(
                    resultado.peso
                );


            /*
             * Si el MotorResult no devuelve un peso
             * válido, usamos el peso configurado.
             */

            if (
                !Number.isFinite(
                    peso
                ) ||
                peso < 0
            ) {

                peso =
                    Number(
                        this.obtenerPesos()[
                            item.clave
                        ]
                    ) || 0;

            }


            /*
             * Factor de confianza.
             *
             * No anulamos completamente un motor
             * con confianza baja.
             *
             * Factor mínimo: 25%
             * Factor máximo: 100%
             *
             * confianza 0   → 0.25
             * confianza 50  → 0.625
             * confianza 100 → 1
             */

            const factorConfianza =

                0.25 +

                (

                    confianza /
                    100

                ) *

                0.75;


            const pesoEfectivo =

                peso *

                factorConfianza;


            sumaPonderada +=

                score *

                pesoEfectivo;


            pesoTotal +=
                pesoEfectivo;


            sumaConfianza +=

                confianza *

                peso;


            pesoConfianza +=
                peso;


            motoresUtilizados++;


            detallePesos.push({

                motor:
                    resultado.motor ||
                    item.clave,

                clave:
                    item.clave,

                score:
                    this.redondear(
                        score,
                        4
                    ),

                confianza:
                    this.redondear(
                        confianza,
                        4
                    ),

                peso:
                    this.redondear(
                        peso,
                        4
                    ),

                factorConfianza:
                    this.redondear(
                        factorConfianza,
                        4
                    ),

                pesoEfectivo:
                    this.redondear(
                        pesoEfectivo,
                        4
                    ),

                aporte:
                    this.redondear(

                        score *
                        pesoEfectivo,

                        4

                    )

            });

        }


        const scoreBruto =

            pesoTotal > 0

                ? sumaPonderada /
                    pesoTotal

                : 0;


        const confianzaGlobal =

            pesoConfianza > 0

                ? sumaConfianza /
                    pesoConfianza

                : 0;


        return {

            score:
                this.redondear(
                    this.limitar(
                        scoreBruto,
                        0,
                        100
                    ),
                    4
                ),

            scoreBruto:
                this.redondear(
                    scoreBruto,
                    6
                ),

            confianza:
                this.redondear(
                    this.limitar(
                        confianzaGlobal,
                        0,
                        100
                    ),
                    4
                ),

            pesoTotal:
                this.redondear(
                    pesoTotal,
                    4
                ),

            motoresUtilizados,

            detallePesos

        };

    }


    /*================================================================
        ANALIZAR TODOS LOS NÚMEROS
    ================================================================*/

    analizarTodos(
        configuracionAdicional = {}
    ) {

        this.verificarInicializacion();


        const resultados = [];


        for (
            let numero = 0;
            numero <= 99;
            numero++
        ) {

            resultados.push(

                this.analizarNumero(

                    numero,

                    configuracionAdicional

                )

            );

        }


        return resultados;

    }


    /*================================================================
        ORDENAR RESULTADOS
    ================================================================*/

    ordenarResultados(
        resultados = []
    ) {

        if (
            !Array.isArray(
                resultados
            )
        ) {

            return [];

        }


        return [

            ...resultados

        ].sort(

            (a, b) => {

                /*
                 * Primero score.
                 */

                const diferenciaScore =

                    Number(
                        b.score
                    ) -

                    Number(
                        a.score
                    );


                if (
                    diferenciaScore !== 0
                ) {

                    return diferenciaScore;

                }


                /*
                 * Segundo confianza.
                 */

                const diferenciaConfianza =

                    Number(
                        b.confianza
                    ) -

                    Number(
                        a.confianza
                    );


                if (
                    diferenciaConfianza !== 0
                ) {

                    return diferenciaConfianza;

                }


                /*
                 * Finalmente número.
                 */

                return (

                    Number(
                        a.numero
                    ) -

                    Number(
                        b.numero
                    )

                );

            }

        );

    }


    /*================================================================
        OBTENER RANKING PROVISIONAL
    ================================================================*/

    obtenerRanking(
        limite = 100,
        configuracionAdicional = {}
    ) {

        const resultados =
            this.analizarTodos(
                configuracionAdicional
            );


        const ordenados =
            this.ordenarResultados(
                resultados
            );


        const cantidad =
            Number.isInteger(
                Number(limite)
            )

                ? Math.max(
                    1,
                    Math.min(
                        Number(limite),
                        100
                    )
                )

                : 100;


        return ordenados.slice(
            0,
            cantidad
        );

    }


    /*================================================================
        OBTENER TOP
    ================================================================*/

    obtenerTop(
        cantidad = 20,
        configuracionAdicional = {}
    ) {

        return this.obtenerRanking(

            cantidad,

            configuracionAdicional

        );

    }


    /*================================================================
        INFORMACIÓN
    ================================================================*/

    obtenerInformacion() {

        return {

            inicializado:
                this.inicializado,

            historial:
                this.historial.length,

            estadisticas:
                this.estadisticas.length,

            cantidadMotores:
                this.motores.length,

            motores:
                this.motores.map(
                    item => ({

                        clave:
                            item.clave,

                        nombre:
                            item.instancia
                                ?.nombre || null,

                        version:
                            item.instancia
                                ?.version || null

                    })
                ),

            pesos:
                this.obtenerPesos()

        };

    }


    /*================================================================
        OBTENER RESULTADO DE UN MOTOR
    ================================================================*/

    obtenerResultadoMotor(
        analisis,
        motor
    ) {

        if (
            !analisis ||
            !analisis.resultados
        ) {

            return null;

        }


        return (
            analisis.resultados[
                motor
            ] ||
            null
        );

    }


    /*================================================================
        REINICIAR
    ================================================================*/

    reiniciar() {

        this.inicializado = false;

        this.historial = [];

        this.estadisticas = [];

        this.configuracion = {};


        /*
         * Reiniciar motores si disponen
         * del método reiniciar().
         */

        for (
            const item
            of this.motores
        ) {

            if (
                item.instancia &&
                typeof item.instancia.reiniciar ===
                    "function"
            ) {

                item.instancia.reiniciar();

            }

        }


        return this;

    }


    /*================================================================
        UTILIDADES
    ================================================================*/

    limitar(
        valor,
        minimo = 0,
        maximo = 100
    ) {

        const numero =
            Number(valor);


        if (
            !Number.isFinite(
                numero
            )
        ) {

            return minimo;

        }


        return Math.min(

            maximo,

            Math.max(
                minimo,
                numero
            )

        );

    }


    redondear(
        valor,
        decimales = 2
    ) {

        const numero =
            Number(valor);


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

}