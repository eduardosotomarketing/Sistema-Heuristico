/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 * Archivo: app.js
 *
 * Punto de entrada principal de la aplicación.
 **********************************************************************/

import DashboardService from "./services/DashboardService.js";

class App {

    constructor() {

        this.dashboard = new DashboardService();

    }

    /*==============================================================
        INICIALIZAR
    ==============================================================*/

    async iniciar() {

        try {

            console.clear();

            console.log("========================================");
            console.log("SISTEMA HEURÍSTICO EVOLUTIVO");
            console.log("Versión 1.0.0");
            console.log("========================================");

            await this.dashboard.cargarDashboard();

            await this.mostrarEstado();

        }

        catch (error) {

            console.error(error);

            this.mostrarError(error);

        }

    }

    /*==============================================================
        ESTADO DEL SISTEMA
    ==============================================================*/

    async mostrarEstado() {

        const resumen = await this.dashboard.obtenerResumen();

        console.table(resumen);

    }

    /*==============================================================
        ERROR
    ==============================================================*/

    mostrarError(error) {

        alert(

            "Ocurrió un error.\n\n" +

            error.message

        );

    }

}

/*==============================================================
    INICIAR CUANDO EL DOM ESTÉ LISTO
==============================================================*/

document.addEventListener(

    "DOMContentLoaded",

    async () => {

        const app = new App();

        await app.iniciar();

    }

);