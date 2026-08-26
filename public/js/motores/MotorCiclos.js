 /**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * js/motores/MotorCiclos.js
 *
 * Propósito:
 * Analizar los ciclos de aparición de cada número 00-99.
 *
 * Indicadores:
 *
 *   - Atraso actual
 *   - Intervalos históricos
 *   - Promedio de intervalo
 *   - Mediana de intervalo
 *   - Intervalo mínimo
 *   - Intervalo máximo
 *   - Desviación estándar
 *   - Regularidad
 *   - Relación atraso/promedio
 *   - Cantidad de apariciones
 *
 * IMPORTANTE:
 *
 * Este motor NO interpreta el atraso como una probabilidad
 * matemática de que el número deba salir.
 *
 * El atraso es solamente una variable heurística.
 *
 **********************************************************************/

import BaseMotor from "./BaseMotor.js";

import MotorResult from "./MotorResult.js";


export default class MotorCiclos extends BaseMotor {


    constructor() {

        super(

            "Ciclos",

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


this.validarContexto(contexto);


const semanas =
    this.obtenerSemanas(contexto);




        /*
         * Si no existe historial no podemos calcular ciclos.
         */

        if (semanas.length === 0) {

            return this.resultadoSinDatos(

                numeroValidado,

                contexto,

                "No existen semanas históricas."

            );

        }


        /*
         * Ordenamos las semanas desde la más reciente
         * hacia la más antigua.
         */

        const semanasOrdenadas =

            this.ordenarSemanas(

                semanas

            );


        /*
         * Obtenemos las posiciones en las que apareció
         * el número.
         */

        const posiciones =

            this.obtenerPosiciones(

                numeroValidado,

                semanasOrdenadas

            );


        /*
         * Cantidad de apariciones.
         */

        const apariciones =

            posiciones.length;


        /*
         * Si apareció menos de dos veces,
         * no podemos calcular intervalos.
         */

        if (apariciones === 0) {

            return this.resultadoSinDatos(

                numeroValidado,

                contexto,

                "El número no registra apariciones."

            );

        }


        if (apariciones === 1) {

            const atraso =

                posiciones[0];


            const confianza =

                this.calcularConfianza(

                    semanasOrdenadas.length,

                    apariciones

                );


            const peso =

                this.obtenerPeso(contexto);


            return new MotorResult({

                numero: numeroValidado,

                motor: this.nombre,

                version: this.version,

                score:

                    this.calcularScoreSinIntervalos(

                        atraso,

                        semanasOrdenadas.length

                    ),

                confianza,

                peso,

                detalle: {

                    apariciones,

                    atrasoActual: atraso,

                    intervalos: [],

                    mensaje:

                        "Existe una sola aparición histórica; todavía no hay suficientes datos para calcular un ciclo."

                },

                indicadores: {

                    atraso,

                    promedioIntervalo: null,

                    medianaIntervalo: null,

                    intervaloMinimo: null,

                    intervaloMaximo: null,

                    desviacionEstandar: null,

                    regularidad: null,

                    relacionAtrasoPromedio: null

                }

            });

        }


        /*
         * Calculamos los intervalos entre apariciones.
         */

        const intervalos =

            this.calcularIntervalos(

                posiciones

            );


        /*
         * Estadísticas de los intervalos.
         */

        const promedio =

            this.calcularPromedio(

                intervalos

            );


        const mediana =

            this.calcularMediana(

                intervalos

            );


        const minimo =

            Math.min(

                ...intervalos

            );


        const maximo =

            Math.max(

                ...intervalos

            );


        const desviacion =

            this.calcularDesviacionEstandar(

                intervalos,

                promedio

            );


        /*
         * Regularidad:
         *
         * Cuanto menor sea la dispersión respecto
         * del promedio, mayor será la regularidad.
         */

        const regularidad =

            this.calcularRegularidad(

                promedio,

                desviacion

            );


        /*
         * Atraso actual.
         */

        const atraso =

            posiciones[0];


        /*
         * Relación entre atraso actual y promedio histórico.
         */

        const relacionAtrasoPromedio =

            promedio > 0

                ? atraso / promedio

                : 0;


        /*
         * Score de atraso.
         */

        const scoreAtraso =

            this.calcularScoreAtraso(

                atraso,

                promedio,

                desviacion

            );


        /*
         * Score de regularidad.

         * Se incorpora como una segunda señal.

         */

        const scoreRegularidad =

            regularidad;


        /*
         * Score de proximidad al ciclo.
         */

        const scoreCiclo =

            this.calcularScoreCiclo(

                atraso,

                promedio,

                desviacion

            );


        /*
         * Combinamos los componentes.
         *
         * Estos pesos son internos del motor y podrán
         * modificarse posteriormente mediante optimización.
         */

        const score =

            (

                scoreAtraso * 0.35

            ) +

            (

                scoreCiclo * 0.45

            ) +

            (

                scoreRegularidad * 0.20

            );


        /*
         * Confianza.
         */

        const confianza =

            this.calcularConfianza(

                semanasOrdenadas.length,

                apariciones

            );


        /*
         * Peso global del motor.
         */

        const peso =

            this.obtenerPeso(contexto);


        /*
         * Resultado final.
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

                apariciones,

                atrasoActual:

                    atraso,

                intervalos,

                promedioIntervalo:

                    this.redondear(

                        promedio

                    ),

                medianaIntervalo:

                    this.redondear(

                        mediana

                    ),

                intervaloMinimo:

                    minimo,

                intervaloMaximo:

                    maximo,

                desviacionEstandar:

                    this.redondear(

                        desviacion

                    ),

                regularidad:

                    this.redondear(

                        regularidad

                    ),

                relacionAtrasoPromedio:

                    this.redondear(

                        relacionAtrasoPromedio,

                        4

                    ),

                scoreAtraso:

                    this.redondear(

                        scoreAtraso

                    ),

                scoreCiclo:

                    this.redondear(

                        scoreCiclo

                    ),

                scoreRegularidad:

                    this.redondear(

                        scoreRegularidad

                    )

            },

            indicadores: {

                atraso,

                promedioIntervalo:

                    this.redondear(

                        promedio

                    ),

                medianaIntervalo:

                    this.redondear(

                        mediana

                    ),

                intervaloMinimo:

                    minimo,

                intervaloMaximo:

                    maximo,

                desviacionEstandar:

                    this.redondear(

                        desviacion

                    ),

                regularidad:

                    this.redondear(

                        regularidad

                    ),

                relacionAtrasoPromedio:

                    this.redondear(

                        relacionAtrasoPromedio,

                        4

                    ),

                scoreCiclos:

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


        /*
         * Si existe número de semana, lo utilizamos.
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
         * Si existe fecha, utilizamos fecha.
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
         * Último recurso:
         * asumimos que vienen de antigua a reciente.
         */

        return copia.reverse();

    }


    /*==============================================================
        OBTENER POSICIONES
    *
    * Posición 0 = semana más reciente.
    * Posición 1 = una semana atrás.
    * etc.
    ==============================================================*/

    obtenerPosiciones(numero, semanas) {

        const posiciones = [];


        for (

            let i = 0;

            i < semanas.length;

            i++

        ) {

            if (

                this.semanaContieneNumero(

                    semanas[i],

                    numero

                )

            ) {

                posiciones.push(i);

            }

        }


        return posiciones;

    }


    /*==============================================================
        CALCULAR INTERVALOS
    ==============================================================*/

    calcularIntervalos(posiciones) {

        const intervalos = [];


        /*
         * Las posiciones están:

         * 0 = aparición más reciente
         * 4 = cuatro semanas atrás
         * 9 = nueve semanas atrás
         *
         * Diferencia:

         * 4 - 0 = 4 semanas
         */

        for (

            let i = 0;

            i < posiciones.length - 1;

            i++

        ) {

            const intervalo =

                posiciones[i + 1] -

                posiciones[i];


            if (intervalo > 0) {

                intervalos.push(

                    intervalo

                );

            }

        }


        return intervalos;

    }


    /*==============================================================
        PROMEDIO
    ==============================================================*/

    calcularPromedio(valores) {

        if (

            !Array.isArray(valores) ||

            valores.length === 0

        ) {

            return 0;

        }


        const suma =

            valores.reduce(

                (total, valor) =>

                    total + valor,

                0

            );


        return suma /

               valores.length;

    }


    /*==============================================================
        MEDIANA
    ==============================================================*/

    calcularMediana(valores) {

        if (

            !Array.isArray(valores) ||

            valores.length === 0

        ) {

            return 0;

        }


        const ordenados =

            [...valores].sort(

                (a, b) => a - b

            );


        const mitad =

            Math.floor(

                ordenados.length / 2

            );


        if (

            ordenados.length % 2 === 0

        ) {

            return (

                ordenados[mitad - 1] +

                ordenados[mitad]

            ) / 2;

        }


        return ordenados[mitad];

    }


    /*==============================================================
        DESVIACIÓN ESTÁNDAR
    ==============================================================*/

    calcularDesviacionEstandar(

        valores,

        promedio

    ) {

        if (

            !Array.isArray(valores) ||

            valores.length === 0

        ) {

            return 0;

        }


        const varianza =

            valores.reduce(

                (total, valor) =>

                    total +

                    Math.pow(

                        valor -

                        promedio,

                        2

                    ),

                0

            ) /

            valores.length;


        return Math.sqrt(

            varianza

        );

    }


    /*==============================================================
        REGULARIDAD
    ==============================================================*/

    calcularRegularidad(

        promedio,

        desviacion

    ) {

        if (promedio <= 0) {

            return 0;

        }


        /*
         * Coeficiente de variación.

         * CV = desviación / promedio

         *
         * Cuanto menor sea el CV,
         * más regular es el ciclo.
         */

        const cv =

            desviacion /

            promedio;


        /*
         * Transformamos a 0-100.

         * CV = 0    → 100
         * CV = 1    → 0
         */

        const regularidad =

            100 *

            (

                1 -

                Math.min(

                    cv,

                    1

                )

            );


        return this.normalizarScore(

            regularidad

        );

    }


    /*==============================================================
        SCORE DE ATRASO
    ==============================================================*/

    calcularScoreAtraso(

        atraso,

        promedio,

        desviacion

    ) {

        if (promedio <= 0) {

            return 0;

        }


        /*
         * El atraso se compara contra
         * el ciclo promedio.

         * Ejemplo:

         * promedio = 5
         * atraso = 5

         * Está exactamente en el promedio.
         */

        const ratio =

            atraso /

            promedio;


        /*
         * Cuando el atraso supera el promedio,
         * la señal aumenta.

         * Esto NO significa que exista una
         * obligación matemática de aparecer.
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
        SCORE DE CICLO
    ==============================================================*/

    calcularScoreCiclo(

        atraso,

        promedio,

        desviacion

    ) {

        if (promedio <= 0) {

            return 0;

        }


        /*
         * Distancia respecto del ciclo promedio.
         */

        const distancia =

            Math.abs(

                atraso -

                promedio

            );


        /*
         * Si no existe desviación,
         * solamente comparamos con el promedio.
         */

        if (desviacion === 0) {

            if (

                atraso >= promedio

            ) {

                return 100;

            }

            return 50;

        }


        /*
         * Z-score simplificado.

         */

        const z =

            (

                atraso -

                promedio

            ) /

            desviacion;


        /*
         * Convertimos la posición
         * a una escala 0-100.

         *
         * Z <= 0
         * → debajo del promedio.
         *
         * Z = 1
         * → una desviación por encima.
         *
         * Z >= 2
         * → atraso considerable.
         */

        let score =

            50 +

            (

                z *

                25

            );


        /*
         * Pequeño ajuste por distancia.
         */

        if (

            distancia <=

            desviacion

        ) {

            score += 10;

        }


        return this.normalizarScore(

            score

        );

    }


    /*==============================================================
        SCORE CUANDO SOLO EXISTE UNA APARICIÓN
    ==============================================================*/

    calcularScoreSinIntervalos(

        atraso,

        totalSemanas

    ) {

        if (

            totalSemanas <= 0

        ) {

            return 0;

        }


        const ratio =

            atraso /

            totalSemanas;


        return this.normalizarScore(

            ratio * 100

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


        for (const lista of listas) {

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

        apariciones

    ) {

        if (

            totalSemanas <= 0 ||

            apariciones <= 0

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
         * Evidencia por cantidad de apariciones.
         */

        const evidenciaApariciones =

            100 *

            (

                1 -

                Math.exp(

                    -apariciones /

                    8

                )

            );


        /*
         * Combinamos ambas fuentes.

         */

        const confianza =

            (

                evidenciaTemporal *

                0.55

            ) +

            (

                evidenciaApariciones *

                0.45

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

                atraso: 0,

                promedioIntervalo: null,

                medianaIntervalo: null,

                intervaloMinimo: null,

                intervaloMaximo: null,

                desviacionEstandar: null,

                regularidad: null,

                relacionAtrasoPromedio: null

            }

        });

    }


    /*==============================================================
        PESO GLOBAL DEL MOTOR
    ==============================================================*/

    obtenerPeso(contexto) {

        if (

            contexto.pesos &&

            contexto.pesos.ciclos !== undefined

        ) {

            return Number(

                contexto.pesos.ciclos

            );

        }


        if (

            contexto.configuracion &&

            contexto.configuracion.pesos &&

            contexto.configuracion.pesos.ciclos !== undefined

        ) {

            return Number(

                contexto.configuracion.pesos.ciclos

            );

        }


        /*
         * Peso provisional.
         */

        return 15;

    }

}