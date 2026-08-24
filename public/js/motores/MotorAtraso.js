/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * js/motores/MotorAtraso.js
 *
 * Propósito:
 * Analizar cuánto tiempo lleva un número sin aparecer.
 *
 * Indicadores:
 *
 *   - Atraso actual
 *   - Atraso máximo histórico
 *   - Atraso promedio
 *   - Cantidad de apariciones
 *   - Intervalo promedio entre apariciones
 *   - Último intervalo observado
 *   - Relación atraso/promedio
 *   - Percentil aproximado del atraso
 *   - Atraso normalizado
 *   - Score de atraso
 *
 * IMPORTANTE:
 *
 * El atraso NO significa que un número tenga mayor probabilidad
 * matemática de aparecer en el próximo sorteo.
 *
 * Es únicamente una variable heurística basada en el historial.
 *
 **********************************************************************/

import BaseMotor from "./BaseMotor.js";

import MotorResult from "./MotorResult.js";


export default class MotorAtraso extends BaseMotor {


    constructor() {

        super(

            "Atraso",

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

            this.obtenerSemanas(

                contexto

            );


        /*
         * Sin historial no podemos calcular atraso.

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
         * Calculamos las posiciones donde apareció
         * el número.

         */

        const posiciones =

            this.obtenerPosiciones(

                numeroValidado,

                semanasOrdenadas

            );


        /*
         * Atraso actual.

         */

        const atrasoActual =

            this.calcularAtrasoActual(

                posiciones,

                semanasOrdenadas.length

            );


        /*
         * Intervalos históricos entre apariciones.

         */

        const intervalos =

            this.calcularIntervalos(

                posiciones

            );


        /*
         * Estadísticas de atraso.

         */

        const estadisticasAtraso =

            this.calcularEstadisticasAtraso(

                intervalos,

                atrasoActual

            );


        /*
         * Relación entre el atraso actual
         * y el comportamiento histórico.

         */

        const ratioAtraso =

            this.calcularRatioAtraso(

                atrasoActual,

                estadisticasAtraso.promedio

            );


        /*
         * Percentil aproximado.

         */

        const percentil =

            this.calcularPercentil(

                atrasoActual,

                intervalos

            );


        /*
         * Atraso normalizado respecto del máximo
         * observado.

         */

        const atrasoNormalizado =

            this.calcularAtrasoNormalizado(

                atrasoActual,

                estadisticasAtraso.maximo

            );


        /*
         * Score bruto del atraso.

         */

        const scoreAtraso =

            this.calcularScoreAtraso(

                atrasoActual,

                estadisticasAtraso.promedio,

                estadisticasAtraso.maximo,

                percentil

            );


        /*
         * Analizamos el comportamiento reciente.

         */

        const reciente =

            this.calcularReciente(

                numeroValidado,

                semanasOrdenadas,

                contexto

            );


        /*
         * Analizamos si el atraso actual está cerca,
         * dentro o muy por encima del comportamiento habitual.

         */

        const estadoAtraso =

            this.clasificarAtraso(

                ratioAtraso,

                percentil,

                atrasoActual,

                estadisticasAtraso

            );


        /*
         * Confianza.

         */

        const confianza =

            this.calcularConfianza(

                semanasOrdenadas.length,

                posiciones.length,

                intervalos.length

            );


        /*
         * Peso global.

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

                    scoreAtraso

                ),

            confianza,

            peso,

            detalle: {

                atrasoActual,

                apariciones:

                    posiciones.length,

                intervalos,

                estadisticasAtraso,

                ratioAtraso:

                    this.redondear(

                        ratioAtraso,

                        4

                    ),

                percentil:

                    this.redondear(

                        percentil,

                        4

                    ),

                atrasoNormalizado:

                    this.redondear(

                        atrasoNormalizado,

                        4

                    ),

                reciente,

                estadoAtraso,

                scoreAtraso:

                    this.redondear(

                        scoreAtraso

                    )

            },

            indicadores: {

                atrasoActual,

                atrasoPromedio:

                    this.redondear(

                        estadisticasAtraso.promedio,

                        4

                    ),

                atrasoMaximo:

                    estadisticasAtraso.maximo,

                apariciones:

                    posiciones.length,

                intervaloPromedio:

                    this.redondear(

                        estadisticasAtraso

                            .intervaloPromedio,

                        4

                    ),

                ultimoIntervalo:

                    estadisticasAtraso

                        .ultimoIntervalo,

                ratioAtraso:

                    this.redondear(

                        ratioAtraso,

                        4

                    ),

                percentilAtraso:

                    this.redondear(

                        percentil,

                        4

                    ),

                atrasoNormalizado:

                    this.redondear(

                        atrasoNormalizado,

                        4

                    ),

                scoreAtraso:

                    this.redondear(

                        scoreAtraso

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
         *
         * Esta es nuestra estructura principal actual.
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

        const copia = [

            ...semanas

        ];


        /*
         * Primero utilizamos el número de semana.

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
         * Como alternativa usamos fecha.

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
        OBTENER POSICIONES
    ==============================================================*/

    obtenerPosiciones(

        numero,

        semanas

    ) {

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
        ATRASO ACTUAL
    ==============================================================*/

    calcularAtrasoActual(

        posiciones,

        totalSemanas

    ) {

        /*
         * Si nunca apareció, todo el historial
         * representa atraso observado.

         */

        if (

            posiciones.length === 0

        ) {

            return totalSemanas;

        }


        /*
         * Como las semanas están ordenadas
         * de reciente a antigua, la primera posición
         * representa la última aparición.

         */

        return posiciones[0];

    }


    /*==============================================================
        CALCULAR INTERVALOS
    ==============================================================*/

    calcularIntervalos(

        posiciones

    ) {

        if (

            posiciones.length < 2

        ) {

            return [];

        }


        const intervalos = [];


        /*
         * Ejemplo:
         *
         * posiciones:
         * [2, 8, 14]
         *
         * intervalos:
         * 6, 6
         */

        for (

            let i = 0;

            i < posiciones.length - 1;

            i++

        ) {

            const intervalo =

                posiciones[i + 1] -

                posiciones[i];


            if (

                intervalo > 0

            ) {

                intervalos.push(

                    intervalo

                );

            }

        }


        return intervalos;

    }


    /*==============================================================
        ESTADÍSTICAS DEL ATRASO
    ==============================================================*/

    calcularEstadisticasAtraso(

        intervalos,

        atrasoActual

    ) {

        if (

            intervalos.length === 0

        ) {

            return {

                promedio: 0,

                mediana: 0,

                minimo: 0,

                maximo: atrasoActual,

                intervaloPromedio: 0,

                ultimoIntervalo: 0,

                cantidadIntervalos: 0

            };

        }


        const ordenados =

            [

                ...intervalos

            ].sort(

                (a, b) => a - b

            );


        const suma =

            intervalos.reduce(

                (

                    acumulado,

                    valor

                ) =>

                    acumulado + valor,

                0

            );


        const promedio =

            suma /

            intervalos.length;


        let mediana;


        const mitad =

            Math.floor(

                ordenados.length /

                2

            );


        if (

            ordenados.length % 2 === 0

        ) {

            mediana =

                (

                    ordenados[mitad - 1] +

                    ordenados[mitad]

                ) / 2;

        }

        else {

            mediana =

                ordenados[mitad];

        }


        return {

            promedio,

            mediana,

            minimo:

                ordenados[0],

            maximo:

                Math.max(

                    ...intervalos,

                    atrasoActual

                ),

            intervaloPromedio:

                promedio,

            ultimoIntervalo:

                intervalos[0] || 0,

            cantidadIntervalos:

                intervalos.length

        };

    }


    /*==============================================================
        RATIO ATRASO
    ==============================================================*/

    calcularRatioAtraso(

        atrasoActual,

        promedio

    ) {

        if (

            promedio <= 0

        ) {

            return atrasoActual > 0

                ? atrasoActual

                : 0;

        }


        return (

            atrasoActual /

            promedio

        );

    }


    /*==============================================================
        PERCENTIL
    ==============================================================*/

    calcularPercentil(

        atrasoActual,

        intervalos

    ) {

        if (

            intervalos.length === 0

        ) {

            return atrasoActual > 0

                ? 50

                : 0;

        }


        let menoresOIguales = 0;


        for (

            const intervalo of intervalos

        ) {

            if (

                intervalo <=

                atrasoActual

            ) {

                menoresOIguales++;

            }

        }


        return (

            menoresOIguales /

            intervalos.length

        ) * 100;

    }


    /*==============================================================
        ATRASO NORMALIZADO
    ==============================================================*/

    calcularAtrasoNormalizado(

        atrasoActual,

        maximo

    ) {

        if (

            maximo <= 0

        ) {

            return 0;

        }


        return (

            atrasoActual /

            maximo

        ) * 100;

    }


    /*==============================================================
        SCORE DE ATRASO
    ==============================================================*/

    calcularScoreAtraso(

        atrasoActual,

        promedio,

        maximo,

        percentil

    ) {

        /*
         * Sin atraso no hay señal.

         */

        if (

            atrasoActual <= 0

        ) {

            return 0;

        }


        /*
         * Componente 1:
         *
         * Qué tan lejos está del promedio.

         */

        let componentePromedio = 0;


        if (

            promedio > 0

        ) {

            componentePromedio =

                Math.min(

                    (

                        atrasoActual /

                        promedio

                    ) *

                    50,

                    100

                );

        }


        /*
         * Componente 2:
         *
         * Posición respecto a los intervalos históricos.

         */

        const componentePercentil =

            percentil;


        /*
         * Componente 3:
         *
         * Magnitud respecto al máximo observado.

         */

        let componenteMaximo = 0;


        if (

            maximo > 0

        ) {

            componenteMaximo =

                (

                    atrasoActual /

                    maximo

                ) * 100;

        }


        /*
         * Score combinado.
         *
         * Promedio:   40%
         * Percentil:  40%
         * Máximo:     20%
         */

        const score =

            (

                componentePromedio *

                0.40

            ) +

            (

                componentePercentil *

                0.40

            ) +

            (

                componenteMaximo *

                0.20

            );


        return this.normalizarScore(

            score

        );

    }


    /*==============================================================
        CLASIFICAR ATRASO
    ==============================================================*/

    clasificarAtraso(

        ratio,

        percentil,

        atrasoActual,

        estadisticas

    ) {

        if (

            atrasoActual <= 0

        ) {

            return "sin_atraso";

        }


        if (

            estadisticas.promedio <= 0

        ) {

            return "sin_referencia_historica";

        }


        /*
         * Menos del 50% del intervalo promedio.

         */

        if (

            ratio < 0.50

        ) {

            return "atraso_bajo";

        }


        /*
         * Entre 50% y 100%.

         */

        if (

            ratio < 1

        ) {

            return "atraso_normal_bajo";

        }


        /*
         * Entre 100% y 150%.

         */

        if (

            ratio < 1.50

        ) {

            return "atraso_normal_alto";

        }


        /*
         * Entre 150% y 200%.

         */

        if (

            ratio < 2

        ) {

            return "atraso_alto";

        }


        /*
         * Más del doble del promedio.

         */

        return "atraso_extremo";

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


        const porcentaje =

            ventana > 0

                ? (

                    apariciones /

                    ventana

                ) * 100

                : 0;


        return {

            ventana,

            apariciones,

            porcentaje:

                this.redondear(

                    porcentaje,

                    4

                ),

            estado:

                apariciones > 0

                    ? "aparecio_recientemente"

                    : "sin_aparicion_reciente"

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

            contexto.atraso &&

            contexto.atraso

                .ventanaReciente !== undefined

        ) {

            const valor =

                Number(

                    contexto.atraso

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


        return Math.min(

            20,

            totalSemanas

        );

    }


    /*==============================================================
        CONFIANZA
    ==============================================================*/

    calcularConfianza(

        totalSemanas,

        apariciones,

        cantidadIntervalos

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
         * Evidencia de apariciones.

         */

        const evidenciaApariciones =

            apariciones > 0

                ? 100 *

                    (

                        1 -

                        Math.exp(

                            -apariciones /

                            10

                        )

                    )

                : 0;


        /*
         * Evidencia de intervalos.

         */

        const evidenciaIntervalos =

            cantidadIntervalos > 0

                ? 100 *

                    (

                        1 -

                        Math.exp(

                            -cantidadIntervalos /

                            10

                        )

                    )

                : 0;


        const confianza =

            (

                evidenciaTemporal *

                0.40

            ) +

            (

                evidenciaApariciones *

                0.30

            ) +

            (

                evidenciaIntervalos *

                0.30

            );


        return this.normalizarConfianza(

            confianza

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

                atrasoActual: 0,

                atrasoPromedio: 0,

                atrasoMaximo: 0,

                apariciones: 0,

                intervaloPromedio: 0,

                ultimoIntervalo: 0,

                ratioAtraso: 0,

                percentilAtraso: 0,

                atrasoNormalizado: 0,

                scoreAtraso: 0

            }

        });

    }


    /*==============================================================
        PESO DEL MOTOR
    ==============================================================*/

    obtenerPeso(contexto) {

        if (

            contexto.pesos &&

            contexto.pesos.atraso !== undefined

        ) {

            return Number(

                contexto.pesos.atraso

            );

        }


        if (

            contexto.configuracion &&

            contexto.configuracion.pesos &&

            contexto.configuracion.pesos.atraso !== undefined

        ) {

            return Number(

                contexto.configuracion.pesos.atraso

            );

        }


        /*
         * Peso provisional.
         *
         * Posteriormente será ajustado por el sistema
         * de autoevaluación.

         */

        return 10;

    }

}