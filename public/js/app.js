
/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 * Archivo: js/app.js
 *
 * Punto de entrada general de la aplicación.
 *
 * RESPONSABILIDADES:
 * - Inicialización general
 * - Identificación de la página actual
 * - Información básica del sistema
 * - Control de errores generales
 *
 * IMPORTANTE:
 * La lógica específica de cada módulo se mantiene separada.
 *
 * Ejemplo:
 *
 * semanas.html
 *      ↓
 * semanas.js
 *      ↓
 * SemanaService
 *
 * index.html
 *      ↓
 * app.js
 *      ↓
 * DashboardService
 **********************************************************************/


/* ================================================================
   CONFIGURACIÓN
================================================================ */

import {
    CONFIG
} from "./config.js";


/* ================================================================
   VARIABLES
================================================================ */

class App {

    constructor() {

        this.nombre =
            CONFIG.APP_NAME;

        this.version =
            CONFIG.VERSION;

        this.pagina =
            this.obtenerPaginaActual();

    }


    /* ============================================================
       INICIALIZAR
    ============================================================ */

    async iniciar() {

        try {

            console.log(
                "========================================"
            );

            console.log(
                this.nombre
            );

            console.log(
                `Versión ${this.version}`
            );

            console.log(
                `Página: ${this.pagina}`
            );

            console.log(
                "========================================"
            );


            /*
             * Inicialización común
             */

            this.inicializarAplicacion();


            /*
             * Inicialización específica
             * según la página.
             */

            await this.inicializarPagina();


        }

        catch (error) {

            console.error(
                "Error inicializando la aplicación:",
                error
            );

            this.mostrarError(
                error
            );

        }

    }


    /* ============================================================
       INICIALIZACIÓN GENERAL
    ============================================================ */

    inicializarAplicacion() {

        /*
         * Actualmente no necesitamos
         * autenticación.
         *
         * Firebase ya se inicializa
         * cuando los servicios que lo
         * necesitan importan firebase.js.
         */


        console.log(
            "Aplicación inicializada correctamente."
        );

    }


    /* ============================================================
       DETECTAR PÁGINA
    ============================================================ */

    obtenerPaginaActual() {

        const ruta =
            window.location.pathname;


        /*
         * Obtener solamente
         * el nombre del archivo.
         */

        let archivo =
            ruta.split("/").pop();


        /*
         * Si no hay archivo,
         * asumimos index.html.
         */

        if (
            !archivo ||
            archivo === ""
        ) {

            archivo =
                "index.html";

        }


        return archivo.toLowerCase();

    }


    /* ============================================================
       INICIALIZAR PÁGINA
    ============================================================ */

    async inicializarPagina() {

        switch (
            this.pagina
        ) {


            /* ----------------------------------------------------
               DASHBOARD
            ---------------------------------------------------- */

            case "index.html":

                await this.inicializarDashboard();

                break;


            /* ----------------------------------------------------
               SEMANAS
            ---------------------------------------------------- */

            case "semanas.html":

                /*
                 * La página de semanas
                 * tiene su propio controlador:
                 *
                 * js/semanas.js
                 *
                 * No cargamos DashboardService.
                 */

                console.log(
                    "Módulo Semanas activo."
                );

                break;


            /* ----------------------------------------------------
               HISTORIAL
            ---------------------------------------------------- */

            case "historial.html":

                console.log(
                    "Módulo Historial."
                );

                break;


            /* ----------------------------------------------------
               ESTADÍSTICAS
            ---------------------------------------------------- */

            case "estadisticas.html":

                console.log(
                    "Módulo Estadísticas."
                );

                break;


            /* ----------------------------------------------------
               RANKING
            ---------------------------------------------------- */

            case "ranking.html":

                console.log(
                    "Módulo Ranking."
                );

                break;


            /* ----------------------------------------------------
               PÁGINA DESCONOCIDA
            ---------------------------------------------------- */

            default:

                console.log(
                    "Página sin módulo específico."
                );

                break;

        }

    }


    /* ============================================================
       DASHBOARD
    ============================================================ */

    async inicializarDashboard() {

        try {

            /*
             * Importación dinámica.
             *
             * Esto evita cargar DashboardService
             * innecesariamente en otras páginas.
             */

            const modulo =
                await import(
                    "./services/DashboardService.js"
                );


            const DashboardService =
                modulo.default;


            const dashboard =
                new DashboardService();


            /*
             * Verificamos si el servicio
             * dispone de los métodos esperados.
             */

            if (
                typeof dashboard.cargarDashboard ===
                "function"
            ) {

                await dashboard.cargarDashboard();

            }


            if (
                typeof dashboard.obtenerResumen ===
                "function"
            ) {

                const resumen =
                    await dashboard.obtenerResumen();


                console.table(
                    resumen
                );

            }

        }

        catch (error) {

            console.error(
                "Error cargando Dashboard:",
                error
            );

            /*
             * No detenemos completamente
             * la aplicación si falla
             * solamente el Dashboard.
             */

        }

    }


    /* ============================================================
       MOSTRAR INFORMACIÓN
    ============================================================ */

    mostrarEstado() {

        return {

            aplicacion:
                this.nombre,

            version:
                this.version,

            pagina:
                this.pagina,

            firebaseAuthentication:
                false

        };

    }


    /* ============================================================
       ERROR
    ============================================================ */

    mostrarError(error) {

        const mensaje =
            error?.message ||
            "Ocurrió un error inesperado.";


        console.error(
            mensaje
        );


        /*
         * Mostrar alerta solamente
         * si estamos en navegador.
         */

        if (
            typeof window !==
            "undefined"
        ) {

            alert(

                `${this.nombre}\n\n` +
                `${mensaje}`

            );

        }

    }

}


/* ================================================================
   INICIAR APLICACIÓN
================================================================ */

document.addEventListener(

    "DOMContentLoaded",

    async () => {

        const app =
            new App();


        await app.iniciar();

    }

);


/* ================================================================
   EXPORTAR
================================================================ */

export default App;