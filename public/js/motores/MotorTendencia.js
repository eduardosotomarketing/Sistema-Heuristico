/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * js/motores/MotorTendencia.js
 *
 * Propósito:
 * Analizar la evolución temporal reciente de cada número (00-99).
 *
 * Analiza:
 * - Últimas 3 semanas
 * - Últimas 5 semanas
 * - Últimas 10 semanas
 * - Últimas 20 semanas
 * - Últimas 50 semanas
 *
 * Diferencia conceptual:
 *
 * MotorFrecuencia:
 *     mide cuánto aparece un número.
 *
 * MotorTendencia:
 *     mide cómo está evolucionando su frecuencia reciente
 *     respecto de períodos más amplios.
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

    /*
     * Normalizar el número recibido.
     */

    const numeroValidado =
        this.normalizarNumero(numero);


    /*
     * Validar que pertenezca
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


        if (semanas.length === 0) {

            return this.resultadoSinDatos(
                numeroValidado,
                contexto,
                "No existen semanas históricas."
            );

        }


        const semanasOrdenadas =
            this.ordenarSemanas(semanas);


        const ventanas =
            this.obtenerConfiguracionVentanas(
                contexto
            );


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


        /*==========================================================
            FRECUENCIAS PORCENTUALES
        ==========================================================*/

        const porcentaje3 =
            this.obtenerPorcentaje(
                resultadosVentanas,
                3
            );


        const porcentaje5 =
            this.obtenerPorcentaje(
                resultadosVentanas,
                5
            );


        const porcentaje10 =
            this.obtenerPorcentaje(
                resultadosVentanas,
                10
            );


        const porcentaje20 =
            this.obtenerPorcentaje(
                resultadosVentanas,
                20
            );


        const porcentaje50 =
            this.obtenerPorcentaje(
                resultadosVentanas,
                50
            );


        /*==========================================================
            CORTO PLAZO
        ==========================================================*/

        const cortoPlazo =

            (
                porcentaje3 * 0.60
            ) +

            (
                porcentaje5 * 0.40
            );


        /*==========================================================
            MEDIANO PLAZO
        ==========================================================*/

        const medianoPlazo =

            (
                porcentaje10 * 0.60
            ) +

            (
                porcentaje20 * 0.40
            );


        /*==========================================================
            LARGO PLAZO
        ==========================================================*/

        const largoPlazo =
            porcentaje50;


        /*==========================================================
            DIFERENCIAS
        ==========================================================*/

        const diferenciaCortoMediano =
            cortoPlazo - medianoPlazo;


        const diferenciaCortoLargo =
            cortoPlazo - largoPlazo;


        /*==========================================================
            VALOR DE TENDENCIA
        ==========================================================*/

        const valorTendencia =

            (
                diferenciaCortoMediano * 0.70
            ) +

            (
                diferenciaCortoLargo * 0.30
            );


        /*==========================================================
            CLASIFICACIÓN
        ==========================================================*/

        const direccion =
            this.clasificarTendencia(
                valorTendencia
            );


        /*==========================================================
            SCORE DE ACTIVIDAD RECIENTE
        ==========================================================*/

        const scoreActividad =
            this.calcularScoreActividad(
                porcentaje3,
                porcentaje5,
                porcentaje10
            );


        /*==========================================================
            SCORE DE DIRECCIÓN
        ==========================================================*/

        const scoreDireccion =
            this.calcularScoreDireccion(
                valorTendencia
            );


        /*==========================================================
            SCORE FINAL
        ==========================================================*/

        const score =

            (
                scoreActividad * 0.55
            ) +

            (
                scoreDireccion * 0.45
            );


        const confianza =
            this.calcularConfianza(
                semanasOrdenadas.length
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

                ventanas:
                    resultadosVentanas,

                configuracion:
                    ventanas,

                semanasDisponibles:
                    semanasOrdenadas.length,

                cortoPlazo:
                    this.redondear(
                        cortoPlazo,
                        4
                    ),

                medianoPlazo:
                    this.redondear(
                        medianoPlazo,
                        4
                    ),

                largoPlazo:
                    this.redondear(
                        largoPlazo,
                        4
                    ),

                diferenciaCortoMediano:
                    this.redondear(
                        diferenciaCortoMediano,
                        4
                    ),

                diferenciaCortoLargo:
                    this.redondear(
                        diferenciaCortoLargo,
                        4
                    ),

                valorTendencia:
                    this.redondear(
                        valorTendencia,
                        4
                    ),

                direccion,

                scoreActividad:
                    this.redondear(
                        scoreActividad
                    ),

                scoreDireccion:
                    this.redondear(
                        scoreDireccion
                    )

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

                porcentaje3:
                    this.redondear(
                        porcentaje3,
                        4
                    ),

                porcentaje5:
                    this.redondear(
                        porcentaje5,
                        4
                    ),

                porcentaje10:
                    this.redondear(
                        porcentaje10,
                        4
                    ),

                porcentaje20:
                    this.redondear(
                        porcentaje20,
                        4
                    ),

                porcentaje50:
                    this.redondear(
                        porcentaje50,
                        4
                    ),

                cortoPlazo:
                    this.redondear(
                        cortoPlazo,
                        4
                    ),

                medianoPlazo:
                    this.redondear(
                        medianoPlazo,
                        4
                    ),

                largoPlazo:
                    this.redondear(
                        largoPlazo,
                        4
                    ),

                valorTendencia:
                    this.redondear(
                        valorTendencia,
                        4
                    ),

                direccion,

                scoreTendencia:
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
        ORDENAR SEMANAS
    ==============================================================*/

    ordenarSemanas(semanas) {

        const copia =
            [...semanas];


        if (
            copia.some(
                semana =>
                    semana &&
                    semana.semana !== undefined
            )
        ) {

            copia.sort(
                (a, b) =>
                    Number(b.semana) -
                    Number(a.semana)
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
                    new Date(b.fecha) -
                    new Date(a.fecha)
            );


            return copia;

        }


        return copia.reverse();

    }


    /*==============================================================
        CONFIGURACIÓN DE VENTANAS
    ==============================================================*/

    obtenerConfiguracionVentanas(contexto) {

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
                contexto.configuracion
                    .tendencia
                    .ventanas
            )
        ) {

            configuracion =
                contexto.configuracion
                    .tendencia
                    .ventanas;

        }


        if (!configuracion) {

            return configuracionPredeterminada;

        }


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


        const sumaPesos =
            resultado.reduce(
                (suma, item) =>
                    suma + item.peso,
                0
            );


        if (sumaPesos <= 0) {

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
        CALCULAR VENTANA
    ==============================================================*/

    calcularVentana(
        numero,
        semanas,
        cantidadSemanas
    ) {

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


        const porcentaje =

            cantidadReal > 0

                ? (
                    apariciones /
                    cantidadReal
                ) * 100

                : 0;


        return {

            semanasSolicitadas:
                cantidadSemanas,

            semanasAnalizadas:
                cantidadReal,

            apariciones,

            porcentaje:
                this.redondear(
                    porcentaje,
                    4
                ),

            score:
                this.redondear(
                    this.normalizarScore(
                        porcentaje
                    )
                )

        };

    }


    /*==============================================================
        OBTENER APARICIONES
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
        OBTENER PORCENTAJE
    ==============================================================*/

    obtenerPorcentaje(
        resultados,
        ventana
    ) {

        if (
            !resultados ||
            !resultados[ventana]
        ) {

            return 0;

        }


        return Number(
            resultados[
                ventana
            ].porcentaje
        ) || 0;

    }


    /*==============================================================
        SCORE DE ACTIVIDAD
    ==============================================================*/

    calcularScoreActividad(
        porcentaje3,
        porcentaje5,
        porcentaje10
    ) {

        const score =

            (
                porcentaje3 * 0.45
            ) +

            (
                porcentaje5 * 0.35
            ) +

            (
                porcentaje10 * 0.20
            );


        return this.normalizarScore(
            score
        );

    }


    /*==============================================================
        SCORE DE DIRECCIÓN
    ==============================================================*/

    calcularScoreDireccion(
        valorTendencia
    ) {

        /*
         * Tendencia neutra = 50.
         *
         * Tendencia positiva aumenta el score.
         * Tendencia negativa lo reduce.
         *
         * Factor 2 provisional.
         * Posteriormente podrá ser optimizado
         * mediante MotorEvaluacion.
         */

        const score =
            50 +
            (
                valorTendencia * 2
            );


        return this.normalizarScore(
            score
        );

    }


    /*==============================================================
        CLASIFICAR TENDENCIA
    ==============================================================*/

    clasificarTendencia(valor) {

        if (valor >= 15) {

            return "ascendente_fuerte";

        }


        if (valor >= 5) {

            return "ascendente";

        }


        if (valor <= -15) {

            return "descendente_fuerte";

        }


        if (valor <= -5) {

            return "descendente";

        }


        return "estable";

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

            if (!Array.isArray(lista)) {

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

    calcularConfianza(totalSemanas) {

        if (totalSemanas <= 0) {

            return 0;

        }


        const confianza =

            100 *

            (
                1 -
                Math.exp(
                    -totalSemanas / 80
                )
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

            motor:
                this.nombre,

            version:
                this.version,

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

                frecuencia3: 0,
                frecuencia5: 0,
                frecuencia10: 0,
                frecuencia20: 0,
                frecuencia50: 0,

                porcentaje3: 0,
                porcentaje5: 0,
                porcentaje10: 0,
                porcentaje20: 0,
                porcentaje50: 0,

                cortoPlazo: 0,
                medianoPlazo: 0,
                largoPlazo: 0,

                valorTendencia: 0,

                direccion:
                    "sin_datos",

                scoreTendencia: 0

            }

        });

    }


    /*==============================================================
        OBTENER PESO
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
            contexto.configuracion
                .pesos
                .tendencia !== undefined
        ) {

            return Number(
                contexto.configuracion
                    .pesos
                    .tendencia
            );

        }


        return 20;

    }

}