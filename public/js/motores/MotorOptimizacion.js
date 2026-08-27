/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * js/motores/MotorOptimizacion.js
 *
 * Versión:
 * 1.0.1
 *
 * Propósito:
 *
 * Analizar la evolución histórica de los motores y generar una
 * propuesta explicable de ajuste de pesos.
 *
 * FLUJO:
 *
 * MotorEvaluacion
 *      ↓
 * MotorEvolucion
 *      ↓
 * MotorOptimizacion
 *      ↓
 * propuestaPesos
 *
 *
 * PRINCIPIOS:
 *
 *   - No optimizar con evidencia insuficiente.
 *   - Separar simulación de aplicación real.
 *   - Evitar cambios bruscos.
 *   - Mantener pesos dentro de límites.
 *   - Normalizar únicamente propuestas aplicables.
 *   - Explicar cada ajuste.
 *   - Mantener trazabilidad.
 *
 *
 * CAMBIO IMPORTANTE v1.0.1
 *
 * Si todavía NO existen suficientes evaluaciones:
 *
 *   - ajusteTotalBruto puede calcularse.
 *   - ajusteAplicado será 0.
 *   - pesoPropuestoLimitado será igual al peso actual.
 *   - NO se normalizarán los pesos.
 *   - pesosPropuestos será igual a pesosActuales.
 *   - motoresAumentados estará vacío.
 *   - motoresReducidos estará vacío.
 *   - todos los motores estarán en motoresSinCambio.
 *
 * Esto evita confundir una normalización matemática con una
 * optimización realmente aplicada.
 *
 **********************************************************************/


export default class MotorOptimizacion {


    /*================================================================
        CONSTRUCTOR
    ================================================================*/

    constructor(
        configuracion = {}
    ) {

        this.nombre =
            "MotorOptimizacion";


        this.version =
            "1.0.1";


        this.configuracion = {


            /*
             * Cantidad mínima de evaluaciones
             * para habilitar propuestas aplicables.
             */

            minimoEvaluaciones:

                configuracion
                    .minimoEvaluaciones ??

                20,


            /*
             * Cambio máximo absoluto permitido
             * por motor en cada ciclo.
             */

            maximoCambioPorCiclo:

                configuracion
                    .maximoCambioPorCiclo ??

                2,


            /*
             * Peso mínimo permitido.
             */

            pesoMinimo:

                configuracion
                    .pesoMinimo ??

                2,


            /*
             * Peso máximo permitido.
             */

            pesoMaximo:

                configuracion
                    .pesoMaximo ??

                30,


            /*
             * Suma objetivo de pesos.
             *
             * Se utiliza solamente cuando
             * la propuesta es aplicable.
             */

            sumaObjetivoPesos:

                configuracion
                    .sumaObjetivoPesos ??

                100,


            /*
             * Influencia del índice discriminatorio.
             */

            factorIndice:

                configuracion
                    .factorIndice ??

                0.08,


            /*
             * Influencia de la variación reciente.
             */

            factorVariacion:

                configuracion
                    .factorVariacion ??

                0.06,


            /*
             * Bono por tendencia ascendente.
             */

            bonoMejora:

                configuracion
                    .bonoMejora ??

                0.75,


            /*
             * Penalización por tendencia descendente.
             */

            penalizacionDeterioro:

                configuracion
                    .penalizacionDeterioro ??

                0.75,


            /*
             * Bono para motores consistentes.
             */

            bonoConsistencia:

                configuracion
                    .bonoConsistencia ??

                0.50,


            /*
             * Penalización por índice negativo.
             */

            penalizacionIndiceNegativo:

                configuracion
                    .penalizacionIndiceNegativo ??

                0.50

        };


        /*
         * Última optimización generada.
         */

        this.ultimaOptimizacion =
            null;

    }


    /*================================================================
        MÉTODO PRINCIPAL
    ================================================================*/

    optimizar(
        evolucion,
        pesosActuales = {},
        opciones = {}
    ) {

        this.validarEvolucion(
            evolucion
        );


        const pesosBase =
            this.normalizarPesosEntrada(
                pesosActuales
            );


        if (
            Object.keys(
                pesosBase
            ).length === 0
        ) {

            throw new Error(
                "No se recibieron pesos actuales válidos."
            );

        }


        const cantidadEvaluaciones =
            this.numeroSeguro(

                evolucion
                    .cantidadEvaluaciones

            );


        const minimoEvaluaciones =

            opciones
                .minimoEvaluaciones ??

            this.configuracion
                .minimoEvaluaciones;


        const datosSuficientes =

            cantidadEvaluaciones >=
            minimoEvaluaciones;


        /*
         * Motores evolutivos.
         */

        const motoresEvolucion =

            evolucion.motores &&
            typeof evolucion.motores ===
                "object"

                ? evolucion.motores

                : {};


        /*
         * Detalle individual.
         */

        const detalles = {};


        /*
         * Pesos antes de normalización.
         */

        const pesosPropuestosBrutos = {};


        /*
         * Pesos limitados después de aplicar
         * el máximo cambio por ciclo.
         */

        const pesosPropuestosLimitados = {};


        /*------------------------------------------------------------
            ANALIZAR MOTOR POR MOTOR
        ------------------------------------------------------------*/

        for (
            const clave
            of Object.keys(
                pesosBase
            )
        ) {

            const pesoActual =
                pesosBase[clave];


            const datosMotor =
                motoresEvolucion[clave] ||
                null;


            const analisis =
                this.calcularAjusteMotor(

                    clave,

                    pesoActual,

                    datosMotor,

                    datosSuficientes

                );


            detalles[clave] =
                analisis;


            /*
             * Este peso refleja el ajuste teórico.
             */

            pesosPropuestosBrutos[clave] =

                analisis
                    .pesoPropuestoBruto;


            /*
             * Este peso representa lo que podría
             * entrar a normalización si la propuesta
             * está habilitada.
             */

            pesosPropuestosLimitados[clave] =

                analisis
                    .pesoPropuestoLimitado;

        }


        /*------------------------------------------------------------
            DEFINIR PESOS FINALES
        ------------------------------------------------------------*/

        let pesosPropuestos;


        let normalizacionAplicada =
            false;


        /*
         * CAMBIO CENTRAL v1.0.1
         *
         * Sin evidencia suficiente:
         *
         * NO normalizamos.
         * NO modificamos.
         */

        if (
            !datosSuficientes
        ) {

            pesosPropuestos = {

                ...pesosBase

            };


            normalizacionAplicada =
                false;

        }

        else {

            pesosPropuestos =
                this.normalizarPesosFinales(

                    pesosPropuestosLimitados,

                    this.configuracion
                        .sumaObjetivoPesos

                );


            normalizacionAplicada =
                true;

        }


        /*------------------------------------------------------------
            ACTUALIZAR DETALLES FINALES
        ------------------------------------------------------------*/

        for (
            const clave
            of Object.keys(
                detalles
            )
        ) {

            const pesoFinal =

                pesosPropuestos[clave];


            detalles[clave]
                .pesoNormalizado =

                    this.redondear(
                        pesoFinal,
                        6
                    );


            detalles[clave]
                .variacionFinal =

                    this.redondear(

                        pesoFinal -
                        pesosBase[clave],

                        6

                    );


            /*
             * Diferenciamos entre simulación
             * y variación realmente propuesta.
             */

            detalles[clave]
                .simulacionVariacion =

                    this.redondear(

                        detalles[clave]
                            .pesoPropuestoBruto -

                        pesosBase[clave],

                        6

                    );

        }


        /*------------------------------------------------------------
            ESTADO GLOBAL
        ------------------------------------------------------------*/

        const estado =

            datosSuficientes

                ? "PROPUESTA_APLICABLE"

                : "PROPUESTA_NO_APLICABLE";


        /*------------------------------------------------------------
            CLASIFICAR MOTORES
        ------------------------------------------------------------*/

        const motoresAumentados =

            this.obtenerMotoresPorVariacion(

                detalles,

                valor =>
                    valor > 0

            );


        const motoresReducidos =

            this.obtenerMotoresPorVariacion(

                detalles,

                valor =>
                    valor < 0

            );


        const motoresSinCambio =

            this.obtenerMotoresPorVariacion(

                detalles,

                valor =>
                    valor === 0

            );


        /*------------------------------------------------------------
            RESULTADO
        ------------------------------------------------------------*/

        const optimizacion = {

            id:
                this.generarId(),


            nombre:
                this.nombre,


            version:
                this.version,


            generadoEn:

                new Date()
                    .toISOString(),


            evolucionId:

                evolucion.id ??
                null,


            cantidadEvaluaciones,


            minimoEvaluaciones,


            datosSuficientes,


            estado,


            /*
             * Indica claramente si ocurrió
             * normalización.
             */

            normalizacionAplicada,


            sumaObjetivoPesos:

                this.configuracion
                    .sumaObjetivoPesos,


            pesosActuales:

                {
                    ...pesosBase
                },


            /*
             * Peso teórico antes de límites.
             */

            pesosPropuestosBrutos,


            /*
             * Peso luego de límite por ciclo,
             * pero antes de normalización.
             */

            pesosPropuestosLimitados,


            /*
             * Peso final de la propuesta.
             *
             * Si no hay evidencia suficiente,
             * es idéntico a pesosActuales.
             */

            pesosPropuestos,


            sumaPesosActuales:

                this.sumarPesos(
                    pesosBase
                ),


            sumaPesosPropuestosBrutos:

                this.sumarPesos(
                    pesosPropuestosBrutos
                ),


            sumaPesosPropuestosLimitados:

                this.sumarPesos(
                    pesosPropuestosLimitados
                ),


            sumaPesosPropuestos:

                this.sumarPesos(
                    pesosPropuestos
                ),


            detalles,


            motoresAumentados,


            motoresReducidos,


            motoresSinCambio,


            /*
             * Ranking de simulaciones.
             *
             * Permite observar qué motores
             * tenderían a subir o bajar aunque
             * todavía no se apliquen cambios.
             */

            rankingSimulacion:

                this.generarRankingSimulacion(
                    detalles
                ),


            resumen:

                this.generarResumen(

                    detalles,

                    datosSuficientes,

                    cantidadEvaluaciones,

                    minimoEvaluaciones,

                    normalizacionAplicada

                ),


            advertencias:

                this.generarAdvertencias(

                    evolucion,

                    datosSuficientes,

                    cantidadEvaluaciones,

                    minimoEvaluaciones,

                    pesosBase

                )

        };


        this.ultimaOptimizacion =
            optimizacion;


        return optimizacion;

    }


    /*================================================================
        CALCULAR AJUSTE INDIVIDUAL
    ================================================================*/

    calcularAjusteMotor(
        clave,
        pesoActual,
        datosMotor,
        datosSuficientes
    ) {

        /*
         * Si no existen datos del motor,
         * se mantiene el peso.
         */

        if (
            !datosMotor
        ) {

            return {

                motor:
                    clave,


                pesoActual,


                indiceDiscriminacion:
                    0,


                indiceReciente:
                    0,


                variacionIndice:
                    0,


                tendencia:
                    "sin_datos",


                estado:
                    "sin_datos",


                consistencia:
                    0,


                consistente:
                    false,


                ajusteIndice:
                    0,


                ajusteVariacion:
                    0,


                ajusteTendencia:
                    0,


                ajusteConsistencia:
                    0,


                ajustePenalizacion:
                    0,


                ajusteTotalBruto:
                    0,


                ajusteLimitado:
                    0,


                ajusteAplicado:
                    0,


                pesoPropuestoBruto:
                    pesoActual,


                pesoPropuestoLimitado:
                    pesoActual,


                pesoNormalizado:
                    pesoActual,


                variacionFinal:
                    0,


                simulacionVariacion:
                    0,


                motivo:

                    "No existen datos evolutivos suficientes para este motor."

            };

        }


        /*------------------------------------------------------------
            DATOS DEL MOTOR
        ------------------------------------------------------------*/

        const indiceHistorico =
            this.numeroSeguro(

                datosMotor
                    .promedioIndiceDiscriminacion

            );


        const indiceReciente =
            this.numeroSeguro(

                datosMotor
                    .promedioIndiceReciente,

                indiceHistorico

            );


        const variacionIndice =
            this.numeroSeguro(

                datosMotor
                    .variacionIndiceReciente

            );


        const consistencia =
            this.numeroSeguro(

                datosMotor
                    .consistencia

            );


        const tendencia =

            datosMotor
                .tendenciaIndiceDiscriminacion
                ?.tendencia ||

            "estable";


        const estado =

            datosMotor
                .estado ||

            "estable";


        const consistente =

            datosMotor
                .consistente ===
                true;


        /*------------------------------------------------------------
            COMPONENTE 1
            ÍNDICE DISCRIMINATORIO
        ------------------------------------------------------------*/

        const ajusteIndice =

            indiceReciente *

            this.configuracion
                .factorIndice;


        /*------------------------------------------------------------
            COMPONENTE 2
            VARIACIÓN RECIENTE
        ------------------------------------------------------------*/

        const ajusteVariacion =

            variacionIndice *

            this.configuracion
                .factorVariacion;


        /*------------------------------------------------------------
            COMPONENTE 3
            TENDENCIA
        ------------------------------------------------------------*/

        let ajusteTendencia =
            0;


        if (
            tendencia ===
            "ascendente"
        ) {

            ajusteTendencia +=

                this.configuracion
                    .bonoMejora;

        }


        else if (
            tendencia ===
            "descendente"
        ) {

            ajusteTendencia -=

                this.configuracion
                    .penalizacionDeterioro;

        }


        /*
         * Estado evolutivo adicional.
         */

        if (
            estado ===
            "mejorando"
        ) {

            ajusteTendencia +=

                this.configuracion
                    .bonoMejora *
                0.50;

        }


        else if (
            estado ===
            "empeorando"
        ) {

            ajusteTendencia -=

                this.configuracion
                    .penalizacionDeterioro *
                0.50;

        }


        /*------------------------------------------------------------
            COMPONENTE 4
            CONSISTENCIA
        ------------------------------------------------------------*/

        let ajusteConsistencia =
            0;


        if (
            consistente
        ) {

            ajusteConsistencia +=

                this.configuracion
                    .bonoConsistencia;

        }


        /*
         * Señal de baja consistencia.
         */

        if (
            consistencia < 25
        ) {

            ajusteConsistencia -=
                0.25;

        }


        /*------------------------------------------------------------
            COMPONENTE 5
            PENALIZACIONES
        ------------------------------------------------------------*/

        let ajustePenalizacion =
            0;


        if (
            indiceReciente < 0
        ) {

            ajustePenalizacion -=

                this.configuracion
                    .penalizacionIndiceNegativo;

        }


        if (
            estado ===
            "debil_historico"
        ) {

            ajustePenalizacion -=

                this.configuracion
                    .penalizacionIndiceNegativo;

        }


        /*------------------------------------------------------------
            AJUSTE BRUTO
        ------------------------------------------------------------*/

        const ajusteTotalBruto =

            ajusteIndice +

            ajusteVariacion +

            ajusteTendencia +

            ajusteConsistencia +

            ajustePenalizacion;


        /*------------------------------------------------------------
            AJUSTE LIMITADO
        ------------------------------------------------------------*/

        const ajusteLimitado =

            this.limitar(

                ajusteTotalBruto,

                -this.configuracion
                    .maximoCambioPorCiclo,

                this.configuracion
                    .maximoCambioPorCiclo

            );


        /*
         * CAMBIO v1.0.1
         *
         * ajusteLimitado:
         *     simulación técnicamente admisible.
         *
         * ajusteAplicado:
         *     ajuste operativo.
         *
         * Si todavía no hay evidencia:
         *     ajusteAplicado = 0.
         */

        const ajusteAplicado =

            datosSuficientes

                ? ajusteLimitado

                : 0;


        /*------------------------------------------------------------
            PESO TEÓRICO
        ------------------------------------------------------------*/

        const pesoPropuestoBruto =

            this.limitar(

                pesoActual +
                ajusteTotalBruto,

                this.configuracion
                    .pesoMinimo,

                this.configuracion
                    .pesoMaximo

            );


        /*------------------------------------------------------------
            PESO LIMITADO / OPERATIVO
        ------------------------------------------------------------*/

        const pesoPropuestoLimitado =

            this.limitar(

                pesoActual +
                ajusteAplicado,

                this.configuracion
                    .pesoMinimo,

                this.configuracion
                    .pesoMaximo

            );


        return {

            motor:
                clave,


            pesoActual:

                this.redondear(
                    pesoActual,
                    6
                ),


            indiceDiscriminacion:

                this.redondear(
                    indiceHistorico,
                    6
                ),


            indiceReciente:

                this.redondear(
                    indiceReciente,
                    6
                ),


            variacionIndice:

                this.redondear(
                    variacionIndice,
                    6
                ),


            tendencia,


            estado,


            consistencia:

                this.redondear(
                    consistencia,
                    6
                ),


            consistente,


            ajusteIndice:

                this.redondear(
                    ajusteIndice,
                    6
                ),


            ajusteVariacion:

                this.redondear(
                    ajusteVariacion,
                    6
                ),


            ajusteTendencia:

                this.redondear(
                    ajusteTendencia,
                    6
                ),


            ajusteConsistencia:

                this.redondear(
                    ajusteConsistencia,
                    6
                ),


            ajustePenalizacion:

                this.redondear(
                    ajustePenalizacion,
                    6
                ),


            ajusteTotalBruto:

                this.redondear(
                    ajusteTotalBruto,
                    6
                ),


            /*
             * Ajuste teórico después del
             * límite máximo por ciclo.
             */

            ajusteLimitado:

                this.redondear(
                    ajusteLimitado,
                    6
                ),


            /*
             * Ajuste realmente habilitado.
             */

            ajusteAplicado:

                this.redondear(
                    ajusteAplicado,
                    6
                ),


            /*
             * Simulación.
             */

            pesoPropuestoBruto:

                this.redondear(
                    pesoPropuestoBruto,
                    6
                ),


            /*
             * Peso operativo previo a normalización.
             */

            pesoPropuestoLimitado:

                this.redondear(
                    pesoPropuestoLimitado,
                    6
                ),


            pesoNormalizado:
                null,


            variacionFinal:
                null,


            simulacionVariacion:

                this.redondear(

                    pesoPropuestoBruto -
                    pesoActual,

                    6

                ),


            motivo:

                this.generarMotivoMotor({

                    indiceReciente,

                    variacionIndice,

                    tendencia,

                    estado,

                    consistencia,

                    consistente,

                    datosSuficientes

                })

        };

    }


    /*================================================================
        GENERAR MOTIVO
    ================================================================*/

    generarMotivoMotor(
        datos
    ) {

        const motivos = [];


        if (
            !datos.datosSuficientes
        ) {

            motivos.push(
                "La señal se conserva únicamente como simulación porque todavía no existe evidencia suficiente para modificar pesos."
            );

        }


        if (
            datos.indiceReciente > 0
        ) {

            motivos.push(
                "El índice discriminatorio reciente es positivo."
            );

        }


        else if (
            datos.indiceReciente < 0
        ) {

            motivos.push(
                "El índice discriminatorio reciente es negativo."
            );

        }


        if (
            datos.variacionIndice > 0
        ) {

            motivos.push(
                "El rendimiento reciente mejoró respecto del período anterior."
            );

        }


        else if (
            datos.variacionIndice < 0
        ) {

            motivos.push(
                "El rendimiento reciente se deterioró respecto del período anterior."
            );

        }


        if (
            datos.tendencia ===
            "ascendente"
        ) {

            motivos.push(
                "La tendencia temporal es ascendente."
            );

        }


        else if (
            datos.tendencia ===
            "descendente"
        ) {

            motivos.push(
                "La tendencia temporal es descendente."
            );

        }


        if (
            datos.consistente
        ) {

            motivos.push(
                "El motor presenta consistencia histórica."
            );

        }


        if (
            datos.estado ===
            "debil_historico"
        ) {

            motivos.push(
                "El motor presenta debilidad histórica."
            );

        }


        if (
            motivos.length === 0
        ) {

            motivos.push(
                "No se detectaron señales relevantes para modificar el peso."
            );

        }


        return motivos.join(
            " "
        );

    }


    /*================================================================
        RANKING DE SIMULACIÓN
    ================================================================*/

    generarRankingSimulacion(
        detalles
    ) {

        return Object.values(
            detalles
        )
        .map(

            item => ({

                motor:
                    item.motor,

                pesoActual:
                    item.pesoActual,

                ajusteBruto:
                    item.ajusteTotalBruto,

                ajusteLimitado:
                    item.ajusteLimitado,

                pesoSimulado:
                    item.pesoPropuestoBruto,

                indiceReciente:
                    item.indiceReciente,

                variacionIndice:
                    item.variacionIndice,

                tendencia:
                    item.tendencia,

                estado:
                    item.estado

            })

        )
        .sort(

            (a, b) => {

                if (
                    b.ajusteBruto !==
                    a.ajusteBruto
                ) {

                    return (

                        b.ajusteBruto -
                        a.ajusteBruto

                    );

                }


                return a.motor
                    .localeCompare(
                        b.motor
                    );

            }

        );

    }


    /*================================================================
        NORMALIZAR PESOS DE ENTRADA
    ================================================================*/

    normalizarPesosEntrada(
        pesos
    ) {

        if (
            !pesos ||
            typeof pesos !==
                "object"
        ) {

            return {};

        }


        const resultado = {};


        for (
            const [
                clave,
                valor
            ]
            of Object.entries(
                pesos
            )
        ) {

            const peso =
                Number(
                    valor
                );


            if (
                Number.isFinite(
                    peso
                ) &&
                peso >= 0
            ) {

                resultado[clave] =
                    peso;

            }

        }


        return resultado;

    }


    /*================================================================
        NORMALIZAR PESOS FINALES
    ================================================================*/

    normalizarPesosFinales(
        pesos,
        objetivo = 100
    ) {

        const claves =
            Object.keys(
                pesos
            );


        if (
            claves.length === 0
        ) {

            return {};

        }


        const suma =
            this.sumarPesos(
                pesos
            );


        if (
            suma <= 0
        ) {

            return {
                ...pesos
            };

        }


        const resultado = {};


        for (
            const clave
            of claves
        ) {

            const valor =

                pesos[clave] /
                suma *
                objetivo;


            resultado[clave] =

                this.redondear(
                    valor,
                    6
                );

        }


        /*
         * Corregir diferencia de redondeo.
         */

        const sumaNormalizada =
            this.sumarPesos(
                resultado
            );


        const diferencia =

            this.redondear(

                objetivo -
                sumaNormalizada,

                6

            );


        if (
            Math.abs(
                diferencia
            ) >
            0.0000001
        ) {

            /*
             * Aplicamos la corrección al motor
             * con mayor peso para minimizar
             * impacto relativo.
             */

            const claveMayor =

                claves.reduce(

                    (
                        mejor,
                        clave
                    ) =>

                        resultado[clave] >
                        resultado[mejor]

                            ? clave

                            : mejor,

                    claves[0]

                );


            resultado[claveMayor] =

                this.redondear(

                    resultado[claveMayor] +
                    diferencia,

                    6

                );

        }


        return resultado;

    }


    /*================================================================
        OBTENER MOTORES SEGÚN VARIACIÓN FINAL
    ================================================================*/

    obtenerMotoresPorVariacion(
        detalles,
        condicion
    ) {

        return Object.values(
            detalles
        )
        .filter(

            item =>

                condicion(

                    this.numeroSeguro(
                        item.variacionFinal
                    )

                )

        )
        .map(

            item =>
                item.motor

        );

    }


    /*================================================================
        GENERAR RESUMEN
    ================================================================*/

    generarResumen(
        detalles,
        datosSuficientes,
        cantidadEvaluaciones,
        minimoEvaluaciones,
        normalizacionAplicada
    ) {

        const lista =
            Object.values(
                detalles
            );


        const cambiosSimulados =

            lista.filter(

                item =>

                    Math.abs(
                        item.ajusteTotalBruto
                    ) >
                    0.000001

            ).length;


        const cambiosLimitados =

            lista.filter(

                item =>

                    Math.abs(
                        item.ajusteLimitado
                    ) >
                    0.000001

            ).length;


        const cambiosAplicados =

            lista.filter(

                item =>

                    Math.abs(
                        item.variacionFinal
                    ) >
                    0.000001

            ).length;


        return {

            cantidadMotores:
                lista.length,


            cantidadEvaluaciones,


            minimoEvaluaciones,


            datosSuficientes,


            normalizacionAplicada,


            cambiosSimulados,


            cambiosLimitados,


            cambiosAplicados,


            modo:

                datosSuficientes

                    ? "propuesta_aplicable"

                    : "solo_simulacion",


            descripcion:

                datosSuficientes

                    ? "La cantidad mínima de evaluaciones fue alcanzada. Los ajustes fueron limitados, normalizados y preparados como propuesta aplicable."

                    : "Todavía no existe suficiente evidencia. Se calculan señales y ajustes simulados, pero los pesos operativos permanecen sin cambios."

        };

    }


    /*================================================================
        GENERAR ADVERTENCIAS
    ================================================================*/

    generarAdvertencias(
        evolucion,
        datosSuficientes,
        cantidadEvaluaciones,
        minimoEvaluaciones,
        pesosActuales
    ) {

        const advertencias = [];


        if (
            !datosSuficientes
        ) {

            advertencias.push({

                tipo:
                    "evidencia_insuficiente",

                descripcion:

                    `Se requieren al menos ${minimoEvaluaciones} evaluaciones. Actualmente existen ${cantidadEvaluaciones}. Ningún peso operativo será modificado.`

            });

        }


        if (
            evolucion.datosSuficientes ===
            false
        ) {

            advertencias.push({

                tipo:
                    "evolucion_no_habilitada",

                descripcion:

                    "MotorEvolucion todavía no considera suficiente la evidencia acumulada."

            });

        }


        const sumaActual =
            this.sumarPesos(
                pesosActuales
            );


        if (
            Math.abs(
                sumaActual -
                this.configuracion
                    .sumaObjetivoPesos
            ) >
            0.000001
        ) {

            advertencias.push({

                tipo:
                    "pesos_actuales_no_normalizados",

                sumaActual,

                sumaObjetivo:

                    this.configuracion
                        .sumaObjetivoPesos,

                descripcion:

                    datosSuficientes

                        ? "Los pesos actuales no suman el objetivo configurado. Si la propuesta es aplicable, los pesos finales serán normalizados."

                        : "Los pesos actuales no suman el objetivo configurado, pero no serán normalizados mientras exista evidencia insuficiente."

            });

        }


        if (
            Array.isArray(
                evolucion.motoresEnDeterioro
            ) &&
            evolucion.motoresEnDeterioro.length > 0
        ) {

            advertencias.push({

                tipo:
                    "motores_en_deterioro",

                motores:

                    [
                        ...evolucion
                            .motoresEnDeterioro
                    ],

                descripcion:

                    "Existen motores con deterioro reciente. Sus señales deben revisarse antes de aplicar cambios."

            });

        }


        advertencias.push({

            tipo:
                "advertencia_estadistica",

            descripcion:

                "Los ajustes se basan en comportamiento histórico del modelo y no representan probabilidades de resultados futuros."

        });


        return advertencias;

    }


    /*================================================================
        VALIDAR EVOLUCIÓN
    ================================================================*/

    validarEvolucion(
        evolucion
    ) {

        if (
            !evolucion ||
            typeof evolucion !==
                "object"
        ) {

            throw new Error(
                "No se recibió una evolución válida."
            );

        }


        if (
            !evolucion.motores ||
            typeof evolucion.motores !==
                "object"
        ) {

            throw new Error(
                "La evolución no contiene información de motores."
            );

        }


        return true;

    }


    /*================================================================
        SUMAR PESOS
    ================================================================*/

    sumarPesos(
        pesos
    ) {

        return this.redondear(

            Object.values(
                pesos
            ).reduce(

                (
                    suma,
                    valor
                ) =>

                    suma +
                    this.numeroSeguro(
                        valor
                    ),

                0

            ),

            6

        );

    }


    /*================================================================
        LIMITAR
    ================================================================*/

    limitar(
        valor,
        minimo,
        maximo
    ) {

        return Math.min(

            Math.max(
                valor,
                minimo
            ),

            maximo

        );

    }


    /*================================================================
        NÚMERO SEGURO
    ================================================================*/

    numeroSeguro(
        valor,
        defecto = 0
    ) {

        const numero =
            Number(
                valor
            );


        return Number.isFinite(
            numero
        )

            ? numero

            : defecto;

    }


    /*================================================================
        REDONDEAR
    ================================================================*/

    redondear(
        valor,
        decimales = 4
    ) {

        const numero =
            this.numeroSeguro(
                valor
            );


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
        GENERAR ID
    ================================================================*/

    generarId() {

        const fecha =

            new Date()

                .toISOString()

                .replace(
                    /[^0-9]/g,
                    ""
                );


        const aleatorio =

            Math.random()

                .toString(36)

                .substring(
                    2,
                    8
                );


        return (
            `optimizacion_${fecha}_${aleatorio}`
        );

    }


    /*================================================================
        OBTENER ÚLTIMA OPTIMIZACIÓN
    ================================================================*/

    obtenerUltimaOptimizacion() {

        return this.ultimaOptimizacion;

    }


    /*================================================================
        OBTENER ESTADO
    ================================================================*/

    obtenerEstado(
        cantidadEvaluaciones = 0
    ) {

        const cantidad =
            this.numeroSeguro(
                cantidadEvaluaciones
            );


        return {

            nombre:
                this.nombre,


            version:
                this.version,


            minimoEvaluaciones:

                this.configuracion
                    .minimoEvaluaciones,


            maximoCambioPorCiclo:

                this.configuracion
                    .maximoCambioPorCiclo,


            pesoMinimo:

                this.configuracion
                    .pesoMinimo,


            pesoMaximo:

                this.configuracion
                    .pesoMaximo,


            sumaObjetivoPesos:

                this.configuracion
                    .sumaObjetivoPesos,


            cantidadEvaluaciones:
                cantidad,


            datosSuficientes:

                cantidad >=
                this.configuracion
                    .minimoEvaluaciones,


            optimizacionGenerada:

                this.ultimaOptimizacion !==
                null

        };

    }


    /*================================================================
        LIMPIAR
    ================================================================*/

    limpiar() {

        this.ultimaOptimizacion =
            null;

    }

}