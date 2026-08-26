/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * js/motores/MotorEvaluacion.js
 *
 * Propósito:
 * Evaluar una predicción histórica contra los números reales de una
 * semana ya sorteada.
 *
 * Responsabilidades:
 *
 *   - Comparar predicción vs. resultado real.
 *   - Calcular aciertos Top 10.
 *   - Calcular aciertos Top 20.
 *   - Calcular aciertos Equipo Titular.
 *   - Calcular aciertos Equipo Suplente.
 *   - Detectar posición de cada acierto.
 *   - Analizar score de los números acertados.
 *   - Analizar confianza.
 *   - Analizar qué motores participaron en los aciertos.
 *   - Calcular capacidad discriminatoria de cada motor.
 *   - Generar indicadores para la futura optimización de pesos.
 *   - Generar información preparada para análisis mediante IA.
 *
 * IMPORTANTE:
 *
 * Este módulo NO modifica automáticamente los pesos.
 *
 * La modificación automática de pesos será responsabilidad de una
 * etapa posterior de optimización.
 *
 **********************************************************************/

export default class MotorEvaluacion {


    /*==============================================================
        CONSTRUCTOR
    ==============================================================*/

    constructor(configuracion = {}) {

        this.nombre =
            "MotorEvaluacion";


        this.version =
            "1.1.0";


        this.configuracion = {

            cantidadNumerosEsperados:

                configuracion.cantidadNumerosEsperados ||

                10,


            minimoSemanasParaOptimizacion:

                configuracion.minimoSemanasParaOptimizacion ||

                20

        };


        /*
         * Historial temporal en memoria.
         *
         * Posteriormente será persistido
         * mediante un servicio específico.
         */

        this.historial = [];

    }


    /*==============================================================
        MÉTODO PRINCIPAL
    ==============================================================*/

    evaluar(

        prediccion,

        numerosReales,

        datosSemana = {}

    ) {

        if (!prediccion) {

            throw new Error(

                "No se recibió una predicción para evaluar."

            );

        }


        const reales =

            this.normalizarListaNumeros(

                numerosReales

            );


        if (

            reales.length === 0

        ) {

            throw new Error(

                "No se recibieron números reales válidos."

            );

        }


        const realesSet =

            new Set(

                reales

            );


        /*----------------------------------------------------------
            EVALUAR GRUPOS
        ----------------------------------------------------------*/

        const top10 =

            this.evaluarGrupo(

                prediccion.top10,

                realesSet,

                "top10"

            );


        const top20 =

            this.evaluarGrupo(

                prediccion.top20,

                realesSet,

                "top20"

            );


        const titulares =

            this.evaluarGrupo(

                prediccion.equipoTitular,

                realesSet,

                "equipoTitular"

            );


        const suplentes =

            this.evaluarGrupo(

                prediccion.equipoSuplente,

                realesSet,

                "equipoSuplente"

            );


        const rankingCompleto =

            this.evaluarGrupo(

                prediccion.rankingCompleto,

                realesSet,

                "rankingCompleto"

            );


        /*----------------------------------------------------------
            ACIERTOS DETALLADOS
        ----------------------------------------------------------*/

        const aciertosDetallados =

            this.evaluarAciertosDetallados(

                prediccion,

                realesSet

            );


        /*----------------------------------------------------------
            RENDIMIENTO DE MOTORES
        ----------------------------------------------------------*/

        const rendimientoMotores =

            this.analizarMotores(

                aciertosDetallados,

                prediccion

            );


        /*----------------------------------------------------------
            COMPORTAMIENTO DEL RANKING
        ----------------------------------------------------------*/

        const comportamientoRanking =

            this.analizarComportamientoRanking(

                prediccion,

                realesSet

            );


        /*----------------------------------------------------------
            MÉTRICAS GENERALES
        ----------------------------------------------------------*/

        const metricas =

            this.calcularMetricasGenerales(

                top10,

                top20,

                titulares,

                suplentes,

                rankingCompleto,

                aciertosDetallados

            );


        /*----------------------------------------------------------
            SEÑALES DE OPTIMIZACIÓN
        ----------------------------------------------------------*/

        const señalesOptimizacion =

            this.generarSeñalesOptimizacion(

                rendimientoMotores,

                metricas

            );


        /*----------------------------------------------------------
            RESUMEN IA
        ----------------------------------------------------------*/

        const resumenIA =

            this.generarResumenIA(

                prediccion,

                reales,

                metricas,

                rendimientoMotores,

                comportamientoRanking,

                señalesOptimizacion,

                datosSemana

            );


        /*----------------------------------------------------------
            RESULTADO
        ----------------------------------------------------------*/

        const evaluacion = {

            id:

                this.generarIdEvaluacion(),


            version:

                this.version,


            fechaEvaluacion:

                new Date().toISOString(),


            semana: {

                id:

                    datosSemana.id ||

                    datosSemana.semanaId ||

                    null,

                numero:

                    datosSemana.numero ||

                    datosSemana.semana ||

                    null,

                fecha:

                    datosSemana.fecha ||

                    null

            },


            prediccionId:

                prediccion.id ||

                null,


            numerosReales:

                reales.map(

                    numero =>

                        this.formatearNumero(

                            numero

                        )

                ),


            grupos: {

                top10,

                top20,

                equipoTitular:

                    titulares,

                equipoSuplente:

                    suplentes,

                rankingCompleto

            },


            aciertosDetallados,


            rendimientoMotores,


            comportamientoRanking,


            metricas,


            señalesOptimizacion,


            resumenIA

        };


        this.historial.push(

            evaluacion

        );


        return evaluacion;

    }


    /*==============================================================
        EVALUAR GRUPO
    ==============================================================*/

    evaluarGrupo(

        grupo,

        realesSet,

        nombreGrupo

    ) {

        if (

            !Array.isArray(

                grupo

            )

        ) {

            return {

                nombre:

                    nombreGrupo,

                cantidadPredicha:

                    0,

                cantidadReales:

                    realesSet.size,

                aciertos:

                    0,

                porcentajeAcierto:

                    0,

                numerosAcertados:

                    [],

                posicionesAcertadas:

                    [],

                detalle:

                    []

            };

        }


        const aciertos = [];


        for (

            const item of grupo

        ) {

            const numero =

                Number(

                    item.numero

                );


            if (

                realesSet.has(

                    numero

                )

            ) {

                aciertos.push({

                    numero:

                        this.formatearNumero(

                            numero

                        ),

                    posicion:

                        item.posicion ??

                        null,

                    score:

                        this.numeroSeguro(

                            item.score

                        ),

                    confianza:

                        this.numeroSeguro(

                            item.confianza

                        )

                });

            }

        }


        const cantidad =

            grupo.length;


        const porcentaje =

            cantidad > 0

                ? (

                    aciertos.length /

                    cantidad

                ) * 100

                : 0;


        return {

            nombre:

                nombreGrupo,

            cantidadPredicha:

                cantidad,

            cantidadReales:

                realesSet.size,

            aciertos:

                aciertos.length,

            porcentajeAcierto:

                this.redondear(

                    porcentaje,

                    4

                ),

            numerosAcertados:

                aciertos.map(

                    item =>

                        item.numero

                ),

            posicionesAcertadas:

                aciertos.map(

                    item =>

                        item.posicion

                ),

            detalle:

                aciertos

        };

    }


    /*==============================================================
        EVALUAR ACIERTOS DETALLADOS
    ==============================================================*/

    evaluarAciertosDetallados(

        prediccion,

        realesSet

    ) {

        if (

            !Array.isArray(

                prediccion.rankingCompleto

            )

        ) {

            return [];

        }


        const aciertos = [];


        for (

            const item of

                prediccion.rankingCompleto

        ) {

            const numero =

                Number(

                    item.numero

                );


            if (

                !realesSet.has(

                    numero

                )

            ) {

                continue;

            }


            const posicion =

                Number(

                    item.posicion

                );


            const motores =

                item.motores ||

                item.resumenMotores ||

                {};


            aciertos.push({

                numero:

                    this.formatearNumero(

                        numero

                    ),

                numeroValor:

                    numero,

                posicion:

                    Number.isFinite(

                        posicion

                    )

                        ? posicion

                        : null,

                score:

                    this.numeroSeguro(

                        item.score

                    ),

                confianza:

                    this.numeroSeguro(

                        item.confianza

                    ),

                cantidadMotores:

                    this.numeroSeguro(

                        item.cantidadMotores

                    ),

                motores,

                calidadPosicion:

                    this.calcularCalidadPosicion(

                        posicion

                    )

            });

        }


        return aciertos;

    }


    /*==============================================================
        CALIDAD DE POSICIÓN
    ==============================================================*/

    calcularCalidadPosicion(

        posicion

    ) {

        if (

            !Number.isFinite(

                posicion

            ) ||

            posicion <= 0

        ) {

            return 0;

        }


        return this.redondear(

            100 /

            posicion,

            6

        );

    }


    /*==============================================================
        CREAR ESTRUCTURA DE MOTOR
    ==============================================================*/

    crearRegistroMotor(

        clave

    ) {

        return {

            motor:

                clave,

            apariciones:

                0,

            aciertos:

                0,

            scoreTotal:

                0,

            scoreAciertos:

                0,

            confianzaTotal:

                0,

            confianzaAciertos:

                0,

            promedioScore:

                0,

            promedioScoreAciertos:

                0,

            promedioConfianza:

                0,

            promedioConfianzaAciertos:

                0,

            ventajaScore:

                0,

            ventajaConfianza:

                0,

            indiceDiscriminacion:

                0,

            tasaAcierto:

                0

        };

    }


    /*==============================================================
        ANALIZAR MOTORES
    ==============================================================*/

    analizarMotores(

        aciertosDetallados,

        prediccion

    ) {

        const motores = {};


        /*----------------------------------------------------------
            RECORRER RANKING COMPLETO
        ----------------------------------------------------------*/

        if (

            Array.isArray(

                prediccion.rankingCompleto

            )

        ) {

            for (

                const item of

                    prediccion.rankingCompleto

            ) {

                const datos =

                    item.motores ||

                    item.resumenMotores ||

                    {};


                for (

                    const clave in datos

                ) {

                    if (

                        !motores[clave]

                    ) {

                        motores[clave] =

                            this.crearRegistroMotor(

                                clave

                            );

                    }


                    const resultado =

                        datos[clave];


                    const score =

                        this.numeroSeguro(

                            resultado?.score

                        );


                    const confianza =

                        this.numeroSeguro(

                            resultado?.confianza

                        );


                    motores[clave]
                        .apariciones++;


                    motores[clave]
                        .scoreTotal +=

                            score;


                    motores[clave]
                        .confianzaTotal +=

                            confianza;

                }

            }

        }


        /*----------------------------------------------------------
            RECORRER ACIERTOS
        ----------------------------------------------------------*/

        for (

            const acierto of

                aciertosDetallados

        ) {

            const datos =

                acierto.motores ||

                {};


            for (

                const clave in datos

            ) {

                if (

                    !motores[clave]

                ) {

                    motores[clave] =

                        this.crearRegistroMotor(

                            clave

                        );

                }


                const resultado =

                    datos[clave];


                const score =

                    this.numeroSeguro(

                        resultado?.score

                    );


                const confianza =

                    this.numeroSeguro(

                        resultado?.confianza

                    );


                motores[clave]
                    .aciertos++;


                motores[clave]
                    .scoreAciertos +=

                        score;


                motores[clave]
                    .confianzaAciertos +=

                        confianza;

            }

        }


        /*----------------------------------------------------------
            CALCULAR INDICADORES
        ----------------------------------------------------------*/

        for (

            const clave in motores

        ) {

            const motor =

                motores[clave];


            motor.promedioScore =

                motor.apariciones > 0

                    ? this.redondear(

                        motor.scoreTotal /

                        motor.apariciones,

                        6

                    )

                    : 0;


            motor.promedioScoreAciertos =

                motor.aciertos > 0

                    ? this.redondear(

                        motor.scoreAciertos /

                        motor.aciertos,

                        6

                    )

                    : 0;


            motor.promedioConfianza =

                motor.apariciones > 0

                    ? this.redondear(

                        motor.confianzaTotal /

                        motor.apariciones,

                        6

                    )

                    : 0;


            motor.promedioConfianzaAciertos =

                motor.aciertos > 0

                    ? this.redondear(

                        motor.confianzaAciertos /

                        motor.aciertos,

                        6

                    )

                    : 0;


            /*------------------------------------------------------
                VENTAJA SCORE
            ------------------------------------------------------*/

            motor.ventajaScore =

                this.redondear(

                    motor.promedioScoreAciertos -

                    motor.promedioScore,

                    6

                );


            /*------------------------------------------------------
                VENTAJA CONFIANZA
            ------------------------------------------------------*/

            motor.ventajaConfianza =

                this.redondear(

                    motor.promedioConfianzaAciertos -

                    motor.promedioConfianza,

                    6

                );


            /*------------------------------------------------------
                ÍNDICE DE DISCRIMINACIÓN
            ------------------------------------------------------*/

            motor.indiceDiscriminacion =

                this.redondear(

                    (

                        motor.ventajaScore *

                        0.70

                    ) +

                    (

                        motor.ventajaConfianza *

                        0.30

                    ),

                    6

                );


            /*------------------------------------------------------
                TASA DESCRIPTIVA
            ------------------------------------------------------*/

            motor.tasaAcierto =

                motor.apariciones > 0

                    ? this.redondear(

                        (

                            motor.aciertos /

                            motor.apariciones

                        ) * 100,

                        4

                    )

                    : 0;

        }


        /*----------------------------------------------------------
            RANKING REAL DE MOTORES
        ----------------------------------------------------------*/

        const rankingMotores =

            Object.values(

                motores

            ).sort(

                (a, b) => {

                    /*
                     * 1. Índice discriminación.
                     */

                    const discriminacionA =

                        this.numeroSeguro(

                            a.indiceDiscriminacion

                        );


                    const discriminacionB =

                        this.numeroSeguro(

                            b.indiceDiscriminacion

                        );


                    if (

                        discriminacionB !==

                        discriminacionA

                    ) {

                        return (

                            discriminacionB -

                            discriminacionA

                        );

                    }


                    /*
                     * 2. Ventaja de score.
                     */

                    const ventajaA =

                        this.numeroSeguro(

                            a.ventajaScore

                        );


                    const ventajaB =

                        this.numeroSeguro(

                            b.ventajaScore

                        );


                    if (

                        ventajaB !==

                        ventajaA

                    ) {

                        return (

                            ventajaB -

                            ventajaA

                        );

                    }


                    /*
                     * 3. Score promedio en aciertos.
                     */

                    const scoreA =

                        this.numeroSeguro(

                            a.promedioScoreAciertos

                        );


                    const scoreB =

                        this.numeroSeguro(

                            b.promedioScoreAciertos

                        );


                    if (

                        scoreB !==

                        scoreA

                    ) {

                        return (

                            scoreB -

                            scoreA

                        );

                    }


                    /*
                     * 4. Nombre estable.
                     */

                    return String(

                        a.motor

                    ).localeCompare(

                        String(

                            b.motor

                        )

                    );

                }

            );


        return {

            motores,

            rankingMotores,

            mejorMotor:

                rankingMotores.length > 0

                    ? rankingMotores[0].motor

                    : null

        };

    }


    /*==============================================================
        COMPORTAMIENTO DEL RANKING
    ==============================================================*/

    analizarComportamientoRanking(

        prediccion,

        realesSet

    ) {

        if (

            !Array.isArray(

                prediccion.rankingCompleto

            )

        ) {

            return {

                cobertura: 0,

                mejorPosicion: null,

                peorPosicion: null,

                promedioPosicion: 0,

                medianaPosicion: 0,

                aciertosTop5: 0,

                aciertosTop10: 0,

                aciertosTop20: 0,

                aciertosTop30: 0,

                aciertosTop50: 0,

                aciertosTop100: 0

            };

        }


        const posiciones = [];


        for (

            const item of

                prediccion.rankingCompleto

        ) {

            const numero =

                Number(

                    item.numero

                );


            if (

                realesSet.has(

                    numero

                )

            ) {

                const posicion =

                    Number(

                        item.posicion

                    );


                if (

                    Number.isFinite(

                        posicion

                    )

                ) {

                    posiciones.push(

                        posicion

                    );

                }

            }

        }


        posiciones.sort(

            (a, b) =>

                a - b

        );


        const cobertura =

            realesSet.size > 0

                ? (

                    posiciones.length /

                    realesSet.size

                ) * 100

                : 0;


        const contarHasta =

            limite =>

                posiciones.filter(

                    posicion =>

                        posicion <=

                        limite

                ).length;


        return {

            cobertura:

                this.redondear(

                    cobertura,

                    4

                ),

            mejorPosicion:

                posiciones.length > 0

                    ? posiciones[0]

                    : null,

            peorPosicion:

                posiciones.length > 0

                    ? posiciones[
                        posiciones.length - 1
                    ]

                    : null,

            promedioPosicion:

                posiciones.length > 0

                    ? this.redondear(

                        posiciones.reduce(

                            (

                                suma,

                                valor

                            ) =>

                                suma + valor,

                            0

                        ) /

                        posiciones.length,

                        4

                    )

                    : 0,

            medianaPosicion:

                this.calcularMediana(

                    posiciones

                ),

            aciertosTop5:

                contarHasta(5),

            aciertosTop10:

                contarHasta(10),

            aciertosTop20:

                contarHasta(20),

            aciertosTop30:

                contarHasta(30),

            aciertosTop50:

                contarHasta(50),

            aciertosTop100:

                contarHasta(100)

        };

    }


    /*==============================================================
        MÉTRICAS GENERALES
    ==============================================================*/

    calcularMetricasGenerales(

        top10,

        top20,

        titulares,

        suplentes,

        rankingCompleto,

        aciertosDetallados

    ) {

        const scoreAciertos =

            aciertosDetallados.map(

                item =>

                    item.score

            );


        const confianzaAciertos =

            aciertosDetallados.map(

                item =>

                    item.confianza

            );


        const promedio =

            valores => {

                if (

                    valores.length === 0

                ) {

                    return 0;

                }


                return this.redondear(

                    valores.reduce(

                        (

                            suma,

                            valor

                        ) =>

                            suma + valor,

                        0

                    ) /

                    valores.length,

                    6

                );

            };


        return {

            aciertosTop10:

                top10.aciertos,

            porcentajeTop10:

                top10.porcentajeAcierto,


            aciertosTop20:

                top20.aciertos,

            porcentajeTop20:

                top20.porcentajeAcierto,


            aciertosTitulares:

                titulares.aciertos,

            porcentajeTitulares:

                titulares.porcentajeAcierto,


            aciertosSuplentes:

                suplentes.aciertos,

            porcentajeSuplentes:

                suplentes.porcentajeAcierto,


            aciertosRankingCompleto:

                rankingCompleto.aciertos,

            porcentajeRankingCompleto:

                rankingCompleto
                    .porcentajeAcierto,


            promedioScoreAciertos:

                promedio(

                    scoreAciertos

                ),


            promedioConfianzaAciertos:

                promedio(

                    confianzaAciertos

                ),


            cantidadAciertos:

                aciertosDetallados.length

        };

    }


    /*==============================================================
        SEÑALES PARA OPTIMIZACIÓN
    ==============================================================*/

    generarSeñalesOptimizacion(

        rendimientoMotores,

        metricas

    ) {

        const señales = [];


        /*----------------------------------------------------------
            MOTOR DESTACADO
        ----------------------------------------------------------*/

        if (

            rendimientoMotores &&

            Array.isArray(

                rendimientoMotores
                    .rankingMotores

            ) &&

            rendimientoMotores
                .rankingMotores
                .length > 0

        ) {

            const mejorMotor =

                rendimientoMotores
                    .rankingMotores[0];


            señales.push({

                tipo:

                    "motor_destacado",

                motor:

                    mejorMotor.motor,

                descripcion:

                    "Motor con mayor capacidad discriminatoria en esta evaluación.",

                indiceDiscriminacion:

                    mejorMotor
                        .indiceDiscriminacion,

                ventajaScore:

                    mejorMotor
                        .ventajaScore,

                ventajaConfianza:

                    mejorMotor
                        .ventajaConfianza

            });

        }


        /*----------------------------------------------------------
            TOP 10
        ----------------------------------------------------------*/

        if (

            metricas.porcentajeTop10 >= 20

        ) {

            señales.push({

                tipo:

                    "top10_favorable",

                valor:

                    metricas
                        .porcentajeTop10,

                descripcion:

                    "El Top 10 obtuvo una cobertura relevante en esta evaluación."

            });

        }

        else {

            señales.push({

                tipo:

                    "top10_debil",

                valor:

                    metricas
                        .porcentajeTop10,

                descripcion:

                    "El Top 10 tuvo una cobertura baja en esta evaluación."

            });

        }


        /*----------------------------------------------------------
            VALOR FUERA TOP 10
        ----------------------------------------------------------*/

        if (

            metricas.aciertosTop20 >

            metricas.aciertosTop10

        ) {

            señales.push({

                tipo:

                    "valor_fuera_top10",

                diferencia:

                    metricas
                        .aciertosTop20 -

                    metricas
                        .aciertosTop10,

                descripcion:

                    "Se produjeron aciertos adicionales entre las posiciones 11 y 20."

            });

        }


        /*----------------------------------------------------------
            SIN ACIERTOS
        ----------------------------------------------------------*/

        if (

            metricas.cantidadAciertos === 0

        ) {

            señales.push({

                tipo:

                    "sin_aciertos",

                descripcion:

                    "No se encontraron coincidencias entre el ranking y los números reales."

            });

        }


        return señales;

    }


    /*==============================================================
        RESUMEN PARA IA
    ==============================================================*/

    generarResumenIA(

        prediccion,

        reales,

        metricas,

        rendimientoMotores,

        comportamientoRanking,

        señalesOptimizacion,

        datosSemana

    ) {

        return {

            tipo:

                "evaluacion_modelo",


            version:

                this.version,


            fecha:

                new Date()
                    .toISOString(),


            semana: {

                id:

                    datosSemana.id ||

                    datosSemana.semanaId ||

                    null,

                numero:

                    datosSemana.numero ||

                    datosSemana.semana ||

                    null,

                fecha:

                    datosSemana.fecha ||

                    null

            },


            prediccionId:

                prediccion.id ||

                null,


            numerosReales:

                reales.map(

                    numero =>

                        this.formatearNumero(

                            numero

                        )

                ),


            metricas,


            comportamientoRanking,


            mejorMotor:

                rendimientoMotores
                    .mejorMotor,


            rendimientoMotores:

                rendimientoMotores
                    .rankingMotores

                    .map(

                        motor => ({

                            motor:

                                motor.motor,

                            apariciones:

                                motor.apariciones,

                            aciertos:

                                motor.aciertos,

                            tasaAcierto:

                                motor.tasaAcierto,

                            promedioScore:

                                motor
                                    .promedioScore,

                            promedioScoreAciertos:

                                motor
                                    .promedioScoreAciertos,

                            ventajaScore:

                                motor
                                    .ventajaScore,

                            promedioConfianza:

                                motor
                                    .promedioConfianza,

                            promedioConfianzaAciertos:

                                motor
                                    .promedioConfianzaAciertos,

                            ventajaConfianza:

                                motor
                                    .ventajaConfianza,

                            indiceDiscriminacion:

                                motor
                                    .indiceDiscriminacion

                        })

                    ),


            señalesOptimizacion,


            interpretacionBase: {

                aclaracion:

                    "Las métricas describen el comportamiento histórico del modelo y no garantizan resultados futuros.",

                objetivo:

                    "Utilizar las evaluaciones acumuladas para analizar qué indicadores resultan más útiles dentro del conjunto histórico.",

                proximaEtapa:

                    "Acumular evaluaciones antes de realizar ajustes automáticos de pesos."

            }

        };

    }


    /*==============================================================
        AGREGAR EVALUACIÓN
    ==============================================================*/

    agregarEvaluacion(

        evaluacion

    ) {

        if (!evaluacion) {

            return false;

        }


        this.historial.push(

            evaluacion

        );


        return true;

    }


    /*==============================================================
        OBTENER HISTORIAL
    ==============================================================*/

    obtenerHistorial() {

        return [

            ...this.historial

        ];

    }


    /*==============================================================
        OBTENER ÚLTIMA EVALUACIÓN
    ==============================================================*/

    obtenerUltimaEvaluacion() {

        if (

            this.historial.length === 0

        ) {

            return null;

        }


        return this.historial[

            this.historial.length - 1

        ];

    }


    /*==============================================================
        RESUMEN ACUMULADO
    ==============================================================*/

    generarResumenAcumulado(

        evaluaciones = null

    ) {

        const lista =

            Array.isArray(

                evaluaciones

            )

                ? evaluaciones

                : this.historial;


        if (

            lista.length === 0

        ) {

            return {

                cantidadSemanas: 0,

                promedioAciertosTop10: 0,

                promedioAciertosTop20: 0,

                promedioAciertosTitulares: 0,

                promedioAciertosSuplentes: 0,

                promedioCoberturaRanking: 0,

                motores: {}

            };

        }


        let sumaTop10 = 0;

        let sumaTop20 = 0;

        let sumaTitulares = 0;

        let sumaSuplentes = 0;

        let sumaCobertura = 0;


        const motores = {};


        for (

            const evaluacion of lista

        ) {

            const metricas =

                evaluacion.metricas ||

                {};


            const comportamiento =

                evaluacion
                    .comportamientoRanking ||

                {};


            sumaTop10 +=

                this.numeroSeguro(

                    metricas
                        .aciertosTop10

                );


            sumaTop20 +=

                this.numeroSeguro(

                    metricas
                        .aciertosTop20

                );


            sumaTitulares +=

                this.numeroSeguro(

                    metricas
                        .aciertosTitulares

                );


            sumaSuplentes +=

                this.numeroSeguro(

                    metricas
                        .aciertosSuplentes

                );


            sumaCobertura +=

                this.numeroSeguro(

                    comportamiento
                        .cobertura

                );


            const rendimiento =

                evaluacion
                    .rendimientoMotores ||

                {};


            const listaMotores =

                rendimiento
                    .rankingMotores ||

                [];


            for (

                const motor of

                    listaMotores

            ) {

                const clave =

                    motor.motor;


                if (

                    !motores[clave]

                ) {

                    motores[clave] = {

                        motor:

                            clave,

                        semanas:

                            0,

                        aciertos:

                            0,

                        apariciones:

                            0,

                        sumaTasaAcierto:

                            0,

                        sumaVentajaScore:

                            0,

                        sumaVentajaConfianza:

                            0,

                        sumaIndiceDiscriminacion:

                            0,

                        promedioTasaAcierto:

                            0,

                        promedioVentajaScore:

                            0,

                        promedioVentajaConfianza:

                            0,

                        promedioIndiceDiscriminacion:

                            0

                    };

                }


                motores[clave]
                    .semanas++;


                motores[clave]
                    .aciertos +=

                        this.numeroSeguro(

                            motor.aciertos

                        );


                motores[clave]
                    .apariciones +=

                        this.numeroSeguro(

                            motor.apariciones

                        );


                motores[clave]
                    .sumaTasaAcierto +=

                        this.numeroSeguro(

                            motor.tasaAcierto

                        );


                motores[clave]
                    .sumaVentajaScore +=

                        this.numeroSeguro(

                            motor.ventajaScore

                        );


                motores[clave]
                    .sumaVentajaConfianza +=

                        this.numeroSeguro(

                            motor.ventajaConfianza

                        );


                motores[clave]
                    .sumaIndiceDiscriminacion +=

                        this.numeroSeguro(

                            motor.indiceDiscriminacion

                        );

            }

        }


        /*----------------------------------------------------------
            PROMEDIOS POR MOTOR
        ----------------------------------------------------------*/

        for (

            const clave in motores

        ) {

            const motor =

                motores[clave];


            motor.promedioTasaAcierto =

                motor.semanas > 0

                    ? this.redondear(

                        motor
                            .sumaTasaAcierto /

                        motor.semanas,

                        6

                    )

                    : 0;


            motor.promedioVentajaScore =

                motor.semanas > 0

                    ? this.redondear(

                        motor
                            .sumaVentajaScore /

                        motor.semanas,

                        6

                    )

                    : 0;


            motor.promedioVentajaConfianza =

                motor.semanas > 0

                    ? this.redondear(

                        motor
                            .sumaVentajaConfianza /

                        motor.semanas,

                        6

                    )

                    : 0;


            motor.promedioIndiceDiscriminacion =

                motor.semanas > 0

                    ? this.redondear(

                        motor
                            .sumaIndiceDiscriminacion /

                        motor.semanas,

                        6

                    )

                    : 0;


            delete motor
                .sumaTasaAcierto;


            delete motor
                .sumaVentajaScore;


            delete motor
                .sumaVentajaConfianza;


            delete motor
                .sumaIndiceDiscriminacion;

        }


        const cantidadSemanas =

            lista.length;


        return {

            cantidadSemanas,


            promedioAciertosTop10:

                this.redondear(

                    sumaTop10 /

                    cantidadSemanas,

                    6

                ),


            promedioAciertosTop20:

                this.redondear(

                    sumaTop20 /

                    cantidadSemanas,

                    6

                ),


            promedioAciertosTitulares:

                this.redondear(

                    sumaTitulares /

                    cantidadSemanas,

                    6

                ),


            promedioAciertosSuplentes:

                this.redondear(

                    sumaSuplentes /

                    cantidadSemanas,

                    6

                ),


            promedioCoberturaRanking:

                this.redondear(

                    sumaCobertura /

                    cantidadSemanas,

                    6

                ),


            motores

        };

    }


    /*==============================================================
        COMPROBAR SI HAY DATOS SUFICIENTES
    ==============================================================*/

    hayDatosParaOptimizar(

        cantidadSemanas = null

    ) {

        const cantidad =

            cantidadSemanas !== null

                ? Number(

                    cantidadSemanas

                )

                : this.historial.length;


        return (

            cantidad >=

            this.configuracion
                .minimoSemanasParaOptimizacion

        );

    }


    /*==============================================================
        COMPARAR DOS PERIODOS
    ==============================================================*/

    compararPeriodos(

        periodoAnterior,

        periodoActual

    ) {

        const anterior =

            this.generarResumenAcumulado(

                periodoAnterior

            );


        const actual =

            this.generarResumenAcumulado(

                periodoActual

            );


        return {

            anterior,

            actual,


            variaciones: {

                top10:

                    this.redondear(

                        actual
                            .promedioAciertosTop10 -

                        anterior
                            .promedioAciertosTop10,

                        6

                    ),


                top20:

                    this.redondear(

                        actual
                            .promedioAciertosTop20 -

                        anterior
                            .promedioAciertosTop20,

                        6

                    ),


                titulares:

                    this.redondear(

                        actual
                            .promedioAciertosTitulares -

                        anterior
                            .promedioAciertosTitulares,

                        6

                    ),


                suplentes:

                    this.redondear(

                        actual
                            .promedioAciertosSuplentes -

                        anterior
                            .promedioAciertosSuplentes,

                        6

                    ),


                cobertura:

                    this.redondear(

                        actual
                            .promedioCoberturaRanking -

                        anterior
                            .promedioCoberturaRanking,

                        6

                    )

            }

        };

    }


    /*==============================================================
        MEDIANA
    ==============================================================*/

    calcularMediana(

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


        const lista = [

            ...valores

        ].sort(

            (a, b) =>

                a - b

        );


        const mitad =

            Math.floor(

                lista.length /

                2

            );


        if (

            lista.length % 2 === 0

        ) {

            return this.redondear(

                (

                    lista[mitad - 1] +

                    lista[mitad]

                ) / 2,

                6

            );

        }


        return this.redondear(

            lista[mitad],

            6

        );

    }


    /*==============================================================
        NORMALIZAR LISTA DE NÚMEROS
    ==============================================================*/

    normalizarListaNumeros(

        numeros

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

            const numero of numeros

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


    /*==============================================================
        FORMATO 00-99
    ==============================================================*/

    formatearNumero(

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

            return null;

        }


        return String(

            valor

        ).padStart(

            2,

            "0"

        );

    }


    /*==============================================================
        NÚMERO SEGURO
    ==============================================================*/

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


    /*==============================================================
        REDONDEAR
    ==============================================================*/

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


    /*==============================================================
        GENERAR ID
    ==============================================================*/

    generarIdEvaluacion() {

        const fecha =

            new Date()

                .toISOString()

                .replace(

                    /[^0-9]/g,

                    ""

                );


        const aleatorio =

            Math.random()

                .toString(

                    36

                )

                .substring(

                    2,

                    8

                );


        return (

            `evaluacion_${fecha}_${aleatorio}`

        );

    }


    /*==============================================================
        OBTENER ESTADO
    ==============================================================*/

    obtenerEstado() {

        return {

            nombre:

                this.nombre,

            version:

                this.version,

            evaluaciones:

                this.historial.length,

            minimoSemanasParaOptimizacion:

                this.configuracion
                    .minimoSemanasParaOptimizacion,

            datosSuficientesParaOptimizar:

                this.hayDatosParaOptimizar()

        };

    }


    /*==============================================================
        LIMPIAR HISTORIAL EN MEMORIA
    ==============================================================*/

    limpiarHistorial() {

        this.historial = [];

        return true;

    }

}