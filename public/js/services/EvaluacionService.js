/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * js/services/EvaluacionService.js
 *
 * Propósito:
 *
 * Persistir las evaluaciones generadas por MotorEvaluacion.
 *
 * Firestore:
 *
 * colección:
 * evaluaciones
 *
 * Responsabilidades:
 *
 *   - Guardar evaluación.
 *   - Obtener por ID.
 *   - Obtener historial completo.
 *   - Buscar evaluación por predicción.
 *   - Buscar evaluaciones por semana.
 *   - Obtener última evaluación.
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
    "evaluaciones";


export default class EvaluacionService {


    /*================================================================
        CONSTRUCTOR
    ================================================================*/

    constructor() {

        this.coleccion =
            COLECCION;

    }


    /*================================================================
        GUARDAR
    ================================================================*/

    async guardar(
        evaluacion
    ) {

        try {

            if (
                !evaluacion ||
                typeof evaluacion !==
                    "object"
            ) {

                throw new Error(
                    "La evaluación recibida no es válida."
                );

            }


            const datos =
                this.prepararEvaluacion(
                    evaluacion
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
                "Evaluación guardada:",
                id
            );


            return datos;

        }

        catch (error) {

            console.error(
                "Error guardando evaluación:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        PREPARAR EVALUACIÓN
    ================================================================*/

    prepararEvaluacion(
        evaluacion
    ) {

        const datos =
            this.convertirObjetoPlano(
                evaluacion
            );


        const ahora =
            new Date()
                .toISOString();


        if (
            !datos.fechaEvaluacion
        ) {

            datos.fechaEvaluacion =
                ahora;

        }


        if (
            !datos.creado
        ) {

            datos.creado =
                ahora;

        }


        datos.modificado =
            ahora;


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
                "Error obteniendo evaluación:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        OBTENER TODAS
    ================================================================*/

    async obtenerTodas(
        direccion = "asc"
    ) {

        try {

            const sentido =

                direccion ===
                "desc"

                    ? "desc"

                    : "asc";


            const referencia =
                collection(

                    db,

                    this.coleccion

                );


            const consulta =
                query(

                    referencia,

                    orderBy(
                        "fechaEvaluacion",
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
                "Error obteniendo evaluaciones:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        OBTENER HISTORIAL
    ================================================================*/

    async obtenerHistorial() {

        return await this.obtenerTodas(
            "asc"
        );

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
                        "fechaEvaluacion",
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
                "Error obteniendo última evaluación:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        OBTENER POR PREDICCIÓN
    ================================================================*/

    async obtenerPorPrediccion(
        prediccionId
    ) {

        try {

            if (!prediccionId) {

                return null;

            }


            const referencia =
                collection(

                    db,

                    this.coleccion

                );


            const consulta =
                query(

                    referencia,

                    where(
                        "prediccionId",
                        "==",
                        String(
                            prediccionId
                        )
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
                        b.fechaEvaluacion ||
                        0
                    ) -

                    new Date(
                        a.fechaEvaluacion ||
                        0
                    )

            );


            return resultados[0];

        }

        catch (error) {

            console.error(
                "Error buscando evaluación por predicción:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        OBTENER POR SEMANA
    ================================================================*/

    async obtenerPorSemana(
        numeroSemana
    ) {

        try {

            const semana =
                Number(
                    numeroSemana
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


            const consulta =
                query(

                    referencia,

                    where(
                        "semana.numero",
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
                        b.fechaEvaluacion ||
                        0
                    ) -

                    new Date(
                        a.fechaEvaluacion ||
                        0
                    )

            );


            return resultados;

        }

        catch (error) {

            console.error(
                "Error buscando evaluaciones por semana:",
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
                    "No se recibió ID de evaluación."
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
                "Error actualizando evaluación:",
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
                "Error comprobando evaluación:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        EXISTE EVALUACIÓN PARA PREDICCIÓN
    ================================================================*/

    async existeParaPrediccion(
        prediccionId
    ) {

        const evaluacion =
            await this.obtenerPorPrediccion(
                prediccionId
            );


        return evaluacion !==
            null;

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
                "Error eliminando evaluación:",
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
            `evaluacion_${fecha}_${aleatorio}`
        );

    }

}