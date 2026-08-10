/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * js/motores/MotorParidad.js
 *
 * Propósito:
 * Analizar el comportamiento histórico de números pares e impares.
 *
 * Analiza:
 *
 *   - Frecuencia par/impar
 *   - Frecuencia histórica del número
 *   - Frecuencia reciente
 *   - Secuencias de paridad
 *   - Distribución de paridad por semana
 *   - Desviación respecto de una distribución 50/50
 *   - Comportamiento reciente de la paridad
 *
 * IMPORTANTE:
 *
 * La paridad no implica una ventaja matemática sobre un número
 * determinado. Este motor solamente convierte los datos históricos
 * en una señal heurística.
 *
 **********************************************************************/

import BaseMotor from "./BaseMotor.js";

import MotorResult from "./MotorResult.js";


export default class MotorParidad extends BaseMotor {


    constructor() {

        super(

            "Paridad",

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
         * Sin historial no podemos calcular el motor.
         */

        if (semanas.length === 0) {

            return this.resultadoSinDatos(

                numeroValidado,

                contexto,

                "No existen semanas históricas."

            );

        }


        /*
         * Ordenamos de la más reciente
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
         * Determinamos la paridad del número.

         * 00, 02, 04... → par
         * 01, 03, 05... → impar
         */

        const paridad =

            this.obtenerParidad(

                numeroValidado

            );


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
         * Frecuencia de su grupo de paridad.

         */

        const frecuenciaParidad =

            estadisticas

                .frecuenciasParidad

                .get(

                    paridad

                ) || 0;


        /*
         * Total de números analizados.

         */

        const totalNumeros =

            estadisticas.totalNumeros;


        /*
         * Distribución histórica.

         */

        const porcentajeParidad =

            totalNumeros > 0

                ? (

                    frecuenciaParidad /

                    totalNumeros

                ) * 100

                : 0;


        /*
         * Analizamos la distribución reciente.

         */

        const reciente =

            this.calcularReciente(

                numeroValidado,

                paridad,

                semanasOrdenadas,

                contexto

            );


        /*
         * Analizamos las secuencias de paridad.

         */

        const secuencias =

            this.calcularSecuencias(

                semanasOrdenadas

            );


        /*
         * Obtenemos la secuencia actual.

         */

        const secuenciaActual =

            this.obtenerSecuenciaActual(

                semanasOrdenadas,

                paridad

            );


        /*
         * Diferencia respecto del equilibrio 50/50.

         */

        const desviacionEquilibrio =

            Math.abs(

                porcentajeParidad -

                50

            );


        /*
         * Score histórico.
         */

        const scoreHistorico =

            this.calcularScoreHistorico(

                porcentajeParidad,

                paridad,

                estadisticas

            );


        /*
         * Score reciente.

         */

        const scoreReciente =

            reciente.score;


        /*
         * Score de secuencia.

         */

        const scoreSecuencia =

            this.calcularScoreSecuencia(

                secuenciaActual,

                secuencias,

                paridad

            );


        /*
         * Score de equilibrio.
         *
         * Esta variable mide qué tan cerca está
         * la distribución observada de 50/50.
         */

        const scoreEquilibrio =

            this.calcularScoreEquilibrio(

                porcentajeParidad

            );


        /*
         * Score final.
         *
         * Histórico: 30%
         * Reciente:  35%
         * Secuencia: 20%
         * Equilibrio:15%
         */

        const score =

            (

                scoreHistorico *

                0.30

            ) +

            (

                scoreReciente *

                0.35

            ) +

            (

                scoreSecuencia *

                0.20

            ) +

            (

                scoreEquilibrio *

                0.15

            );


        /*
         * Confianza.

         */

        const confianza =

            this.calcularConfianza(

                semanasOrdenadas.length,

                frecuenciaNumero,

                totalNumeros

            );


        /*
         * Peso global del motor.

         */

        const peso =

            this.obtenerPeso(contexto);


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

                paridad,

                frecuenciaNumero,

                frecuenciaParidad,

                totalNumeros,

                porcentajeParidad:

                    this.redondear(

                        porcentajeParidad,

                        4

                    ),

                desviacionEquilibrio:

                    this.redondear(

                        desviacionEquilibrio,

                        4

                    ),

                reciente,

                secuenciaActual,

                secuencias,

                scoreHistorico:

                    this.redondear(

                        scoreHistorico

                    ),

                scoreReciente:

                    this.redondear(

                        scoreReciente

                    ),

                scoreSecuencia:

                    this.redondear(

                        scoreSecuencia

                    ),

                scoreEquilibrio:

                    this.redondear(

                        scoreEquilibrio

                    )

            },

            indicadores: {

                paridad,

                frecuenciaNumero,

                frecuenciaParidad,

                porcentajeParidad:

                    this.redondear(

                        porcentajeParidad,

                        4

                    ),

                frecuenciaReciente:

                    reciente.apariciones,

                secuenciaActual,

                desviacionEquilibrio:

                    this.redondear(

                        desviacionEquilibrio,

                        4

                    ),

                scoreParidad:

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


            /*
             * Eliminamos duplicados dentro de una
             * misma semana.

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

                totalNumeros++;


                /*
                 * Frecuencia individual.

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
                 * Paridad.

                 */

                const paridad =

                    this.obtenerParidad(

                        numero

                    );


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

            frecuenciasParidad,

            totalNumeros

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
        OBTENER PARIDAD
    ==============================================================*/

    obtenerParidad(numero) {

        return Number(numero) % 2 === 0

            ? "par"

            : "impar";

    }


    /*==============================================================
        CALCULAR COMPORTAMIENTO RECIENTE
    ==============================================================*/

    calcularReciente(

        numero,

        paridad,

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


        let aparicionesNumero = 0;

        let aparicionesParidad = 0;

        let totalNumeros = 0;


        for (

            const semana of muestra

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

                const valor of numerosUnicos

            ) {

                totalNumeros++;


                if (

                    valor === numero

                ) {

                    aparicionesNumero++;

                }


                if (

                    this.obtenerParidad(

                        valor

                    ) === paridad

                ) {

                    aparicionesParidad++;

                }

            }

        }


        const porcentajeParidad =

            totalNumeros > 0

                ? (

                    aparicionesParidad /

                    totalNumeros

                ) * 100

                : 0;


        const frecuenciaNumero =

            ventana > 0

                ? (

                    aparicionesNumero /

                    ventana

                ) * 100

                : 0;


        /*
         * La señal reciente se basa principalmente
         * en la presencia del grupo de paridad.

         */

        const score =

            this.calcularScoreReciente(

                porcentajeParidad

            );


        return {

            ventana,

            aparicionesNumero,

            aparicionesParidad,

            porcentajeParidad:

                this.redondear(

                    porcentajeParidad,

                    4

                ),

            frecuenciaNumero:

                this.redondear(

                    frecuenciaNumero,

                    4

                ),

            score:

                this.redondear(

                    score

                )

        };

    }


    /*==============================================================
        SCORE RECIENTE
    ==============================================================*/

    calcularScoreReciente(

        porcentajeParidad

    ) {

        /*
         * Utilizamos la frecuencia observada
         * directamente como señal.

         *
         * 0%  → 0
         * 50% → 50
         * 100% → 100
         */

        return this.normalizarScore(

            porcentajeParidad

        );

    }


    /*==============================================================
        OBTENER VENTANA RECIENTE
    ==============================================================*/

    obtenerVentanaReciente(

        contexto,

        totalSemanas

    ) {

        if (

            contexto.paridad &&

            contexto.paridad

                .ventanaReciente !== undefined

        ) {

            const valor =

                Number(

                    contexto.paridad

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
        SCORE HISTÓRICO
    ==============================================================*/

    calcularScoreHistorico(

        porcentajeParidad,

        paridad,

        estadisticas

    ) {

        /*
         * La frecuencia histórica de cada grupo
         * se compara con la frecuencia observada
         * del número dentro de ese grupo.
         */

        const total =

            estadisticas.totalNumeros;


        if (total <= 0) {

            return 0;

        }


        /*
         * Para evitar favorecer automáticamente
         * al grupo más frecuente, limitamos la señal.

         */

        const score =

            porcentajeParidad;


        return this.normalizarScore(

            score

        );

    }


    /*==============================================================
        SCORE DE EQUILIBRIO
    ==============================================================*/

    calcularScoreEquilibrio(

        porcentajeParidad

    ) {

        /*
         * Cuanto más cerca de 50%,
         * mayor equilibrio histórico.

         */

        const distancia =

            Math.abs(

                porcentajeParidad -

                50

            );


        /*
         * Distancia máxima considerada:
         * 50 puntos porcentuales.

         */

        const score =

            100 -

            (

                distancia *

                2

            );


        return this.normalizarScore(

            score

        );

    }


    /*==============================================================
        CALCULAR SECUENCIAS
    ==============================================================*/

    calcularSecuencias(semanas) {

        const secuencias = {

            par: [],

            impar: []

        };


        if (

            semanas.length === 0

        ) {

            return secuencias;

        }


        /*
         * Cada semana obtiene la cantidad
         * de pares e impares.

         */

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


            let pares = 0;

            let impares = 0;


            for (

                const numero of numerosUnicos

            ) {

                if (

                    this.obtenerParidad(

                        numero

                    ) === "par"

                ) {

                    pares++;

                }

                else {

                    impares++;

                }

            }


            secuencias.par.push(

                pares

            );


            secuencias.impar.push(

                impares

            );

        }


        return secuencias;

    }


    /*==============================================================
        SECUENCIA ACTUAL
    ==============================================================*/

    obtenerSecuenciaActual(

        semanas,

        paridad

    ) {

        if (

            semanas.length === 0

        ) {

            return {

                paridad,

                semanas: 0,

                cantidad: 0

            };

        }


        /*
         * En lugar de mirar simplemente si la última
         * semana tuvo pares o impares, calculamos
         * cuántas semanas consecutivas presentan
         * predominio del grupo.

         */

        let consecutivas = 0;


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


            let cantidadParidad = 0;

            let cantidadOpuesta = 0;


            for (

                const numero of numerosUnicos

            ) {

                if (

                    this.obtenerParidad(

                        numero

                    ) === paridad

                ) {

                    cantidadParidad++;

                }

                else {

                    cantidadOpuesta++;

                }

            }


            /*
             * Consideramos predominio cuando
             * el grupo tiene más representantes
             * que el grupo contrario.

             */

            if (

                cantidadParidad >

                cantidadOpuesta

            ) {

                consecutivas++;

            }

            else {

                break;

            }

        }


        return {

            paridad,

            semanas:

                consecutivas,

            cantidad:

                consecutivas

        };

    }


    /*==============================================================
        SCORE DE SECUENCIA
    ==============================================================*/

    calcularScoreSecuencia(

        secuenciaActual,

        secuencias,

        paridad

    ) {

        const semanas =

            secuenciaActual.semanas;


        if (

            semanas <= 0

        ) {

            return 0;

        }


        /*
         * La señal aumenta gradualmente con
         * la persistencia del patrón.

         */

        const score =

            Math.min(

                semanas *

                20,

                100

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

        frecuenciaNumero,

        totalNumeros

    ) {

        if (

            totalSemanas <= 0 ||

            totalNumeros <= 0

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

            frecuenciaNumero > 0

                ? 100 *

                    (

                        1 -

                        Math.exp(

                            -frecuenciaNumero /

                            10

                        )

                    )

                : 0;


        const confianza =

            (

                evidenciaTemporal *

                0.65

            ) +

            (

                evidenciaNumero *

                0.35

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

                mensaje,

                paridad:

                    this.obtenerParidad(

                        numero

                    )

            },

            indicadores: {

                paridad:

                    this.obtenerParidad(

                        numero

                    ),

                frecuenciaNumero: 0,

                frecuenciaParidad: 0,

                porcentajeParidad: 0,

                frecuenciaReciente: 0,

                secuenciaActual: 0,

                desviacionEquilibrio: 0,

                scoreParidad: 0

            }

        });

    }


    /*==============================================================
        PESO GLOBAL
    ==============================================================*/

    obtenerPeso(contexto) {

        if (

            contexto.pesos &&

            contexto.pesos.paridad !== undefined

        ) {

            return Number(

                contexto.pesos.paridad

            );

        }


        if (

            contexto.configuracion &&

            contexto.configuracion.pesos &&

            contexto.configuracion.pesos.paridad !== undefined

        ) {

            return Number(

                contexto.configuracion.pesos.paridad

            );

        }


        /*
         * Peso provisional.

         */

        return 5;

    }

}