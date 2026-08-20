/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 * Archivo: js/motores/BaseMotor.js
 *
 * Clase base de todos los motores heurísticos.
 *
 * RESPONSABILIDADES:
 *
 * - Recibir historial y estadísticas
 * - Mantener configuración común
 * - Normalizar valores
 * - Limitar puntuaciones
 * - Crear resultados uniformes
 * - Proporcionar información del motor
 *
 * IMPORTANTE:
 *
 * BaseMotor NO consulta Firebase.
 *
 * Los datos deben ser proporcionados por MotorManager
 * o por la capa superior del sistema.
 **********************************************************************/

import { CONFIG } from "../config.js";


export default class BaseMotor {


    /*==============================================================
        CONSTRUCTOR
    ==============================================================*/

    constructor(nombre = "Motor") {

        this.nombre = nombre;

        this.version = CONFIG.VERSION;

        this.historial = [];

        this.estadisticas = [];

        this.configuracion = {};

        this.inicializado = false;

        this.ultimaEjecucion = null;

    }


    /*==============================================================
        INICIALIZAR
    ==============================================================*/

    inicializar(datos = {}) {

        this.historial =
            Array.isArray(datos.historial)
                ? datos.historial
                : [];


        this.estadisticas =
            Array.isArray(datos.estadisticas)
                ? datos.estadisticas
                : [];


        this.configuracion =
            datos.configuracion || {};


        this.inicializado = true;

        return this;

    }


    /*==============================================================
        EJECUTAR
    ==============================================================*/

    ejecutar() {

        throw new Error(

            `${this.nombre}: ` +
            "el método ejecutar() debe ser implementado."

        );

    }


    /*==============================================================
        INFORMACIÓN DEL MOTOR
    ==============================================================*/

    obtenerInformacion() {

        return {

            nombre: this.nombre,

            version: this.version,

            inicializado: this.inicializado,

            historial:
                this.historial.length,

            estadisticas:
                this.estadisticas.length,

            ultimaEjecucion:
                this.ultimaEjecucion

        };

    }


    /*==============================================================
        REGISTRAR EJECUCIÓN
    ==============================================================*/

    registrarEjecucion() {

        this.ultimaEjecucion =
            new Date().toISOString();

    }


    /*==============================================================
        NORMALIZAR NÚMERO
    ==============================================================*/

    normalizarNumero(numero) {

        const valor =
            Number(numero);


        if (!Number.isFinite(valor)) {

            return null;

        }


        return Math.trunc(valor);

    }


    /*==============================================================
        TEXTO DEL NÚMERO
    ==============================================================*/

    textoNumero(numero) {

        const valor =
            this.normalizarNumero(numero);


        if (valor === null) {

            return null;

        }


        return String(valor).padStart(2, "0");

    }


    /*==============================================================
        LIMITAR VALOR
    ==============================================================*/

    limitar(
        valor,
        minimo = 0,
        maximo = 100
    ) {

        const numero =
            Number(valor);


        if (!Number.isFinite(numero)) {

            return minimo;

        }


        return Math.min(

            maximo,

            Math.max(
                minimo,
                numero
            )

        );

    }


    /*==============================================================
        NORMALIZAR PORCENTAJE
    ==============================================================*/

    porcentaje(valor) {

        return this.limitar(

            Number(valor),

            0,

            100

        );

    }


    /*==============================================================
        REDONDEAR
    ==============================================================*/

    redondear(
        valor,
        decimales = 2
    ) {

        const numero =
            Number(valor);


        if (!Number.isFinite(numero)) {

            return 0;

        }


        const factor =
            Math.pow(
                10,
                decimales
            );


        return Math.round(

            numero * factor

        ) / factor;

    }


    /*==============================================================
        PROMEDIO
    ==============================================================*/

    promedio(lista = []) {

    if (
        !Array.isArray(lista) ||
        lista.length === 0
    ) {

        return 0;

    }


    const valores =
        lista

            .map(Number)

            .filter(
                valor =>
                    Number.isFinite(valor)
            );


    if (valores.length === 0) {

        return 0;

    }


    const suma =
        valores.reduce(

            (total, valor) =>
                total + valor,

            0

        );


    return suma / valores.length;

}

/*========================================================
    MAYOR
========================================================*/

mayor(lista = []) {

    if (
        !Array.isArray(lista) ||
        lista.length === 0
    ) {

        return null;

    }

    const valores =
        lista

            .map(Number)

            .filter(
                valor =>
                    Number.isFinite(valor)
            );


    if (valores.length === 0) {

        return null;

    }


    return Math.max(...valores);

}


/*========================================================
    MENOR
========================================================*/

menor(lista = []) {

    if (
        !Array.isArray(lista) ||
        lista.length === 0
    ) {

        return null;

    }


    const valores =
        lista

            .map(Number)

            .filter(
                valor =>
                    Number.isFinite(valor)
            );


    if (valores.length === 0) {

        return null;

    }


    return Math.min(...valores);

}


    /*==============================================================
        SUMA
    ==============================================================*/

    suma(lista = []) {

        if (!Array.isArray(lista)) {

            return 0;

        }


        return lista.reduce(

            (total, valor) => {

                const numero =
                    Number(valor);


                if (
                    !Number.isFinite(numero)
                ) {

                    return total;

                }


                return total + numero;

            },

            0

        );

    }


    /*==============================================================
        CONTAR APARICIONES
    ==============================================================*/

    contarNumero(
        numero,
        semanas = this.historial
    ) {

        const objetivo =
            this.normalizarNumero(
                numero
            );


        if (objetivo === null) {

            return 0;

        }


        if (!Array.isArray(semanas)) {

            return 0;

        }


        let contador = 0;


        semanas.forEach(semana => {

            if (
                !semana ||
                !Array.isArray(
                    semana.numeros
                )
            ) {

                return;

            }


            if (
                semana.numeros.includes(
                    objetivo
                )
            ) {

                contador++;

            }

        });


        return contador;

    }


    /*==============================================================
        OBTENER ESTADÍSTICA DE UN NÚMERO
    ==============================================================*/

    obtenerEstadistica(numero) {

        const objetivo =
            this.normalizarNumero(
                numero
            );


        if (objetivo === null) {

            return null;

        }


        return this.estadisticas.find(

            item =>
                Number(item.numero) === objetivo

        ) || null;

    }


    /*==============================================================
        CREAR RESULTADO BÁSICO
    ==============================================================*/

    crearResultado(
        numero,
        score = 0,
        datos = {}
    ) {

        const valor =
            this.normalizarNumero(
                numero
            );


        return {

            numero: valor,

            texto:
                this.textoNumero(
                    valor
                ),

            score:
                this.redondear(
                    score
                ),

            motor:
                this.nombre,

            ...datos

        };

    }


    /*==============================================================
        ORDENAR RESULTADOS
    ==============================================================*/

    ordenarResultados(
        resultados = [],
        campo = "score"
    ) {

        if (
            !Array.isArray(
                resultados
            )
        ) {

            return [];

        }


        return [...resultados].sort(

            (a, b) =>

                Number(b[campo] || 0) -
                Number(a[campo] || 0)

        );

    }


    /*==============================================================
        OBTENER TOP
    ==============================================================*/

    obtenerTop(
        resultados = [],
        cantidad = 10,
        campo = "score"
    ) {

        return this

            .ordenarResultados(
                resultados,
                campo
            )

            .slice(
                0,
                cantidad
            );

    }


    /*==============================================================
        VALIDAR NÚMERO
    ==============================================================*/

    validarNumero(numero) {

        const valor =
            this.normalizarNumero(
                numero
            );


        if (valor === null) {

            return false;

        }


        return (

            valor >= CONFIG.MIN_NUMERO &&

            valor <= CONFIG.MAX_NUMERO

        );

    }


    /*==============================================================
        OBTENER NÚMEROS POSIBLES
    ==============================================================*/

    obtenerNumerosPosibles() {

        const numeros = [];


        for (

            let numero =
                CONFIG.MIN_NUMERO;

            numero <=
                CONFIG.MAX_NUMERO;

            numero++

        ) {

            numeros.push(numero);

        }


        return numeros;

    }


    /*==============================================================
        REINICIAR
    ==============================================================*/

    reiniciar() {

        this.historial = [];

        this.estadisticas = [];

        this.inicializado = false;

        this.ultimaEjecucion = null;

        return this;

    }

}