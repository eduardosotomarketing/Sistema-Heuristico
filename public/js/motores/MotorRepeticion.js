
/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * js/motores/MotorRepeticion.js
 *
 * Propósito:
 * Analizar la repetición de un número dentro del historial.
 *
 * Este motor estudia:
 *
 *   - Repetición entre semanas consecutivas
 *   - Repeticiones en últimas 3 semanas
 *   - Repeticiones en últimas 5 semanas
 *   - Repeticiones en últimas 10 semanas
 *   - Repeticiones en últimas 20 semanas
 *   - Repetición después de 1 semana
 *   - Repetición después de 2 semanas
 *   - Repetición después de 3 semanas
 *   - Cantidad total de repeticiones
 *   - Tasa histórica de repetición
 *   - Tasa reciente
 *   - Intensidad de repetición
 *
 * IMPORTANTE:
 *
 * La repetición observada históricamente NO implica que un número
 * tenga mayor probabilidad matemática de repetirse.
 *
 * El motor únicamente transforma el historial observado en
 * indicadores heurísticos.
 *
 **********************************************************************/

import BaseMotor from "./BaseMotor.js";

import MotorResult from "./MotorResult.js";


export default class MotorRepeticion extends BaseMotor {


    constructor() {

        super(

            "Repeticion",

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
         * Sin historial no existe repetición que analizar.

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
         * Construimos una secuencia binaria:
         *
         * 1 = apareció
         * 0 = no apareció
         *
         * Ejemplo:
         *
         * [1,0,0,1,1,0,1]
         *
         */

        const secuencia =

            this.construirSecuencia(

                numeroValidado,

                semanasOrdenadas

            );


        /*
         * Estadísticas generales.

         */

        const estadisticas =

            this.calcularEstadisticas(

                secuencia

            );


        /*
         * Repeticiones entre semanas consecutivas.

         */

        const consecutivas =

            this.calcularRepeticionesConsecutivas(

                secuencia

            );


        /*
         * Repeticiones con distancia 2.

         */

        const distancia2 =

            this.calcularRepeticionesDistancia(

                secuencia,

                2

            );


        /*
         * Repeticiones con distancia 3.

         */

        const distancia3 =

            this.calcularRepeticionesDistancia(

                secuencia,

                3

            );


        /*
         * Ventanas recientes.

         */

        const ventana3 =

            this.calcularVentana(

                secuencia,

                3

            );


        const ventana5 =

            this.calcularVentana(

                secuencia,

                5

            );


        const ventana10 =

            this.calcularVentana(

                secuencia,

                10

            );


        const ventana20 =

            this.calcularVentana(

                secuencia,

                20

            );


        /*
         * Tasa histórica de repetición.

         */

        const tasaHistorica =

            this.calcularTasaHistorica(

                consecutivas,

                secuencia

            );


        /*
         * Tasa reciente.

         */

        const tasaReciente =

            this.calcularTasaReciente(

                secuencia

            );


        /*
         * Persistencia.
         *
         * Mide cuántas semanas consecutivas puede
         * mantenerse presente el número.

         */

        const persistencia =

            this.calcularPersistencia(

                secuencia

            );


        /*
         * Intensidad de repetición.

         */

        const intensidad =

            this.calcularIntensidad(

                consecutivas,

                ventana3,

                ventana5,

                ventana10

            );


        /*
         * Score principal.

         */

        const score =

            this.calcularScore(

                tasaHistorica,

                tasaReciente,

                intensidad,

                consecutivas,

                distancia2,

                distancia3

            );


        /*
         * Clasificación.

         */

        const clasificacion =

            this.clasificarRepeticion(

                tasaReciente,

                intensidad,

                consecutivas

            );


        /*
         * Confianza.

         */

        const confianza =

            this.calcularConfianza(

                secuencia.length,

                estadisticas.apariciones,

                consecutivas.total

            );


        /*
         * Peso del motor.

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

                secuencia,

                estadisticas,

                consecutivas,

                distancia2,

                distancia3,

                ventana3,

                ventana5,

                ventana10,

                ventana20,

                tasaHistorica:

                    this.redondear(

                        tasaHistorica,

                        4

                    ),

                tasaReciente:

                    this.redondear(

                        tasaReciente,

                        4

                    ),

                persistencia,

                intensidad:

                    this.redondear(

                        intensidad,

                        4

                    ),

                clasificacion,

                score:

                    this.redondear(

                        score

                    )

            },

            indicadores: {

                apariciones:

                    estadisticas.apariciones,

                totalSemanas:

                    secuencia.length,

                repeticionesConsecutivas:

                    consecutivas.total,

                tasaRepeticionHistorica:

                    this.redondear(

                        tasaHistorica,

                        4

                    ),

                tasaRepeticionReciente:

                    this.redondear(

                        tasaReciente,

                        4

                    ),

                repeticion3:

                    ventana3.repeticiones,

                repeticion5:

                    ventana5.repeticiones,

                repeticion10:

                    ventana10.repeticiones,

                repeticion20:

                    ventana20.repeticiones,

                repeticionDistancia2:

                    distancia2.total,

                repeticionDistancia3:

                    distancia3.total,

                rachaActual:

                    persistencia.actual,

                rachaMaxima:

                    persistencia.maxima,

                intensidad:

                    this.redondear(

                        intensidad,

                        4

                    ),

                scoreRepeticion:

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
        CONSTRUIR SECUENCIA
    ==============================================================*/

    construirSecuencia(

        numero,

        semanas

    ) {

        return semanas.map(

            semana =>

                this.semanaContieneNumero(

                    semana,

                    numero

                )

                    ? 1

                    : 0

        );

    }


    /*==============================================================
        ESTADÍSTICAS GENERALES
    ==============================================================*/

    calcularEstadisticas(

        secuencia

    ) {

        const totalSemanas =

            secuencia.length;


        const apariciones =

            secuencia.reduce(

                (

                    suma,

                    valor

                ) =>

                    suma + valor,

                0

            );


        const porcentaje =

            totalSemanas > 0

                ? (

                    apariciones /

                    totalSemanas

                ) * 100

                : 0;


        return {

            totalSemanas,

            apariciones,

            noApariciones:

                totalSemanas -

                apariciones,

            porcentaje:

                this.redondear(

                    porcentaje,

                    4

                )

        };

    }


    /*==============================================================
        REPETICIONES CONSECUTIVAS
    ==============================================================*/

    calcularRepeticionesConsecutivas(

        secuencia

    ) {

        let total = 0;


        let maxima = 0;


        let actual = 0;


        const posiciones = [];


        for (

            let i = 0;

            i < secuencia.length;

            i++

        ) {

            if (

                secuencia[i] === 1

            ) {

                actual++;


                if (

                    actual > maxima

                ) {

                    maxima = actual;

                }

            }

            else {

                actual = 0;

            }


            /*
             * Como la secuencia está ordenada
             * desde la semana más reciente,
             * una aparición en i y i+1 representa
             * repetición entre semanas consecutivas.

             */

            if (

                i <

                secuencia.length - 1 &&

                secuencia[i] === 1 &&

                secuencia[i + 1] === 1

            ) {

                total++;

                posiciones.push(i);

            }

        }


        return {

            total,

            maxima,

            posiciones

        };

    }


    /*==============================================================
        REPETICIÓN A DISTANCIA
    ==============================================================*/

    calcularRepeticionesDistancia(

        secuencia,

        distancia

    ) {

        let total = 0;


        const posiciones = [];


        for (

            let i = 0;

            i <

            secuencia.length -

            distancia;

            i++

        ) {

            if (

                secuencia[i] === 1 &&

                secuencia[

                    i + distancia

                ] === 1

            ) {

                total++;


                posiciones.push(i);

            }

        }


        const posibilidades =

            Math.max(

                0,

                secuencia.length -

                distancia

            );


        const porcentaje =

            posibilidades > 0

                ? (

                    total /

                    posibilidades

                ) * 100

                : 0;


        return {

            distancia,

            total,

            posibilidades,

            porcentaje:

                this.redondear(

                    porcentaje,

                    4

                ),

            posiciones

        };

    }


    /*==============================================================
        VENTANA
    ==============================================================*/

    calcularVentana(

        secuencia,

        cantidad

    ) {

        const ventana =

            secuencia.slice(

                0,

                Math.min(

                    cantidad,

                    secuencia.length

                )

            );


        let repeticiones = 0;


        /*
         * Una repetición dentro de una ventana
         * se contabiliza cuando existen dos apariciones
         * consecutivas.

         */

        for (

            let i = 0;

            i < ventana.length - 1;

            i++

        ) {

            if (

                ventana[i] === 1 &&

                ventana[i + 1] === 1

            ) {

                repeticiones++;

            }

        }


        const apariciones =

            ventana.reduce(

                (

                    suma,

                    valor

                ) =>

                    suma + valor,

                0

            );


        const posibilidades =

            Math.max(

                0,

                ventana.length - 1

            );


        const porcentaje =

            posibilidades > 0

                ? (

                    repeticiones /

                    posibilidades

                ) * 100

                : 0;


        return {

            ventana:

                ventana.length,

            apariciones,

            repeticiones,

            posibilidades,

            porcentaje:

                this.redondear(

                    porcentaje,

                    4

                )

        };

    }


    /*==============================================================
        TASA HISTÓRICA
    ==============================================================*/

    calcularTasaHistorica(

        consecutivas,

        secuencia

    ) {

        const posibilidades =

            Math.max(

                0,

                secuencia.length - 1

            );


        if (

            posibilidades === 0

        ) {

            return 0;

        }


        return (

            consecutivas.total /

            posibilidades

        ) * 100;

    }


    /*==============================================================
        TASA RECIENTE
    ==============================================================*/

    calcularTasaReciente(

        secuencia

    ) {

        const ventana =

            secuencia.slice(

                0,

                Math.min(

                    10,

                    secuencia.length

                )

            );


        if (

            ventana.length < 2

        ) {

            return 0;

        }


        let repeticiones = 0;


        for (

            let i = 0;

            i < ventana.length - 1;

            i++

        ) {

            if (

                ventana[i] === 1 &&

                ventana[i + 1] === 1

            ) {

                repeticiones++;

            }

        }


        return (

            repeticiones /

            (

                ventana.length - 1

            )

        ) * 100;

    }


    /*==============================================================
        PERSISTENCIA
    ==============================================================*/

    calcularPersistencia(

        secuencia

    ) {

        /*
         * Racha actual desde la semana más reciente.

         */

        let actual = 0;


        for (

            let i = 0;

            i < secuencia.length;

            i++

        ) {

            if (

                secuencia[i] === 1

            ) {

                actual++;

            }

            else {

                break;

            }

        }


        /*
         * Máxima racha histórica.

         */

        let maxima = 0;

        let racha = 0;


        for (

            const valor of secuencia

        ) {

            if (

                valor === 1

            ) {

                racha++;


                if (

                    racha > maxima

                ) {

                    maxima = racha;

                }

            }

            else {

                racha = 0;

            }

        }


        return {

            actual,

            maxima

        };

    }


    /*==============================================================
        INTENSIDAD
    ==============================================================*/

    calcularIntensidad(

        consecutivas,

        ventana3,

        ventana5,

        ventana10

    ) {

        /*
         * Combinamos:
         *
         * 50% repetición inmediata
         * 30% comportamiento últimas 5
         * 20% comportamiento últimas 10
         */

        const inmediata =

            consecutivas.total > 0

                ? Math.min(

                    100,

                    consecutivas.total *

                    10

                )

                : 0;


        const reciente5 =

            ventana5.porcentaje;


        const reciente10 =

            ventana10.porcentaje;


        const intensidad =

            (

                inmediata *

                0.50

            ) +

            (

                reciente5 *

                0.30

            ) +

            (

                reciente10 *

                0.20

            );


        return this.normalizarScore(

            intensidad

        );

    }


    /*==============================================================
        SCORE
    ==============================================================*/

    calcularScore(

        tasaHistorica,

        tasaReciente,

        intensidad,

        consecutivas,

        distancia2,

        distancia3

    ) {

        /*
         * Componente histórico.

         */

        const historico =

            Math.min(

                tasaHistorica,

                100

            );


        /*
         * Componente reciente.

         */

        const reciente =

            Math.min(

                tasaReciente,

                100

            );


        /*
         * Repetición inmediata.

         */

        const inmediata =

            Math.min(

                100,

                consecutivas.total *

                10

            );


        /*
         * Repetición con distancia.

         */

        const patronesDistancia =

            Math.min(

                100,

                (

                    distancia2.total *

                    5

                ) +

                (

                    distancia3.total *

                    3

                )

            );


        /*
         * Score final.
         *
         * Histórico:          20%
         * Reciente:            30%
         * Intensidad:          25%
         * Inmediata:            15%
         * Distancias:           10%
         */

        const score =

            (

                historico *

                0.20

            ) +

            (

                reciente *

                0.30

            ) +

            (

                intensidad *

                0.25

            ) +

            (

                inmediata *

                0.15

            ) +

            (

                patronesDistancia *

                0.10

            );


        return this.normalizarScore(

            score

        );

    }


    /*==============================================================
        CLASIFICACIÓN
    ==============================================================*/

    clasificarRepeticion(

        tasaReciente,

        intensidad,

        consecutivas

    ) {

        if (

            consecutivas.total === 0 &&

            intensidad < 10

        ) {

            return "sin_repeticion_observada";

        }


        if (

            intensidad >= 70 &&

            tasaReciente >= 30

        ) {

            return "repeticion_muy_alta";

        }


        if (

            intensidad >= 50

        ) {

            return "repeticion_alta";

        }


        if (

            intensidad >= 30

        ) {

            return "repeticion_moderada";

        }


        return "repeticion_baja";

    }


    /*==============================================================
        CONFIANZA
    ==============================================================*/

    calcularConfianza(

        totalSemanas,

        apariciones,

        repeticiones

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
         * Evidencia de repeticiones.

         */

        const evidenciaRepeticiones =

            repeticiones > 0

                ? 100 *

                    (

                        1 -

                        Math.exp(

                            -repeticiones /

                            5

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

                evidenciaRepeticiones *

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

                apariciones: 0,

                totalSemanas: 0,

                repeticionesConsecutivas: 0,

                tasaRepeticionHistorica: 0,

                tasaRepeticionReciente: 0,

                repeticion3: 0,

                repeticion5: 0,

                repeticion10: 0,

                repeticion20: 0,

                repeticionDistancia2: 0,

                repeticionDistancia3: 0,

                rachaActual: 0,

                rachaMaxima: 0,

                intensidad: 0,

                scoreRepeticion: 0

            }

        });

    }


    /*==============================================================
        PESO DEL MOTOR
    ==============================================================*/

    obtenerPeso(contexto) {

        if (

            contexto.pesos &&

            contexto.pesos.repeticion !== undefined

        ) {

            return Number(

                contexto.pesos.repeticion

            );

        }


        if (

            contexto.configuracion &&

            contexto.configuracion.pesos &&

            contexto.configuracion.pesos.repeticion !== undefined

        ) {

            return Number(

                contexto.configuracion.pesos.repeticion

            );

        }


        /*
         * Peso provisional.
         *
         * Más adelante será optimizado automáticamente.

         */

        return 10;

    }

}