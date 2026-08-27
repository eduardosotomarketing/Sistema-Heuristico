/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * js/services/EvolucionService.js
 *
 * Versión:
 * 1.0.0
 *
 * Propósito:
 *
 * Persistir snapshots generados por MotorEvolucion.
 *
 * Estructura Firestore:
 *
 * evoluciones/{evolucionId}
 *
 *     Documento principal:
 *
 *     - id
 *     - nombre
 *     - version
 *     - generadoEn
 *     - cantidadEvaluaciones
 *     - minimoEvaluaciones
 *     - datosSuficientes
 *     - rendimientoGeneral
 *     - comparacionPeriodos
 *     - tendencias
 *     - mejorMotorHistorico
 *     - mejorMotorReciente
 *     - motoresConsistentes
 *     - motoresEnMejora
 *     - motoresEnDeterioro
 *     - cambios
 *     - señalesOptimizacion
 *     - periodos
 *
 *
 * evoluciones/{evolucionId}/motores/{nombreMotor}
 *
 *     - motor
 *     - posicionEvolutiva
 *     - cantidadEvaluaciones
 *     - promedioIndiceDiscriminacion
 *     - promedioIndiceAnterior
 *     - promedioIndiceReciente
 *     - variacionIndiceReciente
 *     - promedioVentajaScore
 *     - promedioVentajaScoreReciente
 *     - promedioVentajaConfianza
 *     - tendenciaIndiceDiscriminacion
 *     - consistencia
 *     - consistente
 *     - estado
 *
 *
 * IMPORTANTE:
 *
 * No se persiste el historial completo interno de cada motor.
 *
 * Ese historial ya existe en la colección "evaluaciones" y puede
 * reconstruirse mediante MotorEvolucion.
 *
 * EvolucionService almacena snapshots explicables del estado del
 * modelo en un momento determinado.
 *
 **********************************************************************/


import {

    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    limit,
    writeBatch

} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


import {

    db

} from "../firebase.js";


/*====================================================================
    COLECCIONES
====================================================================*/

const COLECCION =
    "evoluciones";


const SUBCOLECCION_MOTORES =
    "motores";


export default class EvolucionService {


    /*================================================================
        CONSTRUCTOR
    ================================================================*/

    constructor() {

        this.coleccion =
            COLECCION;


        this.subcoleccionMotores =
            SUBCOLECCION_MOTORES;


        this.version =
            "1.0.0";

    }


    /*================================================================
        GUARDAR
    ================================================================*/

    async guardar(
        evolucion
    ) {

        try {

            if (

                !evolucion ||

                typeof evolucion !==
                    "object"

            ) {

                throw new Error(
                    "La evolución recibida no es válida."
                );

            }


            const evolucionPlana =
                this.convertirObjetoPlano(
                    evolucion
                );


            const id =

                evolucionPlana.id ||

                this.generarId();


            evolucionPlana.id =
                id;


            /*
             * Motores se guardan separados.
             */

            const motores =

                evolucionPlana.motores &&
                typeof evolucionPlana.motores ===
                    "object"

                    ? evolucionPlana.motores

                    : {};


            /*
             * Documento principal compacto.
             */

            const principal =

                this.prepararDocumentoPrincipal(

                    evolucionPlana

                );


            const referencia =

                doc(

                    db,

                    this.coleccion,

                    id

                );


            await setDoc(

                referencia,

                principal

            );


            /*
             * Guardamos estado de motores.
             */

            const cantidadMotores =

                await this.guardarMotores(

                    id,

                    motores

                );


            console.log(

                "Evolución guardada:",

                id,

                `(${cantidadMotores} motores)`

            );


            return {

                ...principal,

                motores:

                    this.compactarMotoresObjeto(
                        motores
                    )

            };

        }

        catch (error) {

            console.error(
                "Error guardando evolución:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        PREPARAR DOCUMENTO PRINCIPAL
    ================================================================*/

    prepararDocumentoPrincipal(
        evolucion
    ) {

        const ahora =

            new Date()
                .toISOString();


        const rankingMotores =

            Array.isArray(
                evolucion.rankingMotores
            )

                ? evolucion.rankingMotores
                    .map(

                        motor =>

                            this.compactarMotor(
                                motor
                            )

                    )

                : [];


        const periodos =

            Array.isArray(
                evolucion.periodos
            )

                ? evolucion.periodos.map(

                    periodo =>
                        this.compactarPeriodo(
                            periodo
                        )

                )

                : [];


        return {

            id:
                evolucion.id,


            nombre:

                evolucion.nombre ||

                "MotorEvolucion",


            version:

                evolucion.version ||

                null,


            versionServicio:
                this.version,


            generadoEn:

                evolucion.generadoEn ||

                ahora,


            cantidadEvaluaciones:

                this.numeroSeguro(

                    evolucion
                        .cantidadEvaluaciones

                ),


            minimoEvaluaciones:

                this.numeroSeguro(

                    evolucion
                        .minimoEvaluaciones,

                    20

                ),


            datosSuficientes:

                evolucion
                    .datosSuficientes ===
                    true,


            rendimientoGeneral:

                this.convertirObjetoPlano(

                    evolucion
                        .rendimientoGeneral ||
                    {}

                ),


            comparacionPeriodos:

                this.convertirObjetoPlano(

                    evolucion
                        .comparacionPeriodos ||
                    {}

                ),


            tendencias:

                this.convertirObjetoPlano(

                    evolucion
                        .tendencias ||
                    {}

                ),


            mejorMotorHistorico:

                evolucion
                    .mejorMotorHistorico ??
                null,


            mejorMotorReciente:

                evolucion
                    .mejorMotorReciente ??
                null,


            motoresConsistentes:

                Array.isArray(
                    evolucion.motoresConsistentes
                )

                    ? evolucion.motoresConsistentes

                    : [],


            motoresEnMejora:

                Array.isArray(
                    evolucion.motoresEnMejora
                )

                    ? evolucion.motoresEnMejora

                    : [],


            motoresEnDeterioro:

                Array.isArray(
                    evolucion.motoresEnDeterioro
                )

                    ? evolucion.motoresEnDeterioro

                    : [],


            /*
             * Ranking compacto.
             */

            rankingMotores,


            /*
             * No deberían ser demasiado grandes,
             * pero los limpiamos igualmente.
             */

            cambios:

                this.compactarLista(

                    evolucion.cambios

                ),


            señalesOptimizacion:

                this.compactarLista(

                    evolucion
                        .señalesOptimizacion

                ),


            periodos,


            cantidadMotores:

                evolucion.motores &&
                typeof evolucion.motores ===
                    "object"

                    ? Object.keys(
                        evolucion.motores
                    ).length

                    : 0,


            motoresSeparados:
                true,


            subcoleccionMotores:

                this.subcoleccionMotores,


            /*
             * No guardamos resumenIA completo porque
             * duplica gran parte del análisis.
             *
             * Guardamos solamente una versión compacta.
             */

            resumenIA:

                this.compactarResumenIA(

                    evolucion.resumenIA

                ),


            creado:

                evolucion.creado ||

                ahora,


            modificado:
                ahora

        };

    }


    /*================================================================
        GUARDAR MOTORES
    ================================================================*/

    async guardarMotores(
        evolucionId,
        motores
    ) {

        if (

            !motores ||

            typeof motores !==
                "object"

        ) {

            return 0;

        }


        const claves =

            Object.keys(
                motores
            );


        if (
            claves.length === 0
        ) {

            return 0;

        }


        const batch =

            writeBatch(
                db
            );


        let cantidad =
            0;


        for (
            const clave
            of claves
        ) {

            const motor =
                motores[clave];


            if (
                !motor
            ) {

                continue;

            }


            const documento =

                this.compactarMotor(

                    motor

                );


            documento.motor =

                documento.motor ||

                clave;


            documento.evolucionId =
                evolucionId;


            const referencia =

                doc(

                    db,

                    this.coleccion,

                    evolucionId,

                    this.subcoleccionMotores,

                    String(clave)

                );


            batch.set(

                referencia,

                documento

            );


            cantidad++;

        }


        await batch.commit();


        return cantidad;

    }


    /*================================================================
        COMPACTAR MOTOR
    ================================================================*/

    compactarMotor(
        motor
    ) {

        if (

            !motor ||

            typeof motor !==
                "object"

        ) {

            return {};

        }


        return {

            motor:

                motor.motor ??
                null,


            posicionEvolutiva:

                this.numeroSeguro(

                    motor.posicionEvolutiva,

                    null

                ),


            cantidadEvaluaciones:

                this.numeroSeguro(

                    motor.cantidadEvaluaciones

                ),


            promedioTasaAcierto:

                this.numeroSeguro(

                    motor.promedioTasaAcierto

                ),


            promedioVentajaScore:

                this.numeroSeguro(

                    motor.promedioVentajaScore

                ),


            promedioVentajaScoreAnterior:

                this.numeroSeguro(

                    motor
                        .promedioVentajaScoreAnterior

                ),


            promedioVentajaScoreReciente:

                this.numeroSeguro(

                    motor
                        .promedioVentajaScoreReciente

                ),


            variacionVentajaScore:

                this.numeroSeguro(

                    motor.variacionVentajaScore

                ),


            promedioVentajaConfianza:

                this.numeroSeguro(

                    motor
                        .promedioVentajaConfianza

                ),


            promedioVentajaConfianzaAnterior:

                this.numeroSeguro(

                    motor
                        .promedioVentajaConfianzaAnterior

                ),


            promedioVentajaConfianzaReciente:

                this.numeroSeguro(

                    motor
                        .promedioVentajaConfianzaReciente

                ),


            variacionVentajaConfianza:

                this.numeroSeguro(

                    motor
                        .variacionVentajaConfianza

                ),


            promedioIndiceDiscriminacion:

                this.numeroSeguro(

                    motor
                        .promedioIndiceDiscriminacion

                ),


            promedioIndiceAnterior:

                this.numeroSeguro(

                    motor
                        .promedioIndiceAnterior

                ),


            promedioIndiceReciente:

                this.numeroSeguro(

                    motor
                        .promedioIndiceReciente

                ),


            variacionIndiceReciente:

                this.numeroSeguro(

                    motor
                        .variacionIndiceReciente

                ),


            tendenciaTasa:

                this.compactarTendencia(

                    motor.tendenciaTasa

                ),


            tendenciaAciertos:

                this.compactarTendencia(

                    motor.tendenciaAciertos

                ),


            tendenciaVentajaScore:

                this.compactarTendencia(

                    motor
                        .tendenciaVentajaScore

                ),


            tendenciaVentajaConfianza:

                this.compactarTendencia(

                    motor
                        .tendenciaVentajaConfianza

                ),


            tendenciaIndiceDiscriminacion:

                this.compactarTendencia(

                    motor
                        .tendenciaIndiceDiscriminacion

                ),


            ventanaComparacion:

                this.convertirObjetoPlano(

                    motor
                        .ventanaComparacion ||
                    {}

                ),


            estado:

                motor.estado ??
                null,


            consistencia:

                this.numeroSeguro(

                    motor.consistencia

                ),


            consistente:

                motor.consistente ===
                true,


            /*
             * Indicamos explícitamente que
             * el historial detallado vive en
             * evaluaciones.
             */

            historialIncluido:
                false

        };

    }


    /*================================================================
        COMPACTAR MOTORES COMO OBJETO
    ================================================================*/

    compactarMotoresObjeto(
        motores
    ) {

        const resultado = {};


        if (

            !motores ||

            typeof motores !==
                "object"

        ) {

            return resultado;

        }


        for (
            const clave
            of Object.keys(
                motores
            )
        ) {

            resultado[clave] =

                this.compactarMotor(

                    motores[clave]

                );

        }


        return resultado;

    }


    /*================================================================
        COMPACTAR TENDENCIA
    ================================================================*/

    compactarTendencia(
        tendencia
    ) {

        if (

            !tendencia ||

            typeof tendencia !==
                "object"

        ) {

            return {

                cantidad: 0,

                promedio: 0,

                minimo: 0,

                maximo: 0,

                pendiente: 0,

                tendencia:
                    "sin_datos"

            };

        }


        return {

            cantidad:

                this.numeroSeguro(
                    tendencia.cantidad
                ),


            promedio:

                this.numeroSeguro(
                    tendencia.promedio
                ),


            minimo:

                this.numeroSeguro(
                    tendencia.minimo
                ),


            maximo:

                this.numeroSeguro(
                    tendencia.maximo
                ),


            pendiente:

                this.numeroSeguro(
                    tendencia.pendiente
                ),


            tendencia:

                tendencia.tendencia ??
                "sin_datos"

        };

    }


    /*================================================================
        COMPACTAR PERÍODO
    ================================================================*/

    compactarPeriodo(
        periodo
    ) {

        if (

            !periodo ||

            typeof periodo !==
                "object"

        ) {

            return {};

        }


        const evaluaciones =

            Array.isArray(
                periodo.evaluaciones
            )

                ? periodo.evaluaciones

                : [];


        return {

            numero:

                this.numeroSeguro(
                    periodo.numero
                ),


            nombre:

                periodo.nombre ??
                null,


            indiceInicio:

                this.numeroSeguro(
                    periodo.indiceInicio,
                    null
                ),


            indiceFin:

                this.numeroSeguro(
                    periodo.indiceFin,
                    null
                ),


            cantidad:

                this.numeroSeguro(
                    periodo.cantidad
                ),


            desde:

                evaluaciones.length > 0

                    ? evaluaciones[0]
                        ?.fechaEvaluacion ??
                    null

                    : null,


            hasta:

                evaluaciones.length > 0

                    ? evaluaciones[
                        evaluaciones.length - 1
                    ]?.fechaEvaluacion ??
                    null

                    : null,


            resumen:

                this.convertirObjetoPlano(

                    periodo.resumen ||
                    {}

                )

        };

    }


    /*================================================================
        COMPACTAR LISTA
    ================================================================*/

    compactarLista(
        lista
    ) {

        if (
            !Array.isArray(
                lista
            )
        ) {

            return [];

        }


        return lista.map(

            item =>

                this.convertirObjetoPlano(
                    item
                )

        );

    }


    /*================================================================
        COMPACTAR RESUMEN IA
    ================================================================*/

    compactarResumenIA(
        resumenIA
    ) {

        if (

            !resumenIA ||

            typeof resumenIA !==
                "object"

        ) {

            return {};

        }


        return {

            tipo:

                resumenIA.tipo ??
                null,


            version:

                resumenIA.version ??
                null,


            fecha:

                resumenIA.fecha ??
                null,


            cantidadEvaluaciones:

                this.numeroSeguro(

                    resumenIA
                        .cantidadEvaluaciones

                ),


            minimoEvaluaciones:

                this.numeroSeguro(

                    resumenIA
                        .minimoEvaluaciones

                ),


            datosSuficientes:

                resumenIA
                    .datosSuficientes ===
                    true,


            mejorMotorHistorico:

                resumenIA
                    .mejorMotorHistorico ??
                null,


            mejorMotorReciente:

                resumenIA
                    .mejorMotorReciente ??
                null,


            motoresConsistentes:

                Array.isArray(
                    resumenIA.motoresConsistentes
                )

                    ? resumenIA.motoresConsistentes

                    : [],


            motoresEnMejora:

                Array.isArray(
                    resumenIA.motoresEnMejora
                )

                    ? resumenIA.motoresEnMejora

                    : [],


            motoresEnDeterioro:

                Array.isArray(
                    resumenIA.motoresEnDeterioro
                )

                    ? resumenIA.motoresEnDeterioro

                    : [],


            interpretacionBase:

                this.convertirObjetoPlano(

                    resumenIA
                        .interpretacionBase ||
                    {}

                ),


            advertencia:

                resumenIA.advertencia ??
                null

        };

    }


    /*================================================================
        OBTENER POR ID
    ================================================================*/

    async obtener(
        id,
        opciones = {}
    ) {

        try {

            if (!id) {

                return null;

            }


            const incluirMotores =

                opciones.incluirMotores !==
                false;


            const referencia =

                doc(

                    db,

                    this.coleccion,

                    String(id)

                );


            const snapshot =

                await getDoc(
                    referencia
                );


            if (
                !snapshot.exists()
            ) {

                return null;

            }


            const principal = {

                id:
                    snapshot.id,

                ...snapshot.data()

            };


            if (
                !incluirMotores
            ) {

                return principal;

            }


            const motores =

                await this.obtenerMotores(
                    id
                );


            return {

                ...principal,

                motores

            };

        }

        catch (error) {

            console.error(
                "Error obteniendo evolución:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        OBTENER MOTORES
    ================================================================*/

    async obtenerMotores(
        evolucionId
    ) {

        try {

            if (!evolucionId) {

                return {};

            }


            const referencia =

                collection(

                    db,

                    this.coleccion,

                    String(
                        evolucionId
                    ),

                    this.subcoleccionMotores

                );


            const snapshot =

                await getDocs(
                    referencia
                );


            const motores = {};


            for (
                const documento
                of snapshot.docs
            ) {

                const datos =
                    documento.data();


                const clave =

                    datos.motor ||

                    documento.id;


                motores[clave] = {

                    ...datos

                };

            }


            return motores;

        }

        catch (error) {

            console.error(
                "Error obteniendo motores de evolución:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        OBTENER TODAS
    ================================================================*/

    async obtenerTodas(
        direccion = "desc"
    ) {

        try {

            const sentido =

                direccion ===
                "asc"

                    ? "asc"

                    : "desc";


            const referencia =

                collection(

                    db,

                    this.coleccion

                );


            const consulta =

                query(

                    referencia,

                    orderBy(
                        "generadoEn",
                        sentido
                    )

                );


            const snapshot =

                await getDocs(
                    consulta
                );


            /*
             * Listado compacto.
             *
             * No cargamos subcolección motores.
             */

            return snapshot.docs.map(

                documento => ({

                    id:
                        documento.id,

                    ...documento.data()

                })

            );

        }

        catch (error) {

            console.error(
                "Error obteniendo evoluciones:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        OBTENER ÚLTIMA
    ================================================================*/

    async obtenerUltima(
        completa = true
    ) {

        try {

            const referencia =

                collection(

                    db,

                    this.coleccion

                );


            const consulta =

                query(

                    referencia,

                    orderBy(
                        "generadoEn",
                        "desc"
                    ),

                    limit(1)

                );


            const snapshot =

                await getDocs(
                    consulta
                );


            if (
                snapshot.empty
            ) {

                return null;

            }


            const documento =
                snapshot.docs[0];


            if (
                completa
            ) {

                return await this.obtener(
                    documento.id
                );

            }


            return {

                id:
                    documento.id,

                ...documento.data()

            };

        }

        catch (error) {

            console.error(
                "Error obteniendo última evolución:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        ACTUALIZAR DOCUMENTO PRINCIPAL
    ================================================================*/

    async actualizar(
        id,
        cambios = {}
    ) {

        try {

            if (!id) {

                throw new Error(
                    "No se recibió ID de evolución."
                );

            }


            const cambiosSeguros = {

                ...cambios

            };


            /*
             * Motores deben persistirse por separado.
             */

            delete cambiosSeguros.motores;


            delete cambiosSeguros.rankingMotores;


            const referencia =

                doc(

                    db,

                    this.coleccion,

                    String(id)

                );


            const datos =

                this.convertirObjetoPlano(
                    cambiosSeguros
                );


            datos.modificado =

                new Date()
                    .toISOString();


            await updateDoc(

                referencia,

                datos

            );


            return await this.obtener(
                id
            );

        }

        catch (error) {

            console.error(
                "Error actualizando evolución:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        EXISTE
    ================================================================*/

    async existe(
        id
    ) {

        try {

            if (!id) {

                return false;

            }


            const referencia =

                doc(

                    db,

                    this.coleccion,

                    String(id)

                );


            const snapshot =

                await getDoc(
                    referencia
                );


            return snapshot.exists();

        }

        catch (error) {

            console.error(
                "Error comprobando evolución:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        ELIMINAR MOTORES
    ================================================================*/

    async eliminarMotores(
        evolucionId
    ) {

        const referencia =

            collection(

                db,

                this.coleccion,

                String(
                    evolucionId
                ),

                this.subcoleccionMotores

            );


        const snapshot =

            await getDocs(
                referencia
            );


        if (
            snapshot.empty
        ) {

            return 0;

        }


        const batch =

            writeBatch(
                db
            );


        let cantidad =
            0;


        for (
            const documento
            of snapshot.docs
        ) {

            batch.delete(
                documento.ref
            );


            cantidad++;

        }


        await batch.commit();


        return cantidad;

    }


    /*================================================================
        ELIMINAR COMPLETA
    ================================================================*/

    async eliminar(
        id
    ) {

        try {

            if (!id) {

                return false;

            }


            /*
             * Firestore no elimina subcolecciones
             * automáticamente.
             */

            await this.eliminarMotores(
                id
            );


            const referencia =

                doc(

                    db,

                    this.coleccion,

                    String(id)

                );


            await deleteDoc(
                referencia
            );


            return true;

        }

        catch (error) {

            console.error(
                "Error eliminando evolución:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        CONTAR
    ================================================================*/

    async contar() {

        const lista =

            await this.obtenerTodas();


        return lista.length;

    }


    /*================================================================
        CONVERTIR OBJETO PLANO
    ================================================================*/

    convertirObjetoPlano(
        valor,
        visitados = new WeakSet()
    ) {

        if (
            valor === null
        ) {

            return null;

        }


        if (
            valor === undefined
        ) {

            return null;

        }


        if (

            typeof valor ===
                "string" ||

            typeof valor ===
                "number" ||

            typeof valor ===
                "boolean"

        ) {

            return valor;

        }


        if (
            valor instanceof Date
        ) {

            return valor
                .toISOString();

        }


        if (
            Array.isArray(
                valor
            )
        ) {

            return valor.map(

                item =>

                    this.convertirObjetoPlano(

                        item,

                        visitados

                    )

            );

        }


        if (
            valor instanceof Map
        ) {

            const objeto = {};


            for (

                const [
                    clave,
                    contenido
                ]

                of valor.entries()

            ) {

                objeto[
                    String(clave)
                ] =

                    this.convertirObjetoPlano(

                        contenido,

                        visitados

                    );

            }


            return objeto;

        }


        if (
            valor instanceof Set
        ) {

            return [

                ...valor

            ].map(

                item =>

                    this.convertirObjetoPlano(

                        item,

                        visitados

                    )

            );

        }


        if (
            typeof valor ===
                "object"
        ) {

            if (
                visitados.has(
                    valor
                )
            ) {

                return null;

            }


            visitados.add(
                valor
            );


            const objeto = {};


            for (

                const [
                    clave,
                    contenido
                ]

                of Object.entries(
                    valor
                )

            ) {

                if (

                    typeof contenido ===
                        "function" ||

                    contenido ===
                        undefined

                ) {

                    continue;

                }


                objeto[clave] =

                    this.convertirObjetoPlano(

                        contenido,

                        visitados

                    );

            }


            visitados.delete(
                valor
            );


            return objeto;

        }


        return null;

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

            `evolucion_${fecha}_${aleatorio}`

        );

    }

}
