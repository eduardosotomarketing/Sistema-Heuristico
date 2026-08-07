/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 * Archivo: models/Semana.js
 * ----------------------------------------------------------
 * Modelo de una semana de sorteo
 *********************************************************************/

import { CONFIG } from "../config.js";

export default class Semana {

    constructor(
        semana,
        fecha,
        numeros = []
    ) {

        this.id = CONFIG.ID_PREFIX +
            String(semana).padStart(CONFIG.ID_DIGITOS, "0");

        this.semana = Number(semana);

        this.fecha = fecha;

        this.numeros = [...numeros];

        this.cantidad = numeros.length;

        this.creado = new Date().toISOString();

        this.modificado = new Date().toISOString();

    }

    /*==========================================================
        VALIDACIONES
    ==========================================================*/

    validarSemana() {

        if (!Number.isInteger(this.semana)) {

            throw new Error("Número de semana inválido.");

        }

        if (this.semana <= 0) {

            throw new Error("La semana debe ser mayor que cero.");

        }

    }

    validarFecha() {

        if (!this.fecha) {

            throw new Error("Debe indicar una fecha.");

        }

    }

    validarCantidad() {

        if (this.numeros.length !== CONFIG.NUMEROS_POR_SEMANA) {

            throw new Error(

                `Debe ingresar exactamente ${CONFIG.NUMEROS_POR_SEMANA} números.`

            );

        }

    }

    validarRango() {

        this.numeros.forEach(numero => {

            if (
                numero < CONFIG.MIN_NUMERO ||
                numero > CONFIG.MAX_NUMERO
            ) {

                throw new Error(

                    `Número fuera de rango: ${numero}`

                );

            }

        });

    }

    validarDuplicados() {

        const conjunto = new Set(this.numeros);

        if (conjunto.size !== this.numeros.length) {

            throw new Error("Existen números repetidos.");

        }

    }

    validar() {

        this.validarSemana();

        this.validarFecha();

        this.validarCantidad();

        this.validarRango();

        this.validarDuplicados();

        return true;

    }

    /*==========================================================
        INFORMACIÓN
    ==========================================================*/

    obtenerCantidad() {

        return this.numeros.length;

    }

    contiene(numero) {

        return this.numeros.includes(numero);

    }

    obtenerNumero(posicion) {

        return this.numeros[posicion];

    }

    obtenerMayor() {

        return Math.max(...this.numeros);

    }

    obtenerMenor() {

        return Math.min(...this.numeros);

    }

    obtenerSuma() {

        return this.numeros.reduce(

            (total, numero) => total + numero,

            0

        );

    }

    obtenerPromedio() {

        return this.obtenerSuma() / this.numeros.length;

    }

    obtenerPares() {

        return this.numeros.filter(

            numero => numero % 2 === 0

        );

    }

    obtenerImpares() {

        return this.numeros.filter(

            numero => numero % 2 !== 0

        );

    }

    obtenerBajos() {

        return this.numeros.filter(

            numero => numero <= 33

        );

    }

    obtenerMedios() {

        return this.numeros.filter(

            numero => numero >= 34 && numero <= 66

        );

    }

    obtenerAltos() {

        return this.numeros.filter(

            numero => numero >= 67

        );

    }

    /*==========================================================
        ACTUALIZAR
    ==========================================================*/

    actualizarFecha(fecha) {

        this.fecha = fecha;

        this.actualizarModificacion();

    }

    actualizarNumeros(numeros) {

        this.numeros = [...numeros];

        this.cantidad = numeros.length;

        this.actualizarModificacion();

    }

    actualizarModificacion() {

        this.modificado = new Date().toISOString();

    }

    /*==========================================================
        EXPORTAR JSON
    ==========================================================*/

    toJSON() {

        return {

            id: this.id,

            semana: this.semana,

            fecha: this.fecha,

            cantidad: this.cantidad,

            numeros: this.numeros,

            creado: this.creado,

            modificado: this.modificado

        };

    }

    /*==========================================================
        IMPORTAR JSON
    ==========================================================*/

    static fromJSON(json) {

        const semana = new Semana(

            json.semana,

            json.fecha,

            json.numeros

        );

        semana.id = json.id;

        semana.cantidad = json.cantidad;

        semana.creado = json.creado;

        semana.modificado = json.modificado;

        return semana;

    }

}