
/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * js/motores/MotorRanking.js
 *
 * Propósito:
 * Construir el ranking final de números 00-99 a partir de los
 * resultados obtenidos por MotorManager.
 *
 * Responsabilidades:
 *
 *   - Recibir resultados de MotorManager.
 *   - Ordenar 00-99 por score.
 *   - Resolver empates.
 *   - Generar Top 10.
 *   - Generar Top 20.
 *   - Generar Equipo Titular.
 *   - Generar Equipo Suplente.
 *   - Conservar información de los motores.
 *   - Generar una estructura preparada para la autoevaluación.
 *
 * IMPORTANTE:
 *
 * MotorRanking NO modifica los resultados individuales de los motores.
 *
 * Solamente los organiza y genera una capa superior de información.
 *
 **********************************************************************/

export default class MotorRanking {


    constructor(configuracion = {}) {

        this.nombre =

            "MotorRanking";


        this.version =

            "1.0.0";


        /*
         * Configuración del ranking.
         */

        this.configuracion = {

            top10:

                configuracion.top10 ||

                10,

            top20:

                configuracion.top20 ||

                20,

            titulares:

                configuracion.titulares ||

                10,

            suplentes:

                configuracion.suplentes ||

                10

        };

    }


    /*==============================================================
        MÉTODO PRINCIPAL
    ==============================================================*/

    generar(

        resultados,

        opciones = {}

    ) {

        /*
         * Aceptamos tanto:
         *
         *   MotorManager.analizarTodos()
         *
         * como:
         *
         *   MotorManager.generarRanking()
         *
         */

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
         * Normalizamos los resultados.

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
         * Asignamos posiciones.

         */

        this.asignarPosiciones(

            ranking

        );


        /*
         * Generamos los diferentes grupos.

         */

        const top10 =

            ranking.slice(

                0,

                opciones.top10 ||

                this.configuracion.top10

            );


        const top20 =

            ranking.slice(

                0,

                opciones.top20 ||

                this.configuracion.top20

            );


        const titulares =

            ranking.slice(

                0,

                opciones.titulares ||

                this.configuracion.titulares

            );


        const inicioSuplentes =

            opciones.inicioSuplentes !==

                undefined

                ? Number(

                    opciones.inicioSuplentes

                )

                : (

                    opciones.titulares ||

                    this.configuracion.titulares

                );


        const suplentes =

            ranking.slice(

                inicioSuplentes,

                inicioSuplentes +

                (

                    opciones.suplentes ||

                    this.configuracion.suplentes

                )

            );


        /*
         * Distribución del ranking.

         */

        const distribucion =

            this.calcularDistribucion(

                ranking

            );


        /*
         * Estadísticas generales.

         */

        const estadisticas =

            this.calcularEstadisticas(

                ranking

            );


        /*
         * Generamos una versión resumida
         * especialmente útil para exportar
         * a una IA posteriormente.

         */

        const resumenIA =

            this.generarResumenIA(

                ranking,

                top10,

                top20,

                titulares,

                suplentes,

                estadisticas

            );


        /*
         * Identificador temporal del ranking.
         */

        const idRanking =

            this.generarIdRanking();


        return {

            id:

                idRanking,

            version:

                this.version,

            generadoEn:

                new Date().toISOString(),

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


    /*==============================================================
        EXTRAER LISTA
    ==============================================================*/

    extraerLista(

        resultados

    ) {

        if (

            Array.isArray(

                resultados

            )

        ) {

            return resultados;

        }


        /*
         * Resultado proveniente de
         * MotorManager.analizarTodos()

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
         * Resultado proveniente de
         * MotorManager.generarRanking()

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


    /*==============================================================
        NORMALIZAR RESULTADO
    ==============================================================*/

    normalizarResultado(

        resultado

    ) {

        /*
         * MotorManager puede devolver:
         *
         * {
         *    numero,
         *    motores,
         *    combinado
         * }
         *
         * o un objeto de ranking ya procesado.
         */

        const numero =

            this.normalizarNumero(

                resultado.numero

            );


        let score = 0;

        let confianza = 0;

        let cantidadMotores = 0;

        let motores = {};


        if (

            resultado.combinado

        ) {

            score =

                this.numeroSeguro(

                    resultado

                        .combinado

                        .score

                );


            confianza =

                this.numeroSeguro(

                    resultado

                        .combinado

                        .confianza

                );


            cantidadMotores =

                this.numeroSeguro(

                    resultado

                        .combinado

                        .cantidadMotores

                );


            motores =

                resultado.motores ||

                {};

        }

        else {

            score =

                this.numeroSeguro(

                    resultado.score

                );


            confianza =

                this.numeroSeguro(

                    resultado.confianza

                );


            cantidadMotores =

                this.numeroSeguro(

                    resultado.cantidadMotores

                );


            motores =

                resultado.motores ||

                {};

        }


        /*
         * Obtenemos información resumida
         * de los motores.

         */

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

            confianza:

                this.redondear(

                    confianza,

                    6

                ),

            cantidadMotores,

            motores,

            resumenMotores

        };

    }


    /*==============================================================
        RESUMIR MOTORES
    ==============================================================*/

    resumirMotores(

        motores

    ) {

        const resumen = {};


        if (!motores) {

            return resumen;

        }


        /*
         * Puede ser un objeto:
         *
         * {
         *    historico: MotorResult,
         *    frecuencia: MotorResult,
         *    ...
         * }
         */

        for (

            const clave in motores

        ) {

            const resultado =

                motores[clave];


            if (!resultado) {

                continue;

            }


            resumen[clave] = {

                score:

                    this.numeroSeguro(

                        resultado.score

                    ),

                confianza:

                    this.numeroSeguro(

                        resultado.confianza

                    ),

                peso:

                    this.numeroSeguro(

                        resultado.peso

                    ),

                indicadores:

                    resultado.indicadores ||

                    {},

                detalle:

                    resultado.detalle ||

                    {}

            };

        }


        return resumen;

    }


    /*==============================================================
        ORDENAR RANKING
    ==============================================================*/

    ordenarRanking(

        candidatos

    ) {

        return [

            ...candidatos

        ].sort(

            (a, b) => {

                /*
                 * 1. Score combinado.
                 */

                if (

                    b.score !==

                    a.score

                ) {

                    return (

                        b.score -

                        a.score

                    );

                }


                /*
                 * 2. Confianza.
                 */

                if (

                    b.confianza !==

                    a.confianza

                ) {

                    return (

                        b.confianza -

                        a.confianza

                    );

                }


                /*
                 * 3. Cantidad de motores.

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
                 * 4. Número como último
                 * criterio determinista.
                 */

                return (

                    a.numero -

                    b.numero

                );

            }

        );

    }


    /*==============================================================
        ASIGNAR POSICIONES
    ==============================================================*/

    asignarPosiciones(

        ranking

    ) {

        ranking.forEach(

            (item, indice) => {

                item.posicion =

                    indice + 1;

            }

        );

        return ranking;

    }


    /*==============================================================
        DISTRIBUCIÓN DEL RANKING
    ==============================================================*/

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


            rangos[

                `${inicio}-${fin}`

            ] = {

                inicio,

                fin,

                cantidad: 0,

                scorePromedio: 0,

                mejorPosicion: null,

                numeros: []

            };

        }


        for (

            const item of ranking

        ) {

            const rango =

                Math.floor(

                    item.numero /

                    10

                ) * 10;


            const clave =

                `${rango}-${rango + 9}`;


            if (

                !rangos[clave]

            ) {

                continue;

            }


            rangos[clave].cantidad++;


            rangos[clave].numeros.push(

                item.numeroTexto

            );


            if (

                rangos[clave].mejorPosicion ===

                    null ||

                item.posicion <

                    rangos[clave].mejorPosicion

            ) {

                rangos[clave].mejorPosicion =

                    item.posicion;

            }

        }


        /*
         * Score promedio por rango.

         */

        for (

            const clave in rangos

        ) {

            const grupo =

                ranking.filter(

                    item => {

                        const rango =

                            Math.floor(

                                item.numero /

                                10

                            ) * 10;


                        return (

                            `${rango}-${rango + 9}` ===

                            clave

                        );

                    }

                );


            if (

                grupo.length > 0

            ) {

                const suma =

                    grupo.reduce(

                        (

                            acumulado,

                            item

                        ) =>

                            acumulado +

                            item.score,

                        0

                    );


                rangos[clave].scorePromedio =

                    this.redondear(

                        suma /

                        grupo.length,

                        4

                    );

            }

        }


        return rangos;

    }


    /*==============================================================
        ESTADÍSTICAS
    ==============================================================*/

    calcularEstadisticas(

        ranking

    ) {

        if (

            ranking.length === 0

        ) {

            return {

                scoreMaximo: 0,

                scoreMinimo: 0,

                scorePromedio: 0,

                confianzaPromedio: 0,

                diferenciaTop1Top10: 0,

                diferenciaTop10Top20: 0

            };

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


        const sumaScores =

            scores.reduce(

                (

                    suma,

                    valor

                ) =>

                    suma + valor,

                0

            );


        const sumaConfianzas =

            confianzas.reduce(

                (

                    suma,

                    valor

                ) =>

                    suma + valor,

                0

            );


        const top1 =

            ranking[0]?.score ||

            0;


        const top10 =

            ranking[9]?.score ||

            0;


        const top20 =

            ranking[19]?.score ||

            0;


        return {

            scoreMaximo:

                this.redondear(

                    Math.max(

                        ...scores

                    ),

                    6

                ),

            scoreMinimo:

                this.redondear(

                    Math.min(

                        ...scores

                    ),

                    6

                ),

            scorePromedio:

                this.redondear(

                    sumaScores /

                    ranking.length,

                    6

                ),

            confianzaPromedio:

                this.redondear(

                    sumaConfianzas /

                    ranking.length,

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

                )

        };

    }


    /*==============================================================
        RESUMEN PARA IA
    ==============================================================*/

    generarResumenIA(

        ranking,

        top10,

        top20,

        titulares,

        suplentes,

        estadisticas

    ) {

        /*
         * Esta estructura no es todavía una llamada
         * a una IA.
         *
         * Es un paquete de información estructurada
         * que posteriormente podrá enviarse a un LLM
         * para:
         *
         *   - explicar resultados
         *   - detectar patrones
         *   - sugerir variables
         *   - detectar cambios
         *   - interpretar evolución
         */

        return {

            fecha:

                new Date().toISOString(),

            versionModelo:

                this.version,

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


    /*==============================================================
        FORMATO PARA IA
    ==============================================================*/

    formatoIA(

        item

    ) {

        return {

            numero:

                item.numeroTexto,

            posicion:

                item.posicion,

            score:

                item.score,

            confianza:

                item.confianza,

            cantidadMotores:

                item.cantidadMotores,

            motores:

                Object.fromEntries(

                    Object.entries(

                        item.resumenMotores ||

                        {}

                    ).map(

                        ([clave, datos]) => [

                            clave,

                            {

                                score:

                                    datos.score,

                                confianza:

                                    datos.confianza,

                                peso:

                                    datos.peso,

                                indicadores:

                                    datos.indicadores

                            }

                        ]

                    )

                )

        };

    }


    /*==============================================================
        PREPARAR PREDICCIÓN PARA GUARDAR
    ==============================================================*/

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


        /*
         * Esta estructura está pensada para
         * guardarse antes de conocer los números
         * reales de la próxima semana.
         */

        return {

            id:

                ranking.id,

            fechaPrediccion:

                ranking.generadoEn,


            semanaObjetivo:

                datosSemana.semanaObjetivo ||

                null,


            fechaObjetivo:

                datosSemana.fechaObjetivo ||

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

                aciertosTop10: null,

                aciertosTop20: null,

                aciertosTitulares: null,

                aciertosSuplentes: null,

                fechaEvaluacion: null

            }

        };

    }


    /*==============================================================
        REGISTRO INDIVIDUAL DE PREDICCIÓN
    ==============================================================*/

    crearRegistroPrediccion(

        item

    ) {

        return {

            numero:

                item.numeroTexto,

            posicion:

                item.posicion,

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


    /*==============================================================
        EVALUAR PREDICCIÓN
    ==============================================================*/

    evaluarPrediccion(

        prediccion,

        numerosReales

    ) {

        if (

            !prediccion

        ) {

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

                new Date().toISOString(),

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

                )

        };


        /*
         * Evaluamos el ranking completo.

         */

        resultado.rankingCompleto =

            evaluarGrupo(

                prediccion.rankingCompleto

            );


        /*
         * Información adicional para
         * la futura autoevaluación.

         */

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


    /*==============================================================
        ACIERTOS POR POSICIÓN
    ==============================================================*/

    calcularAciertosPorPosicion(

        prediccion,

        realesSet

    ) {

        const resultado = [];


        if (

            !Array.isArray(

                prediccion.rankingCompleto

            )

        ) {

            return resultado;

        }


        for (

            const item of

                prediccion.rankingCompleto

        ) {

            const numero =

                Number(

                    item.numero

                );


            resultado.push({

                numero:

                    item.numero,

                posicion:

                    item.posicion,

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

            });

        }


        return resultado;

    }


    /*==============================================================
        MEJORES ACIERTOS
    ==============================================================*/

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


        return prediccion.rankingCompleto

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

                    score:

                        item.score,

                    confianza:

                        item.confianza,

                    motores:

                        item.motores

                })

            )

            .sort(

                (a, b) =>

                    a.posicion -

                    b.posicion

            );

    }


    /*==============================================================
        NORMALIZAR LISTA
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
        RESULTADO VACÍO
    ==============================================================*/

    resultadoVacio() {

        return {

            id:

                this.generarIdRanking(),

            version:

                this.version,

            generadoEn:

                new Date().toISOString(),

            totalNumeros: 0,

            ranking: [],

            top10: [],

            top20: [],

            equipoTitular: [],

            equipoSuplente: [],

            distribucion: {},

            estadisticas: {

                scoreMaximo: 0,

                scoreMinimo: 0,

                scorePromedio: 0,

                confianzaPromedio: 0,

                diferenciaTop1Top10: 0,

                diferenciaTop10Top20: 0

            },

            resumenIA: {

                top10: [],

                top20: [],

                equipoTitular: [],

                equipoSuplente: [],

                rankingCompleto: []

            }

        };

    }


    /*==============================================================
        GENERAR ID
    ==============================================================*/

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

                .toString(

                    36

                )

                .substring(

                    2,

                    8

                );


        return `ranking_${fecha}_${aleatorio}`;

    }


    /*==============================================================
        NORMALIZAR NÚMERO
    ==============================================================*/

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


    /*==============================================================
        FORMATO 00-99
    ==============================================================*/

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
        OBTENER TOP
    ==============================================================*/

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


        return ranking.ranking.slice(

            0,

            Math.max(

                1,

                Number(

                    cantidad

                ) || 10

            )

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

            configuracion:

                {

                    ...this.configuracion

                }

        };

    }

}