/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * js/motores/MotorEvolucion.js
 *
 * Propósito:
 * Analizar la evolución histórica del modelo a partir de las
 * evaluaciones generadas por MotorEvaluacion.
 *
 * Responsabilidades:
 *
 *   - Analizar múltiples evaluaciones históricas.
 *   - Calcular rendimiento por períodos.
 *   - Detectar tendencias de mejora o deterioro.
 *   - Comparar períodos anteriores y recientes.
 *   - Analizar evolución de cada motor.
 *   - Detectar motores en mejora.
 *   - Detectar motores en deterioro.
 *   - Detectar estabilidad.
 *   - Detectar cambios bruscos.
 *   - Generar señales para el futuro optimizador.
 *   - Generar información estructurada para IA.
 *
 * IMPORTANTE:
 *
 * Este motor NO modifica pesos.
 *
 * Su función es observar y medir la evolución.
 *
 **********************************************************************/

export default class MotorEvolucion {


    constructor(configuracion = {}) {

        this.nombre =

            "MotorEvolucion";


        this.version =

            "1.0.0";


        this.configuracion = {

            /*
             * Cantidad mínima de evaluaciones necesarias
             * para comparar dos períodos.
             */

            minimoEvaluaciones:

                configuracion.minimoEvaluaciones ||

                5,


            /*
             * Tamaño predeterminado del período reciente.
             */

            periodoReciente:

                configuracion.periodoReciente ||

                10,


            /*
             * Cantidad de períodos utilizados
             * para calcular tendencias.

             */

            cantidadPeriodos:

                configuracion.cantidadPeriodos ||

                5,


            /*
             * Umbral a partir del cual consideramos
             * que una variación es significativa.
             *
             * Se expresa en puntos porcentuales
             * de rendimiento.

             */

            umbralCambio:

                configuracion.umbralCambio ||

                5,


            /*
             * Umbral de cambio fuerte.

             */

            umbralCambioFuerte:

                configuracion.umbralCambioFuerte ||

                15

        };

    }


    /*==============================================================
        MÉTODO PRINCIPAL
    ==============================================================*/

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


        /*
         * Ordenamos cronológicamente.

         */

        const ordenadas =

            this.ordenarEvaluaciones(

                lista

            );


        /*
         * Analizamos rendimiento general.

         */

        const rendimientoGeneral =

            this.analizarRendimientoGeneral(

                ordenadas

            );


        /*
         * Analizamos períodos.

         */

        const periodos =

            this.construirPeriodos(

                ordenadas,

                opciones

            );


        const comparacionPeriodos =

            this.compararPeriodos(

                periodos

            );


        /*
         * Analizamos tendencia global.

         */

        const tendencias =

            this.analizarTendencias(

                ordenadas

            );


        /*
         * Analizamos cada motor.

         */

        const motores =

            this.analizarEvolucionMotores(

                ordenadas

            );


        /*
         * Detectamos cambios.

         */

        const cambios =

            this.detectarCambios(

                ordenadas,

                motores,

                tendencias

            );


        /*
         * Generamos señales para el optimizador.

         */

        const señalesOptimizacion =

            this.generarSeñalesOptimizacion(

                tendencias,

                motores,

                cambios,

                comparacionPeriodos

            );


        /*
         * Generamos resumen para IA.

         */

        const resumenIA =

            this.generarResumenIA(

                ordenadas,

                rendimientoGeneral,

                periodos,

                comparacionPeriodos,

                tendencias,

                motores,

                cambios,

                señalesOptimizacion

            );


        return {

            id:

                this.generarIdAnalisis(),


            version:

                this.version,


            generadoEn:

                new Date().toISOString(),


            cantidadEvaluaciones:

                ordenadas.length,


            rendimientoGeneral,


            periodos,


            comparacionPeriodos,


            tendencias,


            motores,


            cambios,


            señalesOptimizacion,


            resumenIA

        };

    }


    /*==============================================================
        NORMALIZAR EVALUACIONES
    ==============================================================*/

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


    /*==============================================================
        ORDENAR EVALUACIONES
    ==============================================================*/

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


    /*==============================================================
        RENDIMIENTO GENERAL
    ==============================================================*/

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

            const evaluacion of

                evaluaciones

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


            /*
             * Para comparar semanas utilizamos
             * principalmente el rendimiento Top 10.
             */

            if (

                !mejorSemana ||

                top10 >

                    mejorSemana.aciertosTop10

            ) {

                mejorSemana = {

                    id:

                        evaluacion.id ||

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


    /*==============================================================
        CONSTRUIR PERIODOS
    ==============================================================*/

    construirPeriodos(

        evaluaciones,

        opciones = {}

    ) {

        const tamaño =

            Number(

                opciones.tamañoPeriodo ||

                this.configuracion.periodoReciente

            );


        const cantidadPeriodos =

            Number(

                opciones.cantidadPeriodos ||

                this.configuracion.cantidadPeriodos

            );


        const periodos = [];


        /*
         * Trabajamos desde el final hacia atrás.

         */

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


        /*
         * Reasignamos nombres cronológicos.

         */

        periodos.forEach(

            (periodo, indice) => {

                periodo.numero =

                    indice + 1;


                periodo.nombre =

                    indice ===

                    periodos.length - 1

                        ? "Periodo actual"

                        : `Periodo ${indice + 1}`;

            }

        );


        return periodos;

    }


    /*==============================================================
        COMPARAR PERIODOS
    ==============================================================*/

    compararPeriodos(

        periodos

    ) {

        if (

            periodos.length < 2

        ) {

            return {

                disponible: false,

                motivo:

                    "No hay suficientes períodos para realizar una comparación.",

                variaciones: null

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


        return {

            disponible: true,


            periodoAnterior: anterior,


            periodoActual: actual,


            variaciones: {

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

                    )

            },


            direccion:

                this.determinarDireccion(

                    actual,

                    anterior

                )

        };

    }


    /*==============================================================
        RESUMEN DE PERIODO
    ==============================================================*/

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

                promedioCobertura: 0

            };

        }


        let top10 = 0;

        let top20 = 0;

        let titulares = 0;

        let suplentes = 0;

        let cobertura = 0;


        for (

            const evaluacion of

                evaluaciones

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

                )

        };

    }


    /*==============================================================
        DETERMINAR DIRECCIÓN
    ==============================================================*/

    determinarDireccion(

        actual,

        anterior

    ) {

        const variacion =

            actual.promedioAciertosTop10 -

            anterior.promedioAciertosTop10;


        if (

            variacion >=

            this.configuracion.umbralCambio

        ) {

            return "mejora";

        }


        if (

            variacion <=

            -this.configuracion.umbralCambio

        ) {

            return "deterioro";

        }


        return "estable";

    }


    /*==============================================================
        ANALIZAR TENDENCIAS
    ==============================================================*/

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

                )

        };

    }


    /*==============================================================
        CREAR SERIES
    ==============================================================*/

    crearSeries(

        evaluaciones

    ) {

        const top10 = [];

        const top20 = [];

        const titulares = [];

        const suplentes = [];

        const cobertura = [];


        evaluaciones.forEach(

            (evaluacion, indice) => {

                const metricas =

                    evaluacion.metricas ||

                    {};


                const comportamiento =

                    evaluacion.comportamientoRanking ||

                    {};


                top10.push({

                    x:

                        indice + 1,

                    y:

                        this.numeroSeguro(

                            metricas.aciertosTop10

                        )

                });


                top20.push({

                    x:

                        indice + 1,

                    y:

                        this.numeroSeguro(

                            metricas.aciertosTop20

                        )

                });


                titulares.push({

                    x:

                        indice + 1,

                    y:

                        this.numeroSeguro(

                            metricas.aciertosTitulares

                        )

                });


                suplentes.push({

                    x:

                        indice + 1,

                    y:

                        this.numeroSeguro(

                            metricas.aciertosSuplentes

                        )

                });


                cobertura.push({

                    x:

                        indice + 1,

                    y:

                        this.numeroSeguro(

                            comportamiento.cobertura

                        )

                });

            }

        );


        return {

            top10,

            top20,

            titulares,

            suplentes,

            cobertura

        };

    }


    /*==============================================================
        ANALIZAR SERIE
    ==============================================================*/

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

                tendencia: "sin_datos"

            };

        }


        const valores =

            serie.map(

                punto =>

                    punto.y

            );


        const promedio =

            valores.reduce(

                (

                    suma,

                    valor

                ) =>

                    suma + valor,

                0

            ) /

            valores.length;


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

            0.05

        ) {

            tendencia =

                "ascendente";

        }

        else if (

            pendiente <

            -0.05

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


    /*==============================================================
        CALCULAR PENDIENTE
    ==============================================================*/

    calcularPendiente(

        serie

    ) {

        const n =

            serie.length;


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

            const punto of serie

        ) {

            const x =

                punto.x;


            const y =

                punto.y;


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


    /*==============================================================
        EVOLUCIÓN DE MOTORES
    ==============================================================*/

    analizarEvolucionMotores(

        evaluaciones

    ) {

        const datosMotores = {};


        for (

            const evaluacion of

                evaluaciones

        ) {

            const rendimiento =

                evaluacion.rendimientoMotores ||

                {};


            const motores =

                rendimiento.motores ||

                {};


            for (

                const clave in motores

            ) {

                const motor =

                    motores[clave];


                if (

                    !datosMotores[clave]

                ) {

                    datosMotores[clave] = {

                        motor:

                            clave,

                        historial: []

                    };

                }


                datosMotores[clave].historial.push({

                    fecha:

                        evaluacion.fechaEvaluacion ||

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

                        )

                });

            }

        }


        const resultado = {};


        for (

            const clave in datosMotores

        ) {

            const datos =

                datosMotores[clave];


            const serieTasa =

                datos.historial.map(

                    (item, indice) => ({

                        x:

                            indice + 1,

                        y:

                            item.tasaAcierto

                    })

                );


            const serieAciertos =

                datos.historial.map(

                    (item, indice) => ({

                        x:

                            indice + 1,

                        y:

                            item.aciertos

                    })

                );


            const tendenciaTasa =

                this.analizarSerie(

                    serieTasa

                );


            const tendenciaAciertos =

                this.analizarSerie(

                    serieAciertos

                );


            const promedioTasa =

                this.calcularPromedio(

                    datos.historial.map(

                        item =>

                            item.tasaAcierto

                    )

                );


            const reciente =

                this.obtenerUltimos(

                    datos.historial,

                    this.configuracion.periodoReciente

                );


            const promedioReciente =

                this.calcularPromedio(

                    reciente.map(

                        item =>

                            item.tasaAcierto

                    )

                );


            const promedioAnterior =

                this.calcularPromedio(

                    datos.historial

                        .slice(

                            0,

                            Math.max(

                                0,

                                datos.historial.length -

                                reciente.length

                            )

                        )

                        .map(

                            item =>

                                item.tasaAcierto

                        )

                );


            const variacionReciente =

                this.redondear(

                    promedioReciente -

                    promedioAnterior,

                    6

                );


            let estado =

                "estable";


            if (

                variacionReciente >=

                this.configuracion.umbralCambio

            ) {

                estado =

                    "mejorando";

            }

            else if (

                variacionReciente <=

                -this.configuracion.umbralCambio

            ) {

                estado =

                    "empeorando";

            }


            resultado[clave] = {

                motor:

                    clave,

                cantidadEvaluaciones:

                    datos.historial.length,

                promedioTasaAcierto:

                    this.redondear(

                        promedioTasa,

                        6

                    ),

                promedioTasaReciente:

                    this.redondear(

                        promedioReciente,

                        6

                    ),

                promedioTasaAnterior:

                    this.redondear(

                        promedioAnterior,

                        6

                    ),

                variacionReciente,

                estado,

                tendenciaTasa,

                tendenciaAciertos,

                historial:

                    datos.historial

            };

        }


        return resultado;

    }


    /*==============================================================
        DETECTAR CAMBIOS
    ==============================================================*/

    detectarCambios(

        evaluaciones,

        motores,

        tendencias

    ) {

        const cambios = [];


        /*
         * Cambios generales.

         */

        for (

            const clave in tendencias

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


        /*
         * Cambios por motor.

         */

        for (

            const clave in motores

        ) {

            const motor =

                motores[clave];


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

                        motor.variacionReciente,

                    descripcion:

                        `El motor ${clave} presenta una mejora reciente en su rendimiento descriptivo.`

                });

            }


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

                        motor.variacionReciente,

                    descripcion:

                        `El motor ${clave} presenta un deterioro reciente en su rendimiento descriptivo.`

                });

            }

        }


        /*
         * Detectamos cambios fuertes entre evaluaciones
         * consecutivas.

         */

        for (

            let i = 1;

            i < evaluaciones.length;

            i++

        ) {

            const anterior =

                evaluaciones[i - 1];


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


            if (

                Math.abs(

                    diferencia

                ) >=

                this.configuracion.umbralCambioFuerte

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


    /*==============================================================
        SEÑALES PARA OPTIMIZACIÓN
    ==============================================================*/

    generarSeñalesOptimizacion(

        tendencias,

        motores,

        cambios,

        comparacionPeriodos

    ) {

        const señales = [];


        /*
         * Señales generales.

         */

        for (

            const clave in tendencias

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

                        "media",

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

                        "media",

                    valor:

                        tendencia.pendiente

                });

            }

        }


        /*
         * Señales de motores.

         */

        for (

            const clave in motores

        ) {

            const motor =

                motores[clave];


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

                        "media",

                    variacion:

                        motor.variacionReciente

                });

            }


            if (

                motor.estado ===

                "empeorando"

            ) {

                señales.push({

                    tipo:

                        "motor_candidato_revision",

                    motor:

                        clave,

                    prioridad:

                        "media",

                    variacion:

                        motor.variacionReciente

                });

            }

        }


        /*
         * Comparación de períodos.

         */

        if (

            comparacionPeriodos.disponible

        ) {

            const variaciones =

                comparacionPeriodos.variaciones;


            if (

                variaciones.top10 >=

                this.configuracion.umbralCambio

            ) {

                señales.push({

                    tipo:

                        "modelo_mejorando",

                    prioridad:

                        "alta",

                    variacion:

                        variaciones.top10

                });

            }


            if (

                variaciones.top10 <=

                -this.configuracion.umbralCambio

            ) {

                señales.push({

                    tipo:

                        "modelo_empeorando",

                    prioridad:

                        "alta",

                    variacion:

                        variaciones.top10

                });

            }

        }


        /*
         * Cambios bruscos.

         */

        const cambiosFuertes =

            cambios.filter(

                cambio =>

                    Math.abs(

                        this.numeroSeguro(

                            cambio.diferencia

                        )

                    ) >=

                    this.configuracion.umbralCambioFuerte

            );


        if (

            cambiosFuertes.length > 0

        ) {

            señales.push({

                tipo:

                    "cambio_comportamiento",

                prioridad:

                    "alta",

                cantidad:

                    cambiosFuertes.length

            });

        }


        return señales;

    }


    /*==============================================================
        RESUMEN PARA IA
    ==============================================================*/

    generarResumenIA(

        evaluaciones,

        rendimientoGeneral,

        periodos,

        comparacionPeriodos,

        tendencias,

        motores,

        cambios,

        señalesOptimizacion

    ) {

        /*
         * Información limpia y estructurada.
         *
         * Esta salida podrá copiarse/exportarse
         * posteriormente para entregarla a una IA.

         */

        return {

            tipo:

                "analisis_evolucion_modelo",


            version:

                this.version,


            fecha:

                new Date().toISOString(),


            cantidadEvaluaciones:

                evaluaciones.length,


            rendimientoGeneral,


            comparacionPeriodos,


            tendencias,


            motores:


                Object.values(

                    motores

                ).map(

                    motor => ({

                        motor:

                            motor.motor,

                        cantidadEvaluaciones:

                            motor.cantidadEvaluaciones,

                        promedioTasaAcierto:

                            motor.promedioTasaAcierto,

                        promedioTasaReciente:

                            motor.promedioTasaReciente,

                        promedioTasaAnterior:

                            motor.promedioTasaAnterior,

                        variacionReciente:

                            motor.variacionReciente,

                        estado:

                            motor.estado,

                        tendenciaTasa:

                            motor.tendenciaTasa,

                        tendenciaAciertos:

                            motor.tendenciaAciertos

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

                            null

                    })

                ),


            preguntasSugeridasIA: [

                "¿Qué motores muestran una mejora sostenida?",

                "¿Qué motores muestran deterioro reciente?",

                "¿Qué indicadores presentan cambios de comportamiento?",

                "¿Existe una diferencia consistente entre períodos?",

                "¿Qué variables adicionales podrían incorporarse?",

                "¿Qué motores deberían ser revisados antes de modificar sus pesos?",

                "¿La mejora observada es estable o depende de pocas semanas?",

                "¿Se observan cambios estructurales en el comportamiento histórico?"

            ],


            advertencia:

                "Este análisis describe el comportamiento histórico del modelo. No constituye una garantía ni una probabilidad real de resultados futuros."

        };

    }


    /*==============================================================
        OBTENER ACIERTOS TOP 10
    ==============================================================*/

    obtenerAciertosTop10(

        evaluacion

    ) {

        return this.numeroSeguro(

            evaluacion

                ?.metricas

                ?.aciertosTop10

        );

    }


    /*==============================================================
        OBTENER ÚLTIMAS EVALUACIONES
    ==============================================================*/

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


        return lista.slice(

            Math.max(

                0,

                lista.length -

                Number(

                    cantidad

                )

            )

        );

    }


    /*==============================================================
        CALCULAR PROMEDIO
    ==============================================================*/

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

            valores.filter(

                valor =>

                    Number.isFinite(

                        Number(

                            valor

                        )

                    )

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

                    suma +

                    Number(

                        valor

                    ),

                0

            ) /

            validos.length,

            6

        );

    }


    /*==============================================================
        RESULTADO VACÍO
    ==============================================================*/

    resultadoVacio() {

        return {

            id:

                this.generarIdAnalisis(),


            version:

                this.version,


            generadoEn:

                new Date().toISOString(),


            cantidadEvaluaciones: 0,


            rendimientoGeneral:

                this.analizarRendimientoGeneral(

                    []

                ),


            periodos: [],


            comparacionPeriodos: {

                disponible: false,

                motivo:

                    "No existen evaluaciones."

            },


            tendencias: {

                top10:

                    this.analizarSerie(

                        []

                    ),

                top20:

                    this.analizarSerie(

                        []

                    ),

                titulares:

                    this.analizarSerie(

                        []

                    ),

                suplentes:

                    this.analizarSerie(

                        []

                    ),

                cobertura:

                    this.analizarSerie(

                        []

                    )

            },


            motores: {},


            cambios: [],


            señalesOptimizacion: [],


            resumenIA: {

                tipo:

                    "analisis_evolucion_modelo",

                cantidadEvaluaciones: 0,

                motores: [],

                cambios: [],

                señalesOptimizacion: []

            }

        };

    }


    /*==============================================================
        COMPROBAR SI HAY DATOS SUFICIENTES
    ==============================================================*/

    hayDatosSuficientes(

        cantidad = null

    ) {

        const cantidadEvaluaciones =

            cantidad !== null

                ? Number(

                    cantidad

                )

                : 0;


        return (

            cantidadEvaluaciones >=

            this.configuracion

                .minimoEvaluaciones

        );

    }


    /*==============================================================
        GENERAR ID
    ==============================================================*/

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

                .toString(

                    36

                )

                .substring(

                    2,

                    8

                );


        return `evolucion_${fecha}_${aleatorio}`;

    }


    /*==============================================================
        OBTENER FECHA
    ==============================================================*/

    obtenerFecha(

        evaluacion

    ) {

        const fecha =

            new Date(

                evaluacion?.fechaEvaluacion ||

                evaluacion?.fecha ||

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
        OBTENER ESTADO
    ==============================================================*/

    obtenerEstado(

        cantidadEvaluaciones = 0

    ) {

        return {

            nombre:

                this.nombre,


            version:

                this.version,


            cantidadEvaluaciones:


                Number(

                    cantidadEvaluaciones

                ),


            minimoEvaluaciones:

                this.configuracion

                    .minimoEvaluaciones,


            datosSuficientes:

                this.hayDatosSuficientes(

                    cantidadEvaluaciones

                ),


            periodoReciente:

                this.configuracion

                    .periodoReciente,


            umbralCambio:

                this.configuracion

                    .umbralCambio,


            umbralCambioFuerte:

                this.configuracion

                    .umbralCambioFuerte

        };

    }

}
