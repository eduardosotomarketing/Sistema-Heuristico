/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * js/motores/MotorResult.js
 *
 * Propósito:
 * Representar de manera estandarizada el resultado producido por
 * cualquier motor heurístico.
 *
 * Compatible con:
 *
 *  - MotorHistorico
 *  - MotorTendencia
 *  - MotorCiclos
 *  - MotorAsociaciones
 *  - MotorDistribucion
 *  - futuros motores
 *
 **********************************************************************/

export default class MotorResult {

    constructor({

        numero,

        numeroTexto = null,

        motor,

        version = "1.0.0",

        activo = true,

        score = 0,

        confianza = 0,

        evidencia = null,

        peso = 0,

        detalle = {},

        indicadores = {},

        fechaCalculo = null

    } = {}) {

        this.numero = Number(numero);

        this.numeroTexto =

            numeroTexto !== null

                ? numeroTexto

                : String(this.numero).padStart(2, "0");


        this.motor = motor || "Desconocido";

        this.version = version;

        this.activo = activo;

        this.score = this.normalizar(score);

        this.confianza = this.normalizar(confianza);

        this.evidencia =

            evidencia ||

            this.determinarEvidencia(

                this.confianza

            );

        this.peso = Number(peso) || 0;

        this.detalle = {

            ...detalle

        };

        this.indicadores = {

            ...indicadores

        };

        this.fechaCalculo =

            fechaCalculo ||

            new Date().toISOString();

    }


    /*==============================================================
        NORMALIZACIÓN
    ==============================================================*/

    normalizar(valor) {

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
        EVIDENCIA
    ==============================================================*/

    determinarEvidencia(confianza) {

        if (confianza >= 80) {

            return "ALTA";

        }

        if (confianza >= 50) {

            return "MEDIA";

        }

        return "BAJA";

    }


    /*==============================================================
        REDONDEO
    ==============================================================*/

    redondear(valor, decimales = 2) {

        const numero = Number(valor);

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
        OBTENER SCORE
    ==============================================================*/

    obtenerScore() {

        return this.score;

    }


    /*==============================================================
        OBTENER CONFIANZA
    ==============================================================*/

    obtenerConfianza() {

        return this.confianza;

    }


    /*==============================================================
        OBTENER PESO
    ==============================================================*/

    obtenerPeso() {

        return this.peso;

    }


    /*==============================================================
        OBTENER CONTRIBUCIÓN
    *
    * La contribución representa cuánto aporta este motor al
    * Score Final cuando se aplica su peso.
    ==============================================================*/

    obtenerContribucion() {

        return this.redondear(

            this.score *

            (this.peso / 100)

        );

    }


    /*==============================================================
        CAMBIAR PESO
    ==============================================================*/

    establecerPeso(peso) {

        this.peso =

            Number.isFinite(

                Number(peso)

            )

                ? Number(peso)

                : 0;

    }


    /*==============================================================
        ACTUALIZAR SCORE
    ==============================================================*/

    establecerScore(score) {

        this.score =

            this.normalizar(score);

    }


    /*==============================================================
        ACTUALIZAR CONFIANZA
    ==============================================================*/

    establecerConfianza(confianza) {

        this.confianza =

            this.normalizar(confianza);

        this.evidencia =

            this.determinarEvidencia(

                this.confianza

            );

    }


    /*==============================================================
        AGREGAR INDICADOR
    ==============================================================*/

    agregarIndicador(nombre, valor) {

        if (!nombre) {

            return;

        }

        this.indicadores[nombre] = valor;

    }


    /*==============================================================
        AGREGAR DETALLE
    ==============================================================*/

    agregarDetalle(nombre, valor) {

        if (!nombre) {

            return;

        }

        this.detalle[nombre] = valor;

    }


    /*==============================================================
        COMPARAR SCORE
    ==============================================================*/

    compararScore(otroResultado) {

        if (!(otroResultado instanceof MotorResult)) {

            return 0;

        }

        return this.score -

               otroResultado.score;

    }


    /*==============================================================
        ES SUPERIOR
    ==============================================================*/

    esSuperiorA(otroResultado) {

        if (!(otroResultado instanceof MotorResult)) {

            return false;

        }

        return this.score >

               otroResultado.score;

    }


    /*==============================================================
        ES INFERIOR
    ==============================================================*/

    esInferiorA(otroResultado) {

        if (!(otroResultado instanceof MotorResult)) {

            return false;

        }

        return this.score <

               otroResultado.score;

    }


    /*==============================================================
        CLONAR
    ==============================================================*/

    clonar() {

        return new MotorResult({

            numero: this.numero,

            numeroTexto: this.numeroTexto,

            motor: this.motor,

            version: this.version,

            activo: this.activo,

            score: this.score,

            confianza: this.confianza,

            evidencia: this.evidencia,

            peso: this.peso,

            detalle: {

                ...this.detalle

            },

            indicadores: {

                ...this.indicadores

            },

            fechaCalculo: this.fechaCalculo

        });

    }


    /*==============================================================
        SERIALIZAR
    *
    * Convierte el resultado en un objeto limpio para:
    *
    *  - Firestore
    *  - JSON
    *  - informes
    *  - IA
    *  - almacenamiento
    ==============================================================*/

    toJSON() {

        return {

            numero: this.numero,

            numeroTexto: this.numeroTexto,

            motor: this.motor,

            version: this.version,

            activo: this.activo,

            score: this.score,

            confianza: this.confianza,

            evidencia: this.evidencia,

            peso: this.peso,

            contribucion:

                this.obtenerContribucion(),

            detalle: {

                ...this.detalle

            },

            indicadores: {

                ...this.indicadores

            },

            fechaCalculo:

                this.fechaCalculo

        };

    }


    /*==============================================================
        CREAR DESDE OBJETO
    *
    * Permite reconstruir un MotorResult a partir de un documento
    * recuperado desde Firestore.
    ==============================================================*/

    static fromJSON(data) {

        if (!data || typeof data !== "object") {

            throw new Error(

                "No se puede crear MotorResult: datos inválidos."

            );

        }

        return new MotorResult(data);

    }


    /*==============================================================
        REPRESENTACIÓN DE TEXTO
    ==============================================================*/

    toString() {

        return `${this.numeroTexto} | ` +

               `${this.motor} | ` +

               `Score: ${this.score} | ` +

               `Confianza: ${this.confianza}% | ` +

               `Evidencia: ${this.evidencia}`;

    }

}