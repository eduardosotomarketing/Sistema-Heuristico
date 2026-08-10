/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * js/motores/MotorAsociaciones.js
 *
 * Propósito:
 * Analizar asociaciones históricas entre números.
 *
 * Indicadores:
 *
 *   - Pares frecuentes
 *   - Tríos frecuentes
 *   - Frecuencia de compañeros
 *   - Fuerza de asociación
 *   - Asociación reciente
 *   - Número de vecinos relevantes
 *   - Mejor pareja
 *   - Mejor trío
 *
 * IMPORTANTE:
 *
 * Una asociación histórica NO implica causalidad ni aumenta
 * necesariamente la probabilidad matemática de aparición futura.
 *
 * Este motor genera una señal heurística basada exclusivamente
 * en las relaciones observadas en los datos históricos.
 *
 **********************************************************************/

import BaseMotor from "./BaseMotor.js";

import MotorResult from "./MotorResult.js";


export default class MotorAsociaciones extends BaseMotor {


    constructor() {

        super(

            "Asociaciones",

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


        if (semanas.length === 0) {

            return this.resultadoSinDatos(

                numeroValidado,

                contexto,

                "No existen semanas históricas."

            );

        }


        /*
         * Ordenamos de más reciente a más antigua.
         */

        const semanasOrdenadas =

            this.ordenarSemanas(

                semanas

            );


        /*
         * Construimos las estructuras estadísticas
         * de pares y tríos.
         */

        const estadisticas =

            this.construirEstadisticas(

                semanasOrdenadas

            );


        /*
         * Analizamos los compañeros del número.
         */

        const compañeros =

            this.obtenerCompañeros(

                numeroValidado,

                estadisticas

            );


        /*
         * Obtenemos los pares relacionados.

         */

        const pares =

            this.obtenerPares(

                numeroValidado,

                estadisticas

            );


        /*
         * Obtenemos los tríos relacionados.

         */

        const trios =

            this.obtenerTrios(

                numeroValidado,

                estadisticas

            );


        /*
         * Frecuencia total del número.

         */

        const frecuenciaNumero =

            estadisticas.frecuenciasNumeros.get(

                numeroValidado

            ) || 0;


        /*
         * Si el número nunca apareció,
         * no existen asociaciones válidas.

         */

        if (frecuenciaNumero === 0) {

            return this.resultadoSinDatos(

                numeroValidado,

                contexto,

                "El número no registra apariciones históricas."

            );

        }


        /*
         * Calculamos las señales principales.
         */

        const scorePares =

            this.calcularScorePares(

                numeroValidado,

                frecuenciaNumero,

                compañeros,

                estadisticas

            );


        const scoreTrios =

            this.calcularScoreTrios(

                numeroValidado,

                frecuenciaNumero,

                trios,

                estadisticas

            );


        const scoreReciente =

            this.calcularScoreReciente(

                numeroValidado,

                semanasOrdenadas,

                contexto

            );


        /*
         * Score final del motor.
         *
         * Por defecto:
         *
         * Pares       50%
         * Tríos       25%
         * Recencia    25%
         */

        const score =

            (

                scorePares * 0.50

            ) +

            (

                scoreTrios * 0.25

            ) +

            (

                scoreReciente * 0.25

            );


        /*
         * Confianza.
         */

        const confianza =

            this.calcularConfianza(

                semanasOrdenadas.length,

                frecuenciaNumero,

                compañeros.length

            );


        const peso =

            this.obtenerPeso(contexto);


        /*
         * Obtenemos los compañeros más importantes.

         */

        const mejoresCompañeros =

            compañeros

                .slice(

                    0,

                    10

                );


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

                frecuenciaNumero,

                cantidadCompañeros:

                    compañeros.length,

                mejoresCompañeros,

                pares,

                trios,

                scorePares:

                    this.redondear(

                        scorePares

                    ),

                scoreTrios:

                    this.redondear(

                        scoreTrios

                    ),

                scoreReciente:

                    this.redondear(

                        scoreReciente

                    )

            },

            indicadores: {

                frecuenciaNumero,

                cantidadPares:

                    pares.length,

                cantidadTrios:

                    trios.length,

                mejorPareja:

                    pares.length > 0

                        ? pares[0]

                        : null,

                mejorTrio:

                    trios.length > 0

                        ? trios[0]

                        : null,

                scoreAsociaciones:

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


        const frecuenciasPares =

            new Map();


        const frecuenciasTrios =

            new Map();


        const frecuenciasParesRecientes =

            new Map();


        const frecuenciasTriosRecientes =

            new Map();


        /*
         * Cantidad de semanas analizadas.

         */

        const totalSemanas =

            semanas.length;


        /*
         * Ventana de recencia.

         *
         * Por defecto analizamos las últimas
         * 20 semanas para determinar asociaciones
         * recientes.
         */

        const ventanaReciente =

            Math.min(

                20,

                totalSemanas

            );


        for (

            let indice = 0;

            indice < semanas.length;

            indice++

        ) {

            const semana =

                semanas[indice];


            const numeros =

                this.obtenerNumerosSemana(

                    semana

                );


            /*
             * Normalizamos y eliminamos duplicados.

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

                ]

                .sort(

                    (a, b) => a - b

                );


            /*
             * Frecuencia de números.

             */

            for (

                const numero of numerosUnicos

            ) {

                const actual =

                    frecuenciasNumeros.get(

                        numero

                    ) || 0;


                frecuenciasNumeros.set(

                    numero,

                    actual + 1

                );

            }


            /*
             * Pares.

             */

            const paresSemana =

                this.generarPares(

                    numerosUnicos

                );


            for (

                const par of paresSemana

            ) {

                const clave =

                    this.clavePar(

                        par[0],

                        par[1]

                    );


                frecuenciasPares.set(

                    clave,

                    (

                        frecuenciasPares.get(

                            clave

                        ) || 0

                    ) + 1

                );


                /*
                 * Asociación reciente.

                 */

                if (

                    indice <

                    ventanaReciente

                ) {

                    frecuenciasParesRecientes.set(

                        clave,

                        (

                            frecuenciasParesRecientes.get(

                                clave

                            ) || 0

                        ) + 1

                    );

                }

            }


            /*
             * Tríos.

             */

            const triosSemana =

                this.generarTrios(

                    numerosUnicos

                );


            for (

                const trio of triosSemana

            ) {

                const clave =

                    this.claveTrio(

                        trio[0],

                        trio[1],

                        trio[2]

                    );


                frecuenciasTrios.set(

                    clave,

                    (

                        frecuenciasTrios.get(

                            clave

                        ) || 0

                    ) + 1

                );


                /*
                 * Asociación reciente.

                 */

                if (

                    indice <

                    ventanaReciente

                ) {

                    frecuenciasTriosRecientes.set(

                        clave,

                        (

                            frecuenciasTriosRecientes.get(

                                clave

                            ) || 0

                    ) + 1

                    );

                }

            }

        }


        return {

            frecuenciasNumeros,

            frecuenciasPares,

            frecuenciasTrios,

            frecuenciasParesRecientes,

            frecuenciasTriosRecientes,

            totalSemanas,

            ventanaReciente

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
        GENERAR PARES
    ==============================================================*/

    generarPares(numeros) {

        const pares = [];


        for (

            let i = 0;

            i < numeros.length;

            i++

        ) {

            for (

                let j = i + 1;

                j < numeros.length;

                j++

            ) {

                pares.push([

                    numeros[i],

                    numeros[j]

                ]);

            }

        }


        return pares;

    }


    /*==============================================================
        GENERAR TRÍOS
    ==============================================================*/

    generarTrios(numeros) {

        const trios = [];


        for (

            let i = 0;

            i < numeros.length;

            i++

        ) {

            for (

                let j = i + 1;

                j < numeros.length;

                j++

            ) {

                for (

                    let k = j + 1;

                    k < numeros.length;

                    k++

                ) {

                    trios.push([

                        numeros[i],

                        numeros[j],

                        numeros[k]

                    ]);

                }

            }

        }


        return trios;

    }


    /*==============================================================
        CLAVE DE PAR
    ==============================================================*/

    clavePar(a, b) {

        const primero =

            Math.min(

                Number(a),

                Number(b)

            );


        const segundo =

            Math.max(

                Number(a),

                Number(b)

            );


        return [

            primero,

            segundo

        ]

        .map(

            numero =>

                String(numero)

                    .padStart(

                        2,

                        "0"

                    )

        )

        .join("-");

    }


    /*==============================================================
        CLAVE DE TRÍO
    ==============================================================*/

    claveTrio(a, b, c) {

        return [

            Number(a),

            Number(b),

            Number(c)

        ]

        .sort(

            (x, y) => x - y

        )

        .map(

            numero =>

                String(numero)

                    .padStart(

                        2,

                        "0"

                    )

        )

        .join("-");

    }


    /*==============================================================
        OBTENER COMPAÑEROS
    ==============================================================*/

    obtenerCompañeros(

        numero,

        estadisticas

    ) {

        const resultado = [];


        for (

            const [

                clave,

                frecuencia

            ]

            of estadisticas

                .frecuenciasPares

                .entries()

        ) {

            const partes =

                clave.split("-");


            const a =

                Number(

                    partes[0]

                );


            const b =

                Number(

                    partes[1]

                );


            let compañero = null;


            if (a === numero) {

                compañero = b;

            }

            else if (b === numero) {

                compañero = a;

            }


            if (

                compañero === null

            ) {

                continue;

            }


            const frecuenciaNumero =

                estadisticas

                    .frecuenciasNumeros

                    .get(

                        numero

                    ) || 0;


            const frecuenciaCompanero =

                estadisticas

                    .frecuenciasNumeros

                    .get(

                        compañero

                    ) || 0;


            /*
             * Fuerza condicional:
             *
             * P(compañero | número)
             *
             * = apariciones conjuntas /
             *   apariciones del número
             *
             * Se expresa en porcentaje.

             */

            const fuerzaCondicional =

                frecuenciaNumero > 0

                    ? (

                        frecuencia /

                        frecuenciaNumero

                    ) * 100

                    : 0;


            /*
             * Asociación simétrica simple:
             *
             * apariciones conjuntas /
             * mínimo de apariciones individuales.
             */

            const base =

                Math.min(

                    frecuenciaNumero,

                    frecuenciaCompanero

                );


            const fuerzaSimetrica =

                base > 0

                    ? (

                        frecuencia /

                        base

                    ) * 100

                    : 0;


            resultado.push({

                numero:

                    compañero,

                numeroTexto:

                    String(

                        compañero

                    ).padStart(

                        2,

                        "0"

                    ),

                aparicionesConjuntas:

                    frecuencia,

                aparicionesNumero:

                    frecuenciaNumero,

                aparicionesCompanero:

                    frecuenciaCompanero,

                fuerzaCondicional:

                    this.redondear(

                        fuerzaCondicional

                    ),

                fuerzaSimetrica:

                    this.redondear(

                        fuerzaSimetrica

                    )

            });

        }


        /*
         * Ordenamos por frecuencia conjunta
         * y luego por fuerza condicional.

         */

        resultado.sort(

            (a, b) => {

                if (

                    b.aparicionesConjuntas !==

                    a.aparicionesConjuntas

                ) {

                    return (

                        b.aparicionesConjuntas -

                        a.aparicionesConjuntas

                    );

                }


                return (

                    b.fuerzaCondicional -

                    a.fuerzaCondicional

                );

            }

        );


        return resultado;

    }


    /*==============================================================
        OBTENER PARES
    ==============================================================*/

    obtenerPares(

        numero,

        estadisticas

    ) {

        return this.obtenerCompañeros(

            numero,

            estadisticas

        )

        .map(

            compañero => ({

                numero:

                    compañero.numero,

                numeroTexto:

                    compañero.numeroTexto,

                frecuencia:

                    compañero.aparicionesConjuntas,

                fuerza:

                    compañero.fuerzaCondicional

            })

        );

    }


    /*==============================================================
        OBTENER TRÍOS
    ==============================================================*/

    obtenerTrios(

        numero,

        estadisticas

    ) {

        const resultado = [];


        for (

            const [

                clave,

                frecuencia

            ]

            of estadisticas

                .frecuenciasTrios

                .entries()

        ) {

            const partes =

                clave.split("-");


            const numeros =

                partes.map(

                    valor =>

                        Number(valor)

                );


            if (

                !numeros.includes(

                    numero

                )

            ) {

                continue;

            }


            const compañeros =

                numeros.filter(

                    valor =>

                        valor !== numero

                );


            resultado.push({

                numeros:

                    numeros,

                numerosTexto:

                    numeros.map(

                        valor =>

                            String(valor)

                                .padStart(

                                    2,

                                    "0"

                                )

                    ),

                compañeros,

                frecuencia,

                score:

                    this.normalizarScore(

                        frecuencia *

                        10

                    )

            });

        }


        resultado.sort(

            (a, b) =>

                b.frecuencia -

                a.frecuencia

        );


        return resultado;

    }


    /*==============================================================
        SCORE DE PARES
    ==============================================================*/

    calcularScorePares(

        numero,

        frecuenciaNumero,

        compañeros,

        estadisticas

    ) {

        if (

            frecuenciaNumero <= 0 ||

            compañeros.length === 0

        ) {

            return 0;

        }


        /*
         * Utilizamos el compañero más fuerte
         * como señal principal.

         */

        const mejor =

            compañeros[0];


        const fuerza =

            mejor.fuerzaCondicional;


        /*
         * También tenemos en cuenta la cantidad
         * de compañeros significativos.

         */

        const cantidad =

            Math.min(

                compañeros.length,

                10

            );


        const diversidad =

            cantidad *

            5;


        const score =

            (

                fuerza * 0.75

            ) +

            (

                diversidad * 0.25

            );


        return this.normalizarScore(

            score

        );

    }


    /*==============================================================
        SCORE DE TRÍOS
    ==============================================================*/

    calcularScoreTrios(

        numero,

        frecuenciaNumero,

        trios,

        estadisticas

    ) {

        if (

            frecuenciaNumero <= 0 ||

            trios.length === 0

        ) {

            return 0;

        }


        const mejorTrio =

            trios[0];


        /*
         * Frecuencia relativa del mejor trío
         * respecto de las apariciones del número.

         */

        const fuerza =

            (

                mejorTrio.frecuencia /

                frecuenciaNumero

            ) * 100;


        /*
         * Cantidad de tríos.

         */

        const diversidad =

            Math.min(

                trios.length,

                10

            ) *

            5;


        const score =

            (

                fuerza * 0.80

            ) +

            (

                diversidad * 0.20

            );


        return this.normalizarScore(

            score

        );

    }


    /*==============================================================
        SCORE RECIENTE
    ==============================================================*/

    calcularScoreReciente(

        numero,

        semanas,

        contexto

    ) {

        const ventana =

            this.obtenerVentanaReciente(

                contexto,

                semanas.length

            );


        if (

            ventana <= 0

        ) {

            return 0;

        }


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

            (

                apariciones /

                ventana

            ) * 100;


        return this.normalizarScore(

            frecuencia

        );

    }


    /*==============================================================
        VENTANA RECIENTE
    ==============================================================*/

    obtenerVentanaReciente(

        contexto,

        totalSemanas

    ) {

        if (

            contexto.asociaciones &&

            contexto.asociaciones

                .ventanaReciente !== undefined

        ) {

            const valor =

                Number(

                    contexto.asociaciones

                        .ventanaReciente

                );


            if (

                Number.isInteger(valor) &&

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

        frecuenciaNumero,

        cantidadCompañeros

    ) {

        if (

            totalSemanas <= 0 ||

            frecuenciaNumero <= 0

        ) {

            return 0;

        }


        /*
         * Evidencia histórica.

         */

        const evidenciaHistorica =

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

            100 *

            (

                1 -

                Math.exp(

                    -frecuenciaNumero /

                    10

                )

            );


        /*
         * Evidencia de asociaciones.

         */

        const evidenciaAsociaciones =

            100 *

            (

                1 -

                Math.exp(

                    -cantidadCompañeros /

                    5

                )

            );


        const confianza =

            (

                evidenciaHistorica *

                0.40

            ) +

            (

                evidenciaNumero *

                0.40

            ) +

            (

                evidenciaAsociaciones *

                0.20

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

                mensaje,

                mejoresCompañeros: [],

                pares: [],

                trios: []

            },

            indicadores: {

                frecuenciaNumero: 0,

                cantidadPares: 0,

                cantidadTrios: 0,

                mejorPareja: null,

                mejorTrio: null,

                scoreAsociaciones: 0

            }

        });

    }


    /*==============================================================
        PESO GLOBAL
    ==============================================================*/

    obtenerPeso(contexto) {

        if (

            contexto.pesos &&

            contexto.pesos.asociaciones !== undefined

        ) {

            return Number(

                contexto.pesos.asociaciones

            );

        }


        if (

            contexto.configuracion &&

            contexto.configuracion.pesos &&

            contexto.configuracion.pesos.asociaciones !== undefined

        ) {

            return Number(

                contexto.configuracion.pesos.asociaciones

            );

        }


        /*
         * Peso provisional.

         */

        return 10;

    }

}