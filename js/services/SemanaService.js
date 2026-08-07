/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 * Archivo: services/SemanaService.js
 *
 * Lógica de negocio de las semanas
 **********************************************************************/

import Database from "../database/Database.js";
import Semana from "../models/Semana.js";
import { CONFIG } from "../config.js";

export default class SemanaService {

    constructor() {

        this.database = new Database();

        this.collection = CONFIG.COLLECTIONS.SEMANAS;

    }

    /*==============================================================
        GENERAR ID
    ==============================================================*/

    generarId(numeroSemana) {

        return CONFIG.ID_PREFIX +
            String(numeroSemana).padStart(
                CONFIG.ID_DIGITOS,
                "0"
            );

    }

    /*==============================================================
        EXISTE SEMANA
    ==============================================================*/

    async existe(numeroSemana) {

        return await this.database.exists(

            this.collection,

            this.generarId(numeroSemana)

        );

    }

    /*==============================================================
        CREAR SEMANA
    ==============================================================*/

    async crear(semana, fecha, numeros) {

        const nuevaSemana = new Semana(

            semana,
            fecha,
            numeros

        );

        nuevaSemana.validar();

        const existe = await this.existe(semana);

        if (existe) {

            throw new Error(

                `La semana ${semana} ya existe.`

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
        ACTUALIZAR
    ==============================================================*/

    async actualizar(semana, datos) {

        const id = this.generarId(semana);

        datos.modificado = new Date().toISOString();

        await this.database.update(

            this.collection,

            id,

            datos

        );

    }

    /*==============================================================
        ELIMINAR
    ==============================================================*/

    async eliminar(numeroSemana) {

        const id = this.generarId(numeroSemana);

        await this.database.delete(

            this.collection,

            id

        );

    }

    /*==============================================================
        OBTENER UNA SEMANA
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

    async obtenerTodas() {

        return await this.database.readAll(

            this.collection,

            "semana"

        );

    }

    /*==============================================================
        TOTAL
    ==============================================================*/

    async totalSemanas() {

        const semanas = await this.obtenerTodas();

        return semanas.length;

    }

    /*==============================================================
        TOTAL DE NÚMEROS ANALIZADOS
    ==============================================================*/

    async totalNumeros() {

        const semanas = await this.obtenerTodas();

        return semanas.length *

            CONFIG.NUMEROS_POR_SEMANA;

    }

    /*==============================================================
        ÚLTIMA SEMANA
    ==============================================================*/

    async ultimaSemana() {

        const semanas = await this.obtenerTodas();

        if (semanas.length === 0)

            return null;

        return semanas[

            semanas.length - 1

        ];

    }

    /*==============================================================
        BUSCAR NÚMERO
    ==============================================================*/

    async buscarNumero(numero) {

        const semanas = await this.obtenerTodas();

        return semanas.filter(

            semana =>

            semana.numeros.includes(numero)

        );

    }

    /*==============================================================
        VALIDAR SI EL NÚMERO EXISTE
    ==============================================================*/

    async apareceNumero(numero) {

        const resultado = await this.buscarNumero(numero);

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

    async importarJSON(listaSemanas) {

        for (const datos of listaSemanas) {

            const existe = await this.existe(

                datos.semana

            );

            if (!existe) {

                await this.database.create(

                    this.collection,

                    datos.id,

                    datos

                );

            }

        }

    }

}