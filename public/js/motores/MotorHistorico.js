/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * js/motores/MotorHistorico.js
 *
 * Propósito:
 * Calcular el comportamiento histórico de un número (00-99).
 *
 * El motor analiza:
 *
 *   - Cantidad de apariciones
 *   - Total de semanas analizadas
 *   - Porcentaje histórico de aparición
 *   - Frecuencia relativa
 *   - Posición histórica
 *
 * El resultado se normaliza a una escala 0-100.
 *
 **********************************************************************/

import BaseMotor from "./BaseMotor.js";

import MotorResult from "./MotorResult.js";


export default class MotorHistorico extends BaseMotor {


    constructor() {

        super(

            "Historico",

            "1.0.0"

        );

    }


    /*==============================================================
        MÉTODO PRINCIPAL
    ==============================================================*/

  calcular(numero, contexto) {

    /*
     * Normalizar número.
     */

    const numeroValidado =
        this.normalizarNumero(numero);


    /*
     * Validar rango 00-99.
     */

    if (
        !this.validarNumero(
            numeroValidado
        )
    ) {

        throw new Error(
            `Número inválido: ${numero}. Debe estar entre 00 y 99.`
        );

    }


    /*
     * Validar contexto.
     */

    this.validarContexto(
        contexto
    );


    /*
     * Obtener semanas.
     */

    const semanas =
        this.obtenerSemanas(
            contexto
        );


        /*
         * Si todavía no existen semanas,
         * no podemos calcular comportamiento histórico.
         */

        if (semanas.length === 0) {

            return new MotorResult({

                numero: numeroValidado,

                motor: this.nombre,

                version: this.version,

                score: 0,

                confianza: 0,

                peso:

                    this.obtenerPeso(contexto),

                detalle: {

                    mensaje:

                        "No existen semanas históricas."

                },

                indicadores: {

                    apariciones: 0,

                    totalSemanas: 0,

                    porcentaje: 0,

                    frecuenciaRelativa: 0,

                    posicionHistorica: null

                }

            });

        }


        /*
         * Contamos cuántas veces apareció
         * el número dentro del historial.
         */

        const apariciones =

            this.contarApariciones(

                numeroValidado,

                semanas

            );


        /*
         * Total de semanas.
         */

        const totalSemanas =

            semanas.length;


        /*
         * Porcentaje histórico.
         *
         * Ejemplo:
         *
         * 50 apariciones
         * 500 semanas
         *
         * = 10%
         */

        const porcentaje =

            (

                apariciones /

                totalSemanas

            ) * 100;


        /*
         * Para comparar números entre sí,
         * calculamos la frecuencia relativa.
         *
         * Se compara contra el número que
         * más veces apareció.
         */

        const maximo =

            this.obtenerMaximaFrecuencia(

                semanas

            );


        let frecuenciaRelativa = 0;


        if (maximo > 0) {

            frecuenciaRelativa =

                (

                    apariciones /

                    maximo

                ) * 100;

        }


        /*
         * Obtenemos la posición histórica.
         *
         * 1 = número más frecuente.
         */

        const posicionHistorica =

            this.calcularPosicion(

                numeroValidado,

                semanas

            );


        /*
         * Calculamos la confianza.
         *
         * Cuantas más semanas tengamos,
         * mayor será la evidencia disponible.
         */

        const confianza =

            this.calcularConfianza(

                totalSemanas

            );


        /*
         * El score histórico será la frecuencia
         * relativa respecto al máximo histórico.
         */

        const score =

            this.normalizarScore(

                frecuenciaRelativa

            );


        /*
         * Peso configurado para este motor.
         */

        const peso =

            this.obtenerPeso(contexto);


        /*
         * Creamos el resultado estándar.
         */

        return new MotorResult({

            numero: numeroValidado,

            motor: this.nombre,

            version: this.version,

            score: score,

            confianza: confianza,

            peso: peso,

            detalle: {

                apariciones,

                totalSemanas,

                porcentaje:

                    this.redondear(

                        porcentaje

                    ),

                frecuenciaRelativa:

                    this.redondear(

                        frecuenciaRelativa

                    ),

                posicionHistorica,

                maximoApariciones:

                    maximo

            },

            indicadores: {

                frecuenciaHistorica:

                    apariciones,

                porcentajeHistorico:

                    this.redondear(

                        porcentaje

                    ),

                scoreHistorico:

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


    /*
     * contexto.semanas
     */

    if (
        Array.isArray(
            contexto.semanas
        )
    ) {

        return contexto.semanas;

    }


    /*
     * contexto.historial directamente como array.
     */

    if (
        Array.isArray(
            contexto.historial
        )
    ) {

        return contexto.historial;

    }


    /*
     * contexto.historial.semanas
     */

    if (
        contexto.historial &&
        Array.isArray(
            contexto.historial.semanas
        )
    ) {

        return contexto.historial.semanas;

    }


    /*
     * contexto.data.semanas
     */

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
        CONTAR APARICIONES
    ==============================================================*/

    contarApariciones(numero, semanas) {

        let contador = 0;


        for (const semana of semanas) {

            if (

                this.semanaContieneNumero(

                    semana,

                    numero

                )

            ) {

                contador++;

            }

        }


        return contador;

    }


    /*==============================================================
        COMPROBAR SI UNA SEMANA CONTIENE
        UN NÚMERO
    ==============================================================*/

    semanaContieneNumero(semana, numero) {

        if (!semana) {

            return false;

        }


        /*
         * Estructura recomendada:
         *
         * semana.numeros
         */

        if (

            Array.isArray(

                semana.numeros

            )

        ) {

            return this.listaContieneNumero(

                semana.numeros,

                numero

            );

        }


        /*
         * Compatibilidad con:
         *
         * semana.numerosTexto
         */

        if (

            Array.isArray(

                semana.numerosTexto

            )

        ) {

            return this.listaContieneNumero(

                semana.numerosTexto,

                numero

            );

        }


        /*
         * Compatibilidad con una posible
         * estructura "resultado".
         */

        if (

            Array.isArray(

                semana.resultado

            )

        ) {

            return this.listaContieneNumero(

                semana.resultado,

                numero

            );

        }


        return false;

    }


    /*==============================================================
        COMPROBAR NÚMERO EN LISTA
    ==============================================================*/

    listaContieneNumero(lista, numero) {

        return lista.some(

            valor =>

                Number(valor) ===

                Number(numero)

        );

    }


    /*==============================================================
        OBTENER MÁXIMA FRECUENCIA
    ==============================================================*/

    obtenerMaximaFrecuencia(semanas) {

        const frecuencias =

            new Map();


        /*
         * Recorremos todo el historial
         * una sola vez.
         */

        for (const semana of semanas) {

            const numeros =

                this.obtenerNumerosSemana(

                    semana

                );


            /*
             * Evitamos contar dos veces
             * el mismo número dentro de
             * una misma semana.
             */

            const unicos =

                new Set();


            for (const valor of numeros) {

                const numero =

                    Number(valor);


                if (

                    numero >= 0 &&

                    numero <= 99

                ) {

                    unicos.add(numero);

                }

            }


            for (const numero of unicos) {

                const actual =

                    frecuencias.get(

                        numero

                    ) || 0;


                frecuencias.set(

                    numero,

                    actual + 1

                );

            }

        }


        if (frecuencias.size === 0) {

            return 0;

        }


        return Math.max(

            ...frecuencias.values()

        );

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
        CALCULAR POSICIÓN HISTÓRICA
    ==============================================================*/

    calcularPosicion(numero, semanas) {

        const frecuencias =

            new Map();


        for (const semana of semanas) {

            const numeros =

                this.obtenerNumerosSemana(

                    semana

                );


            const unicos =

                new Set();


            for (const valor of numeros) {

                const numeroSemana =

                    Number(valor);


                if (

                    numeroSemana >= 0 &&

                    numeroSemana <= 99

                ) {

                    unicos.add(

                        numeroSemana

                    );

                }

            }


            for (const numeroSemana of unicos) {

                frecuencias.set(

                    numeroSemana,

                    (

                        frecuencias.get(

                            numeroSemana

                        ) || 0

                    ) + 1

                );

            }

        }


        /*
         * Si no hay información para el número,
         * lo colocamos al final.
         */

        const frecuenciaNumero =

            frecuencias.get(numero) || 0;


        let posicion = 1;


        for (const frecuencia of frecuencias.values()) {

            if (

                frecuencia >

                frecuenciaNumero

            ) {

                posicion++;

            }

        }


        return posicion;

    }


    /*==============================================================
        CALCULAR CONFIANZA
    ==============================================================*/

    calcularConfianza(totalSemanas) {

        /*
         * La confianza no representa una probabilidad
         * de que el número salga.
         *
         * Representa la cantidad de información
         * histórica disponible.
         *
         * Escala utilizada:
         *
         * 0 semanas     = 0
         * 10 semanas    = 25
         * 50 semanas    = 50
         * 100 semanas   = 70
         * 250 semanas   = 90
         * 500+ semanas  = 100
         */

        if (totalSemanas <= 0) {

            return 0;

        }


        const confianza =

            (

                100 *

                (

                    1 -

                    Math.exp(

                        -totalSemanas /

                        120

                    )

                )

            );


        return this.normalizarConfianza(

            confianza

        );

    }


    /*==============================================================
        OBTENER PESO
    ==============================================================*/

    obtenerPeso(contexto) {

        /*
         * Primero buscamos:

         * contexto.pesos.historico
         */

        if (

            contexto.pesos &&

            contexto.pesos.historico !== undefined

        ) {

            return Number(

                contexto.pesos.historico

            );

        }


        /*
         * Compatibilidad con:

         * contexto.configuracion.pesos
         */

        if (

            contexto.configuracion &&

            contexto.configuracion.pesos &&

            contexto.configuracion.pesos.historico !== undefined

        ) {

            return Number(

                contexto.configuracion.pesos.historico

            );

        }


        /*
         * Peso predeterminado.
         */

        return 25;

    }

}