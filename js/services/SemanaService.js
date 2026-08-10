/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 * Archivo: js/Services/SemanaService.js
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
        EXISTE SEMANA
    ==============================================================*/

    async existe(numeroSemana) {

        const id =
            this.generarId(
                numeroSemana
            );

        return await this.database.exists(

            this.collection,

            id

        );
    }


    /*==============================================================
        CREAR SEMANA
    ==============================================================*/

    async crear(
        numeroSemana,
        fecha,
        numeros
    ) {

        const nuevaSemana =
            new Semana(

                numeroSemana,
                fecha,
                numeros

            );


        /*
         * Validamos ANTES de enviar información
         * a Firebase.
         */

        nuevaSemana.validar();


        const existe =
            await this.existe(
                numeroSemana
            );


        if (existe) {

            throw new Error(

                `La semana ${numeroSemana} ya existe.`

            );
        }


        await this.database.create(

            this.collection,

            nuevaSemana.id,

            nuevaSemana.toJSON()

        );


        return nuevaSemana;
    }


    /*==============================================================
        OBTENER SEMANA
    ==============================================================*/

    async obtener(numeroSemana) {

        const id =
            this.generarId(
                numeroSemana
            );

        return await this.database.read(

            this.collection,

            id

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
        ACTUALIZAR SEMANA
    ==============================================================*/

    async actualizar(
        numeroSemana,
        datos
    ) {

        const id =
            this.generarId(
                numeroSemana
            );


        const existe =
            await this.database.exists(

                this.collection,

                id

            );


        if (!existe) {

            throw new Error(

                `La semana ${numeroSemana} no existe.`

            );
        }


        const datosActualizados = {

            ...datos,

            modificado:
                new Date().toISOString()

        };


        await this.database.update(

            this.collection,

            id,

            datosActualizados

        );


        return true;
    }


    /*==============================================================
        ELIMINAR
    ==============================================================*/

    async eliminar(
        numeroSemana
    ) {

        const id =
            this.generarId(
                numeroSemana
            );


        const existe =
            await this.database.exists(

                this.collection,

                id

            );


        if (!existe) {

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
        TOTAL DE SEMANAS
    ==============================================================*/

    async totalSemanas() {

        return await this.database.count(

            this.collection

        );
    }


    /*==============================================================
        TOTAL DE NÚMEROS ANALIZADOS
    ==============================================================*/

    async totalNumeros() {

        const semanas =
            await this.obtenerTodas();

        return semanas.reduce(

            (total, semana) =>

                total +
                (
                    Array.isArray(
                        semana.numeros
                    )
                        ? semana.numeros.length
                        : 0
                ),

            0

        );
    }


    /*==============================================================
        ÚLTIMA SEMANA
    ==============================================================*/

    async ultimaSemana() {

        const semanas =
            await this.obtenerTodas(
                "desc"
            );


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
            await this.obtenerTodas(
                "asc"
            );


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

    async buscarNumero(
        numero
    ) {

        const semanas =
            await this.obtenerTodas();


        return semanas.filter(

            semana =>

                Array.isArray(
                    semana.numeros
                ) &&

                semana.numeros.includes(
                    Number(numero)
                )

        );
    }


    /*==============================================================
        APARECE NÚMERO
    ==============================================================*/

    async apareceNumero(
        numero
    ) {

        const resultado =
            await this.buscarNumero(
                numero
            );


        return resultado.length > 0;
    }


    /*==============================================================
        EXPORTAR JSON
    ==============================================================*/

    async exportarJSON() {

        return await this.obtenerTodas();
    }


    /*==============================================================
        IMPORTAR JSON
    ==============================================================*/

    async importarJSON(
        listaSemanas
    ) {

        if (
            !Array.isArray(
                listaSemanas
            )
        ) {

            throw new Error(
                "El archivo JSON debe contener una lista de semanas."
            );
        }


        let importadas = 0;
        let omitidas = 0;


        for (
            const datos
            of listaSemanas
        ) {

            if (
                !datos ||
                datos.semana === undefined
            ) {

                omitidas++;

                continue;
            }


            const existe =
                await this.existe(
                    datos.semana
                );


            if (existe) {

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