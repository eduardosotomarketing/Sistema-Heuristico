/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * js/motores/MotorManager.js
 *
 * Versión:
 * 1.1.0
 *
 * Propósito:
 *
 * Coordinar la ejecución de todos los motores heurísticos del sistema.
 *
 * Responsabilidades:
 *
 *   - Inicializar motores.
 *   - Ejecutar todos los motores para un número.
 *   - Aplicar pesos configurados.
 *   - Considerar confianza de cada motor.
 *   - Calcular score global.
 *   - Analizar los números 00-99.
 *   - Generar resultados ordenables para MotorRanking.
 *   - Permitir actualización dinámica de pesos.
 *
 *
 * CAMBIOS v1.1.0
 *
 *   - Los pesos configurados tienen prioridad sobre MotorResult.peso.
 *   - MotorResult.peso queda como respaldo/fallback.
 *   - Se agrega establecerPesos().
 *   - Se agrega obtenerPesoMotor().
 *   - Se agrega restaurarPesosPredeterminados().
 *   - Se agrega obtenerPesosPredeterminados().
 *   - detallePesos informa:
 *
 *       pesoMotorResult
 *       pesoConfigurado
 *       peso
 *
 *   - Se mantiene compatibilidad con la arquitectura existente.
 *
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


    /*================================================================
        CONSTRUCTOR
    ================================================================*/

    constructor() {


        /*============================================================
            IDENTIDAD
        ============================================================*/

        this.nombre =
            "MotorManager";


        this.version =
            "1.1.0";


        /*============================================================
            ESTADO
        ============================================================*/

        this.inicializado =
            false;


        /*============================================================
            DATOS
        ============================================================*/

        this.historial =
            [];


        this.estadisticas =
            [];


        this.configuracion =
            {};


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
                clave:
                    "frecuencia",

                instancia:
                    this.motorFrecuencia
            },

            {
                clave:
                    "atraso",

                instancia:
                    this.motorAtraso
            },

            {
                clave:
                    "tendencia",

                instancia:
                    this.motorTendencia
            },

            {
                clave:
                    "repeticion",

                instancia:
                    this.motorRepeticion
            },

            {
                clave:
                    "historico",

                instancia:
                    this.motorHistorico
            },

            {
                clave:
                    "paridad",

                instancia:
                    this.motorParidad
            },

            {
                clave:
                    "rangos",

                instancia:
                    this.motorRangos
            },

            {
                clave:
                    "distribucion",

                instancia:
                    this.motorDistribucion
            },

            {
                clave:
                    "asociaciones",

                instancia:
                    this.motorAsociaciones
            },

            {
                clave:
                    "ciclos",

                instancia:
                    this.motorCiclos
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


        if (
            !Array.isArray(
                historial
            )
        ) {

            throw new Error(
                "MotorManager: historial debe ser un array."
            );

        }


        if (
            !Array.isArray(
                estadisticas
            )
        ) {

            throw new Error(
                "MotorManager: estadisticas debe ser un array."
            );

        }


        this.historial =
            historial;


        this.estadisticas =
            estadisticas;


        this.configuracion =
            configuracion &&
            typeof configuracion ===
                "object"

                ? {
                    ...configuracion
                }

                : {};


        /*
         * Normalizamos pesos configurados
         * si fueron proporcionados.
         */

        if (
            this.configuracion.pesos &&
            typeof this.configuracion.pesos ===
                "object"
        ) {

            this.configuracion.pesos =
                this.normalizarPesos(

                    this.configuracion.pesos,

                    false

                );

        }


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


        this.inicializado =
            true;


        return this;

    }


    /*================================================================
        VERIFICAR INICIALIZACIÓN
    ================================================================*/

    verificarInicializacion() {

        if (
            !this.inicializado
        ) {

            throw new Error(
                "MotorManager no está inicializado."
            );

        }

    }


    /*================================================================
        PESOS PREDETERMINADOS
    ================================================================*/

    obtenerPesosPredeterminados() {

        return {

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

    }


    /*================================================================
        NORMALIZAR PESOS
    ================================================================*/

    normalizarPesos(
        pesos = {},
        exigirTodos = false
    ) {

        if (
            !pesos ||
            typeof pesos !==
                "object"
        ) {

            throw new Error(
                "MotorManager: pesos debe ser un objeto."
            );

        }


        const predeterminados =
            this.obtenerPesosPredeterminados();


        const resultado =
            exigirTodos

                ? {}

                : {
                    ...predeterminados
                };


        for (
            const clave
            of Object.keys(
                predeterminados
            )
        ) {

            if (
                pesos[clave] ===
                undefined
            ) {

                if (
                    exigirTodos
                ) {

                    throw new Error(
                        `MotorManager: falta el peso del motor ${clave}.`
                    );

                }


                continue;

            }


            const valor =
                Number(
                    pesos[clave]
                );


            if (
                !Number.isFinite(
                    valor
                ) ||
                valor < 0
            ) {

                throw new Error(
                    `MotorManager: peso inválido para ${clave}: ${pesos[clave]}`
                );

            }


            resultado[clave] =
                valor;

        }


        return resultado;

    }


    /*================================================================
        OBTENER PESOS
    ================================================================*/

    obtenerPesos() {

        const predeterminados =
            this.obtenerPesosPredeterminados();


        const personalizados =

            this.configuracion &&
            this.configuracion.pesos &&
            typeof this.configuracion.pesos ===
                "object"

                ? this.configuracion.pesos

                : {};


        const resultado = {

            ...predeterminados

        };


        for (
            const clave
            of Object.keys(
                predeterminados
            )
        ) {

            const valor =
                Number(
                    personalizados[
                        clave
                    ]
                );


            if (
                Number.isFinite(
                    valor
                ) &&
                valor >= 0
            ) {

                resultado[
                    clave
                ] = valor;

            }

        }


        return resultado;

    }


    /*================================================================
        ESTABLECER PESOS
    ================================================================*/

    establecerPesos(
        pesos = {}
    ) {

        if (
            !pesos ||
            typeof pesos !==
                "object"
        ) {

            throw new Error(
                "MotorManager: pesos debe ser un objeto."
            );

        }


        const actuales =
            this.obtenerPesos();


        const nuevos = {

            ...actuales

        };


        for (
            const clave
            of Object.keys(
                actuales
            )
        ) {

            if (
                pesos[clave] ===
                undefined
            ) {

                continue;

            }


            const valor =
                Number(
                    pesos[clave]
                );


            if (
                !Number.isFinite(
                    valor
                ) ||
                valor < 0
            ) {

                throw new Error(
                    `MotorManager: peso inválido para ${clave}: ${pesos[clave]}`
                );

            }


            nuevos[
                clave
            ] = valor;

        }


        /*
         * Actualizamos configuración principal.
         */

        this.configuracion = {

            ...this.configuracion,

            pesos: {

                ...nuevos

            }

        };


        /*
         * No es obligatorio reinicializar los motores.
         *
         * Cada llamada a calcular() recibe un nuevo contexto
         * generado por crearContexto(), que contiene los pesos
         * actualizados.
         *
         * No obstante, si alguna implementación mantiene
         * configuracion internamente, la sincronizamos cuando
         * es posible.
         */

        for (
            const item
            of this.motores
        ) {

            const motor =
                item.instancia;


            if (
                !motor
            ) {

                continue;

            }


            if (
                motor.configuracion &&
                typeof motor.configuracion ===
                    "object"
            ) {

                motor.configuracion = {

                    ...motor.configuracion,

                    pesos: {

                        ...nuevos

                    }

                };

            }


            if (
                motor.contexto &&
                typeof motor.contexto ===
                    "object"
            ) {

                motor.contexto = {

                    ...motor.contexto,

                    configuracion:
                        this.configuracion,

                    pesos: {

                        ...nuevos

                    }

                };

            }

        }


        return {

            ...nuevos

        };

    }


    /*================================================================
        OBTENER PESO DE MOTOR
    ================================================================*/

    obtenerPesoMotor(
        clave
    ) {

        if (
            !clave
        ) {

            return null;

        }


        const pesos =
            this.obtenerPesos();


        if (
            !Object.prototype
                .hasOwnProperty
                .call(
                    pesos,
                    clave
                )
        ) {

            return null;

        }


        const valor =
            Number(
                pesos[
                    clave
                ]
            );


        return Number.isFinite(
            valor
        )

            ? valor

            : null;

    }


    /*================================================================
        RESTAURAR PESOS PREDETERMINADOS
    ================================================================*/

    restaurarPesosPredeterminados() {

        const predeterminados =
            this.obtenerPesosPredeterminados();


        return this.establecerPesos(
            predeterminados
        );

    }


    /*================================================================
        SUMA DE PESOS
    ================================================================*/

    sumarPesos(
        pesos = null
    ) {

        const objetivo =
            pesos &&
            typeof pesos ===
                "object"

                ? pesos

                : this.obtenerPesos();


        return this.redondear(

            Object.values(
                objetivo
            ).reduce(

                (
                    suma,
                    valor
                ) =>

                    suma +
                    (
                        Number(
                            valor
                        ) || 0
                    ),

                0

            ),

            6

        );

    }


    /*================================================================
        CREAR CONTEXTO
    ================================================================*/

    crearContexto(
        configuracionAdicional = {}
    ) {

        this.verificarInicializacion();


        /*
         * Pesos operativos actuales.
         */

        const pesos =
            this.obtenerPesos();


        /*
         * Permitimos configuración adicional,
         * pero los pesos operativos permanecen
         * controlados por MotorManager.
         */

        const configuracion = {

            ...this.configuracion,

            ...(
                configuracionAdicional
                    .configuracion ||
                {}
            ),

            pesos: {

                ...pesos

            }

        };


        return {

            historial:
                this.historial,

            semanas:
                this.historial,

            estadisticas:
                this.estadisticas,

            configuracion,

            pesos: {

                ...pesos

            },

            ...configuracionAdicional,

            /*
             * Reafirmamos pesos y configuración
             * después del spread para evitar que
             * una configuración adicional los
             * reemplace accidentalmente.
             */

            configuracion,

            pesos: {

                ...pesos

            }

        };

    }


    /*================================================================
        VALIDAR NÚMERO
    ================================================================*/

    validarNumero(
        numero
    ) {

        const valor =
            Number(
                numero
            );


        if (
            !Number.isInteger(
                valor
            ) ||
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


        const resultados =
            {};


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


            pesosConfigurados:

                this.obtenerPesos(),


            sumaPesosConfigurados:

                this.sumarPesos(),


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

        let sumaPonderada =
            0;


        let pesoTotal =
            0;


        let sumaConfianza =
            0;


        let pesoConfianza =
            0;


        let motoresUtilizados =
            0;


        const detallePesos =
            [];


        /*
         * Recuperamos una sola vez los pesos operativos
         * para todo el cálculo.
         */

        const pesosConfigurados =
            this.obtenerPesos();


        for (
            const item
            of this.motores
        ) {

            const resultado =
                resultados[
                    item.clave
                ];


            if (
                !resultado
            ) {

                continue;

            }


            /*--------------------------------------------------------
                SCORE MOTOR
            --------------------------------------------------------*/

            const score =
                this.limitar(

                    Number(
                        resultado.score
                    ) || 0,

                    0,

                    100

                );


            /*--------------------------------------------------------
                CONFIANZA MOTOR
            --------------------------------------------------------*/

            const confianza =
                this.limitar(

                    Number(
                        resultado.confianza
                    ) || 0,

                    0,

                    100

                );


            /*--------------------------------------------------------
                PESO MOTOR RESULT
            --------------------------------------------------------*/

            const pesoMotorResultOriginal =
                Number(
                    resultado.peso
                );


            const pesoMotorResult =

                Number.isFinite(
                    pesoMotorResultOriginal
                ) &&
                pesoMotorResultOriginal >=
                    0

                    ? pesoMotorResultOriginal

                    : null;


            /*--------------------------------------------------------
                PESO CONFIGURADO
            --------------------------------------------------------*/

            const pesoConfiguradoOriginal =
                Number(
                    pesosConfigurados[
                        item.clave
                    ]
                );


            const pesoConfigurado =

                Number.isFinite(
                    pesoConfiguradoOriginal
                ) &&
                pesoConfiguradoOriginal >=
                    0

                    ? pesoConfiguradoOriginal

                    : null;


            /*--------------------------------------------------------
                PESO OPERATIVO
            --------------------------------------------------------*/

            /*
             * PRIORIDAD v1.1.0
             *
             * 1. Peso configurado activamente.
             * 2. Peso declarado por MotorResult.
             * 3. Cero.
             *
             * Esto permite que ConfiguracionPesosService
             * controle realmente el score de MotorManager.
             */

            let peso =
                pesoConfigurado;


            if (
                !Number.isFinite(
                    peso
                ) ||
                peso < 0
            ) {

                peso =
                    pesoMotorResult;

            }


            if (
                !Number.isFinite(
                    peso
                ) ||
                peso < 0
            ) {

                peso =
                    0;

            }


            /*--------------------------------------------------------
                FACTOR DE CONFIANZA
            --------------------------------------------------------*/

            /*
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


            /*--------------------------------------------------------
                PESO EFECTIVO
            --------------------------------------------------------*/

            const pesoEfectivo =

                peso *

                factorConfianza;


            /*--------------------------------------------------------
                APORTE
            --------------------------------------------------------*/

            const aporte =

                score *

                pesoEfectivo;


            sumaPonderada +=
                aporte;


            pesoTotal +=
                pesoEfectivo;


            /*
             * La confianza global se pondera con el
             * peso operativo sin factor de confianza.
             */

            sumaConfianza +=

                confianza *

                peso;


            pesoConfianza +=
                peso;


            motoresUtilizados++;


            /*--------------------------------------------------------
                DETALLE DE AUDITORÍA
            --------------------------------------------------------*/

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


                /*
                 * Peso reportado originalmente
                 * por el motor individual.
                 */

                pesoMotorResult:

                    pesoMotorResult !==
                    null

                        ? this.redondear(
                            pesoMotorResult,
                            6
                        )

                        : null,


                /*
                 * Peso procedente de la configuración
                 * activa del manager.
                 */

                pesoConfigurado:

                    pesoConfigurado !==
                    null

                        ? this.redondear(
                            pesoConfigurado,
                            6
                        )

                        : null,


                /*
                 * Peso realmente utilizado.
                 */

                peso:

                    this.redondear(
                        peso,
                        6
                    ),


                fuentePeso:

                    pesoConfigurado !==
                    null

                        ? "CONFIGURACION"

                        : (
                            pesoMotorResult !==
                            null

                                ? "MOTOR_RESULT"

                                : "CERO"
                        ),


                factorConfianza:

                    this.redondear(
                        factorConfianza,
                        6
                    ),


                pesoEfectivo:

                    this.redondear(
                        pesoEfectivo,
                        6
                    ),


                aporte:

                    this.redondear(
                        aporte,
                        6
                    )

            });

        }


        /*------------------------------------------------------------
            SCORE GLOBAL
        ------------------------------------------------------------*/

        const scoreBruto =

            pesoTotal > 0

                ? sumaPonderada /
                    pesoTotal

                : 0;


        /*------------------------------------------------------------
            CONFIANZA GLOBAL
        ------------------------------------------------------------*/

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
                    6
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


        const resultados =
            [];


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

            (
                a,
                b
            ) => {

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
                    diferenciaScore !==
                    0
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
                    diferenciaConfianza !==
                    0
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
                Number(
                    limite
                )
            )

                ? Math.max(

                    1,

                    Math.min(
                        Number(
                            limite
                        ),
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

        const pesos =
            this.obtenerPesos();


        return {

            nombre:
                this.nombre,


            version:
                this.version,


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
                                ?.nombre ||
                            null,

                        version:

                            item.instancia
                                ?.version ||
                            null

                    })

                ),


            pesos: {

                ...pesos

            },


            sumaPesos:

                this.sumarPesos(
                    pesos
                ),


            pesosPredeterminados:

                this.obtenerPesosPredeterminados()

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

        this.inicializado =
            false;


        this.historial =
            [];


        this.estadisticas =
            [];


        this.configuracion =
            {};


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

                item.instancia
                    .reiniciar();

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
            Number(
                valor
            );


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


    /*================================================================
        REDONDEAR
    ================================================================*/

    redondear(
        valor,
        decimales = 2
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

}