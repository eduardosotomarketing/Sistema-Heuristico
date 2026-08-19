/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 * Archivo: js/services/DashboardService.js
 *
 * Servicio encargado de generar la información
 * utilizada por el Dashboard principal.
 **********************************************************************/

import SemanaService from "./SemanaService.js";


export default class DashboardService {

    constructor() {

        this.semanaService = new SemanaService();

    }


    /*==============================================================
        OBTENER RESUMEN GENERAL
    ==============================================================*/

    async obtenerResumen() {

        const semanas =
            await this.semanaService.obtenerTodas("asc");


        let totalSemanas =
            semanas.length;


        let totalNumeros = 0;

        let totalPares = 0;

        let totalImpares = 0;

        let sumaTotal = 0;


        /*
         * Recorrer todas las semanas
         */

        semanas.forEach(semana => {

            if (!Array.isArray(semana.numeros)) {

                return;

            }


            totalNumeros +=
                semana.numeros.length;


            semana.numeros.forEach(numero => {

                sumaTotal += Number(numero);


                if (Number(numero) % 2 === 0) {

                    totalPares++;

                }
                else {

                    totalImpares++;

                }

            });

        });


        /*========================================================
            ÚLTIMA SEMANA
        ========================================================*/

        let ultimaSemana = null;

        let ultimaFecha = "-";


        if (totalSemanas > 0) {

            const ultima =
                semanas[totalSemanas - 1];


            ultimaSemana =
                ultima.semana ?? null;


            ultimaFecha =
                ultima.fecha ?? "-";

        }


        /*========================================================
            PROMEDIO
        ========================================================*/

        const promedioNumeros =
            totalNumeros > 0
                ? sumaTotal / totalNumeros
                : 0;


        /*========================================================
            RESULTADO
        ========================================================*/

        return {

            totalSemanas,

            totalNumeros,

            ultimaSemana,

            ultimaFecha,

            topNumero: "--",

            topFrecuencia: 0,

            totalPares,

            totalImpares,

            promedioNumeros,

            sumaPromedio: promedioNumeros

        };

    }


    /*==============================================================
        CARGAR DASHBOARD
    ==============================================================*/

    async cargarDashboard() {

        const resumen =
            await this.obtenerResumen();


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


        /*
         * Elementos opcionales.
         *
         * Si todavía no existen en index.html,
         * simplemente no ocurre nada.
         */

        this.actualizarTexto(

            "ultimaFecha",

            resumen.ultimaFecha

        );


        this.actualizarTexto(

            "totalPares",

            resumen.totalPares

        );


        this.actualizarTexto(

            "totalImpares",

            resumen.totalImpares

        );


        this.actualizarTexto(

            "promedioNumeros",

            resumen.promedioNumeros.toFixed(2)

        );


        return resumen;

    }


    /*==============================================================
        ACTUALIZAR TEXTO HTML
    ==============================================================*/

    actualizarTexto(id, valor) {

        const elemento =
            document.getElementById(id);


        if (!elemento) {

            return;

        }


        elemento.textContent = valor;

    }


    /*==============================================================
        VERIFICAR SI EXISTEN DATOS
    ==============================================================*/

    async tieneDatos() {

        const semanas =
            await this.semanaService.obtenerTodas();


        return semanas.length > 0;

    }


    /*==============================================================
        OBTENER ÚLTIMA SEMANA
    ==============================================================*/

    async obtenerUltimaSemana() {

        return await this.semanaService.ultimaSemana();

    }

}