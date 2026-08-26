/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * js/motores/MotorRanking.js
 *
 * Propósito:
 *
 * Construir el ranking final de los números 00-99
 * utilizando los resultados producidos por MotorManager.
 *
 * Responsabilidades:
 *
 * - Recibir análisis de MotorManager
 * - Normalizar resultados
 * - Ordenar candidatos
 * - Reconocer empates reales
 * - Asignar posiciones
 * - Calcular percentiles
 * - Clasificar candidatos
 * - Generar TOP 10 / TOP 20
 * - Generar equipo titular / suplente
 * - Preparar predicciones
 * - Evaluar predicciones históricas
 * - Preparar información para futura autoevaluación
 *
 * IMPORTANTE:
 *
 * El ranking es heurístico.
 * NO representa probabilidad matemática de aparición.
 *
 **********************************************************************/


export default class MotorRanking {


    /*================================================================
        CONSTRUCTOR
    ================================================================*/

    constructor(configuracion = {}) {

        this.nombre =
            "MotorRanking";

        this.version =
            "2.0.0";


        this.configuracion = {

            top10:
                Number(configuracion.top10) || 10,

            top20:
                Number(configuracion.top20) || 20,

            titulares:
                Number(configuracion.titulares) || 10,

            suplentes:
                Number(configuracion.suplentes) || 10,

            toleranciaEmpate:
                Number.isFinite(
                    Number(
                        configuracion.toleranciaEmpate
                    )
                )
                    ? Number(
                        configuracion.toleranciaEmpate
                    )
                    : 0.0001

        };

    }


    /*================================================================
        GENERAR RANKING
    ================================================================*/

    generar(
        resultados,
        opciones = {}
    ) {

        const lista =
            this.extraerLista(
                resultados
            );


        if (
            lista.length === 0
        ) {

            return this.resultadoVacio();

        }


        /*
         * Normalizamos resultados provenientes
         * de MotorManager.
         */

        const candidatos =
            lista.map(

                resultado =>
                    this.normalizarResultado(
                        resultado
                    )

            );


        /*
         * Ordenamos.
         */

        const ranking =
            this.ordenarRanking(
                candidatos
            );


        /*
         * Posiciones con reconocimiento
         * de empates reales.
         */

        this.asignarPosiciones(
            ranking
        );


        /*
         * Percentiles.
         */

        this.asignarPercentiles(
            ranking
        );


        /*
         * Categorías.
         */

        this.asignarCategorias(
            ranking
        );


        /*
         * Diferencias respecto del promedio.
         */

        const promedio =
            this.promedio(

                ranking.map(
                    item =>
                        item.score
                )

            );


        ranking.forEach(
            item => {

                item.diferenciaPromedio =
                    this.redondear(

                        item.score -
                        promedio,

                        4

                    );

            }
        );


        /*------------------------------------------------------------
            CONFIGURACIÓN
        ------------------------------------------------------------*/

        const cantidadTop10 =
            this.normalizarCantidad(

                opciones.top10 ??
                this.configuracion.top10,

                10

            );


        const cantidadTop20 =
            this.normalizarCantidad(

                opciones.top20 ??
                this.configuracion.top20,

                20

            );


        const cantidadTitulares =
            this.normalizarCantidad(

                opciones.titulares ??
                this.configuracion.titulares,

                10

            );


        const cantidadSuplentes =
            this.normalizarCantidad(

                opciones.suplentes ??
                this.configuracion.suplentes,

                10

            );


        /*------------------------------------------------------------
            GRUPOS
        ------------------------------------------------------------*/

        const top10 =
            ranking.slice(
                0,
                cantidadTop10
            );


        const top20 =
            ranking.slice(
                0,
                cantidadTop20
            );


        const titulares =
            ranking.slice(
                0,
                cantidadTitulares
            );


        const inicioSuplentes =

            opciones.inicioSuplentes !==
                undefined

                ? Math.max(
                    0,
                    Number(
                        opciones.inicioSuplentes
                    ) || 0
                )

                : cantidadTitulares;


        const suplentes =
            ranking.slice(

                inicioSuplentes,

                inicioSuplentes +
                cantidadSuplentes

            );


        /*------------------------------------------------------------
            DISTRIBUCIÓN
        ------------------------------------------------------------*/

        const distribucion =
            this.calcularDistribucion(
                ranking
            );


        /*------------------------------------------------------------
            ESTADÍSTICAS
        ------------------------------------------------------------*/

        const estadisticas =
            this.calcularEstadisticas(
                ranking
            );


        /*------------------------------------------------------------
            RESUMEN IA
        ------------------------------------------------------------*/

        const resumenIA =
            this.generarResumenIA(

                ranking,

                top10,

                top20,

                titulares,

                suplentes,

                estadisticas

            );


        const idRanking =
            this.generarIdRanking();


        return {

            id:
                idRanking,

            nombre:
                this.nombre,

            version:
                this.version,

            generadoEn:
                new Date()
                    .toISOString(),

            totalNumeros:
                ranking.length,

            ranking,

            top10,

            top20,

            equipoTitular:
                titulares,

            equipoSuplente:
                suplentes,

            distribucion,

            estadisticas,

            resumenIA

        };

    }


    /*================================================================
        EXTRAER LISTA
    ================================================================*/

    extraerLista(
        resultados
    ) {

        /*
         * MotorManager.analizarTodos()
         * devuelve directamente un array.
         */

        if (
            Array.isArray(
                resultados
            )
        ) {

            return resultados;

        }


        /*
         * Formato:
         *
         * {
         *     resultados: [...]
         * }
         */

        if (
            resultados &&
            Array.isArray(
                resultados.resultados
            )
        ) {

            return resultados.resultados;

        }


        /*
         * Ranking previamente generado.
         */

        if (
            resultados &&
            Array.isArray(
                resultados.ranking
            )
        ) {

            return resultados.ranking;

        }


        return [];

    }


    /*================================================================
        NORMALIZAR RESULTADO
    ================================================================*/

    normalizarResultado(
        resultado
    ) {

        if (!resultado) {

            throw new Error(
                "MotorRanking: resultado inválido."
            );

        }


        const numero =
            this.normalizarNumero(
                resultado.numero
            );


        /*------------------------------------------------------------
            SCORE
        ------------------------------------------------------------*/

        const score =
            this.limitar(

                this.numeroSeguro(
                    resultado.score
                ),

                0,

                100

            );


        /*------------------------------------------------------------
            CONFIANZA
        ------------------------------------------------------------*/

        const confianza =
            this.limitar(

                this.numeroSeguro(
                    resultado.confianza
                ),

                0,

                100

            );


        /*------------------------------------------------------------
            CANTIDAD DE MOTORES
        ------------------------------------------------------------*/

        const cantidadMotores =
            this.numeroSeguro(

                resultado.motoresUtilizados ??

                resultado.cantidadMotores ??

                0

            );


        const motoresDisponibles =
            this.numeroSeguro(

                resultado.motoresDisponibles ??

                cantidadMotores

            );


        /*------------------------------------------------------------
            RESULTADOS DE MOTORES
        ------------------------------------------------------------*/

        const motores =

            resultado.resultados ??

            resultado.motores ??

            {};


        const resumenMotores =
            this.resumirMotores(
                motores
            );


        return {

            numero,

            numeroTexto:
                this.formatearNumero(
                    numero
                ),

            score:
                this.redondear(
                    score,
                    6
                ),

            scoreBruto:
                this.redondear(

                    this.numeroSeguro(
                        resultado.scoreBruto,
                        score
                    ),

                    6

                ),

            confianza:
                this.redondear(
                    confianza,
                    6
                ),

            pesoTotal:
                this.redondear(

                    this.numeroSeguro(
                        resultado.pesoTotal
                    ),

                    6

                ),

            cantidadMotores,

            motoresDisponibles,

            motores,

            resumenMotores,

            detallePesos:
                Array.isArray(
                    resultado.detallePesos
                )
                    ? resultado.detallePesos
                    : [],

            origenCreado:
                resultado.creado || null,

            posicion:
                null,

            orden:
                null,

            percentil:
                0,

            categoria:
                null,

            empate:
                false,

            diferenciaPromedio:
                0

        };

    }


    /*================================================================
        RESUMIR MOTORES
    ================================================================*/

    resumirMotores(
        motores
    ) {

        const resumen = {};


        if (
            !motores ||
            typeof motores !==
                "object"
        ) {

            return resumen;

        }


        for (
            const clave
            in motores
        ) {

            const resultado =
                motores[clave];


            if (!resultado) {

                continue;

            }


            resumen[clave] = {

                motor:
                    resultado.motor ??
                    clave,

                score:
                    this.redondear(

                        this.numeroSeguro(
                            resultado.score
                        ),

                        4

                    ),

                confianza:
                    this.redondear(

                        this.numeroSeguro(
                            resultado.confianza
                        ),

                        4

                    ),

                peso:
                    this.redondear(

                        this.numeroSeguro(
                            resultado.peso
                        ),

                        4

                    ),

                evidencia:
                    resultado.evidencia ??
                    null,

                indicadores:
                    resultado.indicadores ??
                    {},

                detalle:
                    resultado.detalle ??
                    {}

            };

        }


        return resumen;

    }


    /*================================================================
        ORDENAR RANKING
    ================================================================*/

    ordenarRanking(
        candidatos
    ) {

        return [
            ...candidatos
        ].sort(

            (a, b) => {

                /*
                 * 1. Score global.
                 */

                if (
                    !this.sonIguales(
                        a.score,
                        b.score
                    )
                ) {

                    return (
                        b.score -
                        a.score
                    );

                }


                /*
                 * 2. Confianza global.
                 */

                if (
                    !this.sonIguales(
                        a.confianza,
                        b.confianza
                    )
                ) {

                    return (
                        b.confianza -
                        a.confianza
                    );

                }


                /*
                 * 3. Motores utilizados.
                 */

                if (
                    b.cantidadMotores !==
                    a.cantidadMotores
                ) {

                    return (
                        b.cantidadMotores -
                        a.cantidadMotores
                    );

                }


                /*
                 * 4. Número solamente como
                 * criterio estable de presentación.
                 *
                 * NO modifica la posición heurística
                 * cuando existe empate real.
                 */

                return (
                    a.numero -
                    b.numero
                );

            }

        );

    }


    /*================================================================
        ASIGNAR POSICIONES
    ================================================================*/

    asignarPosiciones(
        ranking
    ) {

        let posicionActual = 0;

        let anterior = null;


        ranking.forEach(

            (
                item,
                indice
            ) => {

                /*
                 * Orden físico de la tabla.
                 */

                item.orden =
                    indice + 1;


                /*
                 * Primer candidato.
                 */

                if (!anterior) {

                    posicionActual = 1;

                    item.posicion =
                        posicionActual;

                    item.empate =
                        false;

                    anterior =
                        item;

                    return;

                }


                /*
                 * Empate heurístico:
                 *
                 * - mismo score
                 * - misma confianza
                 * - misma cantidad de motores
                 */

                const empate =

                    this.sonIguales(
                        item.score,
                        anterior.score
                    ) &&

                    this.sonIguales(
                        item.confianza,
                        anterior.confianza
                    ) &&

                    item.cantidadMotores ===
                        anterior.cantidadMotores;


                if (empate) {

                    item.posicion =
                        posicionActual;

                    item.empate =
                        true;

                    anterior.empate =
                        true;

                }

                else {

                    /*
                     * Ranking competitivo:
                     *
                     * 1,1,1,4...
                     */

                    posicionActual =
                        indice + 1;

                    item.posicion =
                        posicionActual;

                    item.empate =
                        false;

                }


                anterior =
                    item;

            }

        );


        return ranking;

    }


    /*================================================================
        ASIGNAR PERCENTILES
    ================================================================*/

    asignarPercentiles(
        ranking
    ) {

        const total =
            ranking.length;


        if (
            total === 0
        ) {

            return ranking;

        }


        ranking.forEach(
            item => {

                if (
                    total === 1
                ) {

                    item.percentil =
                        100;

                    return;

                }


                const percentil =

                    100 *

                    (

                        1 -

                        (

                            item.posicion -
                            1

                        ) /

                        (

                            total -
                            1

                        )

                    );


                item.percentil =
                    this.redondear(

                        this.limitar(
                            percentil,
                            0,
                            100
                        ),

                        2

                    );

            }
        );


        return ranking;

    }


    /*================================================================
        CATEGORÍAS
    ================================================================*/

    asignarCategorias(
        ranking
    ) {

        ranking.forEach(
            item => {

                const percentil =
                    item.percentil;


                if (
                    percentil >= 90
                ) {

                    item.categoria =
                        "MUY_ALTO";

                }

                else if (
                    percentil >= 75
                ) {

                    item.categoria =
                        "ALTO";

                }

                else if (
                    percentil >= 50
                ) {

                    item.categoria =
                        "MEDIO";

                }

                else if (
                    percentil >= 25
                ) {

                    item.categoria =
                        "BAJO";

                }

                else {

                    item.categoria =
                        "MUY_BAJO";

                }

            }
        );


        return ranking;

    }


    /*================================================================
        DISTRIBUCIÓN POR RANGOS
    ================================================================*/

    calcularDistribucion(
        ranking
    ) {

        const rangos = {};


        for (
            let i = 0;
            i < 10;
            i++
        ) {

            const inicio =
                i * 10;

            const fin =
                inicio + 9;


            const clave =
                `${String(inicio).padStart(2, "0")}-${String(fin).padStart(2, "0")}`;


            rangos[clave] = {

                inicio,

                fin,

                cantidad: 0,

                scorePromedio: 0,

                confianzaPromedio: 0,

                mejorPosicion: null,

                numeros: []

            };

        }


        for (
            const item
            of ranking
        ) {

            const inicio =
                Math.floor(
                    item.numero /
                    10
                ) * 10;


            const fin =
                inicio + 9;


            const clave =
                `${String(inicio).padStart(2, "0")}-${String(fin).padStart(2, "0")}`;


            const grupo =
                rangos[clave];


            if (!grupo) {

                continue;

            }


            grupo.cantidad++;


            grupo.numeros.push({

                numero:
                    item.numeroTexto,

                posicion:
                    item.posicion,

                score:
                    item.score

            });


            if (
                grupo.mejorPosicion ===
                    null ||

                item.posicion <
                    grupo.mejorPosicion
            ) {

                grupo.mejorPosicion =
                    item.posicion;

            }

        }


        for (
            const clave
            in rangos
        ) {

            const grupo =
                rangos[clave];


            if (
                grupo.numeros.length ===
                0
            ) {

                continue;

            }


            const candidatos =
                ranking.filter(

                    item =>
                        item.numero >=
                            grupo.inicio &&

                        item.numero <=
                            grupo.fin

                );


            grupo.scorePromedio =
                this.redondear(

                    this.promedio(

                        candidatos.map(
                            item =>
                                item.score
                        )

                    ),

                    4

                );


            grupo.confianzaPromedio =
                this.redondear(

                    this.promedio(

                        candidatos.map(
                            item =>
                                item.confianza
                        )

                    ),

                    4

                );

        }


        return rangos;

    }


    /*================================================================
        ESTADÍSTICAS GENERALES
    ================================================================*/

    calcularEstadisticas(
        ranking
    ) {

        if (
            ranking.length ===
            0
        ) {

            return this.estadisticasVacias();

        }


        const scores =
            ranking.map(
                item =>
                    item.score
            );


        const confianzas =
            ranking.map(
                item =>
                    item.confianza
            );


        const scorePromedio =
            this.promedio(
                scores
            );


        const confianzaPromedio =
            this.promedio(
                confianzas
            );


        const scoreMaximo =
            Math.max(
                ...scores
            );


        const scoreMinimo =
            Math.min(
                ...scores
            );


        const desviacionScore =
            this.desviacionEstandar(
                scores
            );


        const top1 =
            ranking[0]?.score ??
            0;


        const top10 =
            ranking[9]?.score ??
            0;


        const top20 =
            ranking[19]?.score ??
            0;


        const posicionesUnicas =
            new Set(

                ranking.map(
                    item =>
                        item.posicion
                )

            );


        const cantidadEmpatados =
            ranking.filter(
                item =>
                    item.empate
            ).length;


        return {

            scoreMaximo:
                this.redondear(
                    scoreMaximo,
                    6
                ),

            scoreMinimo:
                this.redondear(
                    scoreMinimo,
                    6
                ),

            scorePromedio:
                this.redondear(
                    scorePromedio,
                    6
                ),

            desviacionScore:
                this.redondear(
                    desviacionScore,
                    6
                ),

            confianzaPromedio:
                this.redondear(
                    confianzaPromedio,
                    6
                ),

            diferenciaTop1Top10:
                this.redondear(
                    top1 -
                    top10,
                    6
                ),

            diferenciaTop10Top20:
                this.redondear(
                    top10 -
                    top20,
                    6
                ),

            posicionesUnicas:
                posicionesUnicas.size,

            cantidadEmpatados,

            totalNumeros:
                ranking.length

        };

    }


    /*================================================================
        RESUMEN PARA IA
    ================================================================*/

    generarResumenIA(

        ranking,

        top10,

        top20,

        titulares,

        suplentes,

        estadisticas

    ) {

        return {

            fecha:
                new Date()
                    .toISOString(),

            modelo: {

                nombre:
                    this.nombre,

                version:
                    this.version

            },

            totalNumeros:
                ranking.length,

            top10:
                top10.map(
                    item =>
                        this.formatoIA(
                            item
                        )
                ),

            top20:
                top20.map(
                    item =>
                        this.formatoIA(
                            item
                        )
                ),

            equipoTitular:
                titulares.map(
                    item =>
                        this.formatoIA(
                            item
                        )
                ),

            equipoSuplente:
                suplentes.map(
                    item =>
                        this.formatoIA(
                            item
                        )
                ),

            estadisticasGenerales:
                estadisticas,

            rankingCompleto:
                ranking.map(
                    item =>
                        this.formatoIA(
                            item
                        )
                )

        };

    }


    /*================================================================
        FORMATO PARA IA
    ================================================================*/

    formatoIA(
        item
    ) {

        return {

            numero:
                item.numeroTexto,

            posicion:
                item.posicion,

            orden:
                item.orden,

            empate:
                item.empate,

            percentil:
                item.percentil,

            categoria:
                item.categoria,

            score:
                item.score,

            confianza:
                item.confianza,

            diferenciaPromedio:
                item.diferenciaPromedio,

            cantidadMotores:
                item.cantidadMotores,

            motoresDisponibles:
                item.motoresDisponibles,

            motores:
                Object.fromEntries(

                    Object.entries(

                        item.resumenMotores ??
                        {}

                    ).map(

                        (
                            [
                                clave,
                                datos
                            ]
                        ) => [

                            clave,

                            {

                                score:
                                    datos.score,

                                confianza:
                                    datos.confianza,

                                peso:
                                    datos.peso,

                                evidencia:
                                    datos.evidencia,

                                indicadores:
                                    datos.indicadores

                            }

                        ]

                    )

                )

        };

    }


    /*================================================================
        PREPARAR PREDICCIÓN
    ================================================================*/

    prepararPrediccion(
        ranking,
        datosSemana = {}
    ) {

        if (
            !ranking ||
            !Array.isArray(
                ranking.ranking
            )
        ) {

            throw new Error(
                "Ranking inválido."
            );

        }


        return {

            id:
                ranking.id,

            fechaPrediccion:
                ranking.generadoEn,

            semanaObjetivo:
                datosSemana.semanaObjetivo ??
                null,

            fechaObjetivo:
                datosSemana.fechaObjetivo ??
                null,

            modelo: {

                nombre:
                    this.nombre,

                version:
                    this.version

            },

            top10:
                ranking.top10.map(
                    item =>
                        this.crearRegistroPrediccion(
                            item
                        )
                ),

            top20:
                ranking.top20.map(
                    item =>
                        this.crearRegistroPrediccion(
                            item
                        )
                ),

            equipoTitular:
                ranking.equipoTitular.map(
                    item =>
                        this.crearRegistroPrediccion(
                            item
                        )
                ),

            equipoSuplente:
                ranking.equipoSuplente.map(
                    item =>
                        this.crearRegistroPrediccion(
                            item
                        )
                ),

            rankingCompleto:
                ranking.ranking.map(
                    item =>
                        this.crearRegistroPrediccion(
                            item
                        )
                ),

            evaluacion: {

                realizada: false,

                aciertosTop10:
                    null,

                aciertosTop20:
                    null,

                aciertosTitulares:
                    null,

                aciertosSuplentes:
                    null,

                fechaEvaluacion:
                    null

            }

        };

    }


    /*================================================================
        REGISTRO DE PREDICCIÓN
    ================================================================*/

    crearRegistroPrediccion(
        item
    ) {

        return {

            numero:
                item.numeroTexto,

            posicion:
                item.posicion,

            orden:
                item.orden,

            empate:
                item.empate,

            percentil:
                item.percentil,

            categoria:
                item.categoria,

            score:
                item.score,

            confianza:
                item.confianza,

            cantidadMotores:
                item.cantidadMotores,

            motores:
                item.resumenMotores

        };

    }


    /*================================================================
        EVALUAR PREDICCIÓN
    ================================================================*/

    evaluarPrediccion(
        prediccion,
        numerosReales
    ) {

        if (!prediccion) {

            throw new Error(
                "Predicción inexistente."
            );

        }


        const reales =
            this.normalizarListaNumeros(
                numerosReales
            );


        const realesSet =
            new Set(
                reales
            );


        const evaluarGrupo =
            grupo => {

                if (
                    !Array.isArray(
                        grupo
                    )
                ) {

                    return {

                        aciertos: 0,

                        porcentaje: 0,

                        numerosAcertados: []

                    };

                }


                const aciertos =
                    grupo.filter(

                        item =>
                            realesSet.has(

                                Number(
                                    item.numero
                                )

                            )

                    );


                return {

                    aciertos:
                        aciertos.length,

                    porcentaje:

                        grupo.length > 0

                            ? this.redondear(

                                (

                                    aciertos.length /
                                    grupo.length

                                ) * 100,

                                4

                            )

                            : 0,

                    numerosAcertados:
                        aciertos.map(
                            item =>
                                item.numero
                        )

                };

            };


        const resultado = {

            fechaEvaluacion:
                new Date()
                    .toISOString(),

            numerosReales:
                reales.map(
                    numero =>
                        this.formatearNumero(
                            numero
                        )
                ),

            top10:
                evaluarGrupo(
                    prediccion.top10
                ),

            top20:
                evaluarGrupo(
                    prediccion.top20
                ),

            equipoTitular:
                evaluarGrupo(
                    prediccion.equipoTitular
                ),

            equipoSuplente:
                evaluarGrupo(
                    prediccion.equipoSuplente
                ),

            rankingCompleto:
                evaluarGrupo(
                    prediccion.rankingCompleto
                )

        };


        resultado.aciertosPorPosicion =
            this.calcularAciertosPorPosicion(

                prediccion,

                realesSet

            );


        resultado.mejoresAciertos =
            this.obtenerMejoresAciertos(

                prediccion,

                realesSet

            );


        return resultado;

    }


    /*================================================================
        ACIERTOS POR POSICIÓN
    ================================================================*/

    calcularAciertosPorPosicion(
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


        return prediccion
            .rankingCompleto
            .map(

                item => {

                    const numero =
                        Number(
                            item.numero
                        );


                    return {

                        numero:
                            item.numero,

                        posicion:
                            item.posicion,

                        orden:
                            item.orden,

                        acierto:
                            realesSet.has(
                                numero
                            ),

                        score:
                            item.score,

                        confianza:
                            item.confianza,

                        motores:
                            item.motores

                    };

                }

            );

    }


    /*================================================================
        MEJORES ACIERTOS
    ================================================================*/

    obtenerMejoresAciertos(
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


        return prediccion
            .rankingCompleto

            .filter(

                item =>
                    realesSet.has(

                        Number(
                            item.numero
                        )

                    )

            )

            .map(

                item => ({

                    numero:
                        item.numero,

                    posicion:
                        item.posicion,

                    orden:
                        item.orden,

                    score:
                        item.score,

                    confianza:
                        item.confianza,

                    motores:
                        item.motores

                })

            )

            .sort(

                (a, b) => {

                    if (
                        a.posicion !==
                        b.posicion
                    ) {

                        return (
                            a.posicion -
                            b.posicion
                        );

                    }


                    return (
                        a.orden -
                        b.orden
                    );

                }

            );

    }


    /*================================================================
        NORMALIZAR LISTA
    ================================================================*/

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
        RESULTADO VACÍO
    ================================================================*/

    resultadoVacio() {

        return {

            id:
                this.generarIdRanking(),

            nombre:
                this.nombre,

            version:
                this.version,

            generadoEn:
                new Date()
                    .toISOString(),

            totalNumeros: 0,

            ranking: [],

            top10: [],

            top20: [],

            equipoTitular: [],

            equipoSuplente: [],

            distribucion: {},

            estadisticas:
                this.estadisticasVacias(),

            resumenIA: {

                top10: [],

                top20: [],

                equipoTitular: [],

                equipoSuplente: [],

                rankingCompleto: []

            }

        };

    }


    /*================================================================
        ESTADÍSTICAS VACÍAS
    ================================================================*/

    estadisticasVacias() {

        return {

            scoreMaximo: 0,

            scoreMinimo: 0,

            scorePromedio: 0,

            desviacionScore: 0,

            confianzaPromedio: 0,

            diferenciaTop1Top10: 0,

            diferenciaTop10Top20: 0,

            posicionesUnicas: 0,

            cantidadEmpatados: 0,

            totalNumeros: 0

        };

    }


    /*================================================================
        ID RANKING
    ================================================================*/

    generarIdRanking() {

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
            `ranking_${fecha}_${aleatorio}`
        );

    }


    /*================================================================
        NORMALIZAR NÚMERO
    ================================================================*/

    normalizarNumero(
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
        FORMATO 00-99
    ================================================================*/

    formatearNumero(
        numero
    ) {

        return String(

            this.normalizarNumero(
                numero
            )

        ).padStart(
            2,
            "0"
        );

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
        PROMEDIO
    ================================================================*/

    promedio(
        lista = []
    ) {

        if (
            !Array.isArray(
                lista
            ) ||
            lista.length === 0
        ) {

            return 0;

        }


        const validos =
            lista
                .map(Number)
                .filter(
                    Number.isFinite
                );


        if (
            validos.length === 0
        ) {

            return 0;

        }


        return (

            validos.reduce(
                (
                    suma,
                    valor
                ) =>
                    suma +
                    valor,
                0
            ) /
            validos.length

        );

    }


    /*================================================================
        DESVIACIÓN ESTÁNDAR
    ================================================================*/

    desviacionEstandar(
        lista = []
    ) {

        if (
            !Array.isArray(
                lista
            ) ||
            lista.length === 0
        ) {

            return 0;

        }


        const promedio =
            this.promedio(
                lista
            );


        const varianza =
            lista.reduce(

                (
                    acumulado,
                    valor
                ) => {

                    const diferencia =
                        Number(valor) -
                        promedio;


                    return (

                        acumulado +
                        Math.pow(
                            diferencia,
                            2
                        )

                    );

                },

                0

            ) /
            lista.length;


        return Math.sqrt(
            varianza
        );

    }


    /*================================================================
        COMPARAR CON TOLERANCIA
    ================================================================*/

    sonIguales(
        a,
        b
    ) {

        return (

            Math.abs(

                this.numeroSeguro(a) -
                this.numeroSeguro(b)

            ) <=

            this.configuracion
                .toleranciaEmpate

        );

    }


    /*================================================================
        NORMALIZAR CANTIDAD
    ================================================================*/

    normalizarCantidad(
        valor,
        defecto
    ) {

        const numero =
            Number(valor);


        if (
            !Number.isInteger(
                numero
            ) ||
            numero <= 0
        ) {

            return defecto;

        }


        return Math.min(
            numero,
            100
        );

    }


    /*================================================================
        OBTENER TOP
    ================================================================*/

    obtenerTop(
        ranking,
        cantidad = 10
    ) {

        if (
            !ranking ||
            !Array.isArray(
                ranking.ranking
            )
        ) {

            return [];

        }


        return ranking
            .ranking
            .slice(

                0,

                this.normalizarCantidad(
                    cantidad,
                    10
                )

            );

    }


    /*================================================================
        OBTENER ESTADO
    ================================================================*/

    obtenerEstado() {

        return {

            nombre:
                this.nombre,

            version:
                this.version,

            configuracion: {

                ...this.configuracion

            }

        };

    }

}