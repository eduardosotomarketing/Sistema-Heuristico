/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * js/motores/MotorTendencia.js
 *
 * Propósito:
 * Analizar el comportamiento reciente de cada número (00-99).
 *
 * Ventanas utilizadas:
 *
 *   - Últimas 3 semanas
 *   - Últimas 5 semanas
 *   - Últimas 10 semanas
 *   - Últimas 20 semanas
 *   - Últimas 50 semanas
 *
 * Cada ventana posee un peso configurable.
 *
 * Todos los scores se normalizan entre 0 y 100.
 *
 **********************************************************************/

import BaseMotor from "./BaseMotor.js";

import MotorResult from "./MotorResult.js";


export default class MotorTendencia extends BaseMotor {


    constructor() {

        super(

            "Tendencia",

            "1.0.0"

        );

    }


    /*==============================================================
        MÉTODO PRINCIPAL
    ==============================================================*/

    calcular(numero, contexto) {

        const numeroValidado =

            this.validarNumero(numero);


        this.validarContexto(contexto);


        const semanas =

            this.obtenerSemanas(contexto);


        /*
         * Si no existe historial suficiente,
         * devolvemos un resultado vacío.
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

                    frecuencia3: 0,

                    frecuencia5: 0,

                    frecuencia10: 0,

                    frecuencia20: 0,

                    frecuencia50: 0

                }

            });

        }


        /*
         * Las semanas deben analizarse de la más reciente
         * hacia atrás.
         *
         * Si el historial está almacenado en orden
         * cronológico ascendente, invertimos una copia.
         */

        const semanasOrdenadas =

            this.ordenarSemanas(

                semanas

            );


        /*
         * Obtenemos las ventanas configuradas.
         */

        const ventanas =

            this.obtenerConfiguracionVentanas(

                contexto

            );


        /*
         * Calculamos la frecuencia de aparición
         * para cada ventana.
         */

        const resultadosVentanas = {};


        for (const ventana of ventanas) {

            resultadosVentanas[

                ventana.semanas

            ] = this.calcularVentana(

                numeroValidado,

                semanasOrdenadas,

                ventana.semanas

            );

        }


        /*
         * Calculamos el score ponderado.
         */

        const score =

            this.calcularScorePonderado(

                resultadosVentanas,

                ventanas

            );


        /*
         * Calculamos la confianza.
         */

        const confianza =

            this.calcularConfianza(

                semanasOrdenadas.length

            );


        /*
         * Peso global del Motor Tendencia.
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

            score,

            confianza,

            peso,

            detalle: {

                ventanas:

                    resultadosVentanas,

                configuracion:

                    ventanas,

                semanasDisponibles:

                    semanasOrdenadas.length

            },

            indicadores: {

                frecuencia3:

                    this.obtenerFrecuencia(

                        resultadosVentanas,

                        3

                    ),

                frecuencia5:

                    this.obtenerFrecuencia(

                        resultadosVentanas,

                        5

                    ),

                frecuencia10:

                    this.obtenerFrecuencia(

                        resultadosVentanas,

                        10

                    ),

                frecuencia20:

                    this.obtenerFrecuencia(

                        resultadosVentanas,

                        20

                    ),

                frecuencia50:

                    this.obtenerFrecuencia(

                        resultadosVentanas,

                        50

                    ),

                scoreTendencia:

                    this.redondear(score)

            }

        });

    }


    /*==============================================================
        OBTENER SEMANAS
    ==============================================================*/

    obtenerSemanas(contexto) {

        if (

            Array.isArray(

                contexto.semanas

            )

        ) {

            return contexto.semanas;

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
         * Primero intentamos utilizar el número
         * de semana.
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
         * Si no existe número de semana,
         * utilizamos la fecha.
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
         * Si no podemos determinar el orden,
         * asumimos que el array ya está ordenado
         * cronológicamente y lo invertimos.
         */

        return copia.reverse();

    }


    /*==============================================================
        CONFIGURACIÓN DE VENTANAS
    ==============================================================*/

    obtenerConfiguracionVentanas(contexto) {

        /*
         * Configuración predeterminada.
         *
         * La suma de pesos debe ser 100.
         */

        const configuracionPredeterminada = [

            {
                semanas: 3,
                peso: 35
            },

            {
                semanas: 5,
                peso: 30
            },

            {
                semanas: 10,
                peso: 20
            },

            {
                semanas: 20,
                peso: 10
            },

            {
                semanas: 50,
                peso: 5
            }

        ];


        /*
         * Buscamos configuración personalizada.
         */

        let configuracion = null;


        if (

            contexto.tendencia &&

            Array.isArray(

                contexto.tendencia.ventanas

            )

        ) {

            configuracion =

                contexto.tendencia.ventanas;

        }


        else if (

            contexto.configuracion &&

            contexto.configuracion.tendencia &&

            Array.isArray(

                contexto.configuracion.tendencia.ventanas

            )

        ) {

            configuracion =

                contexto.configuracion.tendencia.ventanas;

        }


        /*
         * Si no existe configuración,
         * usamos la predeterminada.
         */

        if (!configuracion) {

            return configuracionPredeterminada;

        }


        /*
         * Validamos y limpiamos la configuración.
         */

        const resultado =

            configuracion

                .map(item => ({

                    semanas:

                        Number(

                            item.semanas

                        ),

                    peso:

                        Number(

                            item.peso

                        )

                }))

                .filter(item =>

                    Number.isInteger(

                        item.semanas

                    ) &&

                    item.semanas > 0 &&

                    Number.isFinite(

                        item.peso

                    ) &&

                    item.peso >= 0

                );


        if (resultado.length === 0) {

            return configuracionPredeterminada;

        }


        /*
         * Normalizamos los pesos para que
         * siempre sumen 100.
         */

        const sumaPesos =

            resultado.reduce(

                (suma, item) =>

                    suma + item.peso,

                0

            );


        if (sumaPesos === 0) {

            return configuracionPredeterminada;

        }


        return resultado.map(

            item => ({

                semanas:

                    item.semanas,

                peso:

                    (

                        item.peso /

                        sumaPesos

                    ) * 100

            })

        );

    }


    /*==============================================================
        CALCULAR UNA VENTANA
    ==============================================================*/

    calcularVentana(

        numero,

        semanas,

        cantidadSemanas

    ) {

        /*
         * Tomamos únicamente las semanas
         * disponibles.
         */

        const cantidadReal =

            Math.min(

                cantidadSemanas,

                semanas.length

            );


        const muestra =

            semanas.slice(

                0,

                cantidadReal

            );


        let apariciones = 0;


        for (const semana of muestra) {

            if (

                this.semanaContieneNumero(

                    semana,

                    numero

                )

            ) {

                apariciones++;

            }

        }


        /*
         * Frecuencia relativa de la ventana.
         */

        const frecuencia =

            cantidadReal > 0

                ? (

                    apariciones /

                    cantidadReal

                ) * 100

                : 0;


        /*
         * Score de la ventana.
         *
         * La frecuencia máxima teórica sería
         * 100% si el número apareciera en
         * todas las semanas.
         */

        const score =

            this.normalizarScore(

                frecuencia

            );


        return {

            semanasSolicitadas:

                cantidadSemanas,

            semanasAnalizadas:

                cantidadReal,

            apariciones,

            frecuencia:

                this.redondear(

                    frecuencia

                ),

            score:

                this.redondear(

                    score

                )

        };

    }


    /*==============================================================
        CALCULAR SCORE PONDERADO
    ==============================================================*/

    calcularScorePonderado(

        resultados,

        ventanas

    ) {

        let score = 0;

        let pesoUtilizado = 0;


        for (const ventana of ventanas) {

            const resultado =

                resultados[

                    ventana.semanas

                ];


            if (!resultado) {

                continue;

            }


            /*
             * Si no existen suficientes semanas,
             * utilizamos igualmente la información
             * disponible, pero registramos solamente
             * el score real de esa ventana.
             */

            score +=

                resultado.score *

                (

                    ventana.peso /

                    100

                );


            pesoUtilizado +=

                ventana.peso;

        }


        if (pesoUtilizado === 0) {

            return 0;

        }


        /*
         * Normalizamos nuevamente en caso de
         * que alguna configuración personalizada
         * haya dejado pesos incompletos.
         */

        const resultadoFinal =

            score *

            (

                100 /

                pesoUtilizado

            );


        return this.normalizarScore(

            resultadoFinal

        );

    }


    /*==============================================================
        OBTENER FRECUENCIA
    ==============================================================*/

    obtenerFrecuencia(

        resultados,

        ventana

    ) {

        if (

            !resultados ||

            !resultados[ventana]

        ) {

            return 0;

        }


        return resultados[

            ventana

        ].apariciones;

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
        CALCULAR CONFIANZA
    ==============================================================*/

    calcularConfianza(

        totalSemanas

    ) {

        /*
         * La tendencia necesita una cantidad mínima
         * de historial para ser representativa.
         *
         * No significa probabilidad de acierto.
         */

        if (totalSemanas <= 0) {

            return 0;

        }


        /*
         * Utilizamos una función de saturación.
         *
         * 10 semanas  -> evidencia baja
         * 50 semanas  -> evidencia media
         * 100+        -> evidencia alta
         */

        const confianza =

            100 *

            (

                1 -

                Math.exp(

                    -totalSemanas /

                    80

                )

            );


        return this.normalizarConfianza(

            confianza

        );

    }


    /*==============================================================
        OBTENER PESO DEL MOTOR
    ==============================================================*/

    obtenerPeso(contexto) {

        if (

            contexto.pesos &&

            contexto.pesos.tendencia !== undefined

        ) {

            return Number(

                contexto.pesos.tendencia

            );

        }


        if (

            contexto.configuracion &&

            contexto.configuracion.pesos &&

            contexto.configuracion.pesos.tendencia !== undefined

        ) {

            return Number(

                contexto.configuracion.pesos.tendencia

            );

        }


        /*
         * Peso predeterminado.
         */

        return 20;

    }

}