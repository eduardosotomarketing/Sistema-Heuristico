/***********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 * Archivo: js/pruebas.js
 *
 * Entorno de pruebas para la consola del navegador.
 *
 * OBJETIVO:
 * - Evitar depender de variables temporales de la consola.
 * - Cargar automáticamente historial.
 * - Crear automáticamente los motores.
 * - Facilitar pruebas repetibles después de recargar la página.
 *
 * Este archivo NO modifica datos de Firestore.
 ***********************************************************************/


/*==============================================================
    IMPORTACIONES
==============================================================*/

import HistorialService
    from "./services/HistorialService.js";

import EstadisticasService
    from "./services/EstadisticasService.js";

import BaseMotor
    from "./motores/BaseMotor.js";

import MotorFrecuencia
    from "./motores/MotorFrecuencia.js";


/*==============================================================
    ENTORNO DE PRUEBAS
==============================================================*/

class EntornoPruebas {


    constructor() {

        this.historialService = null;

        this.estadisticasService = null;

        this.baseMotor = null;

        this.motorFrecuencia = null;

        this.datos = [];

        this.resultadoEstadisticas = null;

        this.inicializado = false;

    }


    /*==========================================================
        INICIALIZAR
    ==========================================================*/

    async inicializar() {

        console.log(
            "========================================"
        );

        console.log(
            "INICIALIZANDO ENTORNO DE PRUEBAS"
        );

        console.log(
            "========================================"
        );


        /*------------------------------------------------------
            HISTORIAL
        ------------------------------------------------------*/

        this.historialService =
            new HistorialService();


        this.datos =
            await this.historialService
                .obtenerHistorial();


        console.log(
            "Historial cargado:",
            this.datos.length,
            "semana(s)"
        );


        /*------------------------------------------------------
            ESTADÍSTICAS
        ------------------------------------------------------*/

        this.estadisticasService =
            new EstadisticasService();


        this.resultadoEstadisticas =
            await this.estadisticasService
                .calcular();


        console.log(
            "Estadísticas calculadas correctamente."
        );


        /*------------------------------------------------------
            BASE MOTOR
        ------------------------------------------------------*/

        this.baseMotor =
            new BaseMotor(
                "Motor de Prueba"
            );


        this.baseMotor.inicializar({

            historial:
                this.datos,

            estadisticas:
                this.resultadoEstadisticas

        });


        console.log(
            "BaseMotor inicializado."
        );


        /*------------------------------------------------------
            MOTOR FRECUENCIA
        ------------------------------------------------------*/

        this.motorFrecuencia =
            new MotorFrecuencia();


        this.motorFrecuencia.inicializar({

            historial:
                this.datos,

            estadisticas:
                this.resultadoEstadisticas

        });


        console.log(
            "MotorFrecuencia inicializado."
        );


        this.inicializado = true;


        console.log(
            "========================================"
        );

        console.log(
            "ENTORNO DE PRUEBAS LISTO"
        );

        console.log(
            "========================================"
        );


        return this;

    }


    /*==========================================================
        INFORMACIÓN
    ==========================================================*/

    informacion() {

        return {

            inicializado:
                this.inicializado,

            semanas:
                this.datos.length,

            numerosAnalizados:
                this.datos.reduce(

                    (
                        total,
                        semana
                    ) =>

                        total +
                        (
                            Array.isArray(
                                semana.numeros
                            )
                                ? semana.numeros.length
                                : 0
                        ),

                    0

                ),

            baseMotor:
                this.baseMotor
                    ? this.baseMotor
                        .obtenerInformacion()
                    : null,

            motorFrecuencia:
                this.motorFrecuencia
                    ? this.motorFrecuencia
                        .obtenerInformacion()
                    : null

        };

    }


    /*==========================================================
        OBTENER HISTORIAL
    ==========================================================*/

    historial() {

        return this.datos;

    }


    /*==========================================================
        OBTENER ESTADÍSTICAS
    ==========================================================*/

    estadisticas() {

        return this.resultadoEstadisticas;

    }


    /*==========================================================
        PROBAR FRECUENCIA
    ==========================================================*/

    frecuencia(numero) {

        if (!this.inicializado) {

            throw new Error(
                "El entorno de pruebas no está inicializado."
            );

        }


        return this.motorFrecuencia.calcular(

            Number(numero),

            {

                historial:
                    this.datos,

                estadisticas:
                    this.resultadoEstadisticas

            }

        );

    }


    /*==========================================================
        PROBAR TODOS LOS NÚMEROS
    ==========================================================*/

    frecuenciaTodos() {

        if (!this.inicializado) {

            throw new Error(
                "El entorno de pruebas no está inicializado."
            );

        }


        const resultados = [];


        for (
            let numero = 0;
            numero <= 99;
            numero++
        ) {

            resultados.push(

                this.frecuencia(
                    numero
                )

            );

        }


        return resultados;

    }


    /*==========================================================
        TABLA DE FRECUENCIA
    ==========================================================*/

    tablaFrecuencia() {

        const resultados =
            this.frecuenciaTodos();


        return resultados.map(

            resultado => ({

                numero:
                    resultado.numero,

                texto:
                    String(
                        resultado.numero
                    ).padStart(
                        2,
                        "0"
                    ),

                frecuencia:
                    resultado.detalle
                        .frecuenciaHistorica,

                porcentaje:
                    resultado.detalle
                        .porcentajeHistorico,

                frecuencia3:
                    resultado.detalle
                        .frecuencia3
                        .apariciones,

                frecuencia5:
                    resultado.detalle
                        .frecuencia5
                        .apariciones,

                frecuencia10:
                    resultado.detalle
                        .frecuencia10
                        .apariciones,

                frecuencia20:
                    resultado.detalle
                        .frecuencia20
                        .apariciones,

                tendencia:
                    resultado.detalle
                        .tendencia
                        .direccion,

                score:
                    resultado.score,

                confianza:
                    resultado.confianza

            })

        );

    }

}


/*==============================================================
    CREAR ENTORNO GLOBAL
==============================================================*/

window.entornoPruebas =
    new EntornoPruebas();


/*==============================================================
    INICIALIZAR AUTOMÁTICAMENTE
==============================================================*/

window.entornoPruebas.inicializar()
    .catch(

        error => {

            console.error(
                "Error inicializando entorno de pruebas:",
                error
            );

        }

    );
    