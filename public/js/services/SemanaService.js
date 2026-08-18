
/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 * Archivo: js/services/SemanaService.js
 *
 * Servicio encargado de administrar las semanas de sorteos.
 **********************************************************************/

import Database from "../database/Database.js";
import Semana from "../models/Semana.js";
import { CONFIG } from "../config.js";


export default class SemanaService {

    constructor() {

        this.database = new Database();

        this.collection =
            CONFIG.COLLECTIONS.SEMANAS;

    }


    /*==============================================================
        GENERAR ID
    ==============================================================*/

    generarId(numeroSemana) {

        return (

            CONFIG.ID_PREFIX +

            String(numeroSemana)
                .padStart(
                    CONFIG.ID_DIGITOS,
                    "0"
                )

        );

    }


    /*==============================================================
        EXISTE
    ==============================================================*/

    async existe(numeroSemana) {

        return await this.database.exists(

            this.collection,

            this.generarId(numeroSemana)

        );

    }


    /*==============================================================
        CREAR
    ==============================================================*/

    async crear(
        numeroSemana,
        fecha,
        numeros
    ) {

        const semana = new Semana(

            numeroSemana,
            fecha,
            numeros

        );

        semana.validar();

        if (
            await this.existe(numeroSemana)
        ) {

            throw new Error(

                `La semana ${numeroSemana} ya existe.`

            );

        }

        await this.database.create(

            this.collection,

            semana.id,

            semana.toJSON()

        );

        return semana;

    }


    /*==============================================================
        OBTENER UNA
    ==============================================================*/

    async obtener(numeroSemana) {

        return await this.database.read(

            this.collection,

            this.generarId(numeroSemana)

        );

    }


    /*==============================================================
        OBTENER TODAS
    ==============================================================*/

    async obtenerTodas(
        direccion = "asc"
    ) {

        return await this.database.readAll(

            this.collection,

            "semana",

            direccion

        );

    }


    /*==============================================================
        ACTUALIZAR
    ==============================================================*/

    async actualizar(
        numeroSemana,
        datos
    ) {

        const id =
            this.generarId(numeroSemana);

        if (
            !(await this.database.exists(
                this.collection,
                id
            ))
        ) {

            throw new Error(

                `La semana ${numeroSemana} no existe.`

            );

        }

        await this.database.update(

            this.collection,

            id,

            {

                ...datos,

                modificado:
                    new Date().toISOString()

            }

        );

        return true;

    }


    /*==============================================================
        ELIMINAR
    ==============================================================*/

    async eliminar(numeroSemana) {

        const id =
            this.generarId(numeroSemana);

        if (
            !(await this.database.exists(
                this.collection,
                id
            ))
        ) {

            throw new Error(

                `La semana ${numeroSemana} no existe.`

            );

        }

        await this.database.delete(

            this.collection,

            id

        );

        return true;

    }


    /*==============================================================
        TOTAL
    ==============================================================*/

    async totalSemanas() {

        return await this.database.count(

            this.collection

        );

    }


    /*==============================================================
        TOTAL NÚMEROS
    ==============================================================*/

    async totalNumeros() {

        const semanas =
            await this.obtenerTodas();

        return semanas.reduce(

            (total, semana) => {

                if (
                    Array.isArray(
                        semana.numeros
                    )
                ) {

                    return (
                        total +
                        semana.numeros.length
                    );

                }

                return total;

            },

            0

        );

    }


    /*==============================================================
        ÚLTIMA SEMANA
    ==============================================================*/

    async ultimaSemana() {

        const semanas =
            await this.obtenerTodas("desc");

        if (
            !semanas ||
            semanas.length === 0
        ) {

            return null;

        }

        return semanas[0];

    }


    /*==============================================================
        PRIMERA SEMANA
    ==============================================================*/

    async primeraSemana() {

        const semanas =
            await this.obtenerTodas("asc");

        if (
            !semanas ||
            semanas.length === 0
        ) {

            return null;

        }

        return semanas[0];

    }


    /*==============================================================
        BUSCAR NÚMERO
    ==============================================================*/

    async buscarNumero(numero) {

        const semanas =
            await this.obtenerTodas();

        const valor =
            Number(numero);

        return semanas.filter(

            semana =>

                Array.isArray(
                    semana.numeros
                ) &&

                semana.numeros.includes(
                    valor
                )

        );

    }


    /*==============================================================
        APARECE NÚMERO
    ==============================================================*/

    async apareceNumero(numero) {

        const resultado =
            await this.buscarNumero(numero);

        return resultado.length > 0;

    }


    /*==============================================================
        EXPORTAR
    ==============================================================*/

    async exportarJSON() {

        return await this.obtenerTodas();

    }


    /*==============================================================
        IMPORTAR
    ==============================================================*/

    async importarJSON(listaSemanas) {

        if (
            !Array.isArray(listaSemanas)
        ) {

            throw new Error(

                "El archivo JSON debe contener una lista de semanas."

            );

        }

        let importadas = 0;
        let omitidas = 0;

        for (
            const datos of listaSemanas
        ) {

            if (
                !datos ||
                datos.semana === undefined
            ) {

                omitidas++;

                continue;

            }

            if (
                await this.existe(
                    datos.semana
                )
            ) {

                omitidas++;

                continue;

            }

            const semana =
                new Semana(

                    datos.semana,

                    datos.fecha,

                    datos.numeros || []

                );

            semana.validar();

            await this.database.create(

                this.collection,

                semana.id,

                semana.toJSON()

            );

            importadas++;

        }

        return {

            importadas,
            omitidas

        };

    }

}