
/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 * Archivo: js/Services/SemanaService.js
 *
 * Servicio encargado de administrar las semanas de sorteos.
 *
 * RESPONSABILIDADES:
 * - Crear semanas
 * - Consultar semanas
 * - Actualizar semanas
 * - Eliminar semanas
 * - Buscar números
 * - Obtener primera/última semana
 * - Importar/exportar historial
 *
 * Este servicio NO calcula estadísticas.
 * Esa responsabilidad corresponde a los Motores.
 **********************************************************************/

import Database from "../database/Database.js";
import Semana from "../models/Semana.js";
import { CONFIG } from "../config.js";


export default class SemanaService {


    /*==============================================================
        CONSTRUCTOR
    ==============================================================*/

    constructor() {

        this.database =
            new Database();

        this.collection =
            CONFIG.COLLECTIONS.SEMANAS;

    }


    /*==============================================================
        GENERAR ID DE SEMANA
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
         * Validar antes de acceder
         * a Firestore.
         */

        nuevaSemana.validar();


        /*
         * Comprobar duplicado.
         */

        const existe =
            await this.existe(
                numeroSemana
            );


        if (existe) {

            throw new Error(

                `La semana ${numeroSemana} ya existe.`

            );

        }


        /*
         * Guardar.
         */

        await this.database.create(

            this.collection,

            nuevaSemana.id,

            nuevaSemana.toJSON()

        );


        return nuevaSemana;

    }


    /*==============================================================
        OBTENER UNA SEMANA
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

        /*
         * Validar dirección.
         */

        const direccionNormalizada =
            String(direccion).toLowerCase();


        if (
            direccionNormalizada !== "asc" &&
            direccionNormalizada !== "desc"
        ) {

            throw new Error(

                "La dirección debe ser 'asc' o 'desc'."

            );

        }


        return await this.database.readAll(

            this.collection,

            "semana",

            direccionNormalizada

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


        /*
         * Comprobar existencia.
         */

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


        /*
         * Preparar actualización.
         */

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
        ELIMINAR SEMANA
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


        const semanas =
            await this.obtenerTodas();


        return semanas.filter(

            semana =>

                Array.isArray(
                    semana.numeros
                ) &&

                semana.numeros.includes(
                    numeroBuscado
                )

        );

    }


    /*==============================================================
        COMPROBAR APARICIÓN
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
        EXPORTAR HISTORIAL JSON
    ==============================================================*/

    async exportarJSON() {

        return await this.obtenerTodas(
            "asc"
        );

    }


    /*==============================================================
        IMPORTAR HISTORIAL JSON
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

            /*
             * Validación básica.
             */

            if (
                !datos ||
                datos.semana === undefined
            ) {

                omitidas++;

                continue;

            }


            /*
             * No sobrescribir
             * semanas existentes.
             */

            const existe =
                await this.existe(
                    datos.semana
                );


            if (existe) {

                omitidas++;

                continue;

            }


            /*
             * Crear modelo.
             */

            const semana =
                new Semana(

                    datos.semana,

                    datos.fecha,

                    datos.numeros || []

                );


            /*
             * Validar antes
             * de guardar.
             */

            semana.validar();


            /*
             * Mantener datos históricos
             * originales cuando existan.
             */

            if (datos.id) {

                semana.id =
                    datos.id;

            }


            if (datos.creado) {

                semana.creado =
                    datos.creado;

            }


            if (datos.modificado) {

                semana.modificado =
                    datos.modificado;

            }


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
