/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * js/services/PrediccionService.js
 *
 * Versión:
 * 2.1.1
 *
 * Propósito:
 *
 * Persistir y recuperar predicciones del sistema.
 *
 *
 * ARQUITECTURA
 *
 * predicciones/{prediccionId}
 *
 *      cabecera de la predicción
 *
 * predicciones/{prediccionId}/ranking/{numero}
 *
 *      ranking completo separado en documentos individuales
 *
 *
 * MOTIVO
 *
 * El ranking completo con información de todos los motores
 * puede superar el límite máximo de tamaño de un documento
 * Firestore.
 *
 * Por eso:
 *
 *   - Top 10, Top 20, titulares y suplentes permanecen
 *     en la cabecera.
 *
 *   - rankingCompleto se almacena en una subcolección.
 *
 *
 * NUEVO v2.1.1
 *
 *   - Limpieza recursiva de valores undefined antes de persistir.
 *   - Protección de cabecera Firestore.
 *   - Protección de documentos de ranking.
 *
 *
 * HEREDADO v2.1.0
 *
 *   - obtenerPorSemana()
 *   - obtenerPendientePorSemana()
 *   - existePendientePorSemana()
 *   - guardarSeguro()
 *
 *   - Protección contra predicciones pendientes duplicadas.
 *
 **********************************************************************/


/*====================================================================
    FIREBASE
====================================================================*/

import {

    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    setDoc,
    updateDoc,
    where,
    writeBatch

} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


import {

    db

} from "../firebase.js";


/*====================================================================
    CLASE
====================================================================*/

export default class PrediccionService {


    /*================================================================
        CONSTRUCTOR
    ================================================================*/

    constructor() {

        this.nombre =
            "PrediccionService";


        this.version =
            "2.1.1";


        this.coleccion =
            "predicciones";


        this.subcoleccionRanking =
            "ranking";

    }


    /*================================================================
        LIMPIAR UNDEFINED
        NUEVO v2.1.1
    ================================================================*/

    limpiarUndefined(
        valor
    ) {

        /*
         * Firestore no acepta undefined.
         *
         * En arrays lo convertimos a null para
         * conservar posiciones.
         */

        if (
            valor === undefined
        ) {

            return null;

        }


        /*------------------------------------------------------------
            ARRAYS
        ------------------------------------------------------------*/

        if (
            Array.isArray(
                valor
            )
        ) {

            return valor.map(

                item =>
                    this.limpiarUndefined(
                        item
                    )

            );

        }


        /*------------------------------------------------------------
            OBJETOS PLANOS
        ------------------------------------------------------------*/

        if (
            valor !== null &&
            typeof valor ===
                "object" &&
            Object.getPrototypeOf(
                valor
            ) === Object.prototype
        ) {

            const limpio =
                {};


            for (
                const [
                    clave,
                    contenido
                ]
                of Object.entries(
                    valor
                )
            ) {

                /*
                 * En objetos eliminamos completamente
                 * propiedades undefined.
                 */

                if (
                    contenido === undefined
                ) {

                    continue;

                }


                limpio[
                    clave
                ] =
                    this.limpiarUndefined(
                        contenido
                    );

            }


            return limpio;

        }


        /*
         * Strings, números, booleanos,
         * fechas serializadas, null, etc.
         */

        return valor;

    }


    /*================================================================
        GUARDAR
    ================================================================*/

    async guardar(
        prediccion
    ) {

        try {

            this.validarPrediccion(
                prediccion
            );


            const id =
                String(
                    prediccion.id
                );


            const referencia =
                doc(

                    db,

                    this.coleccion,

                    id

                );


            /*
             * rankingCompleto NO se almacena
             * en la cabecera.
             */

            const {

                rankingCompleto = [],

                ...cabeceraOriginal

            } = prediccion;


            const ranking =
                Array.isArray(
                    rankingCompleto
                )

                    ? rankingCompleto

                    : [];


            const ahora =
                new Date()
                    .toISOString();


            const cabecera = {

                ...cabeceraOriginal,


                id,


                totalRanking:
                    ranking.length,


                rankingSeparado:
                    true,


                persistencia: {

                    ...(
                        cabeceraOriginal
                            .persistencia ||
                        {}
                    ),

                    versionServicio:
                        this.version,

                    actualizadoEn:
                        ahora

                }

            };


            /*
             * creadoEn se establece solamente
             * si todavía no existe.
             */

            if (
                !cabecera
                    .persistencia
                    .creadoEn
            ) {

                cabecera
                    .persistencia
                    .creadoEn =
                        ahora;

            }


            /*--------------------------------------------------------
                LIMPIAR CABECERA
            --------------------------------------------------------*/

            const cabeceraFirestore =
                this.limpiarUndefined(
                    cabecera
                );


            /*--------------------------------------------------------
                CABECERA FIRESTORE
            --------------------------------------------------------*/

            await setDoc(

                referencia,

                cabeceraFirestore,

                {
                    merge:
                        true
                }

            );


            /*--------------------------------------------------------
                RANKING
            --------------------------------------------------------*/

            await this
                .guardarRanking(

                    id,

                    ranking

                );


            console.log(

                `Predicción guardada: ${id} ` +
                `(${ranking.length} elementos de ranking)`

            );


            /*--------------------------------------------------------
                RETORNO COMPLETO
            --------------------------------------------------------*/

            return {

                ...cabeceraFirestore,

                rankingCompleto:

                    ranking.map(

                        item =>
                            this.limpiarUndefined(
                                item
                            )

                    )

            };

        }

        catch (error) {

            console.error(
                "Error guardando predicción:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        GUARDAR SEGURO
    ================================================================*/

    async guardarSeguro(

        prediccion,

        {

            forzarNueva = false,

            incluirRankingExistente = true

        } = {}

    ) {

        this.validarPrediccion(
            prediccion
        );


        const semanaObjetivo =
            Number(
                prediccion
                    .semanaObjetivo
            );


        /*------------------------------------------------------------
            CREACIÓN FORZADA
        ------------------------------------------------------------*/

        if (
            forzarNueva ===
                true
        ) {

            const guardada =
                await this.guardar(
                    prediccion
                );


            return {

                accion:
                    "CREADA_FORZADA",

                creada:
                    true,

                reutilizada:
                    false,

                prediccion:
                    guardada

            };

        }


        /*------------------------------------------------------------
            BUSCAR PENDIENTE EXISTENTE
        ------------------------------------------------------------*/

        const existente =
            await this
                .obtenerPendientePorSemana(

                    semanaObjetivo,

                    {

                        incluirRanking:
                            incluirRankingExistente

                    }

                );


        if (
            existente
        ) {

            console.warn(

                `Ya existe una predicción pendiente ` +
                `para la semana ${semanaObjetivo}: ` +
                `${existente.id}`

            );


            return {

                accion:
                    "REUTILIZADA",

                creada:
                    false,

                reutilizada:
                    true,

                prediccion:
                    existente

            };

        }


        /*------------------------------------------------------------
            CREAR NUEVA
        ------------------------------------------------------------*/

        const guardada =
            await this.guardar(
                prediccion
            );


        return {

            accion:
                "CREADA",

            creada:
                true,

            reutilizada:
                false,

            prediccion:
                guardada

        };

    }


    /*================================================================
        GUARDAR RANKING
    ================================================================*/

    async guardarRanking(

        prediccionId,

        ranking

    ) {

        if (
            !Array.isArray(
                ranking
            )
        ) {

            return 0;

        }


        /*
         * Eliminamos cualquier ranking anterior
         * asociado al mismo ID.
         */

        await this
            .eliminarRanking(
                prediccionId
            );


        if (
            ranking.length ===
                0
        ) {

            return 0;

        }


        const batch =
            writeBatch(
                db
            );


        ranking.forEach(

            (
                item,
                indice
            ) => {

                const numero =
                    Number(
                        item.numero
                    );


                const idDocumento =

                    Number.isInteger(
                        numero
                    )

                        ? String(
                            numero
                        )
                            .padStart(
                                2,
                                "0"
                            )

                        : String(
                            indice +
                            1
                        )
                            .padStart(
                                3,
                                "0"
                            );


                const referencia =
                    doc(

                        db,

                        this.coleccion,

                        prediccionId,

                        this.subcoleccionRanking,

                        idDocumento

                    );


                /*
                 * Limpiamos cualquier undefined
                 * proveniente de los motores.
                 */

                const itemFirestore =
                    this.limpiarUndefined({

                        ...item,

                        prediccionId,

                        orden:

                            Number(
                                item.orden
                            ) ||
                            indice +
                            1

                    });


                batch.set(

                    referencia,

                    itemFirestore

                );

            }

        );


        await batch.commit();


        return ranking.length;

    }


    /*================================================================
        ELIMINAR RANKING
    ================================================================*/

    async eliminarRanking(
        prediccionId
    ) {

        const referencia =
            collection(

                db,

                this.coleccion,

                prediccionId,

                this.subcoleccionRanking

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


        snapshot.docs.forEach(

            documento => {

                batch.delete(
                    documento.ref
                );

            }

        );


        await batch.commit();


        return snapshot.size;

    }


    /*================================================================
        OBTENER
    ================================================================*/

    async obtener(

        id,

        {

            incluirRanking = true

        } = {}

    ) {

        try {

            if (
                !id
            ) {

                return null;

            }


            const referencia =
                doc(

                    db,

                    this.coleccion,

                    String(
                        id
                    )

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


            const cabecera = {

                id:
                    snapshot.id,

                ...snapshot.data()

            };


            if (
                incluirRanking !==
                    true
            ) {

                return {

                    ...cabecera,

                    rankingCompleto:
                        []

                };

            }


            const rankingCompleto =
                await this
                    .obtenerRanking(
                        snapshot.id
                    );


            return {

                ...cabecera,

                rankingCompleto

            };

        }

        catch (error) {

            console.error(
                "Error obteniendo predicción:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        OBTENER RANKING
    ================================================================*/

    async obtenerRanking(
        prediccionId
    ) {

        const referencia =
            collection(

                db,

                this.coleccion,

                prediccionId,

                this.subcoleccionRanking

            );


        const snapshot =
            await getDocs(
                referencia
            );


        const ranking =
            snapshot.docs.map(

                documento => ({

                    ...documento.data()

                })

            );


        ranking.sort(

            (
                a,
                b
            ) => {

                const ordenA =
                    Number(
                        a.orden ??
                        a.posicion ??
                        9999
                    );


                const ordenB =
                    Number(
                        b.orden ??
                        b.posicion ??
                        9999
                    );


                if (
                    ordenA !==
                    ordenB
                ) {

                    return (
                        ordenA -
                        ordenB
                    );

                }


                return (

                    Number(
                        a.numero
                    ) -

                    Number(
                        b.numero
                    )

                );

            }

        );


        return ranking;

    }


    /*================================================================
        OBTENER TODAS
    ================================================================*/

    async obtenerTodas(

        direccion = "desc",

        {

            incluirRanking = false

        } = {}

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
                        "fechaPrediccion",
                        sentido
                    )

                );


            const snapshot =
                await getDocs(
                    consulta
                );


            const lista =
                snapshot.docs.map(

                    documento => ({

                        id:
                            documento.id,

                        ...documento.data()

                    })

                );


            if (
                incluirRanking !==
                    true
            ) {

                return lista;

            }


            return await Promise.all(

                lista.map(

                    async item => {

                        const rankingCompleto =
                            await this
                                .obtenerRanking(
                                    item.id
                                );


                        return {

                            ...item,

                            rankingCompleto

                        };

                    }

                )

            );

        }

        catch (error) {

            console.error(
                "Error obteniendo predicciones:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        OBTENER ÚLTIMA
    ================================================================*/

    async obtenerUltima(
        incluirRanking = true
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
                        "fechaPrediccion",
                        "desc"
                    ),

                    limit(
                        1
                    )

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


            const cabecera = {

                id:
                    documento.id,

                ...documento.data()

            };


            if (
                incluirRanking !==
                    true
            ) {

                return {

                    ...cabecera,

                    rankingCompleto:
                        []

                };

            }


            return {

                ...cabecera,

                rankingCompleto:

                    await this
                        .obtenerRanking(
                            documento.id
                        )

            };

        }

        catch (error) {

            console.error(
                "Error obteniendo última predicción:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        OBTENER POR SEMANA
    ================================================================*/

    async obtenerPorSemana(

        semanaObjetivo,

        {

            incluirRanking = false

        } = {}

    ) {

        try {

            const semana =
                Number(
                    semanaObjetivo
                );


            if (
                !Number.isInteger(
                    semana
                ) ||
                semana <=
                    0
            ) {

                throw new Error(
                    `Semana objetivo inválida: ${semanaObjetivo}`
                );

            }


            const referencia =
                collection(

                    db,

                    this.coleccion

                );


            /*
             * Se filtra únicamente por semana.
             *
             * El orden se realiza luego en JavaScript
             * para evitar requerir índice compuesto.
             */

            const consulta =
                query(

                    referencia,

                    where(
                        "semanaObjetivo",
                        "==",
                        semana
                    )

                );


            const snapshot =
                await getDocs(
                    consulta
                );


            let lista =
                snapshot.docs.map(

                    documento => ({

                        id:
                            documento.id,

                        ...documento.data()

                    })

                );


            lista.sort(

                (
                    a,
                    b
                ) => {

                    const fechaA =
                        new Date(
                            a.fechaPrediccion ||
                            0
                        )
                        .getTime();


                    const fechaB =
                        new Date(
                            b.fechaPrediccion ||
                            0
                        )
                        .getTime();


                    return (
                        fechaB -
                        fechaA
                    );

                }

            );


            if (
                incluirRanking !==
                    true
            ) {

                return lista;

            }


            return await Promise.all(

                lista.map(

                    async item => ({

                        ...item,

                        rankingCompleto:

                            await this
                                .obtenerRanking(
                                    item.id
                                )

                    })

                )

            );

        }

        catch (error) {

            console.error(
                "Error obteniendo predicciones por semana:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        OBTENER PENDIENTE POR SEMANA
    ================================================================*/

    async obtenerPendientePorSemana(

        semanaObjetivo,

        {

            incluirRanking = true

        } = {}

    ) {

        const lista =
            await this
                .obtenerPorSemana(

                    semanaObjetivo,

                    {
                        incluirRanking:
                            false
                    }

                );


        const pendiente =
            lista.find(

                item =>

                    item.evaluacion
                        ?.realizada !==
                        true

            );


        if (
            !pendiente
        ) {

            return null;

        }


        if (
            incluirRanking !==
                true
        ) {

            return {

                ...pendiente,

                rankingCompleto:
                    []

            };

        }


        return await this
            .obtener(

                pendiente.id,

                {
                    incluirRanking:
                        true
                }

            );

    }


    /*================================================================
        EXISTE PENDIENTE POR SEMANA
    ================================================================*/

    async existePendientePorSemana(
        semanaObjetivo
    ) {

        const pendiente =
            await this
                .obtenerPendientePorSemana(

                    semanaObjetivo,

                    {
                        incluirRanking:
                            false
                    }

                );


        return (
            pendiente !==
            null
        );

    }


    /*================================================================
        MARCAR EVALUADA
    ================================================================*/

    async marcarEvaluada(

        id,

        evaluacionId

    ) {

        try {

            if (
                !id
            ) {

                throw new Error(
                    "No se recibió ID de predicción."
                );

            }


            if (
                !evaluacionId
            ) {

                throw new Error(
                    "No se recibió ID de evaluación."
                );

            }


            const referencia =
                doc(

                    db,

                    this.coleccion,

                    String(
                        id
                    )

                );


            const snapshot =
                await getDoc(
                    referencia
                );


            if (
                !snapshot.exists()
            ) {

                throw new Error(
                    `La predicción ${id} no existe.`
                );

            }


            const ahora =
                new Date()
                    .toISOString();


            await updateDoc(

                referencia,

                {

                    evaluacion: {

                        realizada:
                            true,

                        evaluacionId:
                            String(
                                evaluacionId
                            ),

                        fechaEvaluacion:
                            ahora

                    },

                    "persistencia.actualizadoEn":
                        ahora

                }

            );


            return true;

        }

        catch (error) {

            console.error(
                "Error marcando predicción evaluada:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        ELIMINAR
    ================================================================*/

    async eliminar(
        id
    ) {

        try {

            if (
                !id
            ) {

                return false;

            }


            await this
                .eliminarRanking(
                    id
                );


            await deleteDoc(

                doc(

                    db,

                    this.coleccion,

                    String(
                        id
                    )

                )

            );


            return true;

        }

        catch (error) {

            console.error(
                "Error eliminando predicción:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        VALIDAR PREDICCIÓN
    ================================================================*/

    validarPrediccion(
        prediccion
    ) {

        if (
            !prediccion ||
            typeof prediccion !==
                "object"
        ) {

            throw new Error(
                "La predicción recibida no es válida."
            );

        }


        if (
            !prediccion.id
        ) {

            throw new Error(
                "La predicción no posee ID."
            );

        }


        const semana =
            Number(
                prediccion
                    .semanaObjetivo
            );


        if (
            !Number.isInteger(
                semana
            ) ||
            semana <=
                0
        ) {

            throw new Error(
                "La predicción no posee una semana objetivo válida."
            );

        }


        if (
            !Array.isArray(
                prediccion.top10
            )
        ) {

            throw new Error(
                "La predicción no posee Top 10 válido."
            );

        }


        if (
            !Array.isArray(
                prediccion.top20
            )
        ) {

            throw new Error(
                "La predicción no posee Top 20 válido."
            );

        }


        return true;

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

            coleccion:
                this.coleccion,

            subcoleccionRanking:
                this.subcoleccionRanking,

            controlDuplicados:
                true,

            limpiezaUndefined:
                true

        };

    }

}