/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * js/motores/MotorRangos.js
 *
 * Propósito:
 * Analizar el comportamiento histórico de los 10 rangos:
 *
 *   00-09
 *   10-19
 *   20-29
 *   30-39
 *   40-49
 *   50-59
 *   60-69
 *   70-79
 *   80-89
 *   90-99
 *
 * El motor estudia:
 *
 *   - Frecuencia histórica del rango
 *   - Frecuencia del número dentro del rango
 *   - Frecuencia reciente
 *   - Atraso del rango
 *   - Actividad del rango
 *   - Concentración
 *   - Distribución
 *   - Comportamiento por ventanas
 *
 * IMPORTANTE:
 *
 * Este motor NO afirma que un rango tenga mayor probabilidad
 * matemática de aparecer en un sorteo futuro.
 *
 * Convierte exclusivamente información histórica en indicadores
 * heurísticos para el sistema de ranking.
 *
 **********************************************************************/

import BaseMotor from "./BaseMotor.js";

import MotorResult from "./MotorResult.js";


export default class MotorRangos extends BaseMotor {


    constructor() {

        super(

            "Rangos",

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
         * Sin historial no podemos calcular indicadores.

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
         * Ordenamos las semanas desde la más reciente
         * hacia la más antigua.

         */

        const semanasOrdenadas =

            this.ordenarSemanas(

                semanas

            );


        /*
         * Rango correspondiente al número.

         */

        const rango =

            this.obtenerRango(

                numeroValidado

            );


        /*
         * Estadísticas generales.

         */

        const estadisticas =

            this.construirEstadisticas(

                semanasOrdenadas

            );


        /*
         * Datos específicos del rango.

         */

        const datosRango =

            estadisticas

                .rangos

                .get(

                    rango

                );


        /*
         * Si por algún motivo el rango no existe,
         * devolvemos un resultado vacío.

         */

        if (!datosRango) {

            return this.resultadoSinDatos(

                numeroValidado,

                contexto,

                "No existen datos suficientes para el rango."

            );

        }


        /*
         * Frecuencia histórica del número.

         */

        const frecuenciaNumero =

            estadisticas

                .frecuenciasNumeros

                .get(

                    numeroValidado

                ) || 0;


        /*
         * Frecuencia histórica del rango.

         */

        const frecuenciaRango =

            datosRango.frecuencia;


        /*
         * Total de apariciones de todos los rangos.

         */

        const totalApariciones =

            estadisticas.totalNumeros;


        /*
         * Porcentaje histórico del rango.

         */

        const porcentajeRango =

            totalApariciones > 0

                ? (

                    frecuenciaRango /

                    totalApariciones

                ) * 100

                : 0;


        /*
         * Porcentaje esperado si los 10 rangos
         * estuvieran distribuidos uniformemente.

         */

        const porcentajeEsperado = 10;


        /*
         * Diferencia respecto al comportamiento esperado.

         */

        const diferenciaEsperado =

            porcentajeRango -

            porcentajeEsperado;


        /*
         * Ratio respecto al promedio.

         */

        const ratioEsperado =

            porcentajeEsperado > 0

                ? (

                    porcentajeRango /

                    porcentajeEsperado

                )

                : 0;


        /*
         * Analizamos las últimas semanas.

         */

        const reciente =

            this.calcularReciente(

                numeroValidado,

                rango,

                semanasOrdenadas,

                contexto

            );


        /*
         * Atraso del rango.

         */

        const atrasoRango =

            this.calcularAtrasoRango(

                rango,

                semanasOrdenadas

            );


        /*
         * Atraso específico del número.

         */

        const atrasoNumero =

            this.calcularAtrasoNumero(

                numeroValidado,

                semanasOrdenadas

            );


        /*
         * Distribución interna del rango.
         *
         * ¿Está concentrada en pocos números?
         * ¿Está distribuida entre varios números?

         */

        const concentracion =

            this.calcularConcentracionRango(

                rango,

                semanasOrdenadas

            );


        /*
         * Actividad reciente del rango.

         */

        const actividadReciente =

            this.calcularActividadRango(

                rango,

                semanasOrdenadas,

                contexto

            );


        /*
         * Score histórico.

         */

        const scoreHistorico =

            this.calcularScoreHistorico(

                porcentajeRango,

                ratioEsperado

            );


        /*
         * Score reciente.

         */

        const scoreReciente =

            reciente.score;


        /*
         * Score de actividad.

         */

        const scoreActividad =

            actividadReciente.score;


        /*
         * Score de concentración.
         */

        const scoreConcentracion =

            concentracion.score;


        /*
         * Score de atraso.

         *
         * IMPORTANTE:
         *
         * El atraso no se interpreta como una garantía
         * de aparición futura.
         *
         * Es solamente una variable heurística.

         */

        const scoreAtraso =

            this.calcularScoreAtraso(

                atrasoRango

            );


        /*
         * Score final del motor.
         *
         * Histórico       25%
         * Reciente        25%
         * Actividad       20%
         * Concentración   10%
         * Atraso          20%
         */

        const score =

            (

                scoreHistorico *

                0.25

            ) +

            (

                scoreReciente *

                0.25

            ) +

            (

                scoreActividad *

                0.20

            ) +

            (

                scoreConcentracion *

                0.10

            ) +

            (

                scoreAtraso *

                0.20

            );


        /*
         * Confianza.

         */

        const confianza =

            this.calcularConfianza(

                semanasOrdenadas.length,

                frecuenciaNumero,

                frecuenciaRango

            );


        /*
         * Peso configurable.

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

                rango,

                rangoTexto:

                    this.obtenerNombreRango(

                        rango

                    ),

                frecuenciaNumero,

                frecuenciaRango,

                totalApariciones,

                porcentajeRango:

                    this.redondear(

                        porcentajeRango,

                        4

                    ),

                porcentajeEsperado,

                diferenciaEsperado:

                    this.redondear(

                        diferenciaEsperado,

                        4

                    ),

                ratioEsperado:

                    this.redondear(

                        ratioEsperado,

                        4

                    ),

                reciente,

                atrasoRango,

                atrasoNumero,

                actividadReciente,

                concentracion,

                scoreHistorico:

                    this.redondear(

                        scoreHistorico

                    ),

                scoreReciente:

                    this.redondear(

                        scoreReciente

                    ),

                scoreActividad:

                    this.redondear(

                        scoreActividad

                    ),

                scoreConcentracion:

                    this.redondear(

                        scoreConcentracion

                    ),

                scoreAtraso:

                    this.redondear(

                        scoreAtraso

                    )

            },

            indicadores: {

                rango,

                frecuenciaNumero,

                frecuenciaRango,

                porcentajeRango:

                    this.redondear(

                        porcentajeRango,

                        4

                    ),

                frecuenciaReciente:

                    reciente.apariciones,

                atrasoRango,

                atrasoNumero,

                actividadRango:

                    actividadReciente.apariciones,

                concentracionRango:

                    concentracion.concentracion,

                scoreRangos:

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

        const copia = [

            ...semanas

        ];


        /*
         * Primero intentamos utilizar el número de semana.

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
         * Como alternativa utilizamos la fecha.

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
         * Si no hay ningún criterio temporal,
         * asumimos que el último elemento es el más reciente.

         */

        return copia.reverse();

    }


    /*==============================================================
        CONSTRUIR ESTADÍSTICAS
    ==============================================================*/

    construirEstadisticas(semanas) {

        const rangos =

            new Map();


        const frecuenciasNumeros =

            new Map();


        let totalNumeros = 0;


        /*
         * Inicializamos los 10 rangos.

         */

        for (

            let rango = 0;

            rango <= 9;

            rango++

        ) {

            rangos.set(

                rango,

                {

                    rango,

                    frecuencia: 0,

                    semanasConAparicion: 0,

                    numeros: new Map(),

                    ultimaSemana: null,

                    primeraSemana: null

                }

            );

        }


        /*
         * Recorremos el historial.

         */

        for (

            const semana of semanas

        ) {

            const numeros =

                this.obtenerNumerosSemana(

                    semana

                );


            /*
             * Eliminamos duplicados dentro
             * de la misma semana.

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


            const rangosPresentes =

                new Set();


            for (

                const numero of numerosUnicos

            ) {

                totalNumeros++;


                /*
                 * Frecuencia del número.

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
                 * Determinamos su rango.

                 */

                const rango =

                    this.obtenerRango(

                        numero

                    );


                const datosRango =

                    rangos.get(

                        rango

                    );


                /*
                 * Frecuencia total del rango.

                 */

                datosRango.frecuencia++;


                /*
                 * Frecuencia del número dentro
                 * de su rango.

                 */

                datosRango.numeros.set(

                    numero,

                    (

                        datosRango.numeros.get(

                            numero

                        ) || 0

                    ) + 1

                );


                rangosPresentes.add(

                    rango

                );

            }


            /*
             * Una semana cuenta solamente una vez
             * para determinar si un rango estuvo presente.

             */

            for (

                const rango of rangosPresentes

            ) {

                const datosRango =

                    rangos.get(

                        rango

                    );


                datosRango.semanasConAparicion++;


                /*
                 * Como recorremos de más reciente
                 * a más antiguo:
                 *
                 * La primera aparición encontrada
                 * es la más reciente.

                 */

                if (

                    datosRango.ultimaSemana === null

                ) {

                    datosRango.ultimaSemana =

                        semana;

                }


                datosRango.primeraSemana =

                    semana;

            }

        }


        return {

            rangos,

            frecuenciasNumeros,

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
        OBTENER RANGO
    ==============================================================*/

    obtenerRango(numero) {

        return Math.floor(

            Number(numero) /

            10

        );

    }


    /*==============================================================
        NOMBRE DEL RANGO
    ==============================================================*/

    obtenerNombreRango(rango) {

        const inicio =

            rango *

            10;


        const fin =

            inicio +

            9;


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
        CALCULAR RECIENTE
    ==============================================================*/

    calcularReciente(

        numero,

        rango,

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

        let aparicionesRango = 0;

        let semanasConRango = 0;


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


            let rangoPresente = false;


            for (

                const valor of numerosUnicos

            ) {

                if (

                    valor === numero

                ) {

                    apariciones++;

                }


                if (

                    this.obtenerRango(

                        valor

                    ) === rango

                ) {

                    aparicionesRango++;

                    rangoPresente = true;

                }

            }


            if (

                rangoPresente

            ) {

                semanasConRango++;

            }

        }


        const porcentajeRango =

            ventana > 0

                ? (

                    semanasConRango /

                    ventana

                ) * 100

                : 0;


        /*
         * La actividad del rango en las últimas
         * semanas se convierte en una señal.

         */

        const score =

            this.normalizarScore(

                porcentajeRango

            );


        return {

            ventana,

            apariciones,

            aparicionesRango,

            semanasConRango,

            porcentajeRango:

                this.redondear(

                    porcentajeRango,

                    4

                ),

            score:

                this.redondear(

                    score

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

            contexto.rangos &&

            contexto.rangos

                .ventanaReciente !== undefined

        ) {

            const valor =

                Number(

                    contexto.rangos

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
         * Valor predeterminado:
         * últimas 20 semanas.

         */

        return Math.min(

            20,

            totalSemanas

        );

    }


    /*==============================================================
        ATRASO DEL RANGO
    ==============================================================*/

    calcularAtrasoRango(

        rango,

        semanas

    ) {

        let atraso = 0;


        for (

            const semana of semanas

        ) {

            const numeros =

                this.obtenerNumerosSemana(

                    semana

                );


            const existe =

                numeros.some(

                    valor =>

                        this.obtenerRango(

                            Number(valor)

                        ) === rango

                );


            if (existe) {

                break;

            }


            atraso++;

        }


        return atraso;

    }


    /*==============================================================
        ATRASO DEL NÚMERO
    ==============================================================*/

    calcularAtrasoNumero(

        numero,

        semanas

    ) {

        let atraso = 0;


        for (

            const semana of semanas

        ) {

            if (

                this.semanaContieneNumero(

                    semana,

                    numero

                )

            ) {

                break;

            }


            atraso++;

        }


        return atraso;

    }


    /*==============================================================
        ACTIVIDAD DEL RANGO
    ==============================================================*/

    calcularActividadRango(

        rango,

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

        let semanasConRango = 0;


        for (

            const semana of muestra

        ) {

            const numeros =

                this.obtenerNumerosSemana(

                    semana

                );


            let presente = false;


            for (

                const valor of numeros

            ) {

                if (

                    this.obtenerRango(

                        Number(valor)

                    ) === rango

                ) {

                    apariciones++;

                    presente = true;

                }

            }


            if (presente) {

                semanasConRango++;

            }

        }


        const frecuencia =

            ventana > 0

                ? (

                    semanasConRango /

                    ventana

                ) * 100

                : 0;


        return {

            ventana,

            apariciones,

            semanasConRango,

            frecuencia:

                this.redondear(

                    frecuencia,

                    4

                ),

            score:

                this.normalizarScore(

                    frecuencia

                )

        };

    }


    /*==============================================================
        CONCENTRACIÓN DEL RANGO
    ==============================================================*/

    calcularConcentracionRango(

        rango,

        semanas

    ) {

        const frecuencias =

            new Map();


        let total = 0;


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

                if (

                    this.obtenerRango(

                        numero

                    ) !== rango

                ) {

                    continue;

                }


                total++;


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


        if (

            total === 0

        ) {

            return {

                total: 0,

                numerosActivos: 0,

                maxFrecuencia: 0,

                concentracion: 0,

                score: 0

            };

        }


        /*
         * Buscamos qué porcentaje de las apariciones
         * del rango corresponde al número dominante.

         */

        let maxFrecuencia = 0;


        for (

            const frecuencia of frecuencias.values()

        ) {

            if (

                frecuencia >

                maxFrecuencia

            ) {

                maxFrecuencia =

                    frecuencia;

            }

        }


        const concentracion =

            (

                maxFrecuencia /

                total

            ) * 100;


        /*
         * Una concentración excesiva no recibe
         * automáticamente score máximo.
         *
         * Utilizamos una escala moderada.

         */

        const score =

            Math.min(

                concentracion *

                2,

                100

            );


        return {

            total,

            numerosActivos:

                frecuencias.size,

            maxFrecuencia,

            concentracion:

                this.redondear(

                    concentracion,

                    4

                ),

            score:

                this.redondear(

                    this.normalizarScore(

                        score

                    )

                )

        };

    }


    /*==============================================================
        SCORE HISTÓRICO
    ==============================================================*/

    calcularScoreHistorico(

        porcentajeRango,

        ratioEsperado

    ) {

        if (

            porcentajeRango <= 0

        ) {

            return 0;

        }


        /*
         * Si el rango aparece exactamente en torno
         * al 10%, recibe una señal media.
         *
         * Si aparece más frecuentemente, aumenta.
         * Si aparece menos, disminuye.

         */

        const score =

            Math.min(

                ratioEsperado *

                50,

                100

            );


        return this.normalizarScore(

            score

        );

    }


    /*==============================================================
        SCORE DE ATRASO
    ==============================================================*/

    calcularScoreAtraso(

        atraso

    ) {

        if (

            atraso <= 0

        ) {

            return 0;

        }


        /*
         * El crecimiento es progresivo.
         *
         * No permitimos que un atraso enorme
         * produzca directamente score 100.

         */

        const score =

            100 *

            (

                1 -

                Math.exp(

                    -atraso /

                    10

                )

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

        frecuenciaRango

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
         * Evidencia del rango.

         */

        const evidenciaRango =

            frecuenciaRango > 0

                ? 100 *

                    (

                        1 -

                        Math.exp(

                            -frecuenciaRango /

                            20

                        )

                    )

                : 0;


        /*
         * Evidencia del número.

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

                0.45

            ) +

            (

                evidenciaRango *

                0.30

            ) +

            (

                evidenciaNumero *

                0.25

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

                rango:

                    this.obtenerRango(

                        numero

                    ),

                rangoTexto:

                    this.obtenerNombreRango(

                        this.obtenerRango(

                            numero

                        )

                    )

            },

            indicadores: {

                rango:

                    this.obtenerRango(

                        numero

                    ),

                frecuenciaNumero: 0,

                frecuenciaRango: 0,

                porcentajeRango: 0,

                frecuenciaReciente: 0,

                atrasoRango: 0,

                atrasoNumero: 0,

                actividadRango: 0,

                concentracionRango: 0,

                scoreRangos: 0

            }

        });

    }


    /*==============================================================
        PESO DEL MOTOR
    ==============================================================*/

    obtenerPeso(contexto) {

        if (

            contexto.pesos &&

            contexto.pesos.rangos !== undefined

        ) {

            return Number(

                contexto.pesos.rangos

            );

        }


        if (

            contexto.configuracion &&

            contexto.configuracion.pesos &&

            contexto.configuracion.pesos.rangos !== undefined

        ) {

            return Number(

                contexto.configuracion.pesos.rangos

            );

        }


        /*
         * Peso provisional.
         *
         * Más adelante será configurable
         * y podrá ser optimizado automáticamente.

         */

        return 10;

    }

}