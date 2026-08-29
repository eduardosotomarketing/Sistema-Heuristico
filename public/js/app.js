/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 * Archivo: js/app.js
 * Versión integración UI: 1.2.0
 *
 * Punto de entrada general de la aplicación.
 *
 * RESPONSABILIDADES:
 * - Inicialización general
 * - Identificación de la página actual
 * - Dashboard
 * - Panel de Ciclo Operativo
 * - Control Operativo de Resultados
 * - Control de errores generales
 *
 * IMPORTANTE:
 * - No usa Firebase Authentication.
 * - El Panel de Ciclo Operativo y el Control de Resultados
 *   se cargan solamente en index.html.
 * - pruebas.js se importa dinámicamente solamente cuando
 *   el Dashboard necesita el entorno operativo consolidado.
 * - El Control Operativo de Resultados v1.0.0 es SOLO LECTURA
 *   respecto de Firestore: valida y previsualiza, pero no procesa.
 **********************************************************************/


/* ================================================================
   CONFIGURACIÓN
================================================================ */

import {
    CONFIG
} from "./config.js";


/* ================================================================
   COMPONENTES UI
================================================================ */

import CicloOperativoPanel
    from "./ui/CicloOperativoPanel.js";


import ControlOperativoResultados
    from "./ui/ControlOperativoResultados.js";


/* ================================================================
   APP
================================================================ */

class App {

    constructor() {

        this.nombre =
            CONFIG.APP_NAME;

        this.version =
            CONFIG.VERSION;

        this.pagina =
            this.obtenerPaginaActual();


        /*
         * Estado de componentes.
         */

        this.panelCiclo =
            null;

        this.controlResultados =
            null;

        this.entornoOperativo =
            null;

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
             * Inicialización general.
             */

            this.inicializarAplicacion();


            /*
             * Inicialización específica
             * según página.
             */

            await this.inicializarPagina();


            /*
             * Exponemos la instancia solamente
             * para diagnóstico manual desde consola.
             */

            window.appHeuristica =
                this;


            console.log(
                "Estado general App:",
                this.mostrarEstado()
            );

        }

        catch (
            error
        ) {

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
         * Actualmente no usamos autenticación.
         *
         * Firebase se inicializa cuando los servicios
         * que lo necesitan importan firebase.js.
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


        let archivo =
            ruta
                .split("/")
                .pop();


        /*
         * Si el Hosting sirve la raíz sin nombre
         * de archivo, asumimos index.html.
         */

        if (
            !archivo ||
            archivo === ""
        ) {

            archivo =
                "index.html";

        }


        return archivo
            .toLowerCase();

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

                /*
                 * ORDEN IMPORTANTE:
                 *
                 * 1. Dashboard visual básico.
                 * 2. Panel de Ciclo Operativo.
                 * 3. Control Operativo de Resultados.
                 *
                 * Los dos componentes operativos reutilizan
                 * la misma instancia de entornoPruebas.
                 */

                await this.inicializarDashboard();

                await this.inicializarPanelCicloOperativo();

                await this.inicializarControlResultados();

                break;


            /* ----------------------------------------------------
               SEMANAS
            ---------------------------------------------------- */

            case "semanas.html":

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
             * Importación dinámica:
             * evita cargar DashboardService en páginas
             * donde no se utiliza.
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
             * Carga de tarjetas.
             */

            if (
                typeof dashboard
                    .cargarDashboard ===
                "function"
            ) {

                await dashboard
                    .cargarDashboard();

            }


            /*
             * Resumen diagnóstico.
             */

            if (
                typeof dashboard
                    .obtenerResumen ===
                "function"
            ) {

                const resumen =
                    await dashboard
                        .obtenerResumen();


                console.table(
                    resumen
                );

            }

        }

        catch (
            error
        ) {

            console.error(
                "Error cargando Dashboard:",
                error
            );


            /*
             * No detenemos toda la aplicación
             * porque falle solamente el resumen.
             */

        }

    }


    /* ============================================================
       OBTENER / REUTILIZAR ENTORNO OPERATIVO
    ============================================================ */

    async obtenerEntornoOperativo() {

        /*
         * 1. Si ya fue resuelto, reutilizamos
         *    exactamente la misma instancia.
         */

        if (
            this.entornoOperativo
        ) {

            return this
                .entornoOperativo;

        }


        /*
         * 2. Intentamos obtener el global
         *    si pruebas.js ya fue cargado.
         */

        let entorno =
            window.entornoPruebas ??
            globalThis.entornoPruebas ??
            null;


        /*
         * 3. Si todavía no existe,
         *    cargamos pruebas.js.
         */

        if (
            !entorno
        ) {

            try {

                const moduloPruebas =
                    await import(
                        "./pruebas.js"
                    );


                /*
                 * Soportamos:
                 *
                 * export const entornoPruebas
                 * export default entornoPruebas
                 * o exposición global.
                 */

                entorno =
                    moduloPruebas
                        .entornoPruebas ??
                    moduloPruebas
                        .default ??
                    window
                        .entornoPruebas ??
                    globalThis
                        .entornoPruebas ??
                    null;

            }

            catch (
                error
            ) {

                console.error(
                    "No se pudo importar js/pruebas.js:",
                    error
                );


                throw new Error(
                    "No fue posible cargar el entorno operativo."
                );

            }

        }


        /*
         * 4. Validación final.
         */

        if (
            !entorno
        ) {

            throw new Error(
                "pruebas.js fue cargado, pero entornoPruebas no está disponible."
            );

        }


        /*
         * Guardamos la referencia para que
         * Panel y Control de Resultados compartan
         * exactamente el mismo entorno.
         */

        this.entornoOperativo =
            entorno;


        return entorno;

    }


    /* ============================================================
       PANEL DE CICLO OPERATIVO
    ============================================================ */

    async inicializarPanelCicloOperativo() {

        const contenedor =
            document.querySelector(
                "#panel-ciclo-operativo"
            );


        /*
         * No hacemos nada si esta página
         * no contiene el panel.
         */

        if (
            !contenedor
        ) {

            console.log(
                "Panel de Ciclo Operativo: contenedor no presente."
            );

            return null;

        }


        try {

            contenedor.innerHTML = `
                <div class="ciclo-panel">
                    <div class="ciclo-panel__cargando">
                        Cargando estado operativo…
                    </div>
                </div>
            `;


            const entorno =
                await this
                    .obtenerEntornoOperativo();


            /*
             * IMPORTANTE:
             *
             * No ejecutamos recargarBaseHeuristica()
             * automáticamente.
             *
             * El panel debe observar el estado existente,
             * no mutarlo.
             */

            const panel =
                new CicloOperativoPanel({

                    entorno,

                    selector:
                        "#panel-ciclo-operativo"

                });


            await panel
                .inicializar();


            this.panelCiclo =
                panel;


            /*
             * Exposición para diagnóstico:
             *
             * await panelCiclo.actualizar();
             */

            window.panelCiclo =
                panel;


            console.log(
                "Panel de Ciclo Operativo inicializado.",
                panel.estado
            );


            return panel;

        }

        catch (
            error
        ) {

            console.error(
                "Error cargando Panel de Ciclo Operativo:",
                error
            );


            /*
             * No propagamos el error:
             * el Dashboard y el resto de la app
             * deben continuar utilizables.
             */

            contenedor.innerHTML = `
                <div class="ciclo-panel">

                    <div class="ciclo-panel__error">

                        <strong>
                            No se pudo cargar el Panel de Ciclo Operativo.
                        </strong>

                        <div>
                            ${
                                this.escapeHTML(
                                    error?.message ||
                                    "Error desconocido."
                                )
                            }
                        </div>

                    </div>

                </div>
            `;


            return null;

        }

    }


    /* ============================================================
       CONTROL OPERATIVO DE RESULTADOS
    ============================================================ */

    async inicializarControlResultados() {

        const contenedor =
            document.querySelector(
                "#control-operativo-resultados"
            );


        /*
         * El componente se activa solamente
         * si index.html contiene su contenedor.
         */

        if (
            !contenedor
        ) {

            console.log(
                "Control de Resultados: contenedor no presente."
            );

            return null;

        }


        try {

            /*
             * Reutilizamos el mismo entorno
             * que ya utiliza el Panel de Ciclo.
             */

            const entorno =
                await this
                    .obtenerEntornoOperativo();


            const control =
                new ControlOperativoResultados({

                    entorno,

                    selector:
                        "#control-operativo-resultados",

                    panelCiclo:
                        this.panelCiclo

                });


            await control
                .inicializar();


            this.controlResultados =
                control;


            /*
             * Expuesto solamente para diagnóstico.
             *
             * Ejemplos:
             *
             * controlResultados.estado
             * controlResultados.validacion
             * await controlResultados.actualizarContexto()
             */

            window.controlResultados =
                control;


            console.log(
                "Control Operativo de Resultados inicializado.",
                control.estado
            );


            return control;

        }

        catch (
            error
        ) {

            console.error(
                "Error cargando Control Operativo de Resultados:",
                error
            );


            /*
             * Tampoco detenemos toda la aplicación
             * si este componente falla.
             */

            contenedor.innerHTML = `
                <div class="resultado-operativo">

                    <div class="resultado-operativo__error">

                        <strong>
                            No se pudo cargar el Control Operativo de Resultados.
                        </strong>

                        <div>
                            ${
                                this.escapeHTML(
                                    error?.message ||
                                    "Error desconocido."
                                )
                            }
                        </div>

                    </div>

                </div>
            `;


            return null;

        }

    }


    /* ============================================================
       UTILIDAD HTML
    ============================================================ */

    escapeHTML(
        valor
    ) {

        return String(
            valor ??
            ""
        )
            .replaceAll(
                "&",
                "&amp;"
            )
            .replaceAll(
                "<",
                "&lt;"
            )
            .replaceAll(
                ">",
                "&gt;"
            )
            .replaceAll(
                '"',
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );

    }


    /* ============================================================
       MOSTRAR ESTADO GENERAL
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
                false,

            entornoOperativo:
                !!this.entornoOperativo,

            panelCicloActivo:
                !!this.panelCiclo,

            controlResultadosActivo:
                !!this.controlResultados,

            modoControlResultados:
                this.controlResultados
                    ? "VALIDACION_SIN_ESCRITURA"
                    : null

        };

    }


    /* ============================================================
       ERROR GENERAL
    ============================================================ */

    mostrarError(
        error
    ) {

        const mensaje =
            error?.message ||
            "Ocurrió un error inesperado.";


        console.error(
            mensaje
        );


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


        await app
            .iniciar();

    }

);
