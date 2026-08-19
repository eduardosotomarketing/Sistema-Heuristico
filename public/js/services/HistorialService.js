/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 * Archivo: js/services/HistorialService.js
 *
 * Servicio central del historial de sorteos.
 *
 * Responsabilidades:
 *
 * - Obtener el historial completo
 * - Obtener las últimas semanas
 * - Obtener la primera semana
 * - Obtener la última semana
 * - Buscar semanas
 * - Buscar apariciones de un número
 * - Obtener cantidad de apariciones
 * - Obtener última aparición
 * - Obtener atraso actual
 * - Obtener números históricos
 * - Obtener información básica del historial
 *
 * IMPORTANTE:
 *
 * Este servicio NO consulta Firestore directamente.
 *
 * Utiliza:
 *
 * HistorialService
 *        ↓
 * SemanaService
 *        ↓
 * Database
 *        ↓
 * Firestore
 *
 * Los motores trabajarán posteriormente sobre este servicio.
 **********************************************************************/

import SemanaService from "./SemanaService.js";

import { CONFIG } from "../config.js";


export default class HistorialService {


    /*==============================================================
        CONSTRUCTOR
    ==============================================================*/

    constructor() {

        this.semanaService =
            new SemanaService();

        /*
         * Caché temporal del historial.
         *
         * No reemplaza Firestore.
         *
         * Simplemente evita realizar varias consultas
         * consecutivas innecesarias durante un mismo
         * procesamiento.
         */

        this.historial = null;

    }


    /*==============================================================
        LIMPIAR CACHÉ
    ==============================================================*/

    limpiarCache() {

        this.historial = null;

    }


    /*==============================================================
        OBTENER HISTORIAL COMPLETO
    ==============================================================*/

    async obtenerHistorial(
        direccion = "asc",
        forzarActualizacion = false
    ) {

        /*
         * Si tenemos información almacenada en caché
         * y no se solicita actualización, la utilizamos.
         */

        if (
            this.historial !== null &&
            !forzarActualizacion
        ) {

            return this.historial;

        }


        const semanas =
            await this.semanaService.obtenerTodas(
                direccion
            );


        if (
            !Array.isArray(semanas)
        ) {

            this.historial = [];

            return [];

        }


        /*
         * Normalizamos la información.
         *
         * Esto es importante porque los motores
         * trabajarán posteriormente con una estructura
         * homogénea.
         */

        this.historial =
            semanas.map(
                semana =>
                    this.normalizarSemana(
                        semana
                    )
            );


        return this.historial;

    }


    /*==============================================================
        NORMALIZAR SEMANA
    ==============================================================*/

    normalizarSemana(
        semana
    ) {

        if (!semana) {

            return null;

        }


        const numeros =
            Array.isArray(
                semana.numeros
            )
                ? semana.numeros
                    .map(
                        numero =>
                            Number(numero)
                    )
                    .filter(
                        numero =>
                            Number.isInteger(numero)
                    )
                : [];


        return {

            id:
                semana.id || null,

            semana:
                Number(semana.semana),

            fecha:
                semana.fecha || null,

            numeros:

                numeros,

            cantidad:

                numeros.length,

            creado:

                semana.creado || null,

            modificado:

                semana.modificado || null

        };

    }


    /*==============================================================
        OBTENER ÚLTIMAS SEMANAS
    ==============================================================*/

    async obtenerUltimasSemanas(
        cantidad = 10
    ) {

        if (
            !Number.isInteger(cantidad) ||
            cantidad <= 0
        ) {

            throw new Error(
                "La cantidad de semanas debe ser mayor que cero."
            );

        }


        const semanas =
            await this.semanaService.obtenerTodas(
                "desc"
            );


        return semanas

            .slice(
                0,
                cantidad
            )

            .map(
                semana =>
                    this.normalizarSemana(
                        semana
                    )
            );

    }


    /*==============================================================
        OBTENER PRIMERA SEMANA
    ==============================================================*/

    async obtenerPrimeraSemana() {

        const semana =
            await this.semanaService.primeraSemana();


        if (!semana) {

            return null;

        }


        return this.normalizarSemana(
            semana
        );

    }


    /*==============================================================
        OBTENER ÚLTIMA SEMANA
    ==============================================================*/

    async obtenerUltimaSemana() {

        const semana =
            await this.semanaService.ultimaSemana();


        if (!semana) {

            return null;

        }


        return this.normalizarSemana(
            semana
        );

    }


    /*==============================================================
        TOTAL DE SEMANAS
    ==============================================================*/

    async totalSemanas() {

        return await this.semanaService.totalSemanas();

    }


    /*==============================================================
        TOTAL DE NÚMEROS
    ==============================================================*/

    async totalNumeros() {

        return await this.semanaService.totalNumeros();

    }


    /*==============================================================
        BUSCAR SEMANA
    ==============================================================*/

    async obtenerSemana(
        numeroSemana
    ) {

        const semana =
            await this.semanaService.obtener(
                numeroSemana
            );


        if (!semana) {

            return null;

        }


        return this.normalizarSemana(
            semana
        );

    }


    /*==============================================================
        BUSCAR SEMANAS POR NÚMERO
    ==============================================================*/

    async buscarNumero(
        numero
    ) {

        const numeroBuscado =
            Number(numero);


        if (
            !Number.isInteger(
                numeroBuscado
            )
        ) {

            throw new Error(
                "El número buscado no es válido."
            );

        }


        if (
            numeroBuscado <
                CONFIG.MIN_NUMERO ||

            numeroBuscado >
                CONFIG.MAX_NUMERO
        ) {

            throw new Error(

                `El número debe estar entre ` +
                `${CONFIG.MIN_NUMERO} y ` +
                `${CONFIG.MAX_NUMERO}.`

            );

        }


        const semanas =
            await this.semanaService.buscarNumero(
                numeroBuscado
            );


        return semanas.map(

            semana =>
                this.normalizarSemana(
                    semana
                )

        );

    }


    /*==============================================================
        APARECE NÚMERO
    ==============================================================*/

    async apareceNumero(
        numero
    ) {

        return await this.semanaService.apareceNumero(
            Number(numero)
        );

    }


    /*==============================================================
        CONTAR APARICIONES
    ==============================================================*/

    async contarApariciones(
        numero
    ) {

        const semanas =
            await this.buscarNumero(
                numero
            );


        return semanas.length;

    }


    /*==============================================================
        OBTENER SEMANAS DE APARICIÓN
    ==============================================================*/

    async obtenerSemanasDeAparicion(
        numero
    ) {

        const semanas =
            await this.buscarNumero(
                numero
            );


        return semanas.map(

            semana =>
                semana.semana

        );

    }


    /*==============================================================
        OBTENER ÚLTIMA APARICIÓN
    ==============================================================*/

    async obtenerUltimaAparicion(
        numero
    ) {

        const semanas =
            await this.buscarNumero(
                numero
            );


        if (
            semanas.length === 0
        ) {

            return null;

        }


        /*
         * Ordenamos por número de semana
         * para garantizar el resultado.
         */

        semanas.sort(

            (a, b) =>
                b.semana - a.semana

        );


        return semanas[0];

    }


    /*==============================================================
        OBTENER PRIMERA APARICIÓN
    ==============================================================*/

    async obtenerPrimeraAparicion(
        numero
    ) {

        const semanas =
            await this.buscarNumero(
                numero
            );


        if (
            semanas.length === 0
        ) {

            return null;

        }


        semanas.sort(

            (a, b) =>
                a.semana - b.semana

        );


        return semanas[0];

    }


    /*==============================================================
        CALCULAR ATRASO
    ==============================================================*/

    async calcularAtraso(
        numero
    ) {

        const ultimaSemana =
            await this.obtenerUltimaSemana();


        if (!ultimaSemana) {

            return 0;

        }


        const ultimaAparicion =
            await this.obtenerUltimaAparicion(
                numero
            );


        /*
         * Si nunca apareció, el atraso se considera
         * igual a la cantidad total de semanas.
         */

        if (!ultimaAparicion) {

            return ultimaSemana.semana;

        }


        return Math.max(

            0,

            ultimaSemana.semana -
            ultimaAparicion.semana

        );

    }


    /*==============================================================
        OBTENER TODOS LOS NÚMEROS DEL HISTORIAL
    ==============================================================*/

    async obtenerNumerosHistoricos() {

        const historial =
            await this.obtenerHistorial();


        const numeros =
            new Set();


        historial.forEach(

            semana => {

                if (
                    !Array.isArray(
                        semana.numeros
                    )
                ) {

                    return;

                }


                semana.numeros.forEach(

                    numero => {

                        numeros.add(
                            Number(numero)
                        );

                    }

                );

            }

        );


        return Array.from(
            numeros
        ).sort(
            (a, b) => a - b
        );

    }


    /*==============================================================
        OBTENER TODOS LOS NÚMEROS 00-99
    ==============================================================*/

    obtenerTodosLosNumeros() {

        const numeros = [];


        for (
            let numero =
                CONFIG.MIN_NUMERO;

            numero <=
                CONFIG.MAX_NUMERO;

            numero++
        ) {

            numeros.push(
                numero
            );

        }


        return numeros;

    }


    /*==============================================================
        CONTAR APARICIONES EN UNA LISTA
    ==============================================================*/

    contarAparicionesEnHistorial(
        numero,
        historial
    ) {

        if (
            !Array.isArray(
                historial
            )
        ) {

            return 0;

        }


        let apariciones = 0;


        historial.forEach(

            semana => {

                if (
                    !Array.isArray(
                        semana.numeros
                    )
                ) {

                    return;

                }


                if (
                    semana.numeros.includes(
                        Number(numero)
                    )
                ) {

                    apariciones++;

                }

            }

        );


        return apariciones;

    }


    /*==============================================================
        OBTENER FRECUENCIA EN ÚLTIMAS N SEMANAS
    ==============================================================*/

    async frecuenciaUltimasSemanas(
        numero,
        cantidad
    ) {

        if (
            !Number.isInteger(
                cantidad
            ) ||
            cantidad <= 0
        ) {

            throw new Error(
                "La cantidad de semanas debe ser válida."
            );

        }


        const semanas =
            await this.obtenerUltimasSemanas(
                cantidad
            );


        return this.contarAparicionesEnHistorial(

            numero,

            semanas

        );

    }


    /*==============================================================
        OBTENER PORCENTAJE HISTÓRICO
    ==============================================================*/

    async porcentajeAparicion(
        numero
    ) {

        const totalSemanas =
            await this.totalSemanas();


        if (
            totalSemanas === 0
        ) {

            return 0;

        }


        const apariciones =
            await this.contarApariciones(
                numero
            );


        return (

            apariciones /
            totalSemanas

        ) * 100;

    }


    /*==============================================================
        OBTENER RESUMEN
    ==============================================================*/

    async obtenerResumen() {

        const totalSemanas =
            await this.totalSemanas();


        const totalNumeros =
            await this.totalNumeros();


        const primeraSemana =
            await this.obtenerPrimeraSemana();


        const ultimaSemana =
            await this.obtenerUltimaSemana();


        return {

            totalSemanas,

            totalNumeros,

            primeraSemana,

            ultimaSemana,

            rangoNumeros: {

                minimo:
                    CONFIG.MIN_NUMERO,

                maximo:
                    CONFIG.MAX_NUMERO

            },

            numerosPorSemana:
                CONFIG.NUMEROS_POR_SEMANA

        };

    }


    /*==============================================================
        RECARGAR HISTORIAL
    ==============================================================*/

    async recargar() {

        this.limpiarCache();


        return await this.obtenerHistorial(

            "asc",

            true

        );

    }

}  