/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * js/services/PrediccionService.js
 *
 * Propósito:
 *
 * Persistir y recuperar predicciones generadas por MotorRanking.
 *
 * Firestore:
 *
 * colección:
 * predicciones
 *
 * Responsabilidades:
 *
 *   - Guardar predicción.
 *   - Obtener predicción por ID.
 *   - Obtener todas.
 *   - Buscar por semana objetivo.
 *   - Obtener última predicción.
 *   - Obtener predicciones pendientes de evaluación.
 *   - Marcar predicción como evaluada.
 *   - Actualizar.
 *   - Eliminar.
 *   - Comprobar existencia.
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
    where,
    orderBy,
    limit

} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


import {
    db
} from "../firebase.js";


/*====================================================================
    NOMBRE DE COLECCIÓN
====================================================================*/

const COLECCION =
    "predicciones";


export default class PrediccionService {


    /*================================================================
        CONSTRUCTOR
    ================================================================*/

    constructor() {

        this.coleccion =
            COLECCION;

    }


    /*================================================================
        GUARDAR PREDICCIÓN
    ================================================================*/

    async guardar(
        prediccion
    ) {

        try {

            if (
                !prediccion ||
                typeof prediccion !==
                    "object"
            ) {

                throw new Error(
                    "La predicción recibida no es válida."
                );

            }


            const datos =
                this.prepararPrediccion(
                    prediccion
                );


            const id =
                datos.id ||
                this.generarId();


            datos.id =
                id;


            const referencia =
                doc(

                    db,

                    this.coleccion,

                    id

                );


            await setDoc(

                referencia,

                datos

            );


            console.log(
                "Predicción guardada:",
                id
            );


            return datos;

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
        PREPARAR PREDICCIÓN
    ================================================================*/

    prepararPrediccion(
        prediccion
    ) {

        const datos =
            this.convertirObjetoPlano(
                prediccion
            );


        const ahora =
            new Date()
                .toISOString();


        /*
         * Si MotorRanking ya creó fechaPrediccion
         * la conservamos.
         */

        if (
            !datos.fechaPrediccion
        ) {

            datos.fechaPrediccion =
                ahora;

        }


        /*
         * Auditoría.
         */

        if (
            !datos.creado
        ) {

            datos.creado =
                ahora;

        }


        datos.modificado =
            ahora;


        /*
         * Estado de evaluación.
         *
         * La predicción recién creada todavía
         * no ha sido contrastada con resultado real.
         */

        if (
            !datos.evaluacion ||
            typeof datos.evaluacion !==
                "object"
        ) {

            datos.evaluacion = {

                realizada:
                    false,

                evaluacionId:
                    null,

                fechaEvaluacion:
                    null

            };

        }

        else {

            datos.evaluacion = {

                realizada:

                    datos.evaluacion
                        .realizada === true,

                evaluacionId:

                    datos.evaluacion
                        .evaluacionId ??
                    null,

                fechaEvaluacion:

                    datos.evaluacion
                        .fechaEvaluacion ??
                    null

            };

        }


        return datos;

    }


    /*================================================================
        OBTENER POR ID
    ================================================================*/

    async obtener(
        id
    ) {

        try {

            if (!id) {

                return null;

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


            if (
                !snapshot.exists()
            ) {

                return null;

            }


            return {

                id:
                    snapshot.id,

                ...snapshot.data()

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
                        "fechaPrediccion",
                        sentido
                    )

                );


            const snapshot =
                await getDocs(
                    consulta
                );


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
                "Error obteniendo predicciones:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        OBTENER ÚLTIMA
    ================================================================*/

    async obtenerUltima() {

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


            return {

                id:
                    documento.id,

                ...documento.data()

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
        semanaObjetivo
    ) {

        try {

            const semana =
                Number(
                    semanaObjetivo
                );


            if (
                !Number.isInteger(
                    semana
                )
            ) {

                return [];

            }


            const referencia =
                collection(

                    db,

                    this.coleccion

                );


            /*
             * Usamos solamente where y luego
             * ordenamos en memoria.
             *
             * Esto evita necesitar un índice compuesto
             * para esta consulta.
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


            const resultados =
                snapshot.docs.map(

                    documento => ({

                        id:
                            documento.id,

                        ...documento.data()

                    })

                );


            resultados.sort(

                (a, b) =>

                    new Date(
                        b.fechaPrediccion ||
                        0
                    ) -

                    new Date(
                        a.fechaPrediccion ||
                        0
                    )

            );


            return resultados;

        }

        catch (error) {

            console.error(
                "Error buscando predicción por semana:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        OBTENER PENDIENTES
    ================================================================*/

    async obtenerPendientes() {

        try {

            const referencia =
                collection(

                    db,

                    this.coleccion

                );


            const consulta =
                query(

                    referencia,

                    where(
                        "evaluacion.realizada",
                        "==",
                        false
                    )

                );


            const snapshot =
                await getDocs(
                    consulta
                );


            const resultados =
                snapshot.docs.map(

                    documento => ({

                        id:
                            documento.id,

                        ...documento.data()

                    })

                );


            resultados.sort(

                (a, b) =>

                    new Date(
                        b.fechaPrediccion ||
                        0
                    ) -

                    new Date(
                        a.fechaPrediccion ||
                        0
                    )

            );


            return resultados;

        }

        catch (error) {

            console.error(
                "Error obteniendo predicciones pendientes:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        MARCAR COMO EVALUADA
    ================================================================*/

    async marcarEvaluada(
        prediccionId,
        evaluacionId
    ) {

        try {

            if (!prediccionId) {

                throw new Error(
                    "No se recibió ID de predicción."
                );

            }


            const referencia =
                doc(

                    db,

                    this.coleccion,

                    String(
                        prediccionId
                    )

                );


            const ahora =
                new Date()
                    .toISOString();


            await updateDoc(

                referencia,

                {

                    "evaluacion.realizada":
                        true,

                    "evaluacion.evaluacionId":

                        evaluacionId ||
                        null,

                    "evaluacion.fechaEvaluacion":
                        ahora,

                    modificado:
                        ahora

                }

            );


            return true;

        }

        catch (error) {

            console.error(
                "Error marcando predicción como evaluada:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        ACTUALIZAR
    ================================================================*/

    async actualizar(
        id,
        cambios = {}
    ) {

        try {

            if (!id) {

                throw new Error(
                    "No se recibió ID de predicción."
                );

            }


            const referencia =
                doc(

                    db,

                    this.coleccion,

                    String(id)

                );


            const datos =
                this.convertirObjetoPlano(
                    cambios
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
                "Error actualizando predicción:",
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
                "Error comprobando predicción:",
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

            if (!id) {

                return false;

            }


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
                "Error eliminando predicción:",
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
        CONVERTIR OBJETO A FORMATO FIRESTORE
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

            return valor.toISOString();

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

                objeto[String(clave)] =
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
            `prediccion_${fecha}_${aleatorio}`
        );

    }

}