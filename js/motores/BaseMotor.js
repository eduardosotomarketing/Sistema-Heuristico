/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * js/motores/BaseMotor.js
 *
 * Propósito:
 * Clase base para todos los motores heurísticos.
 *
 * Todos los motores deberán:
 *
 *   1. Recibir un número.
 *   2. Recibir un contexto.
 *   3. Calcular un score entre 0 y 100.
 *   4. Calcular una confianza entre 0 y 100.
 *   5. Devolver un resultado explicable.
 *
 **********************************************************************/

export default class BaseMotor {

    constructor(nombre, version = "1.0.0") {

        this.nombre = nombre;

        this.version = version;

        this.activo = true;

    }


    /*==============================================================
        MÉTODO PRINCIPAL
    ==============================================================*/

    calcular(numero, contexto) {

        throw new Error(

            `El motor "${this.nombre}" debe implementar el método calcular().`

        );

    }


    /*==============================================================
        VALIDAR NÚMERO
    ==============================================================*/

    validarNumero(numero) {

        if (numero === null || numero === undefined) {

            throw new Error(

                "El número es obligatorio."

            );

        }

        const valor = Number(numero);

        if (!Number.isInteger(valor)) {

            throw new Error(

                "El número debe ser un entero."

            );

        }

        if (valor < 0 || valor > 99) {

            throw new Error(

                "El número debe estar entre 00 y 99."

            );

        }

        return valor;

    }


    /*==============================================================
        VALIDAR CONTEXTO
    ==============================================================*/

    validarContexto(contexto) {

        if (!contexto || typeof contexto !== "object") {

            throw new Error(

                `El motor "${this.nombre}" recibió un contexto inválido.`

            );

        }

        return true;

    }


    /*==============================================================
        NORMALIZAR SCORE
    ==============================================================*/

    normalizarScore(valor) {

        const numero = Number(valor);

        if (!Number.isFinite(numero)) {

            return 0;

        }

        return Math.max(

            0,

            Math.min(

                100,

                numero

            )

        );

    }


    /*==============================================================
        NORMALIZAR CONFIANZA
    ==============================================================*/

    normalizarConfianza(valor) {

        const numero = Number(valor);

        if (!Number.isFinite(numero)) {

            return 0;

        }

        return Math.max(

            0,

            Math.min(

                100,

                numero

            )

        );

    }


    /*==============================================================
        DETERMINAR NIVEL DE EVIDENCIA
    ==============================================================*/

    determinarEvidencia(confianza) {

        const valor = this.normalizarConfianza(confianza);

        if (valor >= 80) {

            return "ALTA";

        }

        if (valor >= 50) {

            return "MEDIA";

        }

        return "BAJA";

    }


    /*==============================================================
        REDONDEAR
    ==============================================================*/

    redondear(valor, decimales = 2) {

        const numero = Number(valor);

        if (!Number.isFinite(numero)) {

            return 0;

        }

        const factor = Math.pow(

            10,

            decimales

        );

        return Math.round(

            numero * factor

        ) / factor;

    }


    /*==============================================================
        FORMATEAR NÚMERO
    ==============================================================*/

    formatearNumero(numero) {

        return String(

            this.validarNumero(numero)

        ).padStart(

            2,

            "0"

        );

    }


    /*==============================================================
        CREAR RESULTADO ESTÁNDAR
    ==============================================================*/

    crearResultado({

        numero,

        score = 0,

        confianza = 0,

        peso = 0,

        detalle = {},

        indicadores = {}

    }) {

        const numeroValidado =

            this.validarNumero(numero);


        const scoreNormalizado =

            this.normalizarScore(score);


        const confianzaNormalizada =

            this.normalizarConfianza(confianza);


        return {

            numero: numeroValidado,

            numeroTexto:

                this.formatearNumero(

                    numeroValidado

                ),

            motor: this.nombre,

            version: this.version,

            activo: this.activo,

            score:

                this.redondear(

                    scoreNormalizado

                ),

            confianza:

                this.redondear(

                    confianzaNormalizada

                ),

            evidencia:

                this.determinarEvidencia(

                    confianzaNormalizada

                ),

            peso:

                this.redondear(

                    Number(peso) || 0

                ),

            detalle,

            indicadores,

            fechaCalculo:

                new Date().toISOString()

        };

    }


    /*==============================================================
        ACTIVAR MOTOR
    ==============================================================*/

    activar() {

        this.activo = true;

    }


    /*==============================================================
        DESACTIVAR MOTOR
    ==============================================================*/

    desactivar() {

        this.activo = false;

    }


    /*==============================================================
        ESTADO
    ==============================================================*/

    estaActivo() {

        return this.activo;

    }


    /*==============================================================
        INFORMACIÓN DEL MOTOR
    ==============================================================*/

    obtenerInformacion() {

        return {

            nombre: this.nombre,

            version: this.version,

            activo: this.activo

        };

    }

}