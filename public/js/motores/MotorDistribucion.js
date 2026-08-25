/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * js/motores/MotorDistribucion.js
 *
 * Propósito:
 * Analizar la distribución estructural de cada número 00-99.
 *
 * Indicadores:
 *
 *   - Rango / decena
 *   - Paridad
 *   - Terminación
 *   - Frecuencia dentro de su rango
 *   - Frecuencia dentro de su terminación
 *   - Frecuencia reciente
 *   - Distribución global
 *   - Distribución por ventanas
 *
 * IMPORTANTE:
 *
 * Estos indicadores describen patrones históricos.
 * No representan probabilidades matemáticas futuras.
 *
 **********************************************************************/

import BaseMotor from "./BaseMotor.js";

import MotorResult from "./MotorResult.js";


export default class MotorDistribucion extends BaseMotor {


    constructor() {

        super(

            "Distribucion",

            "1.0.0"

        );

    }


    /*==============================================================
        MÉTODO PRINCIPAL
    ==============================================================*/

  calcular(numero, contexto) {

    const numeroValidado =
        this.normalizarNumero(numero);


    if (
        !this.validarNumero(
            numeroValidado
        )
    ) {

        throw new Error(
            `Número inválido: ${numero}. Debe estar entre 00 y 99.`
        );

    }


    this.validarContexto(
        contexto
    );


    const semanas =
        this.obtenerSemanas(
            contexto
        );


        const semanasOrdenadas =

            this.ordenarSemanas(

                semanas

            );


        /*
         * Construimos las estadísticas generales.
         */

        const estadisticas =

            this.construirEstadisticas(

                semanasOrdenadas

            );


        const rango =

            this.obtenerRango(

                numeroValidado

            );


        const decena =

            this.obtenerDecena(

                numeroValidado

            );


        const terminacion =

            numeroValidado % 10;


        const paridad =

            numeroValidado % 2 === 0

                ? "par"

                : "impar";


        /*
         * Frecuencia del número.

         */

        const frecuenciaNumero =

            estadisticas

                .frecuenciasNumeros

                .get(

                    numeroValidado

                ) || 0;


        /*
         * Frecuencia del rango.

         */

        const frecuenciaRango =

            estadisticas

                .frecuenciasRangos

                .get(

                    rango

                ) || 0;


        /*
         * Frecuencia de la decena.

         */

        const frecuenciaDecena =

            estadisticas

                .frecuenciasDecenas

                .get(

                    decena

                ) || 0;


        /*
         * Frecuencia de terminación.

         */

        const frecuenciaTerminacion =

            estadisticas

                .frecuenciasTerminaciones

                .get(

                    terminacion

                ) || 0;


        /*
         * Frecuencia de paridad.

         */

        const frecuenciaParidad =

            estadisticas

                .frecuenciasParidad

                .get(

                    paridad

                ) || 0;


        /*
         * Análisis reciente.

         */

        const reciente =

            this.calcularReciente(

                numeroValidado,

                semanasOrdenadas,

                contexto

            );


        /*
         * Distribución relativa.

         */

        const distribucionRango =

            this.calcularDistribucionRelativa(

                frecuenciaRango,

                estadisticas.totalNumeros

            );


        const distribucionDecena =

            this.calcularDistribucionRelativa(

                frecuenciaDecena,

                estadisticas.totalNumeros

            );


        const distribucionTerminacion =

            this.calcularDistribucionRelativa(

                frecuenciaTerminacion,

                estadisticas.totalNumeros

            );


        const distribucionParidad =

            this.calcularDistribucionRelativa(

                frecuenciaParidad,

                estadisticas.totalNumeros

            );


        /*
         * Score de rango.

         */

        const scoreRango =

            this.calcularScoreRango(

                distribucionRango,

                estadisticas

            );


        /*
         * Score de terminación.

         */

        const scoreTerminacion =

            this.calcularScoreTerminacion(

                distribucionTerminacion,

                estadisticas

            );


        /*
         * Score de paridad.

         */

        const scoreParidad =

            this.calcularScoreParidad(

                distribucionParidad,

                estadisticas

            );


        /*
         * Score reciente.

         */

        const scoreReciente =

            reciente.score;


        /*
         * Score final.
         *
         * Rango        30%
         * Terminación  20%
         * Paridad      15%
         * Recencia     35%
         */

        const score =

            (

                scoreRango *

                0.30

            ) +

            (

                scoreTerminacion *

                0.20

            ) +

            (

                scoreParidad *

                0.15

            ) +

            (

                scoreReciente *

                0.35

            );


        const confianza =

            this.calcularConfianza(

                semanasOrdenadas.length,

                frecuenciaNumero

            );


        const peso =

            this.obtenerPeso(contexto);


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

                rango,

                rangoTexto:

                    this.obtenerNombreRango(

                        rango

                    ),

                decena,

                decenaTexto:

                    this.formatearDecena(

                        decena

                    ),

                terminacion,

                paridad,

                frecuenciaNumero,

                frecuenciaRango,

                frecuenciaDecena,

                frecuenciaTerminacion,

                frecuenciaParidad,

                distribucionRango:

                    this.redondear(

                        distribucionRango,

                        4

                    ),

                distribucionDecena:

                    this.redondear(

                        distribucionDecena,

                        4

                    ),

                distribucionTerminacion:

                    this.redondear(

                        distribucionTerminacion,

                        4

                    ),

                distribucionParidad:

                    this.redondear(

                        distribucionParidad,

                        4

                    ),

                reciente,

                scoreRango:

                    this.redondear(

                        scoreRango

                    ),

                scoreTerminacion:

                    this.redondear(

                        scoreTerminacion

                    ),

                scoreParidad:

                    this.redondear(

                        scoreParidad

                    )

            },

            indicadores: {

                rango,

                decena,

                terminacion,

                paridad,

                frecuenciaNumero,

                frecuenciaRango,

                frecuenciaTerminacion,

                frecuenciaParidad,

                frecuenciaReciente:

                    reciente.apariciones,

                scoreDistribucion:

                    this.redondear(

                        score

                    )

            }

        });

    }


   /*==============================================================
    OBTENER SEMANAS
==============================================================*/

obtenerSemanas(contexto) {

    if (!contexto) {

        return [];

    }


    if (
        Array.isArray(
            contexto.semanas
        )
    ) {

        return contexto.semanas;

    }


    if (
        Array.isArray(
            contexto.historial
        )
    ) {

        return contexto.historial;

    }


    if (
        contexto.historial &&
        Array.isArray(
            contexto.historial.semanas
        )
    ) {

        return contexto.historial.semanas;

    }


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

        const copia = [...semanas];


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


        return copia.reverse();

    }


    /*==============================================================
        CONSTRUIR ESTADÍSTICAS
    ==============================================================*/

    construirEstadisticas(semanas) {

        const frecuenciasNumeros =

            new Map();


        const frecuenciasRangos =

            new Map();


        const frecuenciasDecenas =

            new Map();


        const frecuenciasTerminaciones =

            new Map();


        const frecuenciasParidad =

            new Map();


        let totalNumeros = 0;


        for (

            const semana of semanas

        ) {

            const numeros =

                this.obtenerNumerosSemana(

                    semana

                );


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

                totalNumeros++;


                /*
                 * Número.

                 */

                frecuenciasNumeros.set(

                    numero,

                    (

                        frecuenciasNumeros.get(

                            numero

                        ) || 0

                    ) + 1

                );


                /*
                 * Rango.

                 */

                const rango =

                    this.obtenerRango(

                        numero

                    );


                frecuenciasRangos.set(

                    rango,

                    (

                        frecuenciasRangos.get(

                            rango

                        ) || 0

                    ) + 1

                );


                /*
                 * Decena.

                 */

                const decena =

                    this.obtenerDecena(

                        numero

                    );


                frecuenciasDecenas.set(

                    decena,

                    (

                        frecuenciasDecenas.get(

                            decena

                        ) || 0

                    ) + 1

                );


                /*
                 * Terminación.

                 */

                const terminacion =

                    numero % 10;


                frecuenciasTerminaciones.set(

                    terminacion,

                    (

                        frecuenciasTerminaciones.get(

                            terminacion

                        ) || 0

                    ) + 1

                );


                /*
                 * Paridad.

                 */

                const paridad =

                    numero % 2 === 0

                        ? "par"

                        : "impar";


                frecuenciasParidad.set(

                    paridad,

                    (

                        frecuenciasParidad.get(

                            paridad

                        ) || 0

                    ) + 1

                );

            }

        }


        return {

            frecuenciasNumeros,

            frecuenciasRangos,

            frecuenciasDecenas,

            frecuenciasTerminaciones,

            frecuenciasParidad,

            totalNumeros

        };

    }


    /*==============================================================
        OBTENER NÚMEROS DE SEMANA
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
        RANGO
    *
    * 00-09 → rango 0
    * 10-19 → rango 1
    * ...
    * 90-99 → rango 9
    ==============================================================*/

    obtenerRango(numero) {

        return Math.floor(

            numero / 10

        );

    }


    /*==============================================================
        NOMBRE DEL RANGO
    ==============================================================*/

    obtenerNombreRango(rango) {

        const inicio =

            rango * 10;


        const fin =

            inicio + 9;


        return (

            String(inicio)

                .padStart(2, "0")

            +

            "-"

            +

            String(fin)

                .padStart(2, "0")

        );

    }


    /*==============================================================
        DECENA
    ==============================================================*/

    obtenerDecena(numero) {

        return Math.floor(

            numero / 10

        );

    }


    /*==============================================================
        FORMATEAR DECENA
    ==============================================================*/

    formatearDecena(decena) {

        const inicio =

            decena * 10;


        const fin =

            inicio + 9;


        return (

            String(inicio)

                .padStart(

                    2,

                    "0"

                )

            +

            "-"

            +

            String(fin)

                .padStart(

                    2,

                    "0"

                )

        );

    }


    /*==============================================================
        DISTRIBUCIÓN RELATIVA
    ==============================================================*/

    calcularDistribucionRelativa(

        frecuencia,

        total

    ) {

        if (

            total <= 0

        ) {

            return 0;

        }


        return (

            frecuencia /

            total

        ) * 100;

    }


    /*==============================================================
        SCORE DE RANGO
    ==============================================================*/

    calcularScoreRango(

        distribucion,

        estadisticas

    ) {

        const cantidadRangos =

            10;


        /*
         * Distribución uniforme de referencia.

         */

        const esperado =

            100 /

            cantidadRangos;


        if (

            esperado <= 0

        ) {

            return 0;

        }


        /*
         * Comparamos la frecuencia observada
         * contra el promedio estructural.

         */

        const ratio =

            distribucion /

            esperado;


        /*
         * Evitamos que una frecuencia elevada
         * produzca automáticamente un score 100.

         */

        const score =

            Math.min(

                ratio *

                50,

                100

            );


        return this.normalizarScore(

            score

        );

    }


    /*==============================================================
        SCORE DE TERMINACIÓN
    ==============================================================*/

    calcularScoreTerminacion(

        distribucion,

        estadisticas

    ) {

        /*
         * Existen 10 terminaciones:
         *
         * 0,1,2,...9
         *
         * Referencia uniforme = 10%.

         */

        const esperado = 10;


        if (

            esperado <= 0

        ) {

            return 0;

        }


        const ratio =

            distribucion /

            esperado;


        return this.normalizarScore(

            Math.min(

                ratio *

                50,

                100

            )

        );

    }


    /*==============================================================
        SCORE PARIDAD
    ==============================================================*/

    calcularScoreParidad(

        distribucion,

        estadisticas

    ) {

        /*
         * Referencia teórica simple:
         *
         * 50% pares
         * 50% impares.

         */

        const esperado = 50;


        const ratio =

            distribucion /

            esperado;


        return this.normalizarScore(

            Math.min(

                ratio *

                50,

                100

            )

        );

    }


    /*==============================================================
        ANÁLISIS RECIENTE
    ==============================================================*/

    calcularReciente(

        numero,

        semanas,

        contexto

    ) {

        const ventana =

            this.obtenerVentanaReciente(

                contexto,

                semanas.length

            );


        const muestra =

            semanas.slice(

                0,

                ventana

            );


        let apariciones = 0;


        for (

            const semana of muestra

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


        const frecuencia =

            ventana > 0

                ? (

                    apariciones /

                    ventana

                ) * 100

                : 0;


        return {

            ventana,

            apariciones,

            frecuencia:

                this.redondear(

                    frecuencia

                ),

            score:

                this.normalizarScore(

                    frecuencia *

                    10

                )

        };

    }


    /*==============================================================
        VENTANA RECIENTE
    ==============================================================*/

    obtenerVentanaReciente(

        contexto,

        totalSemanas

    ) {

        if (

            contexto.distribucion &&

            contexto.distribucion

                .ventanaReciente !== undefined

        ) {

            const valor =

                Number(

                    contexto.distribucion

                        .ventanaReciente

                );


            if (

                Number.isInteger(

                    valor

                ) &&

                valor > 0

            ) {

                return Math.min(

                    valor,

                    totalSemanas

                );

            }

        }


        /*
         * Predeterminado:

         * últimas 20 semanas.

         */

        return Math.min(

            20,

            totalSemanas

        );

    }


    /*==============================================================
        COMPROBAR NÚMERO
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
        CONFIANZA
    ==============================================================*/

    calcularConfianza(

        totalSemanas,

        frecuenciaNumero

    ) {

        if (

            totalSemanas <= 0 ||

            frecuenciaNumero <= 0

        ) {

            return 0;

        }


        const evidenciaTemporal =

            100 *

            (

                1 -

                Math.exp(

                    -totalSemanas /

                    150

                )

            );


        const evidenciaNumero =

            100 *

            (

                1 -

                Math.exp(

                    -frecuenciaNumero /

                    10

                )

            );


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

                rango:

                    this.obtenerRango(

                        numero

                    ),

                decena:

                    this.obtenerDecena(

                        numero

                    ),

                terminacion:

                    numero % 10,

                paridad:

                    numero % 2 === 0

                        ? "par"

                        : "impar",

                frecuenciaNumero: 0,

                frecuenciaRango: 0,

                frecuenciaTerminacion: 0,

                frecuenciaParidad: 0,

                frecuenciaReciente: 0,

                scoreDistribucion: 0

            }

        });

    }


    /*==============================================================
        PESO GLOBAL
    ==============================================================*/

    obtenerPeso(contexto) {

        if (

            contexto.pesos &&

            contexto.pesos.distribucion !== undefined

        ) {

            return Number(

                contexto.pesos.distribucion

            );

        }


        if (

            contexto.configuracion &&

            contexto.configuracion.pesos &&

            contexto.configuracion.pesos.distribucion !== undefined

        ) {

            return Number(

                contexto.configuracion.pesos.distribucion

            );

        }


        /*
         * Peso provisional.

         */

        return 10;

    }

}