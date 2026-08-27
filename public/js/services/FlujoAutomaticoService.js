/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * js/services/FlujoAutomaticoService.js
 *
 * Versión:
 * 1.0.0
 *
 * Propósito:
 *
 * Orquestar el ciclo automático completo del sistema:
 *
 *   Predicción
 *      ↓
 *   Evaluación
 *      ↓
 *   Evolución
 *      ↓
 *   Optimización
 *      ↓
 *   Aprobación
 *      ↓
 *   Aplicación de pesos
 *
 *
 * IMPORTANTE
 *
 * Este servicio NO calcula rankings por sí mismo.
 *
 * Esa responsabilidad sigue perteneciendo a:
 *
 *   MotorManager
 *   MotorRanking
 *
 * La sincronización final de MotorManager será realizada
 * por pruebas.js después de ejecutar este servicio.
 *
 **********************************************************************/


import PrediccionService
    from "./PrediccionService.js";


import EvaluacionService
    from "./EvaluacionService.js";


import EvolucionService
    from "./EvolucionService.js";


import OptimizacionService
    from "./OptimizacionService.js";


import ConfiguracionPesosService
    from "./ConfiguracionPesosService.js";


import MotorEvaluacion
    from "../motores/MotorEvaluacion.js";


import MotorEvolucion
    from "../motores/MotorEvolucion.js";


import MotorOptimizacion
    from "../motores/MotorOptimizacion.js";


export default class FlujoAutomaticoService {


    /*================================================================
        CONSTRUCTOR
    ================================================================*/

    constructor(
        configuracion = {}
    ) {

        this.nombre =
            "FlujoAutomaticoService";


        this.version =
            "1.0.0";


        /*
         * MODOS:
         *
         * CONTROLADO
         *
         *   genera evaluación/evolución/optimización
         *   pero NO aprueba ni aplica automáticamente.
         *
         *
         * COMPLETO
         *
         *   si MotorOptimizacion devuelve
         *   PROPUESTA_APLICABLE:
         *
         *       aprobar
         *       aplicar pesos
         *       marcar APLICADA
         */

        this.modo =

            configuracion.modo ===
            "COMPLETO"

                ? "COMPLETO"

                : "CONTROLADO";


        /*
         * Evita procesar dos veces
         * la misma predicción.
         */

        this.evitarDuplicados =

            configuracion
                .evitarDuplicados !==
                false;


        /*
         * Servicios Firestore.
         */

        this.prediccionService =
            new PrediccionService();


        this.evaluacionService =
            new EvaluacionService();


        this.evolucionService =
            new EvolucionService();


        this.optimizacionService =
            new OptimizacionService();


        this.configuracionPesosService =
            new ConfiguracionPesosService();


        /*
         * Motores.
         */

        this.motorEvaluacion =
            new MotorEvaluacion({

                cantidadNumerosEsperados:
                    10,

                minimoSemanasParaOptimizacion:
                    20

            });


        this.motorEvolucion =
            new MotorEvolucion({

                minimoEvaluaciones:
                    20,

                periodoReciente:
                    10,

                cantidadPeriodos:
                    5,

                umbralCambio:
                    5,

                umbralCambioFuerte:
                    15,

                umbralDiscriminacion:
                    2,

                minimoIndicePositivo:
                    1,

                minimoEvaluacionesTendencia:
                    3,

                pendienteMinimaMotor:
                    0.05

            });


        this.motorOptimizacion =
            new MotorOptimizacion({

                minimoEvaluaciones:
                    20,

                maximoCambioPorCiclo:
                    2,

                pesoMinimo:
                    2,

                pesoMaximo:
                    30,

                sumaObjetivoPesos:
                    100

            });


        /*
         * Último ciclo ejecutado.
         */

        this.ultimoResultado =
            null;

    }


    /*================================================================
        MÉTODO PRINCIPAL
    ================================================================*/

    async procesarResultado({

        prediccion = null,

        prediccionId = null,

        numerosReales = [],

        datosSemana = {},

        opcionesEvolucion = {},

        opcionesOptimizacion = {},

        reprocesar = false

    } = {}) {

        const inicio =
            new Date()
                .toISOString();


        console.log(
            "========================================"
        );


        console.log(
            "INICIANDO FLUJO AUTOMÁTICO"
        );


        console.log(
            "Modo:",
            this.modo
        );


        console.log(
            "========================================"
        );


        /*============================================================
            1. OBTENER PREDICCIÓN
        ============================================================*/

        const prediccionObjetivo =
            await this
                .resolverPrediccion(

                    prediccion,

                    prediccionId

                );


        if (
            !prediccionObjetivo
        ) {

            throw new Error(
                "No existe una predicción disponible para procesar."
            );

        }


        console.log(
            "Predicción:",
            prediccionObjetivo.id
        );


        /*============================================================
            2. VALIDAR NÚMEROS REALES
        ============================================================*/

        const reales =
            this.normalizarNumeros(
                numerosReales
            );


        if (
            reales.length !== 10
        ) {

            throw new Error(
                `Se esperaban 10 números reales válidos y se recibieron ${reales.length}.`
            );

        }


        /*============================================================
            3. DETECTAR EVALUACIÓN PREVIA
        ============================================================*/

        const evaluacionExistente =
            await this.evaluacionService
                .obtenerPorPrediccion(

                    prediccionObjetivo.id

                );


        if (
            evaluacionExistente &&
            this.evitarDuplicados &&
            !reprocesar
        ) {

            console.warn(
                "La predicción ya posee evaluación:",
                evaluacionExistente.id
            );


            const resultadoDuplicado = {

                tipo:
                    "FLUJO_AUTOMATICO",

                version:
                    this.version,

                estado:
                    "YA_PROCESADA",

                inicio,

                finalizadoEn:
                    new Date()
                        .toISOString(),

                prediccion:
                    prediccionObjetivo,

                evaluacion:
                    evaluacionExistente,

                evolucion:
                    null,

                optimizacion:
                    null,

                configuracion:
                    null,

                pesosAplicados:
                    false,

                mensaje:
                    "La predicción ya había sido evaluada."

            };


            this.ultimoResultado =
                resultadoDuplicado;


            return resultadoDuplicado;

        }


        /*============================================================
            4. GENERAR EVALUACIÓN
        ============================================================*/

        const evaluacion =
            this.motorEvaluacion
                .evaluar(

                    prediccionObjetivo,

                    reales,

                    datosSemana

                );


        /*============================================================
            5. PERSISTIR EVALUACIÓN
        ============================================================*/

        const evaluacionGuardada =
            await this.evaluacionService
                .guardar(
                    evaluacion
                );


        console.log(
            "Evaluación guardada:",
            evaluacionGuardada.id
        );


        /*============================================================
            6. MARCAR PREDICCIÓN EVALUADA
        ============================================================*/

        await this.prediccionService
            .marcarEvaluada(

                prediccionObjetivo.id,

                evaluacionGuardada.id

            );


        console.log(
            "Predicción marcada como evaluada."
        );


        /*============================================================
            7. RECUPERAR HISTORIAL DE EVALUACIONES
        ============================================================*/

        const evaluaciones =
            await this.evaluacionService
                .obtenerHistorial();


        console.log(
            "Evaluaciones acumuladas:",
            evaluaciones.length
        );


        /*============================================================
            8. GENERAR EVOLUCIÓN
        ============================================================*/

        const evolucion =
            this.motorEvolucion
                .analizar(

                    evaluaciones,

                    opcionesEvolucion

                );


        /*============================================================
            9. GUARDAR EVOLUCIÓN
        ============================================================*/

        const evolucionGuardada =
            await this.evolucionService
                .guardar(
                    evolucion
                );


        console.log(
            "Evolución guardada:",
            evolucionGuardada.id
        );


        /*============================================================
            10. OBTENER PESOS ACTIVOS
        ============================================================*/

        const pesosActuales =
            await this.configuracionPesosService
                .obtenerPesosActivos();


        const sumaPesosActuales =
            this.sumarPesos(
                pesosActuales
            );


        console.log(
            "Suma pesos actuales:",
            sumaPesosActuales
        );


        /*============================================================
            11. GENERAR OPTIMIZACIÓN
        ============================================================*/

        const optimizacion =
            this.motorOptimizacion
                .optimizar(

                    evolucionGuardada,

                    pesosActuales,

                    opcionesOptimizacion

                );


        /*============================================================
            12. GUARDAR OPTIMIZACIÓN
        ============================================================*/

        let optimizacionGuardada =
            await this.optimizacionService
                .guardar(
                    optimizacion
                );


        console.log(
            "Optimización guardada:",
            optimizacionGuardada.id
        );


        console.log(
            "Estado optimización:",
            optimizacionGuardada.estado
        );


        /*============================================================
            13. ANALIZAR SI PUEDE APLICARSE
        ============================================================*/

        let configuracionAplicada =
            null;


        let pesosAplicados =
            false;


        let aprobacionAutomatica =
            false;


        const propuestaAplicable =

            optimizacionGuardada.estado ===
                "PROPUESTA_APLICABLE" &&

            optimizacionGuardada
                .datosSuficientes ===
                true;


        /*============================================================
            14. MODO COMPLETO
        ============================================================*/

        if (
            this.modo ===
                "COMPLETO" &&
            propuestaAplicable
        ) {

            console.log(
                "La propuesta posee evidencia suficiente."
            );


            /*--------------------------------------------------------
                14.1 APROBAR
            --------------------------------------------------------*/

            optimizacionGuardada =
                await this.optimizacionService
                    .aprobar(

                        optimizacionGuardada.id,

                        "Aprobación automática del ciclo evolutivo."

                    );


            aprobacionAutomatica =
                true;


            console.log(
                "Optimización aprobada automáticamente."
            );


            /*--------------------------------------------------------
                14.2 APLICAR PESOS
            --------------------------------------------------------*/

            configuracionAplicada =
                await this.configuracionPesosService
                    .aplicarOptimizacion(

                        optimizacionGuardada,

                        {

                            descripcion:

                                "Pesos aplicados automáticamente por FlujoAutomaticoService.",


                            motivo:

                                "Ciclo automático con evidencia suficiente."

                        }

                    );


            pesosAplicados =
                true;


            console.log(
                "Pesos aplicados:",
                configuracionAplicada
                    .sumaPesos
            );


            /*--------------------------------------------------------
                14.3 MARCAR OPTIMIZACIÓN APLICADA
            --------------------------------------------------------*/

            optimizacionGuardada =
                await this.optimizacionService
                    .marcarAplicada(

                        optimizacionGuardada.id,

                        "Aplicación automática completada."

                    );


            console.log(
                "Optimización marcada APLICADA."
            );

        }


        /*============================================================
            15. CASO SIN EVIDENCIA
        ============================================================*/

        if (
            !propuestaAplicable
        ) {

            console.log(
                "Optimización no aplicable."
            );


            console.log(
                "Evaluaciones:",
                optimizacionGuardada
                    .cantidadEvaluaciones
            );


            console.log(
                "Mínimo requerido:",
                optimizacionGuardada
                    .minimoEvaluaciones
            );

        }


        /*============================================================
            16. CONFIGURACIÓN FINAL
        ============================================================*/

        const configuracionFinal =
            await this.configuracionPesosService
                .obtenerConfiguracionActiva();


        /*============================================================
            17. RESULTADO DEL CICLO
        ============================================================*/

        const resultado = {

            tipo:
                "FLUJO_AUTOMATICO",


            version:
                this.version,


            modo:
                this.modo,


            estado:

                pesosAplicados

                    ? "COMPLETADO_CON_APLICACION"

                    : "COMPLETADO_SIN_APLICACION",


            inicio,


            finalizadoEn:

                new Date()
                    .toISOString(),


            semana: {

                id:

                    datosSemana.id ??
                    datosSemana.semanaId ??
                    null,

                numero:

                    datosSemana.numero ??
                    datosSemana.semana ??
                    null,

                fecha:

                    datosSemana.fecha ??
                    null

            },


            numerosReales:

                reales.map(
                    numero =>
                        this.formatearNumero(
                            numero
                        )
                ),


            prediccion: {

                id:
                    prediccionObjetivo.id,

                semanaObjetivo:
                    prediccionObjetivo
                        .semanaObjetivo,

                fechaObjetivo:
                    prediccionObjetivo
                        .fechaObjetivo

            },


            evaluacion: {

                id:
                    evaluacionGuardada.id,

                top10:
                    evaluacionGuardada
                        .metricas
                        ?.aciertosTop10 ??
                    0,

                top20:
                    evaluacionGuardada
                        .metricas
                        ?.aciertosTop20 ??
                    0,

                titulares:
                    evaluacionGuardada
                        .metricas
                        ?.aciertosTitulares ??
                    0,

                mejorMotor:
                    evaluacionGuardada
                        .rendimientoMotores
                        ?.mejorMotor ??
                    null

            },


            evolucion: {

                id:
                    evolucionGuardada.id,

                cantidadEvaluaciones:
                    evolucionGuardada
                        .cantidadEvaluaciones,

                datosSuficientes:
                    evolucionGuardada
                        .datosSuficientes,

                mejorMotorHistorico:
                    evolucionGuardada
                        .mejorMotorHistorico,

                mejorMotorReciente:
                    evolucionGuardada
                        .mejorMotorReciente

            },


            optimizacion: {

                id:
                    optimizacionGuardada.id,

                estado:
                    optimizacionGuardada
                        .estado,

                datosSuficientes:
                    optimizacionGuardada
                        .datosSuficientes,

                sumaAnterior:
                    optimizacionGuardada
                        .sumaPesosActuales,

                sumaPropuesta:
                    optimizacionGuardada
                        .sumaPesosPropuestos

            },


            aplicacion: {

                propuestaAplicable,

                aprobacionAutomatica,

                pesosAplicados,

                configuracionId:

                    configuracionAplicada
                        ?.versionConfiguracion ??
                    null

            },


            configuracionFinal: {

                versionConfiguracion:

                    configuracionFinal
                        ?.versionConfiguracion ??
                    null,

                origen:

                    configuracionFinal
                        ?.origen ??
                    null,

                sumaPesos:

                    configuracionFinal
                        ?.sumaPesos ??
                    null,

                pesos:

                    configuracionFinal
                        ?.pesos
                        ? {
                            ...configuracionFinal.pesos
                        }
                        : null

            }

        };


        this.ultimoResultado =
            resultado;


        console.log(
            "========================================"
        );


        console.log(
            "FLUJO AUTOMÁTICO FINALIZADO"
        );


        console.log(
            "Estado:",
            resultado.estado
        );


        console.log(
            "========================================"
        );


        return resultado;

    }


    /*================================================================
        RESOLVER PREDICCIÓN
    ================================================================*/

    async resolverPrediccion(
        prediccion,
        prediccionId
    ) {

        if (
            prediccion &&
            typeof prediccion ===
                "object"
        ) {

            return prediccion;

        }


        if (
            prediccionId
        ) {

            return await this.prediccionService
                .obtener(

                    prediccionId,

                    {
                        incluirRanking:
                            true
                    }

                );

        }


        /*
         * Si no se indica predicción,
         * usamos la última persistida.
         */

        return await this.prediccionService
            .obtenerUltima(
                true
            );

    }


    /*================================================================
        NORMALIZAR NÚMEROS
    ================================================================*/

    normalizarNumeros(
        numeros
    ) {

        if (
            !Array.isArray(
                numeros
            )
        ) {

            return [];

        }


        const unicos =
            new Set();


        for (
            const numero
            of numeros
        ) {

            const valor =
                Number(
                    numero
                );


            if (
                Number.isInteger(
                    valor
                ) &&
                valor >= 0 &&
                valor <= 99
            ) {

                unicos.add(
                    valor
                );

            }

        }


        return [
            ...unicos
        ];

    }


    /*================================================================
        FORMATEAR NÚMERO
    ================================================================*/

    formatearNumero(
        numero
    ) {

        return String(
            Number(
                numero
            )
        )
        .padStart(
            2,
            "0"
        );

    }


    /*================================================================
        SUMAR PESOS
    ================================================================*/

    sumarPesos(
        pesos
    ) {

        if (
            !pesos ||
            typeof pesos !==
                "object"
        ) {

            return 0;

        }


        return this.redondear(

            Object.values(
                pesos
            ).reduce(

                (
                    suma,
                    valor
                ) =>

                    suma +
                    Number(
                        valor || 0
                    ),

                0

            ),

            6

        );

    }


    /*================================================================
        REDONDEAR
    ================================================================*/

    redondear(
        valor,
        decimales = 6
    ) {

        const numero =
            Number(
                valor
            );


        if (
            !Number.isFinite(
                numero
            )
        ) {

            return 0;

        }


        const factor =
            Math.pow(
                10,
                decimales
            );


        return (

            Math.round(
                numero *
                factor
            ) /
            factor

        );

    }


    /*================================================================
        OBTENER ÚLTIMO RESULTADO
    ================================================================*/

    obtenerUltimoResultado() {

        return this
            .ultimoResultado;

    }


    /*================================================================
        ESTADO
    ================================================================*/

    obtenerEstado() {

        return {

            nombre:
                this.nombre,

            version:
                this.version,

            modo:
                this.modo,

            evitarDuplicados:
                this.evitarDuplicados,

            ultimoCiclo:
                this.ultimoResultado
                    ?.finalizadoEn ??
                null,

            ultimoEstado:
                this.ultimoResultado
                    ?.estado ??
                null

        };

    }

}