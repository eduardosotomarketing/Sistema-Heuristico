/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * js/motores/MotorEvolucion.js
 *
 * Versión:
 * 2.1.0
 *
 * Propósito:
 *
 * Analizar la evolución histórica del modelo utilizando las
 * evaluaciones generadas por MotorEvaluacion.
 *
 * Responsabilidades:
 *
 *   - Analizar múltiples evaluaciones históricas.
 *   - Calcular rendimiento general.
 *   - Construir y comparar períodos.
 *   - Detectar tendencias globales.
 *   - Analizar evolución individual de cada motor.
 *   - Analizar ventajaScore.
 *   - Analizar ventajaConfianza.
 *   - Analizar indiceDiscriminacion.
 *   - Comparar período reciente contra período anterior.
 *   - Detectar motores consistentes.
 *   - Detectar motores en mejora.
 *   - Detectar motores en deterioro.
 *   - Detectar cambios específicos por motor.
 *   - Detectar cambios bruscos.
 *   - Generar ranking evolutivo de motores.
 *   - Generar señales para un futuro optimizador.
 *   - Generar información estructurada para IA.
 *
 * IMPORTANTE:
 *
 * MotorEvolucion NO modifica automáticamente los pesos.
 *
 * Su función es observar, medir y generar evidencia.
 *
 * Los cambios de peso serán responsabilidad de un componente
 * posterior de optimización.
 *
 **********************************************************************/


export default class MotorEvolucion {


    /*================================================================
        CONSTRUCTOR
    ================================================================*/

    constructor(configuracion = {}) {

        this.nombre =
            "MotorEvolucion";


        this.version =
            "2.1.0";


        this.configuracion = {

            /*
             * Evaluaciones mínimas antes de permitir
             * señales utilizables por un optimizador.
             */

            minimoEvaluaciones:

                Number(
                    configuracion.minimoEvaluaciones
                ) || 20,


            /*
             * Ventana máxima considerada reciente.
             */

            periodoReciente:

                Number(
                    configuracion.periodoReciente
                ) || 10,


            /*
             * Cantidad máxima de períodos globales.
             */

            cantidadPeriodos:

                Number(
                    configuracion.cantidadPeriodos
                ) || 5,


            /*
             * Umbral de cambio global.
             */

            umbralCambio:

                Number(
                    configuracion.umbralCambio
                ) || 5,


            /*
             * Umbral de cambio fuerte.
             */

            umbralCambioFuerte:

                Number(
                    configuracion.umbralCambioFuerte
                ) || 15,


            /*
             * Diferencia mínima reciente/anterior
             * considerada significativa para un motor.
             */

            umbralDiscriminacion:

                Number.isFinite(
                    Number(
                        configuracion.umbralDiscriminacion
                    )
                )

                    ? Number(
                        configuracion.umbralDiscriminacion
                    )

                    : 2,


            /*
             * Índice histórico positivo mínimo.
             */

            minimoIndicePositivo:

                Number.isFinite(
                    Number(
                        configuracion.minimoIndicePositivo
                    )
                )

                    ? Number(
                        configuracion.minimoIndicePositivo
                    )

                    : 1,


            /*
             * Cantidad mínima de evaluaciones antes
             * de considerar una tendencia individual
             * como evidencia temporal.
             */

            minimoEvaluacionesTendencia:

                Number(
                    configuracion.minimoEvaluacionesTendencia
                ) || 3,


            /*
             * Pendiente mínima para considerar
             * que existe una tendencia temporal.
             */

            pendienteMinimaMotor:

                Number.isFinite(
                    Number(
                        configuracion.pendienteMinimaMotor
                    )
                )

                    ? Number(
                        configuracion.pendienteMinimaMotor
                    )

                    : 0.05

        };

    }


    /*================================================================
        MÉTODO PRINCIPAL
    ================================================================*/

    analizar(
        evaluaciones,
        opciones = {}
    ) {

        const lista =
            this.normalizarEvaluaciones(
                evaluaciones
            );


        if (
            lista.length === 0
        ) {

            return this.resultadoVacio();

        }


        const ordenadas =
            this.ordenarEvaluaciones(
                lista
            );


        const rendimientoGeneral =
            this.analizarRendimientoGeneral(
                ordenadas
            );


        const periodos =
            this.construirPeriodos(
                ordenadas,
                opciones
            );


        const comparacionPeriodos =
            this.compararPeriodos(
                periodos
            );


        const tendencias =
            this.analizarTendencias(
                ordenadas
            );


        const evolucionMotores =
            this.analizarEvolucionMotores(
                ordenadas
            );


        const cambios =
            this.detectarCambios(

                ordenadas,

                evolucionMotores,

                tendencias

            );


        const datosSuficientes =
            this.hayDatosSuficientes(
                ordenadas.length
            );


        const señalesOptimizacion =
            this.generarSeñalesOptimizacion(

                tendencias,

                evolucionMotores,

                cambios,

                comparacionPeriodos,

                datosSuficientes

            );


        const resumenIA =
            this.generarResumenIA(

                ordenadas,

                rendimientoGeneral,

                periodos,

                comparacionPeriodos,

                tendencias,

                evolucionMotores,

                cambios,

                señalesOptimizacion,

                datosSuficientes

            );


        return {

            id:
                this.generarIdAnalisis(),

            nombre:
                this.nombre,

            version:
                this.version,

            generadoEn:
                new Date()
                    .toISOString(),

            cantidadEvaluaciones:
                ordenadas.length,

            datosSuficientes,

            minimoEvaluaciones:
                this.configuracion
                    .minimoEvaluaciones,

            rendimientoGeneral,

            periodos,

            comparacionPeriodos,

            tendencias,

            motores:
                evolucionMotores
                    .porMotor,

            rankingMotores:
                evolucionMotores
                    .rankingMotores,

            mejorMotorHistorico:
                evolucionMotores
                    .mejorMotorHistorico,

            mejorMotorReciente:
                evolucionMotores
                    .mejorMotorReciente,

            motoresConsistentes:
                evolucionMotores
                    .motoresConsistentes,

            motoresEnMejora:
                evolucionMotores
                    .motoresEnMejora,

            motoresEnDeterioro:
                evolucionMotores
                    .motoresEnDeterioro,

            cambios,

            señalesOptimizacion,

            resumenIA

        };

    }


    /*================================================================
        NORMALIZAR EVALUACIONES
    ================================================================*/

    normalizarEvaluaciones(
        evaluaciones
    ) {

        if (
            !Array.isArray(
                evaluaciones
            )
        ) {

            return [];

        }


        return evaluaciones

            .filter(

                evaluacion =>

                    evaluacion !== null &&

                    typeof evaluacion ===
                        "object"

            )

            .map(

                evaluacion => ({

                    ...evaluacion,

                    fechaEvaluacion:

                        evaluacion.fechaEvaluacion ||

                        evaluacion.fecha ||

                        null

                })

            );

    }


    /*================================================================
        ORDENAR EVALUACIONES
    ================================================================*/

    ordenarEvaluaciones(
        evaluaciones
    ) {

        return [

            ...evaluaciones

        ].sort(

            (a, b) => {

                const fechaA =
                    this.obtenerFecha(
                        a
                    );


                const fechaB =
                    this.obtenerFecha(
                        b
                    );


                return (
                    fechaA -
                    fechaB
                );

            }

        );

    }


    /*================================================================
        RENDIMIENTO GENERAL
    ================================================================*/

    analizarRendimientoGeneral(
        evaluaciones
    ) {

        const cantidad =
            evaluaciones.length;


        if (
            cantidad === 0
        ) {

            return {

                cantidadEvaluaciones: 0,

                promedioAciertosTop10: 0,

                promedioAciertosTop20: 0,

                promedioAciertosTitulares: 0,

                promedioAciertosSuplentes: 0,

                promedioCoberturaRanking: 0,

                promedioScoreAciertos: 0,

                promedioConfianzaAciertos: 0,

                mejorSemana: null,

                peorSemana: null

            };

        }


        let sumaTop10 = 0;

        let sumaTop20 = 0;

        let sumaTitulares = 0;

        let sumaSuplentes = 0;

        let sumaCobertura = 0;

        let sumaScore = 0;

        let sumaConfianza = 0;


        let mejorSemana = null;

        let peorSemana = null;


        for (
            const evaluacion
            of evaluaciones
        ) {

            const metricas =
                evaluacion.metricas ||
                {};


            const comportamiento =
                evaluacion.comportamientoRanking ||
                {};


            const top10 =
                this.numeroSeguro(
                    metricas.aciertosTop10
                );


            const top20 =
                this.numeroSeguro(
                    metricas.aciertosTop20
                );


            const titulares =
                this.numeroSeguro(
                    metricas.aciertosTitulares
                );


            const suplentes =
                this.numeroSeguro(
                    metricas.aciertosSuplentes
                );


            const cobertura =
                this.numeroSeguro(
                    comportamiento.cobertura
                );


            const score =
                this.numeroSeguro(
                    metricas.promedioScoreAciertos
                );


            const confianza =
                this.numeroSeguro(
                    metricas.promedioConfianzaAciertos
                );


            sumaTop10 +=
                top10;


            sumaTop20 +=
                top20;


            sumaTitulares +=
                titulares;


            sumaSuplentes +=
                suplentes;


            sumaCobertura +=
                cobertura;


            sumaScore +=
                score;


            sumaConfianza +=
                confianza;


            if (
                !mejorSemana ||
                top10 >
                mejorSemana.aciertosTop10
            ) {

                mejorSemana = {

                    id:
                        evaluacion.id ||
                        null,

                    semana:
                        evaluacion.semana
                            ?.numero ??
                        null,

                    aciertosTop10:
                        top10,

                    fecha:
                        evaluacion.fechaEvaluacion ||
                        null

                };

            }


            if (
                !peorSemana ||
                top10 <
                peorSemana.aciertosTop10
            ) {

                peorSemana = {

                    id:
                        evaluacion.id ||
                        null,

                    semana:
                        evaluacion.semana
                            ?.numero ??
                        null,

                    aciertosTop10:
                        top10,

                    fecha:
                        evaluacion.fechaEvaluacion ||
                        null

                };

            }

        }


        return {

            cantidadEvaluaciones:
                cantidad,


            promedioAciertosTop10:

                this.redondear(

                    sumaTop10 /
                    cantidad,

                    6

                ),


            promedioAciertosTop20:

                this.redondear(

                    sumaTop20 /
                    cantidad,

                    6

                ),


            promedioAciertosTitulares:

                this.redondear(

                    sumaTitulares /
                    cantidad,

                    6

                ),


            promedioAciertosSuplentes:

                this.redondear(

                    sumaSuplentes /
                    cantidad,

                    6

                ),


            promedioCoberturaRanking:

                this.redondear(

                    sumaCobertura /
                    cantidad,

                    6

                ),


            promedioScoreAciertos:

                this.redondear(

                    sumaScore /
                    cantidad,

                    6

                ),


            promedioConfianzaAciertos:

                this.redondear(

                    sumaConfianza /
                    cantidad,

                    6

                ),


            mejorSemana,

            peorSemana

        };

    }


    /*================================================================
        CONSTRUIR PERÍODOS
    ================================================================*/

    construirPeriodos(
        evaluaciones,
        opciones = {}
    ) {

        const tamaño =

            Math.max(

                1,

                Number(

                    opciones.tamañoPeriodo ??

                    this.configuracion
                        .periodoReciente

                ) || 1

            );


        const cantidadPeriodos =

            Math.max(

                1,

                Number(

                    opciones.cantidadPeriodos ??

                    this.configuracion
                        .cantidadPeriodos

                ) || 1

            );


        const periodos = [];


        let fin =
            evaluaciones.length;


        for (

            let i = 0;

            i < cantidadPeriodos &&
            fin > 0;

            i++

        ) {

            const inicio =

                Math.max(

                    0,

                    fin -
                    tamaño

                );


            const grupo =

                evaluaciones.slice(

                    inicio,

                    fin

                );


            periodos.unshift({

                numero:
                    i + 1,

                indiceInicio:
                    inicio,

                indiceFin:
                    fin - 1,

                cantidad:
                    grupo.length,

                evaluaciones:
                    grupo

            });


            fin =
                inicio;

        }


        periodos.forEach(

            (
                periodo,
                indice
            ) => {

                periodo.numero =
                    indice + 1;


                periodo.nombre =

                    indice ===
                    periodos.length - 1

                        ? "Periodo actual"

                        : `Periodo ${indice + 1}`;


                periodo.resumen =
                    this.resumenPeriodo(
                        periodo
                    );

            }

        );


        return periodos;

    }


    /*================================================================
        COMPARAR PERÍODOS
    ================================================================*/

    compararPeriodos(
        periodos
    ) {

        if (
            !Array.isArray(
                periodos
            ) ||
            periodos.length < 2
        ) {

            return {

                disponible: false,

                motivo:
                    "No hay suficientes períodos para realizar una comparación.",

                variaciones: null,

                direccion:
                    "sin_datos"

            };

        }


        const anterior =
            this.resumenPeriodo(

                periodos[
                    periodos.length - 2
                ]

            );


        const actual =
            this.resumenPeriodo(

                periodos[
                    periodos.length - 1
                ]

            );


        const variaciones = {

            top10:

                this.redondear(

                    actual.promedioAciertosTop10 -

                    anterior.promedioAciertosTop10,

                    6

                ),


            top20:

                this.redondear(

                    actual.promedioAciertosTop20 -

                    anterior.promedioAciertosTop20,

                    6

                ),


            titulares:

                this.redondear(

                    actual.promedioAciertosTitulares -

                    anterior.promedioAciertosTitulares,

                    6

                ),


            suplentes:

                this.redondear(

                    actual.promedioAciertosSuplentes -

                    anterior.promedioAciertosSuplentes,

                    6

                ),


            cobertura:

                this.redondear(

                    actual.promedioCobertura -

                    anterior.promedioCobertura,

                    6

                ),


            scoreAciertos:

                this.redondear(

                    actual.promedioScoreAciertos -

                    anterior.promedioScoreAciertos,

                    6

                ),


            confianzaAciertos:

                this.redondear(

                    actual.promedioConfianzaAciertos -

                    anterior.promedioConfianzaAciertos,

                    6

                )

        };


        return {

            disponible:
                true,

            periodoAnterior:
                anterior,

            periodoActual:
                actual,

            variaciones,

            direccion:
                this.determinarDireccion(
                    actual,
                    anterior
                )

        };

    }


    /*================================================================
        RESUMEN PERÍODO
    ================================================================*/

    resumenPeriodo(
        periodo
    ) {

        const evaluaciones =
            periodo?.evaluaciones ||
            [];


        if (
            evaluaciones.length === 0
        ) {

            return {

                cantidad: 0,

                promedioAciertosTop10: 0,

                promedioAciertosTop20: 0,

                promedioAciertosTitulares: 0,

                promedioAciertosSuplentes: 0,

                promedioCobertura: 0,

                promedioScoreAciertos: 0,

                promedioConfianzaAciertos: 0

            };

        }


        let top10 = 0;

        let top20 = 0;

        let titulares = 0;

        let suplentes = 0;

        let cobertura = 0;

        let scoreAciertos = 0;

        let confianzaAciertos = 0;


        for (
            const evaluacion
            of evaluaciones
        ) {

            const metricas =
                evaluacion.metricas ||
                {};


            const comportamiento =
                evaluacion.comportamientoRanking ||
                {};


            top10 +=
                this.numeroSeguro(
                    metricas.aciertosTop10
                );


            top20 +=
                this.numeroSeguro(
                    metricas.aciertosTop20
                );


            titulares +=
                this.numeroSeguro(
                    metricas.aciertosTitulares
                );


            suplentes +=
                this.numeroSeguro(
                    metricas.aciertosSuplentes
                );


            cobertura +=
                this.numeroSeguro(
                    comportamiento.cobertura
                );


            scoreAciertos +=
                this.numeroSeguro(
                    metricas.promedioScoreAciertos
                );


            confianzaAciertos +=
                this.numeroSeguro(
                    metricas.promedioConfianzaAciertos
                );

        }


        const cantidad =
            evaluaciones.length;


        return {

            cantidad,


            promedioAciertosTop10:

                this.redondear(
                    top10 /
                    cantidad,
                    6
                ),


            promedioAciertosTop20:

                this.redondear(
                    top20 /
                    cantidad,
                    6
                ),


            promedioAciertosTitulares:

                this.redondear(
                    titulares /
                    cantidad,
                    6
                ),


            promedioAciertosSuplentes:

                this.redondear(
                    suplentes /
                    cantidad,
                    6
                ),


            promedioCobertura:

                this.redondear(
                    cobertura /
                    cantidad,
                    6
                ),


            promedioScoreAciertos:

                this.redondear(
                    scoreAciertos /
                    cantidad,
                    6
                ),


            promedioConfianzaAciertos:

                this.redondear(
                    confianzaAciertos /
                    cantidad,
                    6
                )

        };

    }


    /*================================================================
        DETERMINAR DIRECCIÓN GENERAL
    ================================================================*/

    determinarDireccion(
        actual,
        anterior
    ) {

        const variacion =

            this.numeroSeguro(
                actual.promedioAciertosTop10
            ) -

            this.numeroSeguro(
                anterior.promedioAciertosTop10
            );


        const umbral =

            Math.max(

                0.5,

                this.configuracion
                    .umbralCambio /
                10

            );


        if (
            variacion >=
            umbral
        ) {

            return "mejora";

        }


        if (
            variacion <=
            -umbral
        ) {

            return "deterioro";

        }


        return "estable";

    }


    /*================================================================
        ANALIZAR TENDENCIAS GLOBALES
    ================================================================*/

    analizarTendencias(
        evaluaciones
    ) {

        const series =
            this.crearSeries(
                evaluaciones
            );


        return {

            top10:
                this.analizarSerie(
                    series.top10
                ),

            top20:
                this.analizarSerie(
                    series.top20
                ),

            titulares:
                this.analizarSerie(
                    series.titulares
                ),

            suplentes:
                this.analizarSerie(
                    series.suplentes
                ),

            cobertura:
                this.analizarSerie(
                    series.cobertura
                ),

            scoreAciertos:
                this.analizarSerie(
                    series.scoreAciertos
                ),

            confianzaAciertos:
                this.analizarSerie(
                    series.confianzaAciertos
                )

        };

    }


    /*================================================================
        CREAR SERIES GENERALES
    ================================================================*/

    crearSeries(
        evaluaciones
    ) {

        const top10 = [];

        const top20 = [];

        const titulares = [];

        const suplentes = [];

        const cobertura = [];

        const scoreAciertos = [];

        const confianzaAciertos = [];


        evaluaciones.forEach(

            (
                evaluacion,
                indice
            ) => {

                const metricas =
                    evaluacion.metricas ||
                    {};


                const comportamiento =
                    evaluacion.comportamientoRanking ||
                    {};


                const x =
                    indice + 1;


                top10.push({

                    x,

                    y:
                        this.numeroSeguro(
                            metricas.aciertosTop10
                        )

                });


                top20.push({

                    x,

                    y:
                        this.numeroSeguro(
                            metricas.aciertosTop20
                        )

                });


                titulares.push({

                    x,

                    y:
                        this.numeroSeguro(
                            metricas.aciertosTitulares
                        )

                });


                suplentes.push({

                    x,

                    y:
                        this.numeroSeguro(
                            metricas.aciertosSuplentes
                        )

                });


                cobertura.push({

                    x,

                    y:
                        this.numeroSeguro(
                            comportamiento.cobertura
                        )

                });


                scoreAciertos.push({

                    x,

                    y:
                        this.numeroSeguro(
                            metricas.promedioScoreAciertos
                        )

                });


                confianzaAciertos.push({

                    x,

                    y:
                        this.numeroSeguro(
                            metricas.promedioConfianzaAciertos
                        )

                });

            }

        );


        return {

            top10,

            top20,

            titulares,

            suplentes,

            cobertura,

            scoreAciertos,

            confianzaAciertos

        };

    }


    /*================================================================
        ANALIZAR SERIE
    ================================================================*/

    analizarSerie(
        serie
    ) {

        if (
            !Array.isArray(
                serie
            ) ||
            serie.length === 0
        ) {

            return {

                cantidad: 0,

                promedio: 0,

                minimo: 0,

                maximo: 0,

                pendiente: 0,

                tendencia:
                    "sin_datos"

            };

        }


        const valores =
            serie.map(

                punto =>
                    this.numeroSeguro(
                        punto.y
                    )

            );


        const promedio =
            this.calcularPromedio(
                valores
            );


        const minimo =
            Math.min(
                ...valores
            );


        const maximo =
            Math.max(
                ...valores
            );


        const pendiente =
            this.calcularPendiente(
                serie
            );


        let tendencia =
            "estable";


        if (
            pendiente >
            this.configuracion
                .pendienteMinimaMotor
        ) {

            tendencia =
                "ascendente";

        }

        else if (
            pendiente <
            -this.configuracion
                .pendienteMinimaMotor
        ) {

            tendencia =
                "descendente";

        }


        return {

            cantidad:
                serie.length,

            promedio:
                this.redondear(
                    promedio,
                    6
                ),

            minimo,

            maximo,

            pendiente:
                this.redondear(
                    pendiente,
                    6
                ),

            tendencia

        };

    }


    /*================================================================
        CALCULAR PENDIENTE
    ================================================================*/

    calcularPendiente(
        serie
    ) {

        const n =
            Array.isArray(
                serie
            )

                ? serie.length

                : 0;


        if (
            n < 2
        ) {

            return 0;

        }


        let sumaX = 0;

        let sumaY = 0;

        let sumaXY = 0;

        let sumaX2 = 0;


        for (
            const punto
            of serie
        ) {

            const x =
                this.numeroSeguro(
                    punto.x
                );


            const y =
                this.numeroSeguro(
                    punto.y
                );


            sumaX +=
                x;


            sumaY +=
                y;


            sumaXY +=
                x * y;


            sumaX2 +=
                x * x;

        }


        const denominador =

            (
                n *
                sumaX2
            ) -

            (
                sumaX *
                sumaX
            );


        if (
            denominador === 0
        ) {

            return 0;

        }


        return (

            (
                n *
                sumaXY
            ) -

            (
                sumaX *
                sumaY
            )

        ) /
        denominador;

    }


    /*================================================================
        OBTENER VENTANAS DE COMPARACIÓN
    ================================================================*/

    obtenerVentanasComparacion(
        historial
    ) {

        const total =

            Array.isArray(
                historial
            )

                ? historial.length

                : 0;


        /*
         * Una sola evaluación:
         *
         * todavía no existe comparación temporal.
         */

        if (
            total <= 1
        ) {

            return {

                tamañoVentana:
                    total,

                reciente:

                    [
                        ...historial
                    ],

                anterior:
                    [],

                disponible:
                    false

            };

        }


        /*
         * Determinamos dinámicamente el tamaño.
         *
         * Ejemplos:
         *
         * 5 evaluaciones:
         *
         * tamaño = 2
         *
         * anterior:
         * evaluaciones 2 y 3
         *
         * reciente:
         * evaluaciones 4 y 5
         *
         *
         * 20 evaluaciones:
         *
         * tamaño = 10
         *
         * anterior:
         * 1-10
         *
         * reciente:
         * 11-20
         */

        const mitadDisponible =

            Math.floor(
                total /
                2
            );


        const tamañoVentana =

            Math.max(

                1,

                Math.min(

                    this.configuracion
                        .periodoReciente,

                    mitadDisponible

                )

            );


        const inicioReciente =

            total -
            tamañoVentana;


        const finAnterior =

            inicioReciente;


        const inicioAnterior =

            Math.max(

                0,

                finAnterior -
                tamañoVentana

            );


        const reciente =

            historial.slice(

                inicioReciente

            );


        const anterior =

            historial.slice(

                inicioAnterior,

                finAnterior

            );


        return {

            tamañoVentana,

            reciente,

            anterior,

            disponible:

                reciente.length > 0 &&

                anterior.length > 0

        };

    }


    /*================================================================
        EVOLUCIÓN DE MOTORES
    ================================================================*/

    analizarEvolucionMotores(
        evaluaciones
    ) {

        const datosMotores = {};


        /*------------------------------------------------------------
            CONSTRUIR HISTORIAL
        ------------------------------------------------------------*/

        for (
            const evaluacion
            of evaluaciones
        ) {

            const rendimiento =
                evaluacion.rendimientoMotores ||
                {};


            const motores =
                rendimiento.motores ||
                {};


            for (
                const clave
                in motores
            ) {

                const motor =
                    motores[clave];


                if (
                    !datosMotores[clave]
                ) {

                    datosMotores[clave] = {

                        motor:
                            clave,

                        historial:
                            []

                    };

                }


                datosMotores[
                    clave
                ].historial.push({

                    fecha:
                        evaluacion.fechaEvaluacion ||
                        null,

                    semana:
                        evaluacion.semana
                            ?.numero ??
                        null,

                    aciertos:

                        this.numeroSeguro(
                            motor.aciertos
                        ),

                    apariciones:

                        this.numeroSeguro(
                            motor.apariciones
                        ),

                    tasaAcierto:

                        this.numeroSeguro(
                            motor.tasaAcierto
                        ),

                    promedioScore:

                        this.numeroSeguro(
                            motor.promedioScore
                        ),

                    promedioScoreAciertos:

                        this.numeroSeguro(
                            motor.promedioScoreAciertos
                        ),

                    promedioConfianza:

                        this.numeroSeguro(
                            motor.promedioConfianza
                        ),

                    promedioConfianzaAciertos:

                        this.numeroSeguro(
                            motor.promedioConfianzaAciertos
                        ),

                    ventajaScore:

                        this.numeroSeguro(
                            motor.ventajaScore
                        ),

                    ventajaConfianza:

                        this.numeroSeguro(
                            motor.ventajaConfianza
                        ),

                    indiceDiscriminacion:

                        this.numeroSeguro(
                            motor.indiceDiscriminacion
                        )

                });

            }

        }


        const porMotor = {};


        /*------------------------------------------------------------
            ANALIZAR CADA MOTOR
        ------------------------------------------------------------*/

        for (
            const clave
            in datosMotores
        ) {

            const historial =
                datosMotores[
                    clave
                ].historial;


            /*--------------------------------------------------------
                SERIES
            --------------------------------------------------------*/

            const serieTasa =
                this.crearSerieDesdeHistorial(

                    historial,

                    "tasaAcierto"

                );


            const serieAciertos =
                this.crearSerieDesdeHistorial(

                    historial,

                    "aciertos"

                );


            const serieVentajaScore =
                this.crearSerieDesdeHistorial(

                    historial,

                    "ventajaScore"

                );


            const serieVentajaConfianza =
                this.crearSerieDesdeHistorial(

                    historial,

                    "ventajaConfianza"

                );


            const serieIndice =
                this.crearSerieDesdeHistorial(

                    historial,

                    "indiceDiscriminacion"

                );


            /*--------------------------------------------------------
                TENDENCIAS
            --------------------------------------------------------*/

            const tendenciaTasa =
                this.analizarSerie(
                    serieTasa
                );


            const tendenciaAciertos =
                this.analizarSerie(
                    serieAciertos
                );


            const tendenciaVentajaScore =
                this.analizarSerie(
                    serieVentajaScore
                );


            const tendenciaVentajaConfianza =
                this.analizarSerie(
                    serieVentajaConfianza
                );


            const tendenciaIndiceDiscriminacion =
                this.analizarSerie(
                    serieIndice
                );


            /*--------------------------------------------------------
                PROMEDIOS HISTÓRICOS
            --------------------------------------------------------*/

            const promedioTasaAcierto =
                this.calcularPromedio(

                    historial.map(
                        item =>
                            item.tasaAcierto
                    )

                );


            const promedioVentajaScore =
                this.calcularPromedio(

                    historial.map(
                        item =>
                            item.ventajaScore
                    )

                );


            const promedioVentajaConfianza =
                this.calcularPromedio(

                    historial.map(
                        item =>
                            item.ventajaConfianza
                    )

                );


            const promedioIndiceDiscriminacion =
                this.calcularPromedio(

                    historial.map(
                        item =>
                            item.indiceDiscriminacion
                    )

                );


            /*--------------------------------------------------------
                VENTANAS RECIENTE / ANTERIOR
            --------------------------------------------------------*/

            const ventanas =
                this.obtenerVentanasComparacion(
                    historial
                );


            const reciente =
                ventanas.reciente;


            const anterior =
                ventanas.anterior;


            /*--------------------------------------------------------
                ÍNDICE DE DISCRIMINACIÓN
            --------------------------------------------------------*/

            const promedioIndiceReciente =
                this.calcularPromedio(

                    reciente.map(
                        item =>
                            item.indiceDiscriminacion
                    )

                );


            const promedioIndiceAnterior =

                anterior.length > 0

                    ? this.calcularPromedio(

                        anterior.map(
                            item =>
                                item.indiceDiscriminacion
                        )

                    )

                    : promedioIndiceDiscriminacion;


            const variacionIndiceReciente =
                this.redondear(

                    promedioIndiceReciente -

                    promedioIndiceAnterior,

                    6

                );


            /*--------------------------------------------------------
                VENTAJA SCORE
            --------------------------------------------------------*/

            const promedioVentajaScoreReciente =
                this.calcularPromedio(

                    reciente.map(
                        item =>
                            item.ventajaScore
                    )

                );


            const promedioVentajaScoreAnterior =

                anterior.length > 0

                    ? this.calcularPromedio(

                        anterior.map(
                            item =>
                                item.ventajaScore
                        )

                    )

                    : promedioVentajaScore;


            const variacionVentajaScore =
                this.redondear(

                    promedioVentajaScoreReciente -

                    promedioVentajaScoreAnterior,

                    6

                );


            /*--------------------------------------------------------
                VENTAJA CONFIANZA
            --------------------------------------------------------*/

            const promedioVentajaConfianzaReciente =
                this.calcularPromedio(

                    reciente.map(
                        item =>
                            item.ventajaConfianza
                    )

                );


            const promedioVentajaConfianzaAnterior =

                anterior.length > 0

                    ? this.calcularPromedio(

                        anterior.map(
                            item =>
                                item.ventajaConfianza
                        )

                    )

                    : promedioVentajaConfianza;


            const variacionVentajaConfianza =
                this.redondear(

                    promedioVentajaConfianzaReciente -

                    promedioVentajaConfianzaAnterior,

                    6

                );


            /*--------------------------------------------------------
                ESTADO DEL MOTOR
            --------------------------------------------------------*/

            const estado =
                this.clasificarEstadoMotor({

                    cantidadEvaluaciones:
                        historial.length,

                    promedioHistorico:
                        promedioIndiceDiscriminacion,

                    promedioReciente:
                        promedioIndiceReciente,

                    promedioAnterior:
                        promedioIndiceAnterior,

                    variacionReciente:
                        variacionIndiceReciente,

                    tendenciaIndice:
                        tendenciaIndiceDiscriminacion,

                    comparacionDisponible:
                        ventanas.disponible

                });


            /*--------------------------------------------------------
                CONSISTENCIA
            --------------------------------------------------------*/

            const consistencia =
                this.calcularConsistencia(

                    historial.map(
                        item =>
                            item.indiceDiscriminacion
                    )

                );


            const consistente =

                historial.length >= 2 &&

                consistencia >= 70;


            porMotor[clave] = {

                motor:
                    clave,

                cantidadEvaluaciones:
                    historial.length,


                promedioTasaAcierto:

                    this.redondear(
                        promedioTasaAcierto,
                        6
                    ),


                tendenciaTasa,

                tendenciaAciertos,


                promedioVentajaScore:

                    this.redondear(
                        promedioVentajaScore,
                        6
                    ),


                promedioVentajaConfianza:

                    this.redondear(
                        promedioVentajaConfianza,
                        6
                    ),


                promedioIndiceDiscriminacion:

                    this.redondear(
                        promedioIndiceDiscriminacion,
                        6
                    ),


                promedioIndiceReciente:

                    this.redondear(
                        promedioIndiceReciente,
                        6
                    ),


                promedioIndiceAnterior:

                    this.redondear(
                        promedioIndiceAnterior,
                        6
                    ),


                variacionIndiceReciente,


                promedioVentajaScoreReciente:

                    this.redondear(
                        promedioVentajaScoreReciente,
                        6
                    ),


                promedioVentajaScoreAnterior:

                    this.redondear(
                        promedioVentajaScoreAnterior,
                        6
                    ),


                variacionVentajaScore,


                promedioVentajaConfianzaReciente:

                    this.redondear(
                        promedioVentajaConfianzaReciente,
                        6
                    ),


                promedioVentajaConfianzaAnterior:

                    this.redondear(
                        promedioVentajaConfianzaAnterior,
                        6
                    ),


                variacionVentajaConfianza,


                tendenciaVentajaScore,

                tendenciaVentajaConfianza,

                tendenciaIndiceDiscriminacion,


                ventanaComparacion: {

                    disponible:
                        ventanas.disponible,

                    tamaño:
                        ventanas.tamañoVentana,

                    cantidadAnterior:
                        anterior.length,

                    cantidadReciente:
                        reciente.length

                },


                estado,


                consistencia:

                    this.redondear(
                        consistencia,
                        4
                    ),


                consistente,


                historial

            };

        }


        /*------------------------------------------------------------
            RANKING HISTÓRICO
        ------------------------------------------------------------*/

        const rankingMotores =
            Object.values(
                porMotor
            ).sort(

                (a, b) => {

                    if (
                        b.promedioIndiceDiscriminacion !==
                        a.promedioIndiceDiscriminacion
                    ) {

                        return (

                            b.promedioIndiceDiscriminacion -

                            a.promedioIndiceDiscriminacion

                        );

                    }


                    if (
                        b.promedioIndiceReciente !==
                        a.promedioIndiceReciente
                    ) {

                        return (

                            b.promedioIndiceReciente -

                            a.promedioIndiceReciente

                        );

                    }


                    if (
                        b.promedioVentajaScore !==
                        a.promedioVentajaScore
                    ) {

                        return (

                            b.promedioVentajaScore -

                            a.promedioVentajaScore

                        );

                    }


                    return String(
                        a.motor
                    ).localeCompare(
                        String(
                            b.motor
                        )
                    );

                }

            );


        rankingMotores.forEach(

            (
                motor,
                indice
            ) => {

                motor.posicionEvolutiva =
                    indice + 1;

            }

        );


        const mejorMotorHistorico =

            rankingMotores.length > 0

                ? rankingMotores[0]
                    .motor

                : null;


        /*------------------------------------------------------------
            MEJOR MOTOR RECIENTE
        ------------------------------------------------------------*/

        const rankingReciente =
            [

                ...rankingMotores

            ].sort(

                (a, b) => {

                    if (
                        b.promedioIndiceReciente !==
                        a.promedioIndiceReciente
                    ) {

                        return (

                            b.promedioIndiceReciente -

                            a.promedioIndiceReciente

                        );

                    }


                    return (

                        b.promedioVentajaScoreReciente -

                        a.promedioVentajaScoreReciente

                    );

                }

            );


        const mejorMotorReciente =

            rankingReciente.length > 0

                ? rankingReciente[0]
                    .motor

                : null;


        /*------------------------------------------------------------
            LISTAS DERIVADAS
        ------------------------------------------------------------*/

        const motoresConsistentes =
            rankingMotores

                .filter(

                    motor =>
                        motor.consistente

                )

                .map(

                    motor =>
                        motor.motor

                );


        const motoresEnMejora =
            rankingMotores

                .filter(

                    motor =>
                        motor.estado ===
                        "mejorando"

                )

                .map(

                    motor =>
                        motor.motor

                );


        const motoresEnDeterioro =
            rankingMotores

                .filter(

                    motor =>
                        motor.estado ===
                        "empeorando"

                )

                .map(

                    motor =>
                        motor.motor

                );


        return {

            porMotor,

            rankingMotores,

            mejorMotorHistorico,

            mejorMotorReciente,

            motoresConsistentes,

            motoresEnMejora,

            motoresEnDeterioro

        };

    }


    /*================================================================
        CREAR SERIE DESDE HISTORIAL
    ================================================================*/

    crearSerieDesdeHistorial(
        historial,
        propiedad
    ) {

        if (
            !Array.isArray(
                historial
            )
        ) {

            return [];

        }


        return historial.map(

            (
                item,
                indice
            ) => ({

                x:
                    indice + 1,

                y:
                    this.numeroSeguro(
                        item[propiedad]
                    )

            })

        );

    }


    /*================================================================
        CLASIFICAR ESTADO DEL MOTOR
    ================================================================*/

    clasificarEstadoMotor({
        cantidadEvaluaciones,
        promedioHistorico,
        promedioReciente,
        promedioAnterior,
        variacionReciente,
        tendenciaIndice,
        comparacionDisponible
    }) {

        const umbral =
            this.configuracion
                .umbralDiscriminacion;


        /*
         * Primero priorizamos comparación
         * entre ventana anterior y reciente.
         */

        if (
            comparacionDisponible
        ) {

            if (
                variacionReciente >=
                umbral
            ) {

                return "mejorando";

            }


            if (
                variacionReciente <=
                -umbral
            ) {

                return "empeorando";

            }

        }


        /*
         * Si la diferencia reciente no alcanza
         * el umbral, utilizamos la pendiente
         * como señal secundaria.
         */

        if (
            cantidadEvaluaciones >=
            this.configuracion
                .minimoEvaluacionesTendencia
        ) {

            const pendiente =
                this.numeroSeguro(
                    tendenciaIndice
                        ?.pendiente
                );


            if (
                pendiente >
                this.configuracion
                    .pendienteMinimaMotor
            ) {

                return "tendencia_positiva";

            }


            if (
                pendiente <
                -this.configuracion
                    .pendienteMinimaMotor
            ) {

                return "tendencia_negativa";

            }

        }


        /*
         * Señal históricamente negativa.
         */

        if (
            promedioHistorico <
            -this.configuracion
                .minimoIndicePositivo
        ) {

            return "debil_historico";

        }


        /*
         * Señal reciente negativa.
         */

        if (
            promedioReciente <
            -this.configuracion
                .minimoIndicePositivo
        ) {

            return "debil_reciente";

        }


        return "estable";

    }


    /*================================================================
        CONSISTENCIA
    ================================================================*/

    calcularConsistencia(
        valores
    ) {

        if (
            !Array.isArray(
                valores
            ) ||
            valores.length === 0
        ) {

            return 0;

        }


        if (
            valores.length === 1
        ) {

            return 50;

        }


        const promedio =
            this.calcularPromedio(
                valores
            );


        const desviacion =
            this.calcularDesviacionEstandar(
                valores
            );


        const estabilidad =

            Math.max(

                0,

                100 -
                desviacion * 5

            );


        const fuerzaMedia =

            Math.min(

                100,

                Math.abs(
                    promedio
                ) * 10

            );


        return this.limitar(

            (
                estabilidad *
                0.70
            ) +

            (
                fuerzaMedia *
                0.30
            ),

            0,

            100

        );

    }


    /*================================================================
        DESVIACIÓN ESTÁNDAR
    ================================================================*/

    calcularDesviacionEstandar(
        valores
    ) {

        if (
            !Array.isArray(
                valores
            ) ||
            valores.length === 0
        ) {

            return 0;

        }


        const validos =
            valores

                .map(Number)

                .filter(
                    Number.isFinite
                );


        if (
            validos.length === 0
        ) {

            return 0;

        }


        const promedio =
            validos.reduce(

                (
                    suma,
                    valor
                ) =>
                    suma + valor,

                0

            ) /
            validos.length;


        const varianza =
            validos.reduce(

                (
                    acumulado,
                    valor
                ) => {

                    const diferencia =
                        valor -
                        promedio;


                    return (

                        acumulado +

                        diferencia *
                        diferencia

                    );

                },

                0

            ) /
            validos.length;


        return Math.sqrt(
            varianza
        );

    }


    /*================================================================
        DETECTAR CAMBIOS
    ================================================================*/

    detectarCambios(
        evaluaciones,
        evolucionMotores,
        tendencias
    ) {

        const cambios = [];


        /*------------------------------------------------------------
            CAMBIOS GLOBALES
        ------------------------------------------------------------*/

        for (
            const clave
            in tendencias
        ) {

            const tendencia =
                tendencias[clave];


            if (
                tendencia.tendencia ===
                "ascendente"
            ) {

                cambios.push({

                    tipo:
                        "mejora_global",

                    indicador:
                        clave,

                    magnitud:
                        tendencia.pendiente,

                    descripcion:

                        `El indicador ${clave} presenta una tendencia ascendente.`

                });

            }


            if (
                tendencia.tendencia ===
                "descendente"
            ) {

                cambios.push({

                    tipo:
                        "deterioro_global",

                    indicador:
                        clave,

                    magnitud:
                        tendencia.pendiente,

                    descripcion:

                        `El indicador ${clave} presenta una tendencia descendente.`

                });

            }

        }


        /*------------------------------------------------------------
            CAMBIOS ESPECÍFICOS POR MOTOR
        ------------------------------------------------------------*/

        const motores =
            evolucionMotores
                .porMotor ||
            {};


        for (
            const clave
            in motores
        ) {

            const motor =
                motores[clave];


            /*
             * Mejora confirmada por comparación
             * reciente contra anterior.
             */

            if (
                motor.estado ===
                "mejorando"
            ) {

                cambios.push({

                    tipo:
                        "motor_mejorando",

                    motor:
                        clave,

                    variacion:
                        motor.variacionIndiceReciente,

                    indiceHistorico:
                        motor.promedioIndiceDiscriminacion,

                    indiceAnterior:
                        motor.promedioIndiceAnterior,

                    indiceReciente:
                        motor.promedioIndiceReciente,

                    pendiente:
                        motor
                            .tendenciaIndiceDiscriminacion
                            .pendiente,

                    descripcion:

                        `El motor ${clave} presenta una mejora reciente de su capacidad discriminatoria.`

                });

            }


            /*
             * Deterioro confirmado.
             */

            if (
                motor.estado ===
                "empeorando"
            ) {

                cambios.push({

                    tipo:
                        "motor_empeorando",

                    motor:
                        clave,

                    variacion:
                        motor.variacionIndiceReciente,

                    indiceHistorico:
                        motor.promedioIndiceDiscriminacion,

                    indiceAnterior:
                        motor.promedioIndiceAnterior,

                    indiceReciente:
                        motor.promedioIndiceReciente,

                    pendiente:
                        motor
                            .tendenciaIndiceDiscriminacion
                            .pendiente,

                    descripcion:

                        `El motor ${clave} presenta un deterioro reciente de su capacidad discriminatoria.`

                });

            }


            /*
             * Tendencia positiva todavía no suficientemente
             * fuerte como para clasificar "mejorando".
             */

            if (
                motor.estado ===
                "tendencia_positiva"
            ) {

                cambios.push({

                    tipo:
                        "motor_tendencia_positiva",

                    motor:
                        clave,

                    pendiente:
                        motor
                            .tendenciaIndiceDiscriminacion
                            .pendiente,

                    descripcion:

                        `El motor ${clave} mantiene una tendencia temporal positiva.`

                });

            }


            /*
             * Tendencia negativa leve.
             */

            if (
                motor.estado ===
                "tendencia_negativa"
            ) {

                cambios.push({

                    tipo:
                        "motor_tendencia_negativa",

                    motor:
                        clave,

                    pendiente:
                        motor
                            .tendenciaIndiceDiscriminacion
                            .pendiente,

                    descripcion:

                        `El motor ${clave} mantiene una tendencia temporal negativa.`

                });

            }


            /*
             * Comportamiento históricamente negativo.
             */

            if (
                motor.estado ===
                "debil_historico"
            ) {

                cambios.push({

                    tipo:
                        "motor_debil_historico",

                    motor:
                        clave,

                    indice:
                        motor.promedioIndiceDiscriminacion,

                    descripcion:

                        `El motor ${clave} mantiene un índice discriminatorio histórico negativo.`

                });

            }

        }


        /*------------------------------------------------------------
            CAMBIOS BRUSCOS TOP 10
        ------------------------------------------------------------*/

        for (

            let i = 1;

            i < evaluaciones.length;

            i++

        ) {

            const anterior =
                evaluaciones[
                    i - 1
                ];


            const actual =
                evaluaciones[i];


            const anteriorTop10 =
                this.obtenerAciertosTop10(
                    anterior
                );


            const actualTop10 =
                this.obtenerAciertosTop10(
                    actual
                );


            const diferencia =
                actualTop10 -
                anteriorTop10;


            const umbralTop10 =

                Math.max(

                    2,

                    this.configuracion
                        .umbralCambioFuerte /
                    10

                );


            if (
                Math.abs(
                    diferencia
                ) >=
                umbralTop10
            ) {

                cambios.push({

                    tipo:
                        "cambio_brusco_top10",

                    fecha:
                        actual.fechaEvaluacion ||
                        null,

                    anterior:
                        anteriorTop10,

                    actual:
                        actualTop10,

                    diferencia,

                    descripcion:

                        "Se detectó una variación fuerte entre dos evaluaciones consecutivas."

                });

            }

        }


        return cambios;

    }


    /*================================================================
        SEÑALES PARA OPTIMIZACIÓN
    ================================================================*/

    generarSeñalesOptimizacion(
        tendencias,
        evolucionMotores,
        cambios,
        comparacionPeriodos,
        datosSuficientes
    ) {

        const señales = [];


        /*------------------------------------------------------------
            BLOQUEO DE OPTIMIZACIÓN
        ------------------------------------------------------------*/

        if (
            !datosSuficientes
        ) {

            señales.push({

                tipo:
                    "evidencia_insuficiente",

                prioridad:
                    "informativa",

                habilitada:
                    false,

                evaluacionesMinimas:
                    this.configuracion
                        .minimoEvaluaciones,

                descripcion:

                    "El sistema puede analizar la evolución, pero todavía no posee suficientes evaluaciones para recomendar ajustes automáticos de pesos."

            });

        }


        /*------------------------------------------------------------
            TENDENCIAS GLOBALES
        ------------------------------------------------------------*/

        for (
            const clave
            in tendencias
        ) {

            const tendencia =
                tendencias[clave];


            if (
                tendencia.tendencia ===
                "ascendente"
            ) {

                señales.push({

                    tipo:
                        "indicador_en_mejora",

                    indicador:
                        clave,

                    prioridad:
                        datosSuficientes

                            ? "media"

                            : "informativa",

                    habilitada:
                        datosSuficientes,

                    valor:
                        tendencia.pendiente

                });

            }


            if (
                tendencia.tendencia ===
                "descendente"
            ) {

                señales.push({

                    tipo:
                        "indicador_en_deterioro",

                    indicador:
                        clave,

                    prioridad:
                        datosSuficientes

                            ? "media"

                            : "informativa",

                    habilitada:
                        datosSuficientes,

                    valor:
                        tendencia.pendiente

                });

            }

        }


        /*------------------------------------------------------------
            MOTORES
        ------------------------------------------------------------*/

        const motores =
            evolucionMotores
                .porMotor ||
            {};


        for (
            const clave
            in motores
        ) {

            const motor =
                motores[clave];


            /*
             * Candidato a aumento.
             */

            if (
                motor.estado ===
                "mejorando"
            ) {

                señales.push({

                    tipo:
                        "motor_candidato_aumento",

                    motor:
                        clave,

                    prioridad:
                        datosSuficientes

                            ? "media"

                            : "informativa",

                    habilitada:
                        datosSuficientes,

                    indiceHistorico:
                        motor.promedioIndiceDiscriminacion,

                    indiceAnterior:
                        motor.promedioIndiceAnterior,

                    indiceReciente:
                        motor.promedioIndiceReciente,

                    variacion:
                        motor.variacionIndiceReciente,

                    pendiente:
                        motor
                            .tendenciaIndiceDiscriminacion
                            .pendiente,

                    ventajaScore:
                        motor.promedioVentajaScore

                });

            }


            /*
             * Candidato a revisión.
             */

            if (

                motor.estado ===
                    "empeorando" ||

                motor.estado ===
                    "debil_historico" ||

                motor.estado ===
                    "debil_reciente"

            ) {

                señales.push({

                    tipo:
                        "motor_candidato_revision",

                    motor:
                        clave,

                    prioridad:
                        datosSuficientes

                            ? "media"

                            : "informativa",

                    habilitada:
                        datosSuficientes,

                    indiceHistorico:
                        motor.promedioIndiceDiscriminacion,

                    indiceAnterior:
                        motor.promedioIndiceAnterior,

                    indiceReciente:
                        motor.promedioIndiceReciente,

                    variacion:
                        motor.variacionIndiceReciente,

                    pendiente:
                        motor
                            .tendenciaIndiceDiscriminacion
                            .pendiente

                });

            }


            /*
             * Tendencia positiva todavía informativa.
             */

            if (
                motor.estado ===
                "tendencia_positiva"
            ) {

                señales.push({

                    tipo:
                        "motor_tendencia_positiva",

                    motor:
                        clave,

                    prioridad:
                        "informativa",

                    habilitada:
                        false,

                    pendiente:
                        motor
                            .tendenciaIndiceDiscriminacion
                            .pendiente

                });

            }


            /*
             * Tendencia negativa informativa.
             */

            if (
                motor.estado ===
                "tendencia_negativa"
            ) {

                señales.push({

                    tipo:
                        "motor_tendencia_negativa",

                    motor:
                        clave,

                    prioridad:
                        "informativa",

                    habilitada:
                        false,

                    pendiente:
                        motor
                            .tendenciaIndiceDiscriminacion
                            .pendiente

                });

            }


            /*
             * Motor consistente.
             */

            if (

                motor.consistente &&

                motor.promedioIndiceDiscriminacion >=
                this.configuracion
                    .minimoIndicePositivo

            ) {

                señales.push({

                    tipo:
                        "motor_consistente",

                    motor:
                        clave,

                    prioridad:
                        "informativa",

                    habilitada:
                        false,

                    indicePromedio:
                        motor.promedioIndiceDiscriminacion,

                    consistencia:
                        motor.consistencia

                });

            }

        }


        /*------------------------------------------------------------
            MEJOR MOTOR HISTÓRICO
        ------------------------------------------------------------*/

        if (
            evolucionMotores
                .mejorMotorHistorico
        ) {

            const clave =
                evolucionMotores
                    .mejorMotorHistorico;


            const motor =
                motores[clave];


            señales.push({

                tipo:
                    "mejor_motor_historico",

                motor:
                    clave,

                prioridad:
                    "informativa",

                habilitada:
                    false,

                indice:
                    motor
                        ?.promedioIndiceDiscriminacion ??
                    0,

                ventajaScore:
                    motor
                        ?.promedioVentajaScore ??
                    0

            });

        }


        /*------------------------------------------------------------
            MEJOR MOTOR RECIENTE
        ------------------------------------------------------------*/

        if (
            evolucionMotores
                .mejorMotorReciente
        ) {

            const clave =
                evolucionMotores
                    .mejorMotorReciente;


            const motor =
                motores[clave];


            señales.push({

                tipo:
                    "mejor_motor_reciente",

                motor:
                    clave,

                prioridad:
                    "informativa",

                habilitada:
                    false,

                indiceReciente:
                    motor
                        ?.promedioIndiceReciente ??
                    0

            });

        }


        /*------------------------------------------------------------
            COMPARACIÓN GLOBAL DE PERÍODOS
        ------------------------------------------------------------*/

        if (
            comparacionPeriodos
                ?.disponible
        ) {

            const variaciones =
                comparacionPeriodos
                    .variaciones;


            const umbralTop10 =

                Math.max(

                    0.5,

                    this.configuracion
                        .umbralCambio /
                    10

                );


            if (
                variaciones.top10 >=
                umbralTop10
            ) {

                señales.push({

                    tipo:
                        "modelo_mejorando",

                    prioridad:
                        datosSuficientes

                            ? "alta"

                            : "informativa",

                    habilitada:
                        datosSuficientes,

                    variacion:
                        variaciones.top10

                });

            }


            if (
                variaciones.top10 <=
                -umbralTop10
            ) {

                señales.push({

                    tipo:
                        "modelo_empeorando",

                    prioridad:
                        datosSuficientes

                            ? "alta"

                            : "informativa",

                    habilitada:
                        datosSuficientes,

                    variacion:
                        variaciones.top10

                });

            }

        }


        /*------------------------------------------------------------
            CAMBIOS BRUSCOS
        ------------------------------------------------------------*/

        const cambiosFuertes =
            cambios.filter(

                cambio =>
                    cambio.tipo ===
                    "cambio_brusco_top10"

            );


        if (
            cambiosFuertes.length > 0
        ) {

            señales.push({

                tipo:
                    "cambio_comportamiento",

                prioridad:
                    datosSuficientes

                        ? "alta"

                        : "informativa",

                habilitada:
                    datosSuficientes,

                cantidad:
                    cambiosFuertes.length

            });

        }


        return señales;

    }


    /*================================================================
        RESUMEN IA
    ================================================================*/

    generarResumenIA(
        evaluaciones,
        rendimientoGeneral,
        periodos,
        comparacionPeriodos,
        tendencias,
        evolucionMotores,
        cambios,
        señalesOptimizacion,
        datosSuficientes
    ) {

        const motores =
            evolucionMotores
                .rankingMotores ||
            [];


        return {

            tipo:
                "analisis_evolucion_modelo",

            version:
                this.version,

            fecha:
                new Date()
                    .toISOString(),

            cantidadEvaluaciones:
                evaluaciones.length,

            minimoEvaluaciones:
                this.configuracion
                    .minimoEvaluaciones,

            datosSuficientes,

            rendimientoGeneral,

            comparacionPeriodos,

            tendencias,


            mejorMotorHistorico:
                evolucionMotores
                    .mejorMotorHistorico,


            mejorMotorReciente:
                evolucionMotores
                    .mejorMotorReciente,


            motoresConsistentes:
                evolucionMotores
                    .motoresConsistentes,


            motoresEnMejora:
                evolucionMotores
                    .motoresEnMejora,


            motoresEnDeterioro:
                evolucionMotores
                    .motoresEnDeterioro,


            motores:

                motores.map(

                    motor => ({

                        posicionEvolutiva:
                            motor.posicionEvolutiva,

                        motor:
                            motor.motor,

                        cantidadEvaluaciones:
                            motor.cantidadEvaluaciones,

                        promedioTasaAcierto:
                            motor.promedioTasaAcierto,

                        promedioVentajaScore:
                            motor.promedioVentajaScore,

                        promedioVentajaConfianza:
                            motor.promedioVentajaConfianza,

                        promedioIndiceDiscriminacion:
                            motor.promedioIndiceDiscriminacion,

                        promedioIndiceAnterior:
                            motor.promedioIndiceAnterior,

                        promedioIndiceReciente:
                            motor.promedioIndiceReciente,

                        variacionIndiceReciente:
                            motor.variacionIndiceReciente,

                        pendienteIndice:
                            motor
                                .tendenciaIndiceDiscriminacion
                                .pendiente,

                        tendenciaIndice:
                            motor
                                .tendenciaIndiceDiscriminacion
                                .tendencia,

                        ventanaComparacion:
                            motor.ventanaComparacion,

                        estado:
                            motor.estado,

                        consistencia:
                            motor.consistencia,

                        consistente:
                            motor.consistente

                    })

                ),


            cambios,

            señalesOptimizacion,


            periodosResumen:

                periodos.map(

                    periodo => ({

                        numero:
                            periodo.numero,

                        nombre:
                            periodo.nombre,

                        cantidad:
                            periodo.cantidad,

                        desde:
                            periodo.evaluaciones[0]
                                ?.fechaEvaluacion ||
                            null,

                        hasta:
                            periodo.evaluaciones[
                                periodo.evaluaciones.length - 1
                            ]
                                ?.fechaEvaluacion ||
                            null,

                        resumen:
                            periodo.resumen

                    })

                ),


            interpretacionBase: {

                aclaracion:

                    "Las métricas describen el comportamiento histórico del modelo y no representan probabilidades reales.",

                comparacionMotores:

                    "Cada motor se analiza mediante su índice histórico, pendiente temporal y comparación entre una ventana reciente y una ventana anterior equivalente.",

                optimizacion:

                    datosSuficientes

                        ? "Existe el mínimo configurado de evaluaciones para permitir que un futuro optimizador considere propuestas controladas de ajuste."

                        : `Todavía no se alcanzaron las ${this.configuracion.minimoEvaluaciones} evaluaciones mínimas requeridas para habilitar propuestas de optimización.`

            },


            advertencia:

                "La evolución histórica observada no garantiza resultados futuros."

        };

    }


    /*================================================================
        OBTENER ACIERTOS TOP 10
    ================================================================*/

    obtenerAciertosTop10(
        evaluacion
    ) {

        return this.numeroSeguro(

            evaluacion
                ?.metricas
                ?.aciertosTop10

        );

    }


    /*================================================================
        OBTENER ÚLTIMOS
    ================================================================*/

    obtenerUltimos(
        lista,
        cantidad
    ) {

        if (
            !Array.isArray(
                lista
            )
        ) {

            return [];

        }


        const limite =

            Math.max(

                0,

                Number(
                    cantidad
                ) || 0

            );


        return lista.slice(

            Math.max(

                0,

                lista.length -
                limite

            )

        );

    }


    /*================================================================
        PROMEDIO
    ================================================================*/

    calcularPromedio(
        valores
    ) {

        if (
            !Array.isArray(
                valores
            ) ||
            valores.length === 0
        ) {

            return 0;

        }


        const validos =
            valores

                .map(Number)

                .filter(
                    Number.isFinite
                );


        if (
            validos.length === 0
        ) {

            return 0;

        }


        return this.redondear(

            validos.reduce(

                (
                    suma,
                    valor
                ) =>
                    suma + valor,

                0

            ) /
            validos.length,

            6

        );

    }


    /*================================================================
        RESULTADO VACÍO
    ================================================================*/

    resultadoVacio() {

        return {

            id:
                this.generarIdAnalisis(),

            nombre:
                this.nombre,

            version:
                this.version,

            generadoEn:
                new Date()
                    .toISOString(),

            cantidadEvaluaciones:
                0,

            datosSuficientes:
                false,

            minimoEvaluaciones:
                this.configuracion
                    .minimoEvaluaciones,

            rendimientoGeneral:
                this.analizarRendimientoGeneral(
                    []
                ),

            periodos:
                [],

            comparacionPeriodos: {

                disponible:
                    false,

                motivo:
                    "No existen evaluaciones.",

                variaciones:
                    null,

                direccion:
                    "sin_datos"

            },

            tendencias:
                {},

            motores:
                {},

            rankingMotores:
                [],

            mejorMotorHistorico:
                null,

            mejorMotorReciente:
                null,

            motoresConsistentes:
                [],

            motoresEnMejora:
                [],

            motoresEnDeterioro:
                [],

            cambios:
                [],

            señalesOptimizacion: [

                {

                    tipo:
                        "evidencia_insuficiente",

                    prioridad:
                        "informativa",

                    habilitada:
                        false,

                    evaluacionesMinimas:
                        this.configuracion
                            .minimoEvaluaciones,

                    descripcion:

                        "No existen evaluaciones suficientes para analizar evolución."

                }

            ],

            resumenIA: {

                tipo:
                    "analisis_evolucion_modelo",

                version:
                    this.version,

                cantidadEvaluaciones:
                    0,

                datosSuficientes:
                    false

            }

        };

    }


    /*================================================================
        DATOS SUFICIENTES
    ================================================================*/

    hayDatosSuficientes(
        cantidad = null
    ) {

        const valor =
            Number(
                cantidad
            );


        return (

            Number.isFinite(
                valor
            ) &&

            valor >=
            this.configuracion
                .minimoEvaluaciones

        );

    }


    /*================================================================
        GENERAR ID
    ================================================================*/

    generarIdAnalisis() {

        const fecha =
            new Date()

                .toISOString()

                .replace(
                    /[^0-9]/g,
                    ""
                );


        const aleatorio =
            Math.random()

                .toString(36)

                .substring(
                    2,
                    8
                );


        return (
            `evolucion_${fecha}_${aleatorio}`
        );

    }


    /*================================================================
        OBTENER FECHA
    ================================================================*/

    obtenerFecha(
        evaluacion
    ) {

        const fecha =
            new Date(

                evaluacion
                    ?.fechaEvaluacion ||

                evaluacion
                    ?.fecha ||

                evaluacion
                    ?.semana
                    ?.fecha ||

                0

            );


        const timestamp =
            fecha.getTime();


        return Number.isFinite(
            timestamp
        )

            ? timestamp

            : 0;

    }


    /*================================================================
        NÚMERO SEGURO
    ================================================================*/

    numeroSeguro(
        valor,
        defecto = 0
    ) {

        const numero =
            Number(
                valor
            );


        return Number.isFinite(
            numero
        )

            ? numero

            : defecto;

    }


    /*================================================================
        LIMITAR
    ================================================================*/

    limitar(
        valor,
        minimo = 0,
        maximo = 100
    ) {

        const numero =
            this.numeroSeguro(
                valor,
                minimo
            );


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
        decimales = 4
    ) {

        const numero =
            this.numeroSeguro(
                valor
            );


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
        OBTENER ESTADO
    ================================================================*/

    obtenerEstado(
        cantidadEvaluaciones = 0
    ) {

        const cantidad =
            Number(
                cantidadEvaluaciones
            ) || 0;


        return {

            nombre:
                this.nombre,

            version:
                this.version,

            cantidadEvaluaciones:
                cantidad,

            minimoEvaluaciones:
                this.configuracion
                    .minimoEvaluaciones,

            datosSuficientes:
                this.hayDatosSuficientes(
                    cantidad
                ),

            periodoReciente:
                this.configuracion
                    .periodoReciente,

            cantidadPeriodos:
                this.configuracion
                    .cantidadPeriodos,

            umbralCambio:
                this.configuracion
                    .umbralCambio,

            umbralCambioFuerte:
                this.configuracion
                    .umbralCambioFuerte,

            umbralDiscriminacion:
                this.configuracion
                    .umbralDiscriminacion,

            minimoIndicePositivo:
                this.configuracion
                    .minimoIndicePositivo,

            minimoEvaluacionesTendencia:
                this.configuracion
                    .minimoEvaluacionesTendencia,

            pendienteMinimaMotor:
                this.configuracion
                    .pendienteMinimaMotor

        };

    }

}