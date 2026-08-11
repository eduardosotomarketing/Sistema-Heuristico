/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 * Archivo: DashboardService.js
 *
 * Servicio encargado de generar toda la información que utilizará
 * el Dashboard principal.
 **********************************************************************/

import SemanaService from "./SemanaService.js";

export default class DashboardService {

    constructor() {

        this.semanaService = new SemanaService();

    }

    /*==============================================================
        RESUMEN GENERAL
    ==============================================================*/

    async obtenerResumen() {

        const semanas = await this.semanaService.obtenerTodas();

        const totalSemanas = semanas.length;

        const totalNumeros = totalSemanas * 10;

        let ultimaSemana = null;

        let ultimaFecha = "-";

        if (totalSemanas > 0) {

            ultimaSemana = semanas[totalSemanas - 1].semana;

            ultimaFecha = semanas[totalSemanas - 1].fecha;

        }

        return {

            totalSemanas,

            totalNumeros,

            ultimaSemana,

            ultimaFecha,

            topNumero: "--",

            topFrecuencia: 0,

            totalPares: 0,

            totalImpares: 0,

            promedioNumeros: 0,

            sumaPromedio: 0

        };

    }

    /*==============================================================
        CARGAR TARJETAS DEL DASHBOARD
    ==============================================================*/

    async cargarDashboard() {

        const resumen = await this.obtenerResumen();

        this.actualizarTexto(

            "totalSemanas",

            resumen.totalSemanas

        );

        this.actualizarTexto(

            "totalNumeros",

            resumen.totalNumeros

        );

        this.actualizarTexto(

            "ultimaSemana",

            resumen.ultimaSemana ?? "-"

        );

        this.actualizarTexto(

            "topNumero",

            resumen.topNumero

        );

    }

    /*==============================================================
        ACTUALIZAR TEXTO HTML
    ==============================================================*/

    actualizarTexto(id, valor) {

        const elemento = document.getElementById(id);

        if (!elemento) return;

        elemento.textContent = valor;

    }

    /*==============================================================
        VERIFICAR SI EXISTEN DATOS
    ==============================================================*/

    async tieneDatos() {

        const semanas = await this.semanaService.obtenerTodas();

        return semanas.length > 0;

    }

    /*==============================================================
        OBTENER ÚLTIMA SEMANA
    ==============================================================*/

    async obtenerUltimaSemana() {

        return await this.semanaService.ultimaSemana();

    }

}