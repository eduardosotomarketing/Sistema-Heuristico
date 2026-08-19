/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 * Archivo: public/js/services/EstadisticasService.js
 *
 * Servicio central de estadísticas históricas.
 *
 * Responsabilidades:
 *
 * - Obtener el historial de semanas.
 * - Analizar los números 00-99.
 * - Calcular frecuencia histórica.
 * - Calcular frecuencia por ventanas.
 * - Calcular atraso actual.
 * - Calcular atraso máximo.
 * - Calcular última aparición.
 * - Calcular promedio de aparición.
 * - Calcular repetición entre semanas.
 * - Calcular paridad.
 * - Calcular distribución por rangos.
 * - Generar un resumen estadístico general.
 *
 * IMPORTANTE:
 *
 * Este servicio NO modifica Firestore.
 * Las estadísticas se calculan dinámicamente a partir
 * del historial almacenado.
 **********************************************************************/

import HistorialService from "./HistorialService.js";
import { CONFIG } from "../config.js";


export default class EstadisticasService {


    /*==============================================================
        CONSTRUCTOR
    ==============================================================*/

    constructor() {

        this.historialService =
            new HistorialService();

        this.minNumero =
            CONFIG.MIN_NUMERO;

        this.maxNumero =
            CONFIG.MAX_NUMERO;

        this.numerosPorSemana =
            CONFIG.NUMEROS_POR_SEMANA;

    }


    /*==============================================================
        GENERAR LISTA DE NÚMEROS
    ==============================================================*/

    generarNumeros() {

        const numeros = [];

        for (
            let numero = this.minNumero;
            numero <= this.maxNumero;
            numero++
        ) {

            numeros.push(numero);

        }

        return numeros;

    }


    /*==============================================================
        CREAR ESTRUCTURA BASE DE ESTADÍSTICA
    ==============================================================*/

    crearEstadistica(numero) {

        return {

            numero: numero,

            texto:
                String(numero).padStart(2, "0"),

            /*------------------------------------------
                FRECUENCIA
            ------------------------------------------*/

            apariciones: 0,

            frecuencia: 0,

            frecuencia3: 0,

            frecuencia5: 0,

            frecuencia10: 0,

            frecuencia20: 0,

            /*------------------------------------------
                APARICIONES
            ------------------------------------------*/

            semanas: [],

            ultimaSemana: null,

            ultimaPosicion: null,

            /*------------------------------------------
                ATRASO
            ------------------------------------------*/

            atraso: 0,

            maximoAtraso: 0,

            minimoAtraso: null,

            /*------------------------------------------
                PROMEDIO
            ------------------------------------------*/

            promedioAparicion: 0,

            intervaloPromedio: 0,

            /*------------------------------------------
                ESTADO
            ------------------------------------------*/

            caliente: false,

            frio: false,

            /*------------------------------------------
                PARIDAD
            ------------------------------------------*/

            par: numero % 2 === 0,

            impar: numero % 2 !== 0,

            /*------------------------------------------
                RANGO
            ------------------------------------------*/

            rango: this.obtenerRango(numero)

        };

    }


    /*==============================================================
        OBTENER RANGO
    ==============================================================*/

    obtenerRango(numero) {

        if (numero <= 33) {

            return "bajo";

        }

        if (numero <= 66) {

            return "medio";

        }

        return "alto";

    }


    /*==============================================================
        OBTENER HISTORIAL
    ==============================================================*/

    async obtenerHistorial() {

        const historial =
            await this.historialService.obtenerHistorial();

        if (!Array.isArray(historial)) {

            return [];

        }

        /*
         * Ordenamos por número de semana para garantizar
         * que todos los cálculos temporales sean correctos.
         */

        return [...historial].sort(

            (a, b) =>
                Number(a.semana) -
                Number(b.semana)

        );

    }


    /*==============================================================
        NORMALIZAR NÚMEROS
    ==============================================================*/

    normalizarNumeros(numeros) {

        if (!Array.isArray(numeros)) {

            return [];

        }

        return numeros

            .map(numero => Number(numero))

            .filter(numero =>

                Number.isInteger(numero) &&

                numero >= this.minNumero &&

                numero <= this.maxNumero

            );

    }


    /*==============================================================
        CALCULAR ESTADÍSTICAS COMPLETAS
    ==============================================================*/

    async calcular() {

        const historial =
            await this.obtenerHistorial();


        const estadisticas = {};


        /*
         * Crear estructura para los 100 números.
         */

        for (
            let numero = this.minNumero;
            numero <= this.maxNumero;
            numero++
        ) {

            estadisticas[numero] =
                this.crearEstadistica(numero);

        }


        /*
         * Procesar semanas.
         */

        historial.forEach(

            (semana, indiceSemana) => {

                const numeros =
                    this.normalizarNumeros(
                        semana.numeros
                    );


                numeros.forEach(

                    (numero, posicion) => {

                        const estadistica =
                            estadisticas[numero];


                        if (!estadistica) {

                            return;

                        }


                        estadistica.apariciones++;


                        estadistica.semanas.push({

                            semana:
                                Number(
                                    semana.semana
                                ),

                            fecha:
                                semana.fecha || null,

                            posicion:
                                posicion + 1

                        });


                        estadistica.ultimaSemana =
                            Number(
                                semana.semana
                            );


                        estadistica.ultimaPosicion =
                            posicion + 1;

                    }

                );

            }

        );


        /*
         * Calcular métricas derivadas.
         */

        const totalSemanas =
            historial.length;


        Object.values(
            estadisticas
        ).forEach(

            estadistica => {

                this.calcularFrecuencia(

                    estadistica,

                    totalSemanas

                );


                this.calcularVentanas(

                    estadistica,

                    historial

                );


                this.calcularAtraso(

                    estadistica,

                    historial

                );


                this.calcularPromedios(

                    estadistica

                );


                this.calcularEstado(

                    estadistica,

                    totalSemanas

                );

            }

        );


        return {

            historial: historial,

            estadisticas: estadisticas,

            resumen:
                this.generarResumen(

                    historial,

                    estadisticas

                )

        };

    }


    /*==============================================================
        FRECUENCIA HISTÓRICA
    ==============================================================*/

    calcularFrecuencia(
        estadistica,
        totalSemanas
    ) {

        if (totalSemanas <= 0) {

            estadistica.frecuencia = 0;

            return;

        }


        estadistica.frecuencia =

            (
                estadistica.apariciones /
                totalSemanas
            ) * 100;

    }


    /*==============================================================
        FRECUENCIAS POR VENTANAS
    ==============================================================*/

    calcularVentanas(
        estadistica,
        historial
    ) {

        const ventanas = {

            frecuencia3: 3,

            frecuencia5: 5,

            frecuencia10: 10,

            frecuencia20: 20

        };


        Object.entries(
            ventanas
        ).forEach(

            ([propiedad, cantidad]) => {

                const semanas =
                    historial.slice(
                        -cantidad
                    );


                let apariciones = 0;


                semanas.forEach(

                    semana => {

                        const numeros =
                            this.normalizarNumeros(
                                semana.numeros
                            );


                        if (
                            numeros.includes(
                                estadistica.numero
                            )
                        ) {

                            apariciones++;

                        }

                    }

                );


                estadistica[propiedad] =
                    apariciones;

            }

        );

    }


    /*==============================================================
        ATRASO
    ==============================================================*/

    calcularAtraso(
        estadistica,
        historial
    ) {

        /*
         * No existe historial.
         */

        if (
            !historial ||
            historial.length === 0
        ) {

            estadistica.atraso = 0;

            estadistica.maximoAtraso = 0;

            estadistica.minimoAtraso = null;

            return;

        }


        /*
         * Recorrer desde la semana más reciente
         * hacia atrás.
         */

        let atrasoActual = 0;

        let maximoAtraso = 0;

        const intervalos = [];


        for (
            let i = historial.length - 1;
            i >= 0;
            i--
        ) {

            const numeros =
                this.normalizarNumeros(
                    historial[i].numeros
                );


            if (
                numeros.includes(
                    estadistica.numero
                )
            ) {

                break;

            }


            atrasoActual++;

        }


        /*
         * Calcular máximo atraso histórico.
         */

        let atrasoTemporal = 0;


        historial.forEach(

            semana => {

                const numeros =
                    this.normalizarNumeros(
                        semana.numeros
                    );


                if (
                    numeros.includes(
                        estadistica.numero
                    )
                ) {

                    if (
                        atrasoTemporal >
                        maximoAtraso
                    ) {

                        maximoAtraso =
                            atrasoTemporal;

                    }


                    atrasoTemporal = 0;

                }
                else {

                    atrasoTemporal++;

                }

            }

        );


        /*
         * Si terminó el historial sin aparición,
         * ese atraso también cuenta.
         */

        if (
            atrasoTemporal >
            maximoAtraso
        ) {

            maximoAtraso =
                atrasoTemporal;

        }


        /*
         * Calcular intervalos entre apariciones.
         */

        const semanas =
            estadistica.semanas;


        for (
            let i = 1;
            i < semanas.length;
            i++
        ) {

            const anterior =
                Number(
                    semanas[i - 1].semana
                );


            const actual =
                Number(
                    semanas[i].semana
                );


            const intervalo =
                actual - anterior;


            if (
                intervalo > 0
            ) {

                intervalos.push(
                    intervalo
                );

            }

        }


        estadistica.atraso =
            atrasoActual;


        estadistica.maximoAtraso =
            maximoAtraso;


        estadistica.minimoAtraso =
            intervalos.length > 0

                ? Math.min(
                    ...intervalos
                )

                : null;


        estadistica.intervalos =
            intervalos;

    }


    /*==============================================================
        PROMEDIO DE APARICIÓN
    ==============================================================*/

    calcularPromedios(
        estadistica
    ) {

        if (
            estadistica.apariciones === 0
        ) {

            estadistica.promedioAparicion =
                0;

            estadistica.intervaloPromedio =
                0;

            return;

        }


        /*
         * Promedio de semana de aparición.
         */

        const sumaSemanas =
            estadistica.semanas.reduce(

                (total, registro) =>

                    total +
                    Number(
                        registro.semana
                    ),

                0

            );


        estadistica.promedioAparicion =

            sumaSemanas /
            estadistica.apariciones;


        /*
         * Promedio de intervalo.
         */

        if (
            estadistica.intervalos &&
            estadistica.intervalos.length > 0
        ) {

            const sumaIntervalos =
                estadistica.intervalos.reduce(

                    (total, intervalo) =>

                        total + intervalo,

                    0

                );


            estadistica.intervaloPromedio =

                sumaIntervalos /
                estadistica.intervalos.length;

        }
        else {

            estadistica.intervaloPromedio = 0;

        }

    }


    /*==============================================================
        ESTADO CALIENTE / FRÍO
    ==============================================================*/

    calcularEstado(
        estadistica,
        totalSemanas
    ) {

        if (
            totalSemanas <= 0
        ) {

            estadistica.caliente = false;

            estadistica.frio = false;

            return;

        }


        /*
         * Con muy pocas semanas no clasificamos
         * agresivamente los números.
         */

        if (
            totalSemanas < 3
        ) {

            estadistica.caliente = false;

            estadistica.frio = false;

            return;

        }


        /*
         * Frecuencia histórica media esperada.
         *
         * Como cada semana contiene N números,
         * la frecuencia media esperada de un número
         * es:
         *
         * N / 100
         */

        const frecuenciaEsperada =

            (
                this.numerosPorSemana /
                (
                    this.maxNumero -
                    this.minNumero +
                    1
                )
            ) *
            totalSemanas;


        /*
         * Caliente:
         * aparición superior a la esperada.
         */

        estadistica.caliente =

            estadistica.apariciones >
            frecuenciaEsperada;


        /*
         * Frío:
         * aparición inferior a la mitad
         * de la frecuencia esperada.
         */

        estadistica.frio =

            estadistica.apariciones <
            (
                frecuenciaEsperada *
                0.5
            );

    }


    /*==============================================================
        ESTADÍSTICAS DE UNA SEMANA
    ==============================================================*/

    calcularEstadisticasSemana(
        semana
    ) {

        if (!semana) {

            return null;

        }


        const numeros =
            this.normalizarNumeros(
                semana.numeros
            );


        const pares =
            numeros.filter(
                numero =>
                    numero % 2 === 0
            );


        const impares =
            numeros.filter(
                numero =>
                    numero % 2 !== 0
            );


        const bajos =
            numeros.filter(
                numero =>
                    numero <= 33
            );


        const medios =
            numeros.filter(
                numero =>
                    numero >= 34 &&
                    numero <= 66
            );


        const altos =
            numeros.filter(
                numero =>
                    numero >= 67
            );


        const suma =
            numeros.reduce(

                (total, numero) =>
                    total + numero,

                0

            );


        const promedio =
            numeros.length > 0

                ? suma / numeros.length

                : 0;


        return {

            semana:
                Number(
                    semana.semana
                ),

            fecha:
                semana.fecha || null,

            cantidad:
                numeros.length,

            numeros: numeros,

            suma: suma,

            promedio: promedio,

            minimo:
                numeros.length > 0
                    ? Math.min(...numeros)
                    : null,

            maximo:
                numeros.length > 0
                    ? Math.max(...numeros)
                    : null,

            pares:
                pares.length,

            impares:
                impares.length,

            bajos:
                bajos.length,

            medios:
                medios.length,

            altos:
                altos.length

        };

    }


    /*==============================================================
        ESTADÍSTICAS DE TODAS LAS SEMANAS
    ==============================================================*/

    async obtenerEstadisticasSemanas() {

        const historial =
            await this.obtenerHistorial();


        return historial.map(

            semana =>
                this.calcularEstadisticasSemana(
                    semana
                )

        );

    }


    /*==============================================================
        FRECUENCIAS ORDENADAS
    ==============================================================*/

    async obtenerFrecuencias() {

        const resultado =
            await this.calcular();


        return Object.values(
            resultado.estadisticas
        )
        .sort(

            (a, b) =>
                b.apariciones -
                a.apariciones

        );

    }


    /*==============================================================
        ATRASOS ORDENADOS
    ==============================================================*/

    async obtenerAtrasos() {

        const resultado =
            await this.calcular();


        return Object.values(
            resultado.estadisticas
        )
        .sort(

            (a, b) =>
                b.atraso -
                a.atraso

        );

    }


    /*==============================================================
        OBTENER ESTADÍSTICA DE UN NÚMERO
    ==============================================================*/

    async obtenerNumero(numero) {

        const numeroNormalizado =
            Number(numero);


        if (
            !Number.isInteger(
                numeroNormalizado
            )
        ) {

            throw new Error(
                "Número inválido."
            );

        }


        if (
            numeroNormalizado <
                this.minNumero ||

            numeroNormalizado >
                this.maxNumero
        ) {

            throw new Error(
                `El número debe estar entre ` +
                `${this.minNumero} y ` +
                `${this.maxNumero}.`
            );

        }


        const resultado =
            await this.calcular();


        return resultado.estadisticas[
            numeroNormalizado
        ];

    }


    /*==============================================================
        RESUMEN GENERAL
    ==============================================================*/

    generarResumen(
        historial,
        estadisticas
    ) {

        const totalSemanas =
            historial.length;


        const totalNumeros =
            historial.reduce(

                (total, semana) => {

                    const numeros =
                        this.normalizarNumeros(
                            semana.numeros
                        );


                    return total +
                        numeros.length;

                },

                0

            );


        const paresTotales =
            historial.reduce(

                (total, semana) => {

                    const numeros =
                        this.normalizarNumeros(
                            semana.numeros
                        );


                    return total +

                        numeros.filter(
                            numero =>
                                numero % 2 === 0
                        ).length;

                },

                0

            );


        const imparesTotales =
            totalNumeros -
            paresTotales;


        const sumaTotal =
            historial.reduce(

                (total, semana) => {

                    const numeros =
                        this.normalizarNumeros(
                            semana.numeros
                        );


                    return total +

                        numeros.reduce(

                            (
                                suma,
                                numero
                            ) =>
                                suma + numero,

                            0

                        );

                },

                0

            );


        const promedioGeneral =

            totalNumeros > 0

                ? sumaTotal /
                  totalNumeros

                : 0;


        const lista =
            Object.values(
                estadisticas
            );


        const numerosConApariciones =
            lista.filter(

                estadistica =>
                    estadistica.apariciones > 0

            ).length;


        const numerosSinApariciones =
            lista.filter(

                estadistica =>
                    estadistica.apariciones === 0

            ).length;


        const numeroMasFrecuente =
            [...lista]
            .sort(

                (a, b) =>
                    b.apariciones -
                    a.apariciones

            )[0];


        const numeroMasAtrasado =
            [...lista]
            .sort(

                (a, b) =>
                    b.atraso -
                    a.atraso

            )[0];


        return {

            totalSemanas,

            totalNumeros,

            numerosPosibles:

                this.maxNumero -
                this.minNumero +
                1,

            numerosConApariciones,

            numerosSinApariciones,

            paresTotales,

            imparesTotales,

            sumaTotal,

            promedioGeneral,

            numeroMasFrecuente:

                numeroMasFrecuente
                    ? numeroMasFrecuente.texto
                    : null,

            frecuenciaMaxima:

                numeroMasFrecuente
                    ? numeroMasFrecuente.apariciones
                    : 0,

            numeroMasAtrasado:

                numeroMasAtrasado
                    ? numeroMasAtrasado.texto
                    : null,

            atrasoMaximo:

                numeroMasAtrasado
                    ? numeroMasAtrasado.atraso
                    : 0

        };

    }


    /*==============================================================
        DISTRIBUCIÓN POR RANGOS
    ==============================================================*/

    async obtenerDistribucionRangos() {

        const historial =
            await this.obtenerHistorial();


        let bajos = 0;

        let medios = 0;

        let altos = 0;


        historial.forEach(

            semana => {

                const numeros =
                    this.normalizarNumeros(
                        semana.numeros
                    );


                numeros.forEach(

                    numero => {

                        if (
                            numero <= 33
                        ) {

                            bajos++;

                        }
                        else if (
                            numero <= 66
                        ) {

                            medios++;

                        }
                        else {

                            altos++;

                        }

                    }

                );

            }

        );


        const total =
            bajos +
            medios +
            altos;


        return {

            bajos,

            medios,

            altos,

            total,

            porcentajeBajos:

                total > 0
                    ? (bajos / total) * 100
                    : 0,

            porcentajeMedios:

                total > 0
                    ? (medios / total) * 100
                    : 0,

            porcentajeAltos:

                total > 0
                    ? (altos / total) * 100
                    : 0

        };

    }


    /*==============================================================
        DISTRIBUCIÓN PAR / IMPAR
    ==============================================================*/

    async obtenerDistribucionParidad() {

        const historial =
            await this.obtenerHistorial();


        let pares = 0;

        let impares = 0;


        historial.forEach(

            semana => {

                const numeros =
                    this.normalizarNumeros(
                        semana.numeros
                    );


                numeros.forEach(

                    numero => {

                        if (
                            numero % 2 === 0
                        ) {

                            pares++;

                        }
                        else {

                            impares++;

                        }

                    }

                );

            }

        );


        const total =
            pares +
            impares;


        return {

            pares,

            impares,

            total,

            porcentajePares:

                total > 0
                    ? (pares / total) * 100
                    : 0,

            porcentajeImpares:

                total > 0
                    ? (impares / total) * 100
                    : 0

        };

    }


    /*==============================================================
        EXPORTAR ESTADÍSTICAS
    ==============================================================*/

    async exportar() {

        return await this.calcular();

    }

}