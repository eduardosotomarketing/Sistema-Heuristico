/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * public/js/pruebas.js
 *
 * Entorno centralizado de pruebas.
 *
 * Motores integrados:
 *
 *   - BaseMotor
 *   - MotorFrecuencia
 *   - MotorAtraso
 *   - MotorTendencia
 *   - MotorRepeticion
 *   - MotorHistorico
 *   - MotorParidad
 *   - MotorRangos
 *   - MotorDistribucion
 *
 **********************************************************************/


/*====================================================================
    IMPORTS
====================================================================*/

import HistorialService
    from "./services/HistorialService.js";

import EstadisticasService
    from "./services/EstadisticasService.js";

import BaseMotor
    from "./motores/BaseMotor.js";

import MotorFrecuencia
    from "./motores/MotorFrecuencia.js";

import MotorAtraso
    from "./motores/MotorAtraso.js";

import MotorTendencia
    from "./motores/MotorTendencia.js";

import MotorRepeticion
    from "./motores/MotorRepeticion.js";

import MotorHistorico
    from "./motores/MotorHistorico.js";

import MotorParidad
    from "./motores/MotorParidad.js";

import MotorRangos
    from "./motores/MotorRangos.js";

import MotorDistribucion
    from "./motores/MotorDistribucion.js";


/*====================================================================
    CLASE ENTORNO DE PRUEBAS
====================================================================*/

class EntornoPruebas {


    constructor() {

        /*==========================================================
            ESTADO
        ==========================================================*/

        this.inicializado = false;


        /*==========================================================
            SERVICIOS
        ==========================================================*/

        this.historialService = null;

        this.estadisticasService = null;


        /*==========================================================
            DATOS
        ==========================================================*/

        this.datosHistorial = [];

        this.datosEstadisticas = null;


        /*==========================================================
            MOTORES
        ==========================================================*/

        this.baseMotor = null;

        this.motorFrecuencia = null;

        this.motorAtraso = null;

        this.motorTendencia = null;

        this.motorRepeticion = null;

        this.motorHistorico = null;

        this.motorParidad = null;

        this.motorRangos = null;

        this.motorDistribucion = null;

    }


    /*================================================================
        INICIALIZAR
    ================================================================*/

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


        try {


            /*========================================================
                HISTORIAL
            ========================================================*/

            this.historialService =
                new HistorialService();


            this.datosHistorial =
                await this.historialService
                    .obtenerHistorial();


            if (
                !Array.isArray(
                    this.datosHistorial
                )
            ) {

                this.datosHistorial = [];

            }


            console.log(
                "Historial cargado:",
                this.datosHistorial.length,
                "semana(s)"
            );


            /*========================================================
                ESTADÍSTICAS
            ========================================================*/

            this.estadisticasService =
                new EstadisticasService();


            this.datosEstadisticas =
                await this.estadisticasService
                    .calcular();


            console.log(
                "Estadísticas calculadas correctamente."
            );


            console.log(
                "Estadísticas disponibles:",
                this.obtenerArrayEstadisticas()
                    .length
            );


            /*========================================================
                BASE MOTOR
            ========================================================*/

            this.baseMotor =
                new BaseMotor(
                    "Motor de Prueba"
                );


            this.baseMotor.inicializar({

                historial:
                    this.datosHistorial,

                estadisticas:
                    this.obtenerArrayEstadisticas()

            });


            console.log(
                "BaseMotor inicializado."
            );


            /*========================================================
                MOTOR FRECUENCIA
            ========================================================*/

            this.motorFrecuencia =
                new MotorFrecuencia();


            this.motorFrecuencia.inicializar({

                historial:
                    this.datosHistorial,

                estadisticas:
                    this.obtenerArrayEstadisticas()

            });


            console.log(
                "MotorFrecuencia inicializado."
            );


            /*========================================================
                MOTOR ATRASO
            ========================================================*/

            this.motorAtraso =
                new MotorAtraso();


            this.motorAtraso.inicializar({

                historial:
                    this.datosHistorial,

                estadisticas:
                    this.obtenerArrayEstadisticas()

            });


            console.log(
                "MotorAtraso inicializado."
            );


            /*========================================================
                MOTOR TENDENCIA
            ========================================================*/

            this.motorTendencia =
                new MotorTendencia();


            this.motorTendencia.inicializar({

                historial:
                    this.datosHistorial,

                estadisticas:
                    this.obtenerArrayEstadisticas()

            });


            console.log(
                "MotorTendencia inicializado."
            );


            /*========================================================
                MOTOR REPETICIÓN
            ========================================================*/

            this.motorRepeticion =
                new MotorRepeticion();


            this.motorRepeticion.inicializar({

                historial:
                    this.datosHistorial,

                estadisticas:
                    this.obtenerArrayEstadisticas()

            });


            console.log(
                "MotorRepeticion inicializado."
            );


            /*========================================================
                MOTOR HISTÓRICO
            ========================================================*/

            this.motorHistorico =
                new MotorHistorico();


            this.motorHistorico.inicializar({

                historial:
                    this.datosHistorial,

                estadisticas:
                    this.obtenerArrayEstadisticas()

            });


            console.log(
                "MotorHistorico inicializado."
            );


            /*========================================================
                MOTOR PARIDAD
            ========================================================*/

            this.motorParidad =
                new MotorParidad();


            this.motorParidad.inicializar({

                historial:
                    this.datosHistorial,

                estadisticas:
                    this.obtenerArrayEstadisticas()

            });


            console.log(
                "MotorParidad inicializado."
            );


            /*========================================================
                MOTOR RANGOS
            ========================================================*/

            this.motorRangos =
                new MotorRangos();


            this.motorRangos.inicializar({

                historial:
                    this.datosHistorial,

                estadisticas:
                    this.obtenerArrayEstadisticas()

            });


            console.log(
                "MotorRangos inicializado."
            );


            /*========================================================
                MOTOR DISTRIBUCIÓN
            ========================================================*/

            this.motorDistribucion =
                new MotorDistribucion();


            this.motorDistribucion.inicializar({

                historial:
                    this.datosHistorial,

                estadisticas:
                    this.obtenerArrayEstadisticas()

            });


            console.log(
                "MotorDistribucion inicializado."
            );


            /*========================================================
                FINALIZACIÓN
            ========================================================*/

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

        catch (error) {

            this.inicializado = false;


            console.error(
                "ERROR AL INICIALIZAR ENTORNO DE PRUEBAS:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        OBTENER ARRAY DE ESTADÍSTICAS
    ================================================================*/

    obtenerArrayEstadisticas() {

        if (!this.datosEstadisticas) {

            return [];

        }


        if (
            Array.isArray(
                this.datosEstadisticas.estadisticas
            )
        ) {

            return this.datosEstadisticas
                .estadisticas;

        }


        if (
            this.datosEstadisticas.estadisticas &&
            typeof this.datosEstadisticas.estadisticas ===
                "object"
        ) {

            return Object.values(
                this.datosEstadisticas.estadisticas
            );

        }


        if (
            Array.isArray(
                this.datosEstadisticas
            )
        ) {

            return this.datosEstadisticas;

        }


        return [];

    }


    /*================================================================
        VERIFICAR INICIALIZACIÓN
    ================================================================*/

    verificarInicializacion() {

        if (!this.inicializado) {

            throw new Error(
                "El entorno de pruebas no está inicializado."
            );

        }

    }


    /*================================================================
        HISTORIAL
    ================================================================*/

    historial() {

        this.verificarInicializacion();

        return this.datosHistorial;

    }


    /*================================================================
        ESTADÍSTICAS
    ================================================================*/

    estadisticas() {

        this.verificarInicializacion();

        return this.datosEstadisticas;

    }


    /*================================================================
        CONTEXTO ESTÁNDAR
    ================================================================*/

    crearContexto(
        configuracionAdicional = {}
    ) {

        this.verificarInicializacion();


        return {

            historial:
                this.datosHistorial,

            semanas:
                this.datosHistorial,

            estadisticas:
                this.obtenerArrayEstadisticas(),

            ...configuracionAdicional

        };

    }


    /*================================================================
        MOTOR FRECUENCIA
    ================================================================*/

    frecuencia(
        numero,
        configuracion = {}
    ) {

        this.verificarInicializacion();

        return this.motorFrecuencia.calcular(

            numero,

            this.crearContexto(
                configuracion
            )

        );

    }


    /*================================================================
        MOTOR ATRASO
    ================================================================*/

    atraso(
        numero,
        configuracion = {}
    ) {

        this.verificarInicializacion();

        return this.motorAtraso.calcular(

            numero,

            this.crearContexto(
                configuracion
            )

        );

    }


    /*================================================================
        MOTOR TENDENCIA
    ================================================================*/

    tendencia(
        numero,
        configuracion = {}
    ) {

        this.verificarInicializacion();

        return this.motorTendencia.calcular(

            numero,

            this.crearContexto(
                configuracion
            )

        );

    }


    /*================================================================
        MOTOR REPETICIÓN
    ================================================================*/

    repeticion(
        numero,
        configuracion = {}
    ) {

        this.verificarInicializacion();

        return this.motorRepeticion.calcular(

            numero,

            this.crearContexto(
                configuracion
            )

        );

    }


    /*================================================================
        MOTOR HISTÓRICO
    ================================================================*/

    historico(
        numero,
        configuracion = {}
    ) {

        this.verificarInicializacion();

        return this.motorHistorico.calcular(

            numero,

            this.crearContexto(
                configuracion
            )

        );

    }


    /*================================================================
        MOTOR PARIDAD
    ================================================================*/

    paridad(
        numero,
        configuracion = {}
    ) {

        this.verificarInicializacion();

        return this.motorParidad.calcular(

            numero,

            this.crearContexto(
                configuracion
            )

        );

    }


    /*================================================================
        MOTOR RANGOS
    ================================================================*/

    rangos(
        numero,
        configuracion = {}
    ) {

        this.verificarInicializacion();

        return this.motorRangos.calcular(

            numero,

            this.crearContexto(
                configuracion
            )

        );

    }


    /*================================================================
        MOTOR DISTRIBUCIÓN
    ================================================================*/

    distribucion(
        numero,
        configuracion = {}
    ) {

        this.verificarInicializacion();


        if (!this.motorDistribucion) {

            throw new Error(
                "MotorDistribucion no está disponible."
            );

        }


        return this.motorDistribucion.calcular(

            numero,

            this.crearContexto(
                configuracion
            )

        );

    }


    /*================================================================
        ANALIZAR UN NÚMERO
    ================================================================*/

    analizarNumero(numero) {

        this.verificarInicializacion();


        return {

            numero:
                Number(numero),

            frecuencia:
                this.frecuencia(numero),

            atraso:
                this.atraso(numero),

            tendencia:
                this.tendencia(numero),

            repeticion:
                this.repeticion(numero),

            historico:
                this.historico(numero),

            paridad:
                this.paridad(numero),

            rangos:
                this.rangos(numero),

            distribucion:
                this.distribucion(numero)

        };

    }


    /*================================================================
        INFORMACIÓN
    ================================================================*/

    informacion() {

        return {

            inicializado:
                this.inicializado,

            semanas:
                this.datosHistorial.length,

            numerosAnalizados:
                this.calcularNumerosAnalizados(),

            estadisticasDisponibles:
                this.obtenerArrayEstadisticas()
                    .length,

            baseMotor:
                this.baseMotor
                    ? this.baseMotor.obtenerInformacion()
                    : null,

            motorFrecuencia:
                this.motorFrecuencia
                    ? this.motorFrecuencia.obtenerInformacion()
                    : null,

            motorAtraso:
                this.motorAtraso
                    ? this.motorAtraso.obtenerInformacion()
                    : null,

            motorTendencia:
                this.motorTendencia
                    ? this.motorTendencia.obtenerInformacion()
                    : null,

            motorRepeticion:
                this.motorRepeticion
                    ? this.motorRepeticion.obtenerInformacion()
                    : null,

            motorHistorico:
                this.motorHistorico
                    ? this.motorHistorico.obtenerInformacion()
                    : null,

            motorParidad:
                this.motorParidad
                    ? this.motorParidad.obtenerInformacion()
                    : null,

            motorRangos:
                this.motorRangos
                    ? this.motorRangos.obtenerInformacion()
                    : null,

            motorDistribucion:
                this.motorDistribucion
                    ? this.motorDistribucion.obtenerInformacion()
                    : null

        };

    }


    /*================================================================
        CALCULAR NÚMEROS ANALIZADOS
    ================================================================*/

    calcularNumerosAnalizados() {

        const numeros =
            new Set();


        for (
            const semana
            of this.datosHistorial
        ) {

            if (
                !semana ||
                !Array.isArray(
                    semana.numeros
                )
            ) {

                continue;

            }


            for (
                const numero
                of semana.numeros
            ) {

                const valor =
                    Number(numero);


                if (
                    Number.isInteger(valor) &&
                    valor >= 0 &&
                    valor <= 99
                ) {

                    numeros.add(valor);

                }

            }

        }


        return numeros.size;

    }


    /*================================================================
        RECARGAR
    ================================================================*/

    async recargar() {

        console.log(
            "Recargando entorno de pruebas..."
        );


        this.inicializado = false;


        return await this.inicializar();

    }


    /*================================================================
        EJECUTAR TODOS
    ================================================================*/

    ejecutarTodos(funcion) {

        this.verificarInicializacion();


        const resultados = [];


        for (
            let numero = 0;
            numero <= 99;
            numero++
        ) {

            resultados.push(
                funcion(numero)
            );

        }


        return resultados;

    }


    /*================================================================
        TODOS
    ================================================================*/

    frecuenciaTodos() {

        return this.ejecutarTodos(
            numero =>
                this.frecuencia(numero)
        );

    }


    atrasoTodos() {

        return this.ejecutarTodos(
            numero =>
                this.atraso(numero)
        );

    }


    tendenciaTodos() {

        return this.ejecutarTodos(
            numero =>
                this.tendencia(numero)
        );

    }


    repeticionTodos() {

        return this.ejecutarTodos(
            numero =>
                this.repeticion(numero)
        );

    }


    historicoTodos() {

        return this.ejecutarTodos(
            numero =>
                this.historico(numero)
        );

    }


    paridadTodos() {

        return this.ejecutarTodos(
            numero =>
                this.paridad(numero)
        );

    }


    rangosTodos() {

        return this.ejecutarTodos(
            numero =>
                this.rangos(numero)
        );

    }


    distribucionTodos() {

        return this.ejecutarTodos(
            numero =>
                this.distribucion(numero)
        );

    }


    /*================================================================
        TABLA DISTRIBUCIÓN
    ================================================================*/

    tablaDistribucion(
        desde = 0,
        hasta = 99
    ) {

        this.verificarInicializacion();


        const resultados = [];


        for (
            let numero = desde;
            numero <= hasta;
            numero++
        ) {

            const resultado =
                this.distribucion(numero);


            resultados.push({

                numero:
                    resultado.numero,

                texto:
                    resultado.numeroTexto,

                rango:
                    resultado.indicadores.rango,

                decena:
                    resultado.indicadores.decena,

                terminacion:
                    resultado.indicadores.terminacion,

                paridad:
                    resultado.indicadores.paridad,

                frecuenciaNumero:
                    resultado.indicadores.frecuenciaNumero,

                frecuenciaRango:
                    resultado.indicadores.frecuenciaRango,

                frecuenciaTerminacion:
                    resultado.indicadores.frecuenciaTerminacion,

                frecuenciaParidad:
                    resultado.indicadores.frecuenciaParidad,

                frecuenciaReciente:
                    resultado.indicadores.frecuenciaReciente,

                score:
                    resultado.score,

                confianza:
                    resultado.confianza

            });

        }


        console.table(
            resultados
        );


        return resultados;

    }


    /*================================================================
        TABLA GENERAL DE UN NÚMERO
    ================================================================*/

    tablaNumero(numero) {

        const resultado =
            this.analizarNumero(
                numero
            );


        const tabla = [

            {
                motor: "Frecuencia",
                score: resultado.frecuencia.score,
                confianza: resultado.frecuencia.confianza,
                peso: resultado.frecuencia.peso
            },

            {
                motor: "Atraso",
                score: resultado.atraso.score,
                confianza: resultado.atraso.confianza,
                peso: resultado.atraso.peso
            },

            {
                motor: "Tendencia",
                score: resultado.tendencia.score,
                confianza: resultado.tendencia.confianza,
                peso: resultado.tendencia.peso
            },

            {
                motor: "Repeticion",
                score: resultado.repeticion.score,
                confianza: resultado.repeticion.confianza,
                peso: resultado.repeticion.peso
            },

            {
                motor: "Historico",
                score: resultado.historico.score,
                confianza: resultado.historico.confianza,
                peso: resultado.historico.peso
            },

            {
                motor: "Paridad",
                score: resultado.paridad.score,
                confianza: resultado.paridad.confianza,
                peso: resultado.paridad.peso
            },

            {
                motor: "Rangos",
                score: resultado.rangos.score,
                confianza: resultado.rangos.confianza,
                peso: resultado.rangos.peso
            },

            {
                motor: "Distribucion",
                score: resultado.distribucion.score,
                confianza: resultado.distribucion.confianza,
                peso: resultado.distribucion.peso
            }

        ];


        console.table(
            tabla
        );


        return tabla;

    }

}


/*====================================================================
    ENTORNO GLOBAL
====================================================================*/

const entornoPruebas =
    new EntornoPruebas();


window.entornoPruebas =
    entornoPruebas;


window.EntornoPruebas =
    EntornoPruebas;


/*====================================================================
    INICIALIZACIÓN AUTOMÁTICA
====================================================================*/

await entornoPruebas.inicializar();


/*====================================================================
    EXPORTS
====================================================================*/

export {

    EntornoPruebas,

    entornoPruebas

};


export default entornoPruebas;