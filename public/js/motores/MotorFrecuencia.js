import BaseMotor from "./BaseMotor.js";

import MotorResult from "./MotorResult.js";


export default class MotorFrecuencia extends BaseMotor {


    constructor() {

        super(

            "Frecuencia",

            "1.0.0"

        );

    }


    /*==============================================================
        MÉTODO PRINCIPAL
    ==============================================================*/
calcular(numero, contexto) {

    /*
     * Primero normalizamos el número.
     */

    const numeroValidado =
        this.normalizarNumero(numero);


    /*
     * Después comprobamos que pertenezca
     * al rango permitido 00-99.
     */

    if (
        !this.validarNumero(
            numeroValidado
        )
    ) {

        throw new Error(

            `Número inválido: ${numero}. ` +
            "Debe estar entre 00 y 99."

        );

    }


    /*
     * Validar contexto.
     */

    this.validarContexto(
        contexto
    );


        const semanas =

            this.obtenerSemanas(contexto);


        /*
         * Sin historial no existe frecuencia que calcular.

         */

        if (

            semanas.length === 0

        ) {

            return this.resultadoSinDatos(

                numeroValidado,

                contexto,

                "No existen semanas históricas."

            );

        }


        /*
         * Ordenamos desde la semana más reciente
         * hacia la más antigua.

         */

        const semanasOrdenadas =

            this.ordenarSemanas(

                semanas

            );


        /*
         * Estadísticas generales.

         */

        const estadisticas =

            this.construirEstadisticas(

                semanasOrdenadas

            );


        /*
         * Frecuencia histórica total del número.

         */

        const frecuenciaHistorica =

            estadisticas

                .frecuencias

                .get(

                    numeroValidado

                ) || 0;


        /*
         * Total de semanas.

         */

        const totalSemanas =

            semanasOrdenadas.length;


        /*
         * Porcentaje histórico.

         */

        const porcentajeHistorico =

            totalSemanas > 0

                ? (

                    frecuenciaHistorica /

                    totalSemanas

                ) * 100

                : 0;


        /*
         * Calculamos las ventanas temporales.

         */

        const frecuencia3 =

            this.calcularVentana(

                numeroValidado,

                semanasOrdenadas,

                3

            );


        const frecuencia5 =

            this.calcularVentana(

                numeroValidado,

                semanasOrdenadas,

                5

            );


        const frecuencia10 =

            this.calcularVentana(

                numeroValidado,

                semanasOrdenadas,

                10

            );


        const frecuencia20 =

            this.calcularVentana(

                numeroValidado,

                semanasOrdenadas,

                20

            );


        /*
         * Tendencia entre corto y largo plazo.

         */

        const tendencia =

            this.calcularTendencia(

                porcentajeHistorico,

                frecuencia3.porcentaje,

                frecuencia5.porcentaje,

                frecuencia10.porcentaje,

                frecuencia20.porcentaje

            );


        /*
         * Relación entre frecuencia reciente
         * y frecuencia histórica.

         */

        const ratioReciente =

            this.calcularRatioReciente(

                frecuencia5.porcentaje,

                porcentajeHistorico

            );


        /*
         * Normalización histórica.

         */

        const frecuenciaNormalizada =

            this.calcularFrecuenciaNormalizada(

                frecuenciaHistorica,

                estadisticas

                    .frecuencias

            );


        /*
         * Score de corto plazo.

         */

        const scoreCortoPlazo =

            this.calcularScoreCortoPlazo(

                frecuencia3,

                frecuencia5

            );


        /*
         * Score de mediano plazo.

         */

        const scoreMedianoPlazo =

            this.calcularScoreMedianoPlazo(

                frecuencia10,

                frecuencia20

            );


        /*
         * Score histórico.

         */

        const scoreHistorico =

            this.calcularScoreHistorico(

                frecuenciaNormalizada

            );


        /*
         * Score de tendencia.

         */

        const scoreTendencia =

            this.calcularScoreTendencia(

                tendencia

            );


        /*
         * Score final.
         *
         * Histórico:       30%
         * Corto plazo:      25%
         * Mediano plazo:    20%
         * Tendencia:        25%
         */

        const score =

            (

                scoreHistorico *

                0.30

            ) +

            (

                scoreCortoPlazo *

                0.25

            ) +

            (

                scoreMedianoPlazo *

                0.20

            ) +

            (

                scoreTendencia *

                0.25

            );


        /*
         * Confianza.

         */

        const confianza =

            this.calcularConfianza(

                totalSemanas,

                frecuenciaHistorica

            );


        /*
         * Peso global del motor.

         */

        const peso =

            this.obtenerPeso(

                contexto

            );


        /*
         * Resultado estándar.

         */

        return new MotorResult({

            numero: numeroValidado,

            motor: this.nombre,

            version: this.version,

            score:

                this.normalizarScore(

                    score

                ),

            confianza,

            peso,

            detalle: {

                frecuenciaHistorica,

                porcentajeHistorico:

                    this.redondear(

                        porcentajeHistorico,

                        4

                    ),

                frecuencia3,

                frecuencia5,

                frecuencia10,

                frecuencia20,

                tendencia,

                ratioReciente:

                    this.redondear(

                        ratioReciente,

                        4

                    ),

                frecuenciaNormalizada:

                    this.redondear(

                        frecuenciaNormalizada,

                        4

                    ),

                scoreHistorico:

                    this.redondear(

                        scoreHistorico

                    ),

                scoreCortoPlazo:

                    this.redondear(

                        scoreCortoPlazo

                    ),

                scoreMedianoPlazo:

                    this.redondear(

                        scoreMedianoPlazo

                    ),

                scoreTendencia:

                    this.redondear(

                        scoreTendencia

                    )

            },

            indicadores: {

                frecuenciaHistorica,

                frecuencia3:

                    frecuencia3.apariciones,

                frecuencia5:

                    frecuencia5.apariciones,

                frecuencia10:

                    frecuencia10.apariciones,

                frecuencia20:

                    frecuencia20.apariciones,

                porcentajeHistorico:

                    this.redondear(

                        porcentajeHistorico,

                        4

                    ),

                porcentaje3:

                    frecuencia3.porcentaje,

                porcentaje5:

                    frecuencia5.porcentaje,

                porcentaje10:

                    frecuencia10.porcentaje,

                porcentaje20:

                    frecuencia20.porcentaje,

                tendencia:

                    tendencia.valor,

                ratioReciente:

                    this.redondear(

                        ratioReciente,

                        4

                    ),

                scoreFrecuencia:

                    this.redondear(

                        score

                    )

            }

        });

    }


    /*==============================================================
        OBTENER SEMANAS
    ==============================================================*/


/*==============================================================
    OBTENER SEMANAS
==============================================================*/

obtenerSemanas(contexto) {

    if (!contexto) {

        return [];

    }


    /*----------------------------------------------------------
        CASO 1
        contexto.semanas
    ----------------------------------------------------------*/

    if (
        Array.isArray(
            contexto.semanas
        )
    ) {

        return contexto.semanas;

    }


    /*----------------------------------------------------------
        CASO 2
        contexto.historial como ARRAY
        Esta es actualmente nuestra estructura principal.
    ----------------------------------------------------------*/

    if (
        Array.isArray(
            contexto.historial
        )
    ) {

        return contexto.historial;

    }


    /*----------------------------------------------------------
        CASO 3
        contexto.historial.semanas
    ----------------------------------------------------------*/

    if (
        contexto.historial &&
        Array.isArray(
            contexto.historial.semanas
        )
    ) {

        return contexto.historial.semanas;

    }


    /*----------------------------------------------------------
        CASO 4
        contexto.data.semanas
    ----------------------------------------------------------*/

    if (
        contexto.data &&
        Array.isArray(
            contexto.data.semanas
        )
    ) {

        return contexto.data.semanas;

    }


    return [];

}




    /*==============================================================
        ORDENAR SEMANAS
    ==============================================================*/

    ordenarSemanas(semanas) {

        const copia = [

            ...semanas

        ];


        /*
         * Preferimos número de semana.

         */

        if (

            copia.some(

                semana =>

                    semana &&

                    semana.semana !== undefined

            )

        ) {

            copia.sort(

                (a, b) =>

                    Number(

                        b.semana

                    ) -

                    Number(

                        a.semana

                    )

            );


            return copia;

        }


        /*
         * Alternativa: fecha.

         */

        if (

            copia.some(

                semana =>

                    semana &&

                    semana.fecha

            )

        ) {

            copia.sort(

                (a, b) =>

                    new Date(

                        b.fecha

                    ) -

                    new Date(

                        a.fecha

                    )

            );


            return copia;

        }


        /*
         * Última alternativa.

         */

        return copia.reverse();

    }


    /*==============================================================
        CONSTRUIR ESTADÍSTICAS
    ==============================================================*/

    construirEstadisticas(semanas) {

        const frecuencias =

            new Map();


        for (

            const semana of semanas

        ) {

            const numeros =

                this.obtenerNumerosSemana(

                    semana

                );


            /*
             * Una aparición cuenta una sola vez
             * dentro de una misma semana.

             */

            const numerosUnicos =

                [

                    ...new Set(

                        numeros

                            .map(

                                valor =>

                                    Number(valor)

                            )

                            .filter(

                                valor =>

                                    Number.isInteger(

                                        valor

                                    ) &&

                                    valor >= 0 &&

                                    valor <= 99

                            )

                    )

                ];


            for (

                const numero of numerosUnicos

            ) {

                frecuencias.set(

                    numero,

                    (

                        frecuencias.get(

                            numero

                        ) || 0

                    ) + 1

                );

            }

        }


        return {

            frecuencias

        };

    }


    /*==============================================================
        OBTENER NÚMEROS DE UNA SEMANA
    ==============================================================*/

    obtenerNumerosSemana(semana) {

        if (!semana) {

            return [];

        }


        if (

            Array.isArray(

                semana.numeros

            )

        ) {

            return semana.numeros;

        }


        if (

            Array.isArray(

                semana.numerosTexto

            )

        ) {

            return semana.numerosTexto;

        }


        if (

            Array.isArray(

                semana.resultado

            )

        ) {

            return semana.resultado;

        }


        return [];

    }


    /*==============================================================
        CALCULAR VENTANA
    ==============================================================*/

    calcularVentana(

        numero,

        semanas,

        cantidad

    ) {

        const ventana =

            semanas.slice(

                0,

                Math.min(

                    cantidad,

                    semanas.length

                )

            );


        let apariciones = 0;


        for (

            const semana of ventana

        ) {

            if (

                this.semanaContieneNumero(

                    semana,

                    numero

                )

            ) {

                apariciones++;

            }

        }


        const porcentaje =

            ventana.length > 0

                ? (

                    apariciones /

                    ventana.length

                ) * 100

                : 0;


        return {

            ventana: ventana.length,

            apariciones,

            porcentaje:

                this.redondear(

                    porcentaje,

                    4

                )

        };

    }


    /*==============================================================
        CALCULAR TENDENCIA
    ==============================================================*/

    calcularTendencia(

        historico,

        porcentaje3,

        porcentaje5,

        porcentaje10,

        porcentaje20

    ) {

        /*
         * Promedio de corto plazo.

         */

        const corto =

            (

                porcentaje3 +

                porcentaje5

            ) /

            2;


        /*
         * Promedio de mediano plazo.

         */

        const mediano =

            (

                porcentaje10 +

                porcentaje20

            ) /

            2;


        /*
         * Diferencia corto-mediano.

         */

        const diferenciaCortoMediano =

            corto -

            mediano;


        /*
         * Diferencia corto-histórico.

         */

        const diferenciaHistorico =

            corto -

            historico;


        /*
         * Tendencia ponderada.

         */

        const valor =

            (

                diferenciaCortoMediano *

                0.60

            ) +

            (

                diferenciaHistorico *

                0.40

            );


        /*
         * Clasificación.

         */

        let direccion =

            "estable";


        if (

            valor >= 5

        ) {

            direccion =

                "ascendente_fuerte";

        }

        else if (

            valor >= 2

        ) {

            direccion =

                "ascendente";

        }

        else if (

            valor <= -5

        ) {

            direccion =

                "descendente_fuerte";

        }

        else if (

            valor <= -2

        ) {

            direccion =

                "descendente";

        }


        return {

            valor:

                this.redondear(

                    valor,

                    4

                ),

            direccion,

            corto:

                this.redondear(

                    corto,

                    4

                ),

            mediano:

                this.redondear(

                    mediano,

                    4

                ),

            historico:

                this.redondear(

                    historico,

                    4

                ),

            diferenciaCortoMediano:

                this.redondear(

                    diferenciaCortoMediano,

                    4

                ),

            diferenciaHistorico:

                this.redondear(

                    diferenciaHistorico,

                    4

                )

        };

    }


    /*==============================================================
        RATIO RECIENTE
    ==============================================================*/

    calcularRatioReciente(

        porcentajeReciente,

        porcentajeHistorico

    ) {

        if (

            porcentajeHistorico <= 0

        ) {

            return porcentajeReciente > 0

                ? 2

                : 0;

        }


        return (

            porcentajeReciente /

            porcentajeHistorico

        );

    }


    /*==============================================================
        FRECUENCIA NORMALIZADA
    ==============================================================*/

    calcularFrecuenciaNormalizada(

        frecuencia,

        mapaFrecuencias

    ) {

        if (

            !mapaFrecuencias ||

            mapaFrecuencias.size === 0

        ) {

            return 0;

        }


        let maximo = 0;


        for (

            const valor of mapaFrecuencias.values()

        ) {

            if (

                valor > maximo

            ) {

                maximo = valor;

            }

        }


        if (

            maximo <= 0

        ) {

            return 0;

        }


        return (

            frecuencia /

            maximo

        ) * 100;

    }


    /*==============================================================
        SCORE HISTÓRICO
    ==============================================================*/

    calcularScoreHistorico(

        frecuenciaNormalizada

    ) {

        return this.normalizarScore(

            frecuenciaNormalizada

        );

    }


    /*==============================================================
        SCORE CORTO PLAZO
    ==============================================================*/

    calcularScoreCortoPlazo(

        frecuencia3,

        frecuencia5

    ) {

        /*
         * Damos mayor importancia a las últimas
         * 3 semanas.

         */

        const score =

            (

                frecuencia3.porcentaje *

                0.60

            ) +

            (

                frecuencia5.porcentaje *

                0.40

            );


        /*
         * El máximo práctico de aparición
         * por semana es 100%.

         */

        return this.normalizarScore(

            score

        );

    }


    /*==============================================================
        SCORE MEDIANO PLAZO
    ==============================================================*/

    calcularScoreMedianoPlazo(

        frecuencia10,

        frecuencia20

    ) {

        const score =

            (

                frecuencia10.porcentaje *

                0.60

            ) +

            (

                frecuencia20.porcentaje *

                0.40

            );


        return this.normalizarScore(

            score

        );

    }


    /*==============================================================
        SCORE TENDENCIA
    ==============================================================*/

    calcularScoreTendencia(

        tendencia

    ) {

        /*
         * Convertimos aproximadamente el rango
         * -50 / +50 en 0 / 100.

         */

        const valor =

            tendencia.valor;


        const score =

            50 +

            (

                valor *

                5

            );


        return this.normalizarScore(

            score

        );

    }


    /*==============================================================
        CONFIANZA
    ==============================================================*/

    calcularConfianza(

        totalSemanas,

        frecuenciaHistorica

    ) {

        if (

            totalSemanas <= 0

        ) {

            return 0;

        }


        /*
         * Evidencia temporal.

         */

        const evidenciaTemporal =

            100 *

            (

                1 -

                Math.exp(

                    -totalSemanas /

                    150

                )

            );


        /*
         * Evidencia específica del número.

         */

        const evidenciaNumero =

            frecuenciaHistorica > 0

                ? 100 *

                    (

                        1 -

                        Math.exp(

                            -frecuenciaHistorica /

                            10

                        )

                    )

                : 0;


        const confianza =

            (

                evidenciaTemporal *

                0.60

            ) +

            (

                evidenciaNumero *

                0.40

            );


        return this.normalizarConfianza(

            confianza

        );

    }


    /*==============================================================
        COMPROBAR NÚMERO EN SEMANA
    ==============================================================*/

    semanaContieneNumero(

        semana,

        numero

    ) {

        if (!semana) {

            return false;

        }


        const listas = [

            semana.numeros,

            semana.numerosTexto,

            semana.resultado

        ];


        for (

            const lista of listas

        ) {

            if (

                !Array.isArray(

                    lista

                )

            ) {

                continue;

            }


            if (

                lista.some(

                    valor =>

                        Number(valor) ===

                        Number(numero)

                )

            ) {

                return true;

            }

        }


        return false;

    }


    /*==============================================================
        RESULTADO SIN DATOS
    ==============================================================*/

    resultadoSinDatos(

        numero,

        contexto,

        mensaje

    ) {

        return new MotorResult({

            numero,

            motor: this.nombre,

            version: this.version,

            score: 0,

            confianza: 0,

            peso:

                this.obtenerPeso(

                    contexto

                ),

            detalle: {

                mensaje

            },

            indicadores: {

                frecuenciaHistorica: 0,

                frecuencia3: 0,

                frecuencia5: 0,

                frecuencia10: 0,

                frecuencia20: 0,

                porcentajeHistorico: 0,

                porcentaje3: 0,

                porcentaje5: 0,

                porcentaje10: 0,

                porcentaje20: 0,

                tendencia: 0,

                ratioReciente: 0,

                scoreFrecuencia: 0

            }

        });

    }


    /*==============================================================
        PESO DEL MOTOR
    ==============================================================*/

    obtenerPeso(contexto) {

        if (

            contexto.pesos &&

            contexto.pesos.frecuencia !== undefined

        ) {

            return Number(

                contexto.pesos.frecuencia

            );

        }


        if (

            contexto.configuracion &&

            contexto.configuracion.pesos &&

            contexto.configuracion.pesos.frecuencia !== undefined

        ) {

            return Number(

                contexto.configuracion.pesos.frecuencia

            );

        }


        /*
         * Peso provisional.
         *
         * Más adelante será optimizado automáticamente.

         */

        return 15;

    }

}
